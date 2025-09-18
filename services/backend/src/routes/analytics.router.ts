import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { requireAuth, requireAdmin } from "../middlewares/rbac.middleware";
import Analytics from "../models/analytics.model";
import Incident from "../models/incident.model";
import User from "../models/user.model";
import { logger } from "../utils/logger";

const router = express.Router();

// GET /api/analytics/dashboard - Get dashboard analytics
router.get(
  "/dashboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { period = "weekly", startDate, endDate } = req.query;

    let query: any = { period };

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate as string) };
      query.endDate = { $lte: new Date(endDate as string) };
    }

    const analytics = await Analytics.findOne(query)
      .sort({ endDate: -1 })
      .populate("userMetrics.userId", "name email");

    if (!analytics) {
      // Generate analytics on-the-fly if not found
      const generatedAnalytics = await generateAnalytics(
        period as string,
        startDate as string,
        endDate as string
      );
      return res.json(generatedAnalytics);
    }

    res.json(analytics);
  })
);

// GET /api/analytics/hotspots - Get service hotspots
router.get(
  "/hotspots",
  requireAuth,
  asyncHandler(async (req, res) => {
    const hotspots = await Analytics.getHotspots();
    res.json(hotspots);
  })
);

// GET /api/analytics/trends - Get incident trends
router.get(
  "/trends",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { service, timeframe = "30d" } = req.query;

    const days = parseInt(timeframe as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let matchQuery: any = {
      createdAt: { $gte: startDate },
    };

    if (service) {
      matchQuery.service = service;
    }

    const trends = await Incident.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            severity: "$severity",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          data: {
            $push: {
              severity: "$_id.severity",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(trends);
  })
);

// GET /api/analytics/mttr - Get MTTR analytics
router.get(
  "/mttr",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { service, period = "weekly" } = req.query;

    let matchQuery: any = {
      status: "resolved",
      resolvedAt: { $exists: true },
    };

    if (service) {
      matchQuery.service = service;
    }

    const mttrData = await Incident.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          resolutionTime: {
            $divide: [
              { $subtract: ["$resolvedAt", "$createdAt"] },
              1000 * 60, // Convert to minutes
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            service: "$service",
            period: {
              $dateToString: {
                format: period === "daily" ? "%Y-%m-%d" : "%Y-%U",
                date: "$createdAt",
              },
            },
          },
          avgMTTR: { $avg: "$resolutionTime" },
          count: { $sum: 1 },
          minTime: { $min: "$resolutionTime" },
          maxTime: { $max: "$resolutionTime" },
        },
      },
      { $sort: { "_id.period": -1 } },
    ]);

    res.json(mttrData);
  })
);

// GET /api/analytics/sla-compliance - Get SLA compliance metrics
router.get(
  "/sla-compliance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    }

    const slaData = await Incident.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$sla.breached",
          count: { $sum: 1 },
          incidents: {
            $push: {
              _id: "$_id",
              title: "$title",
              service: "$service",
              severity: "$severity",
              breachType: "$sla.breachType",
            },
          },
        },
      },
    ]);

    const total = slaData.reduce((sum, item) => sum + item.count, 0);
    const breached = slaData.find((item) => item._id === true)?.count || 0;
    const compliance = total > 0 ? ((total - breached) / total) * 100 : 100;

    res.json({
      total,
      breached,
      compliance: Math.round(compliance * 100) / 100,
      details: slaData,
    });
  })
);

// GET /api/analytics/user-performance - Get user performance metrics
router.get(
  "/user-performance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, startDate, endDate } = req.query;

    let matchQuery: any = {};

    if (userId) {
      matchQuery.assignee = userId;
    }

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const userPerformance = await Incident.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "assignee",
          foreignField: "_id",
          as: "assigneeData",
        },
      },
      {
        $group: {
          _id: "$assignee",
          userName: { $first: { $arrayElemAt: ["$assigneeData.name", 0] } },
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$createdAt"] },
                    1000 * 60,
                  ],
                },
                null,
              ],
            },
          },
          escalations: { $sum: "$escalationHistory.level" },
        },
      },
      {
        $addFields: {
          resolutionRate: {
            $multiply: [{ $divide: ["$resolved", "$totalAssigned"] }, 100],
          },
        },
      },
      { $sort: { resolutionRate: -1 } },
    ]);

    res.json(userPerformance);
  })
);

// POST /api/analytics/generate - Generate analytics for a period
router.post(
  "/generate",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { period, startDate, endDate } = req.body;

    const analytics = await generateAnalytics(period, startDate, endDate);

    // Save generated analytics
    const savedAnalytics = new Analytics(analytics);
    await savedAnalytics.save();

    logger.info(`Analytics generated for period: ${period}`, {
      period,
      startDate,
      endDate,
      analyticsId: savedAnalytics._id,
    });

    res.json(savedAnalytics);
  })
);

