// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

interface IAnalytics {
  // Time-based metrics
  period: "daily" | "weekly" | "monthly";
  startDate: Date;
  endDate: Date;

  // Incident metrics
  incidentMetrics: {
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    escalatedIncidents: number;
    avgMTTR: number; // in minutes
    avgMTTD: number; // Mean Time To Detection
    avgMTTA: number; // Mean Time To Acknowledgment
    slaBreaches: number;
    slaCompliance: number; // percentage
  };

  // Service-based metrics
  serviceMetrics: Array<{
    service: string;
    incidentCount: number;
    avgSeverity: number;
    mttr: number;
    isHotspot: boolean;
    trendDirection: "up" | "down" | "stable";
  }>;

  // User/Team metrics
  userMetrics: Array<{
    userId: mongoose.Types.ObjectId;
    userName: string;
    assignedIncidents: number;
    resolvedIncidents: number;
    avgResolutionTime: number;
    escalationsReceived: number;
  }>;

  // Automation metrics
  automationMetrics: {
    totalBotInteractions: number;
    incidentsResolvedByBot: number;
    botSuccessRate: number;
    avgBotResponseTime: number;
    runbooksExecuted: number;
    automationSavings: number; // estimated time saved in minutes
  };

  // Trend data
  trends: {
    incidentTrend: Array<{
      date: Date;
      count: number;
      severity: string;
    }>;
    resolutionTrend: Array<{
      date: Date;
      avgTime: number;
    }>;
    serviceTrend: Array<{
      service: string;
      weeklyCount: number;
      change: number; // percentage change from previous period
    }>;
  };

  createdAt: Date;
  updatedAt: Date;
}

interface AnalyticsDocument extends IAnalytics, Document {}

interface AnalyticsModel extends Model<AnalyticsDocument> {
  getLatestByPeriod(period: string): Promise<AnalyticsDocument | null>;
  getHotspots(): Promise<any[]>;
}

const AnalyticsSchema = new Schema<AnalyticsDocument>(
  {
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    incidentMetrics: {
      totalIncidents: { type: Number, default: 0 },
      openIncidents: { type: Number, default: 0 },
      resolvedIncidents: { type: Number, default: 0 },
      escalatedIncidents: { type: Number, default: 0 },
      avgMTTR: { type: Number, default: 0 },
      avgMTTD: { type: Number, default: 0 },
      avgMTTA: { type: Number, default: 0 },
      slaBreaches: { type: Number, default: 0 },
      slaCompliance: { type: Number, default: 100 },
    },
    serviceMetrics: [
      {
        service: { type: String, required: true },
        incidentCount: { type: Number, default: 0 },
        avgSeverity: { type: Number, default: 1 },
        mttr: { type: Number, default: 0 },
        isHotspot: { type: Boolean, default: false },
        trendDirection: {
          type: String,
          enum: ["up", "down", "stable"],
          default: "stable",
        },
      },
    ],
    userMetrics: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        assignedIncidents: { type: Number, default: 0 },
        resolvedIncidents: { type: Number, default: 0 },
        avgResolutionTime: { type: Number, default: 0 },
        escalationsReceived: { type: Number, default: 0 },
      },
    ],
    automationMetrics: {
      totalBotInteractions: { type: Number, default: 0 },
      incidentsResolvedByBot: { type: Number, default: 0 },
      botSuccessRate: { type: Number, default: 0 },
      avgBotResponseTime: { type: Number, default: 0 },
      runbooksExecuted: { type: Number, default: 0 },
      automationSavings: { type: Number, default: 0 },
    },
    trends: {
      incidentTrend: [
        {
          date: { type: Date, required: true },
          count: { type: Number, default: 0 },
          severity: { type: String, required: true },
        },
      ],
      resolutionTrend: [
        {
          date: { type: Date, required: true },
          avgTime: { type: Number, default: 0 },
        },
      ],
      serviceTrend: [
        {
          service: { type: String, required: true },
          weeklyCount: { type: Number, default: 0 },
          change: { type: Number, default: 0 },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
AnalyticsSchema.index({ period: 1, startDate: 1, endDate: 1 });
AnalyticsSchema.index({ "serviceMetrics.service": 1 });
AnalyticsSchema.index({ "serviceMetrics.isHotspot": 1 });

// Static methods
AnalyticsSchema.statics.getLatestByPeriod = function (period: string) {
  return this.findOne({ period })
    .sort({ endDate: -1 })
    .populate("userMetrics.userId", "name email");
};

AnalyticsSchema.statics.getHotspots = function () {
  return this.aggregate([
    { $unwind: "$serviceMetrics" },
    { $match: { "serviceMetrics.isHotspot": true } },
    {
      $group: {
        _id: "$serviceMetrics.service",
        totalIncidents: { $sum: "$serviceMetrics.incidentCount" },
        avgMTTR: { $avg: "$serviceMetrics.mttr" },
        trend: { $last: "$serviceMetrics.trendDirection" },
      },
    },
    { $sort: { totalIncidents: -1 } },
  ]);
};

const Analytics = mongoose.model<AnalyticsDocument, AnalyticsModel>(
  "Analytics",
  AnalyticsSchema
);

export default Analytics;
export { AnalyticsDocument, IAnalytics };
