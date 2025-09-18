import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { requireAuth, requireAdmin } from "../middlewares/rbac.middleware";
import Incident from "../models/incident.model";
import AuditLog from "../models/audit.model";
import { logger } from "../utils/logger";

const router = express.Router();

// POST /api/rca/generate/:incidentId - Generate RCA for incident
router.post(
  "/generate/:incidentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;
    const { customPrompt } = req.body;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (incident.status !== "resolved") {
      return res
        .status(400)
        .json({ message: "Incident must be resolved before generating RCA" });
    }

    try {
      // Call GenAI service for RCA generation
      const rcaData = await generateRCAWithAI(incident, customPrompt);

      // Update incident with RCA
      incident.rca = {
        summary: rcaData.summary,
        timeline: rcaData.timeline,
        rootCause: rcaData.rootCause,
        impact: rcaData.impact,
        contributingFactors: rcaData.contributingFactors || [],
        preventionMeasures: rcaData.preventionMeasures || [],
        generatedBy: "bot",
        generatedAt: new Date(),
        status: "draft",
      };

      // Add timeline entry
      incident.timeline.push({
        timestamp: new Date(),
        action: "rca_generated",
        actor: req.user.name || req.user.email,
        details: "RCA report generated using AI",
      });

      await incident.save();

      // Create audit log
      await AuditLog.create({
        action: "rca.generated",
        userId: req.user._id,
        targetType: "incident",
        targetId: incident._id,
        details: `Generated RCA for incident: ${incident.title}`,
        metadata: {
          generatedBy: "bot",
          customPrompt: !!customPrompt,
        },
      });

      logger.info(`RCA generated for incident: ${incident.title}`, {
        incidentId: incident._id,
        userId: req.user._id,
        generatedBy: "bot",
      });

      res.json({
        message: "RCA generated successfully",
        rca: incident.rca,
      });
    } catch (error) {
      logger.error("RCA generation failed", {
        incidentId,
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user._id,
      });

      res.status(500).json({
        message: "Failed to generate RCA",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

// PUT /api/rca/:incidentId - Update RCA
router.put(
  "/:incidentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;
    const {
      summary,
      timeline,
      rootCause,
      impact,
      contributingFactors,
      preventionMeasures,
    } = req.body;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (!incident.rca) {
      return res
        .status(400)
        .json({ message: "No RCA exists for this incident" });
    }

    // Update RCA fields
    if (summary) incident.rca.summary = summary;
    if (timeline) incident.rca.timeline = timeline;
    if (rootCause) incident.rca.rootCause = rootCause;
    if (impact) incident.rca.impact = impact;
    if (contributingFactors)
      incident.rca.contributingFactors = contributingFactors;
    if (preventionMeasures)
      incident.rca.preventionMeasures = preventionMeasures;

    // Mark as user-modified if it was originally bot-generated
    if (incident.rca.generatedBy === "bot") {
      incident.rca.generatedBy = "user";
    }

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: "rca_updated",
      actor: req.user.name || req.user.email,
      details: "RCA report updated",
    });

    await incident.save();

    // Create audit log
    await AuditLog.create({
      action: "rca.updated",
      userId: req.user._id,
      targetType: "incident",
      targetId: incident._id,
      details: `Updated RCA for incident: ${incident.title}`,
    });

    res.json({
      message: "RCA updated successfully",
      rca: incident.rca,
    });
  })
);

// POST /api/rca/:incidentId/approve - Approve RCA
router.post(
  "/:incidentId/approve",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;
    const { comment } = req.body;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (!incident.rca) {
      return res
        .status(400)
        .json({ message: "No RCA exists for this incident" });
    }

    // Check if user has permission to approve (admin or manager)
    if (!["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Insufficient permissions to approve RCA" });
    }

    incident.rca.status = "approved";
    incident.rca.approvedBy = req.user._id;
    incident.rca.approvedAt = new Date();

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: "rca_approved",
      actor: req.user.name || req.user.email,
      details: `RCA approved${comment ? `: ${comment}` : ""}`,
    });

    await incident.save();

    // Create audit log
    await AuditLog.create({
      action: "rca.approved",
      userId: req.user._id,
      targetType: "incident",
      targetId: incident._id,
      details: `Approved RCA for incident: ${incident.title}`,
      metadata: { comment },
    });

    res.json({
      message: "RCA approved successfully",
      rca: incident.rca,
    });
  })
);

