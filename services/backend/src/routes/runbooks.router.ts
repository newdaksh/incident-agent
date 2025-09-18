import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import {
  requireAuth,
  requireAdmin,
  canManageRunbooks,
} from "../middlewares/rbac.middleware";
import Runbook from "../models/runbook.model";
import RunbookVersion from "../models/runbook-version.model";
import AuditLog from "../models/audit.model";
import { logger } from "../utils/logger";

const router = express.Router();

// GET /api/runbooks - List runbooks with filtering and search
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      search,
      service,
      category,
      status = "approved",
      page = 1,
      limit = 20,
      sortBy = "usageStats.lastUsed",
      sortOrder = "desc",
    } = req.query;

    const filters: any = { approvalStatus: status };

    if (service) {
      filters.serviceTags = service;
    }

    if (category) {
      filters.category = category;
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { serviceTags: { $regex: search, $options: "i" } },
      ];
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const runbooks = await Runbook.find(filters)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate("approvalHistory.approvedBy", "name email")
      .populate("usageStats.userFeedback.userId", "name email");

    const total = await Runbook.countDocuments(filters);

    res.json({
      runbooks,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  })
);

// GET /api/runbooks/:id - Get runbook details
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const runbook = await Runbook.findById(req.params.id)
      .populate("approvalHistory.approvedBy", "name email")
      .populate("usageStats.userFeedback.userId", "name email");

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    res.json(runbook);
  })
);

// POST /api/runbooks - Create new runbook
router.post(
  "/",
  requireAuth,
  canManageRunbooks,
  asyncHandler(async (req, res) => {
    const { name, description, serviceTags, category, steps } = req.body;

    const runbook = new Runbook({
      name,
      description,
      serviceTags,
      category,
      steps,
      metadata: {
        author: req.user.name,
      },
      versionHistory: [
        {
          version: "1.0.0",
          changes: "Initial version",
          author: req.user._id,
        },
      ],
    });

    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.created",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Created runbook: ${runbook.name}`,
    });

    logger.info(`Runbook created: ${runbook.name}`, {
      runbookId: runbook._id,
      userId: req.user._id,
    });

    res.status(201).json(runbook);
  })
);

// PUT /api/runbooks/:id - Update runbook
router.put(
  "/:id",
  requireAuth,
  canManageRunbooks,
  asyncHandler(async (req, res) => {
    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    const { name, description, serviceTags, category, steps, changelog } =
      req.body;

    // Increment version
    const currentVersion = runbook.currentVersion || "1.0.0";
    const versionParts = currentVersion.split(".").map(Number);
    versionParts[2]++; // Increment patch version
    const newVersion = versionParts.join(".");

    // Update runbook
    runbook.name = name || runbook.name;
    runbook.description = description || runbook.description;
    runbook.serviceTags = serviceTags || runbook.serviceTags;
    runbook.category = category || runbook.category;
    runbook.steps = steps || runbook.steps;
    runbook.currentVersion = newVersion;
    runbook.approvalStatus = "pending"; // Reset approval status

    // Add to version history
    runbook.versionHistory.push({
      version: newVersion,
      changes: changelog || "Updated runbook",
      author: req.user._id,
      createdAt: new Date(),
    });

    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.updated",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Updated runbook: ${runbook.name} to version ${newVersion}`,
    });

    res.json(runbook);
  })
);

// POST /api/runbooks/:id/approve - Approve runbook
router.post(
  "/:id/approve",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { comment } = req.body;

    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    runbook.approvalStatus = "approved";
    runbook.metadata.approvedBy = req.user.name;

    runbook.approvalHistory.push({
      status: "approved",
      approvedBy: req.user._id,
      comment: comment || "Approved",
      createdAt: new Date(),
    });

    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.approved",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Approved runbook: ${runbook.name}`,
    });

    res.json(runbook);
  })
);

// POST /api/runbooks/:id/reject - Reject runbook
router.post(
  "/:id/reject",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { comment } = req.body;

    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    runbook.approvalStatus = "draft"; // Send back to draft

    runbook.approvalHistory.push({
      status: "rejected",
      approvedBy: req.user._id,
      comment: comment || "Rejected",
      createdAt: new Date(),
    });

    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.rejected",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Rejected runbook: ${runbook.name}`,
    });

    res.json(runbook);
  })
);

