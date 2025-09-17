import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import {
  requireResponder,
  canManageIncidents,
  canRunRemediations,
} from "../middlewares/rbac.middleware";
import Incident from "../models/incident.model";
import AuditLog from "../models/audit.model";
import {
  IncidentStatus,
  IncidentSeverity,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  ChatRequest,
  CreateTicketRequest,
} from "../types";
import { logger } from "../utils/logger";

const router = express.Router();

// GET /api/incidents - List incidents with filtering
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      service,
      severity,
      status,
      assignee,
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters: any = {};
    if (service) filters.service = service;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    if (assignee) filters.assignee = assignee;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const incidents = await Incident.find(filters)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select("-logs -stackTrace") // Exclude large fields from list view
      .lean();

    const total = await Incident.countDocuments(filters);

    res.json({
      incidents,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  })
);

// GET /api/incidents/:id - Get incident details
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({ incident });
  })
);

// POST /api/incidents - Create new incident
router.post(
  "/",
  canManageIncidents,
  asyncHandler(async (req, res) => {
    const createRequest: CreateIncidentRequest = req.body;

    const incident = new Incident({
      ...createRequest,
      reporter: req.user._id,
      timeline: [
        {
          timestamp: new Date(),
          action: "created",
          actor: req.user.name || req.user.email,
          details: "Incident created",
        },
      ],
    });

    await incident.save();

    // Log incident creation
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "incident_created",
      "incident",
      { incidentId: incident._id, ...createRequest },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    // Emit real-time event
    if (req.io) {
      req.io.emitIncidentCreated(incident);
    }

    logger.info(`Incident created: ${incident._id} by ${req.user.email}`);

    res.status(201).json({
      message: "Incident created successfully",
      incident,
    });
  })
);

// PUT /api/incidents/:id - Update incident
router.put(
  "/:id",
  canManageIncidents,
  asyncHandler(async (req, res) => {
    const updateRequest: UpdateIncidentRequest = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Update incident fields
    Object.assign(incident, updateRequest);

    // Add timeline entry for significant changes
    if (updateRequest.status) {
      incident.timeline.push({
        timestamp: new Date(),
        action: "status_changed",
        actor: req.user.name || req.user.email,
        details: `Status changed to ${updateRequest.status}`,
      });
    }

    if (updateRequest.assignee) {
      incident.timeline.push({
        timestamp: new Date(),
        action: "assigned",
        actor: req.user.name || req.user.email,
        details: `Assigned to ${updateRequest.assignee}`,
      });
    }

    await incident.save();

    // Update metrics based on status change
    await (incident as any).updateMetrics();

    // Log incident update
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "incident_updated",
      "incident",
      updateRequest,
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    // Emit real-time events
    if (req.io) {
      req.io.emitIncidentUpdated(incident);

      if (updateRequest.status) {
        req.io.emitStatusChanged(incident._id.toString(), updateRequest.status);
      }

      if (updateRequest.assignee) {
        req.io.emitIncidentAssigned(
          incident._id.toString(),
          updateRequest.assignee
        );
      }
    }

    res.json({
      message: "Incident updated successfully",
      incident,
    });
  })
);

// POST /api/incidents/:id/chat - Chat with GenAI assistant
router.post(
  "/:id/chat",
  canManageIncidents,
  asyncHandler(async (req, res) => {
    const chatRequest: ChatRequest = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Add user message to transcript
    const userMessage = {
      author: "user" as const,
      text: chatRequest.message,
      timestamp: new Date(),
    };

    incident.botTranscript.push(userMessage);
    await incident.save();

    // TODO: Call GenAI service for analysis
    // This is a placeholder response
    const botResponse = {
      author: "bot" as const,
      text: `I've analyzed your message about the incident. This appears to be a ${incident.severity} severity issue affecting ${incident.service}. Let me gather more information to provide better assistance.`,
      timestamp: new Date(),
      confidence: 0.85,
      suggestions: [
        "Check service logs for error patterns",
        "Verify database connectivity",
        "Review recent deployments",
      ],
      followups: [
        "Can you provide the exact error messages?",
        "When did this issue first occur?",
        "Are there any related alerts?",
      ],
    };

    incident.botTranscript.push(botResponse);
    await incident.save();

    // Log chat interaction
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "incident_chat",
      "incident",
      { message: chatRequest.message, response: botResponse.text },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    // Emit real-time chat update
    if (req.io) {
      req.io.emitChatUpdated(incident._id.toString(), botResponse);
    }

    res.json({
      message: "Chat response generated",
      response: botResponse,
      transcript: incident.botTranscript,
    });
  })
);