// POST /api/rca/:incidentId/publish - Publish RCA
router.post(
  "/:incidentId/publish",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (!incident.rca) {
      return res
        .status(400)
        .json({ message: "No RCA exists for this incident" });
    }

    if (incident.rca.status !== "approved") {
      return res
        .status(400)
        .json({ message: "RCA must be approved before publishing" });
    }

    // Check if user has permission to publish (admin only)
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can publish RCA reports" });
    }

    incident.rca.status = "published";

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: "rca_published",
      actor: req.user.name || req.user.email,
      details: "RCA published",
    });

    await incident.save();

    // Create audit log
    await AuditLog.create({
      action: "rca.published",
      userId: req.user._id,
      targetType: "incident",
      targetId: incident._id,
      details: `Published RCA for incident: ${incident.title}`,
    });

    res.json({
      message: "RCA published successfully",
      rca: incident.rca,
    });
  })
);

// GET /api/rca/:incidentId - Get RCA for incident
router.get(
  "/:incidentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId)
      .populate("rca.approvedBy", "name email")
      .select("title service severity status rca");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (!incident.rca) {
      return res
        .status(404)
        .json({ message: "No RCA exists for this incident" });
    }

    res.json({
      incident: {
        _id: incident._id,
        title: incident.title,
        service: incident.service,
        severity: incident.severity,
        status: incident.status,
      },
      rca: incident.rca,
    });
  })
);

// GET /api/rca - List RCAs with filtering
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      status,
      service,
      severity,
      generatedBy,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const matchQuery: any = { rca: { $exists: true } };

    if (status) {
      matchQuery["rca.status"] = status;
    }

    if (service) {
      matchQuery.service = service;
    }

    if (severity) {
      matchQuery.severity = severity;
    }

    if (generatedBy) {
      matchQuery["rca.generatedBy"] = generatedBy;
    }

    if (startDate || endDate) {
      matchQuery["rca.generatedAt"] = {};
      if (startDate)
        matchQuery["rca.generatedAt"].$gte = new Date(startDate as string);
      if (endDate)
        matchQuery["rca.generatedAt"].$lte = new Date(endDate as string);
    }

    const incidents = await Incident.find(matchQuery)
      .populate("rca.approvedBy", "name email")
      .select("title service severity status rca createdAt resolvedAt")
      .sort({ "rca.generatedAt": -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Incident.countDocuments(matchQuery);

    res.json({
      rcas: incidents,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  })
);

// GET /api/rca/export/:incidentId - Export RCA as PDF/HTML
router.get(
  "/export/:incidentId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId } = req.params;
    const { format = "html" } = req.query;

    const incident = await Incident.findById(incidentId).populate(
      "rca.approvedBy",
      "name email"
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (!incident.rca) {
      return res
        .status(404)
        .json({ message: "No RCA exists for this incident" });
    }

    if (format === "html") {
      const html = generateRCAHTML(incident);
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="RCA-${incident._id}.html"`
      );
      res.send(html);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="RCA-${incident._id}.json"`
      );
      res.json({
        incident: {
          _id: incident._id,
          title: incident.title,
          service: incident.service,
          severity: incident.severity,
          status: incident.status,
          createdAt: incident.createdAt,
          resolvedAt: incident.resolvedAt,
        },
        rca: incident.rca,
      });
    } else {
      res.status(400).json({ message: "Unsupported export format" });
    }
  })
);