// Helper function to generate analytics
async function generateAnalytics(
  period: string,
  startDate?: string,
  endDate?: string
) {
  const start = startDate ? new Date(startDate) : getDefaultStartDate(period);
  const end = endDate ? new Date(endDate) : new Date();

  // Get incident metrics
  const incidents = await Incident.find({
    createdAt: { $gte: start, $lte: end },
  });

  const incidentMetrics = {
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((i) => i.status === "open").length,
    resolvedIncidents: incidents.filter((i) => i.status === "resolved").length,
    escalatedIncidents: incidents.filter(
      (i) =>
        (i as any).escalationHistory && (i as any).escalationHistory.length > 0
    ).length,
    avgMTTR: calculateAvgMTTR(incidents.filter((i) => i.status === "resolved")),
    avgMTTD: 0, // Calculate if detection time tracking is implemented
    avgMTTA: calculateAvgMTTA(
      incidents.filter((i) => (i as any).acknowledgedAt)
    ),
    slaBreaches: incidents.filter((i) => (i as any).sla?.breached).length,
    slaCompliance: calculateSLACompliance(incidents),
  };

  // Get service metrics
  const serviceMetrics = await calculateServiceMetrics(incidents);

  // Get user metrics
  const userMetrics = await calculateUserMetrics(incidents);

  // Get automation metrics
  const automationMetrics = await calculateAutomationMetrics(incidents);

  return {
    period,
    startDate: start,
    endDate: end,
    incidentMetrics,
    serviceMetrics,
    userMetrics,
    automationMetrics,
    trends: {
      incidentTrend: [],
      resolutionTrend: [],
      serviceTrend: [],
    },
  };
}

function getDefaultStartDate(period: string): Date {
  const date = new Date();
  switch (period) {
    case "daily":
      date.setDate(date.getDate() - 1);
      break;
    case "weekly":
      date.setDate(date.getDate() - 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() - 1);
      break;
    default:
      date.setDate(date.getDate() - 7);
  }
  return date;
}

function calculateAvgMTTR(resolvedIncidents: any[]): number {
  if (resolvedIncidents.length === 0) return 0;

  const totalTime = resolvedIncidents.reduce((sum, incident) => {
    if (incident.resolvedAt && incident.createdAt) {
      return (
        sum + (incident.resolvedAt.getTime() - incident.createdAt.getTime())
      );
    }
    return sum;
  }, 0);

  return Math.round(totalTime / resolvedIncidents.length / (1000 * 60)); // Convert to minutes
}

function calculateAvgMTTA(acknowledgedIncidents: any[]): number {
  if (acknowledgedIncidents.length === 0) return 0;

  const totalTime = acknowledgedIncidents.reduce((sum, incident) => {
    if (incident.acknowledgedAt && incident.createdAt) {
      return (
        sum + (incident.acknowledgedAt.getTime() - incident.createdAt.getTime())
      );
    }
    return sum;
  }, 0);

  return Math.round(totalTime / acknowledgedIncidents.length / (1000 * 60)); // Convert to minutes
}

function calculateSLACompliance(incidents: any[]): number {
  if (incidents.length === 0) return 100;

  const breached = incidents.filter((i) => (i as any).sla?.breached).length;
  return Math.round(((incidents.length - breached) / incidents.length) * 100);
}

async function calculateServiceMetrics(incidents: any[]) {
  const serviceGroups = incidents.reduce((groups, incident) => {
    const service = incident.service;
    if (!groups[service]) {
      groups[service] = [];
    }
    groups[service].push(incident);
    return groups;
  }, {} as Record<string, any[]>);

  return Object.entries(serviceGroups).map(([service, serviceIncidents]) => ({
    service,
    incidentCount: (serviceIncidents as any[]).length,
    avgSeverity: calculateAvgSeverity(serviceIncidents as any[]),
    mttr: calculateAvgMTTR(
      (serviceIncidents as any[]).filter((i) => i.status === "resolved")
    ),
    isHotspot: (serviceIncidents as any[]).length > 5, // Simple hotspot logic
    trendDirection: "stable" as const, // Would need historical data for real trend
  }));
}

async function calculateUserMetrics(incidents: any[]) {
  const userGroups = incidents.reduce((groups, incident) => {
    const assignee = incident.assignee;
    if (assignee) {
      if (!groups[assignee]) {
        groups[assignee] = [];
      }
      groups[assignee].push(incident);
    }
    return groups;
  }, {} as Record<string, any[]>);

  const userIds = Object.keys(userGroups);
  const users = await User.find({ _id: { $in: userIds } });

  return Object.entries(userGroups).map(([userId, userIncidents]) => {
    const user = users.find((u) => u._id.toString() === userId);
    const resolved = (userIncidents as any[]).filter(
      (i) => i.status === "resolved"
    );

    return {
      userId: userId,
      userName: user?.name || "Unknown",
      assignedIncidents: (userIncidents as any[]).length,
      resolvedIncidents: resolved.length,
      avgResolutionTime: calculateAvgMTTR(resolved),
      escalationsReceived: (userIncidents as any[]).reduce(
        (sum, i) => sum + (i.escalationHistory?.length || 0),
        0
      ),
    };
  });
}

async function calculateAutomationMetrics(incidents: any[]) {
  const botInteractions = incidents.reduce(
    (sum, i) => sum + (i.botTranscript?.length || 0),
    0
  );
  const botResolved = incidents.filter(
    (i) => i.botAnalysis?.confidence > 0.8
  ).length;

  return {
    totalBotInteractions: botInteractions,
    incidentsResolvedByBot: botResolved,
    botSuccessRate:
      botInteractions > 0
        ? Math.round((botResolved / botInteractions) * 100)
        : 0,
    avgBotResponseTime: 2, // Would need to calculate from actual response times
    runbooksExecuted: incidents.filter((i) => i.runbookId).length,
    automationSavings: botResolved * 30, // Estimated 30 minutes saved per bot resolution
  };
}

function calculateAvgSeverity(incidents: any[]): number {
  const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const totalSeverity = incidents.reduce((sum, i) => {
    return sum + (severityMap[i.severity as keyof typeof severityMap] || 1);
  }, 0);
  return Math.round((totalSeverity / incidents.length) * 100) / 100;
}

export default router;