// POST /api/runbooks/:id/execute - Execute runbook and track usage
router.post(
  "/:id/execute",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { incidentId, stepResults } = req.body;

    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    if (runbook.approvalStatus !== "approved") {
      return res
        .status(400)
        .json({ message: "Runbook must be approved before execution" });
    }

    // Update usage statistics
    runbook.usageStats.totalExecutions++;
    runbook.usageStats.lastUsed = new Date();

    // Check if execution was successful based on step results
    const successfulSteps =
      stepResults?.filter((step: any) => step.status === "completed").length ||
      0;
    const totalSteps = runbook.steps.length;
    const successRate =
      totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0;

    if (successRate >= 80) {
      // Consider 80%+ as successful
      runbook.usageStats.successfulExecutions++;
    }

    // Update average execution time if provided
    if (stepResults?.executionTime) {
      const currentAvg = runbook.usageStats.avgExecutionTime || 0;
      const totalExecutions = runbook.usageStats.totalExecutions;
      runbook.usageStats.avgExecutionTime =
        (currentAvg * (totalExecutions - 1) + stepResults.executionTime) /
        totalExecutions;
    }

    // Update metadata success rate
    runbook.metadata.successRate =
      (runbook.usageStats.successfulExecutions /
        runbook.usageStats.totalExecutions) *
      100;

    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.executed",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Executed runbook: ${runbook.name}${
        incidentId ? ` for incident: ${incidentId}` : ""
      }`,
      metadata: {
        incidentId,
        successRate,
        executionTime: stepResults?.executionTime,
      },
    });

    res.json({
      message: "Runbook execution tracked",
      runbook,
      execution: {
        successRate,
        totalExecutions: runbook.usageStats.totalExecutions,
        overallSuccessRate: runbook.metadata.successRate,
      },
    });
  })
);

// POST /api/runbooks/:id/feedback - Add user feedback
router.post(
  "/:id/feedback",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    // Check if user already provided feedback
    const existingFeedback = runbook.usageStats.userFeedback.find(
      (fb) => fb.userId.toString() === req.user._id.toString()
    );

    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
      existingFeedback.createdAt = new Date();
    } else {
      runbook.usageStats.userFeedback.push({
        userId: req.user._id,
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    await runbook.save();

    res.json({ message: "Feedback added successfully" });
  })
);

// GET /api/runbooks/search/suggestions - Get runbook suggestions for incident
router.get(
  "/search/suggestions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { service, description, severity } = req.query;

    let query: any = { approvalStatus: "approved", isActive: true };

    if (service) {
      query.serviceTags = service;
    }

    // Find runbooks matching service tags
    let runbooks = await Runbook.find(query)
      .sort({ "usageStats.successRate": -1, "usageStats.totalExecutions": -1 })
      .limit(5);

    // If description provided, do text search
    if (description && runbooks.length < 3) {
      const textSearchQuery = {
        ...query,
        $or: [
          { name: { $regex: description, $options: "i" } },
          { description: { $regex: description, $options: "i" } },
          { "steps.title": { $regex: description, $options: "i" } },
          { "steps.description": { $regex: description, $options: "i" } },
        ],
      };

      const additionalRunbooks = await Runbook.find(textSearchQuery)
        .sort({ "metadata.successRate": -1 })
        .limit(5 - runbooks.length);

      runbooks = [...runbooks, ...additionalRunbooks];
    }

    // Remove duplicates
    const uniqueRunbooks = runbooks.filter(
      (runbook, index, self) =>
        index ===
        self.findIndex((r) => r._id.toString() === runbook._id.toString())
    );

    res.json({
      suggestions: uniqueRunbooks,
      criteria: { service, description, severity },
    });
  })
);

// GET /api/runbooks/categories - Get runbook categories
router.get(
  "/categories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categories = await Runbook.distinct("category", { isActive: true });
    res.json(categories);
  })
);

// GET /api/runbooks/services - Get service tags
router.get(
  "/services",
  requireAuth,
  asyncHandler(async (req, res) => {
    const services = await Runbook.distinct("serviceTags", { isActive: true });
    res.json(services);
  })
);

// DELETE /api/runbooks/:id - Soft delete runbook
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const runbook = await Runbook.findById(req.params.id);

    if (!runbook) {
      return res.status(404).json({ message: "Runbook not found" });
    }

    runbook.isActive = false;
    runbook.approvalStatus = "deprecated";
    await runbook.save();

    // Create audit log
    await AuditLog.create({
      action: "runbook.deleted",
      userId: req.user._id,
      targetType: "runbook",
      targetId: runbook._id,
      details: `Deleted runbook: ${runbook.name}`,
    });

    res.json({ message: "Runbook deleted successfully" });
  })
);

export default router;