// Helper function to call GenAI service for RCA generation
async function generateRCAWithAI(
  incident: any,
  customPrompt?: string
): Promise<any> {
  // This would integrate with your GenAI service
  // For now, return a mock response

  const prompt =
    customPrompt ||
    `Generate a detailed Root Cause Analysis for the following incident:
Title: ${incident.title}
Description: ${incident.description}
Service: ${incident.service}
Severity: ${incident.severity}
Timeline: ${JSON.stringify(incident.timeline)}
Bot Analysis: ${JSON.stringify(incident.botAnalysis)}`;

  // Mock response - replace with actual GenAI service call
  return {
    summary: `This incident involved ${incident.service} experiencing ${
      incident.severity
    } severity issues. The incident lasted approximately ${calculateDuration(
      incident.createdAt,
      incident.resolvedAt
    )} and affected users' ability to access the service.`,
    timeline: generateTimelineNarrative(incident.timeline),
    rootCause:
      "Database connection pool exhaustion due to increased load and insufficient connection pool configuration",
    impact: `Service disruption affected approximately ${estimateImpactedUsers(
      incident
    )} users for ${calculateDuration(incident.createdAt, incident.resolvedAt)}`,
    contributingFactors: [
      "Sudden increase in user traffic",
      "Inadequate connection pool size",
      "Missing connection pool monitoring",
      "Lack of circuit breaker patterns",
    ],
    preventionMeasures: [
      "Increase database connection pool size to handle peak loads",
      "Implement comprehensive connection pool monitoring and alerting",
      "Add circuit breaker patterns to prevent cascade failures",
      "Establish automated scaling policies for database connections",
      "Conduct regular load testing to identify capacity limits",
    ],
  };
}

// Helper functions
function calculateDuration(startDate: Date, endDate: Date): string {
  if (!endDate) return "ongoing";

  const diff = endDate.getTime() - startDate.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hours ${minutes % 60} minutes`;
  }
  return `${minutes} minutes`;
}

function estimateImpactedUsers(incident: any): number {
  // Simple estimation based on severity
  const baseUsers = 100;
  const multipliers = { low: 1, medium: 5, high: 15, critical: 50 };
  return (
    baseUsers *
    (multipliers[incident.severity as keyof typeof multipliers] || 1)
  );
}

function generateTimelineNarrative(timeline: any[]): string {
  return timeline
    .map(
      (entry) =>
        `${entry.timestamp.toISOString()}: ${entry.action} by ${
          entry.actor
        } - ${entry.details}`
    )
    .join("\n");
}

function generateRCAHTML(incident: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Root Cause Analysis - ${incident.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-left: 4px solid #007acc; padding-left: 10px; }
        .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .timeline { background: #fafafa; padding: 15px; border-radius: 5px; }
        ul { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Root Cause Analysis</h1>
        <div class="meta">
            <strong>Incident:</strong> ${incident.title}<br>
            <strong>Service:</strong> ${incident.service}<br>
            <strong>Severity:</strong> ${incident.severity}<br>
            <strong>Status:</strong> ${incident.rca.status}<br>
            <strong>Generated:</strong> ${incident.rca.generatedAt}<br>
            ${
              incident.rca.approvedBy
                ? `<strong>Approved by:</strong> ${incident.rca.approvedBy.name}<br>`
                : ""
            }
        </div>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>${incident.rca.summary}</p>
    </div>
    
    <div class="section">
        <h2>Root Cause</h2>
        <p>${incident.rca.rootCause}</p>
    </div>
    
    <div class="section">
        <h2>Impact</h2>
        <p>${incident.rca.impact}</p>
    </div>
    
    <div class="section">
        <h2>Contributing Factors</h2>
        <ul>
            ${incident.rca.contributingFactors
              .map((factor: string) => `<li>${factor}</li>`)
              .join("")}
        </ul>
    </div>
    
    <div class="section">
        <h2>Prevention Measures</h2>
        <ul>
            ${incident.rca.preventionMeasures
              .map((measure: string) => `<li>${measure}</li>`)
              .join("")}
        </ul>
    </div>
    
    <div class="section">
        <h2>Timeline</h2>
        <div class="timeline">
            <pre>${incident.rca.timeline}</pre>
        </div>
    </div>
</body>
</html>`;
}

export default router;