// POST /api/incidents/:id/create-ticket - Create external ticket
router.post(
  "/:id/create-ticket",
  canManageIncidents,
  asyncHandler(async (req, res) => {
    const ticketRequest: CreateTicketRequest = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // TODO: Implement actual ticket creation logic
    // This is a placeholder response
    const ticketLink = {
      provider: ticketRequest.provider,
      externalId: `MOCK-${Date.now()}`,
      url: `https://mock-${
        ticketRequest.provider
      }.com/ticket/MOCK-${Date.now()}`,
      status: "open",
      createdAt: new Date(),
    };

    incident.ticketLinks.push(ticketLink);
    incident.timeline.push({
      timestamp: new Date(),
      action: "ticket_created",
      actor: req.user.name || req.user.email,
      details: `Created ${ticketRequest.provider} ticket: ${ticketLink.externalId}`,
    });

    await incident.save();

    // Log ticket creation
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "ticket_created",
      "incident",
      { provider: ticketRequest.provider, ticketId: ticketLink.externalId },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      message: "Ticket created successfully",
      ticket: ticketLink,
    });
  })
);

// POST /api/incidents/:id/run-remediation - Request remediation
router.post(
  "/:id/run-remediation",
  canRunRemediations,
  asyncHandler(async (req, res) => {
    const { remediationId, runbookId } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // TODO: Implement actual remediation logic
    // This is a placeholder response
    const remediation = {
      id: remediationId || `rem_${Date.now()}`,
      step: "Restart service",
      description: "Restart the affected service to resolve the issue",
      status: "pending" as const,
      timestamp: new Date(),
      requiresApproval: true,
      safe: true,
    };

    incident.remediations.push(remediation);
    incident.timeline.push({
      timestamp: new Date(),
      action: "remediation_requested",
      actor: req.user.name || req.user.email,
      details: `Requested remediation: ${remediation.step}`,
    });

    await incident.save();

    // Log remediation request
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "remediation_requested",
      "incident",
      { remediationId: remediation.id, runbookId },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    // Emit real-time remediation update
    if (req.io) {
      req.io.emitRemediationStatusChanged(
        incident._id.toString(),
        remediation.id,
        "pending"
      );
    }

    res.json({
      message: "Remediation requested successfully",
      remediation,
    });
  })
);

// POST /api/incidents/:id/generate-rca - Generate RCA report
router.post(
  "/:id/generate-rca",
  requireResponder,
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // TODO: Call GenAI service for RCA generation
    // This is a placeholder response
    const rca = {
      title: `Root Cause Analysis - ${incident.title}`,
      summary: "This incident was caused by...",
      rootCause: "Database connection pool exhaustion",
      impact: "Service disruption for 45 minutes affecting 1,500 users",
      timeline: incident.timeline,
      recommendations: [
        "Increase database connection pool size",
        "Implement connection pool monitoring",
        "Add circuit breaker pattern",
      ],
      generatedAt: new Date(),
      generatedBy: req.user._id,
    };

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: "rca_generated",
      actor: req.user.name || req.user.email,
      details: "RCA report generated",
    });

    await incident.save();

    // Log RCA generation
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "rca_generated",
      "incident",
      { rcaTitle: rca.title },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      message: "RCA generated successfully",
      rca,
    });
  })
);

export default router;
