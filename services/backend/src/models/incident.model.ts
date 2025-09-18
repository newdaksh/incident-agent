// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import {
  IIncident,
  IncidentStatus,
  IncidentSeverity,
  IncidentSource,
  ChatMessage,
  RemediationStep,
  TicketLink,
  IncidentMetrics,
} from "../types";

interface IncidentDocument extends IIncident, Document {}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    author: {
      type: String,
      enum: ["user", "bot"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    suggestions: [
      {
        type: String,
      },
    ],
    followups: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

const RemediationStepSchema = new Schema<RemediationStep>(
  {
    id: {
      type: String,
      required: true,
    },
    step: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "executing",
        "completed",
        "failed",
      ],
      default: "pending",
    },
    executedBy: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    safe: {
      type: Boolean,
      default: true,
    },
    result: {
      type: String,
    },
    error: {
      type: String,
    },
  },
  { _id: false }
);

const TicketLinkSchema = new Schema<TicketLink>(
  {
    provider: {
      type: String,
      enum: ["jira", "pagerduty", "servicenow"],
      required: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const IncidentMetricsSchema = new Schema<IncidentMetrics>(
  {
    detectionTime: {
      type: Date,
    },
    acknowledgmentTime: {
      type: Date,
    },
    resolutionTime: {
      type: Date,
    },
    mttr: {
      type: Number, // in minutes
    },
    escalations: {
      type: Number,
      default: 0,
    },
    automatedActions: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const TimelineEntrySchema = new Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IncidentDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    service: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(IncidentSeverity),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.OPEN,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(IncidentSource),
      default: IncidentSource.MANUAL,
    },
    reporter: {
      type: String,
      required: true,
      index: true,
    },
    assignee: {
      type: String,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },

    // Chat and bot interaction
    botTranscript: [ChatMessageSchema],
    botAnalysis: {
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      rootCause: String,
      impact: String,
      recommendations: [String],
      analysisTimestamp: {
        type: Date,
        default: Date.now,
      },
    },

    // SLA tracking
    sla: {
      policyId: {
        type: Schema.Types.ObjectId,
        ref: "SLAPolicy",
      },
      acknowledgmentDeadline: Date,
      resolutionDeadline: Date,
      breached: {
        type: Boolean,
        default: false,
      },
      breachType: {
        type: String,
        enum: ["acknowledgment", "resolution", "both"],
      },
      escalationLevel: {
        type: Number,
        default: 0,
      },
      timeToAcknowledgment: Number, // in minutes
      timeToResolution: Number, // in minutes
    },

    // RCA (Root Cause Analysis)
    rca: {
      summary: String,
      timeline: String,
      rootCause: String,
      impact: String,
      contributingFactors: [String],
      preventionMeasures: [String],
      generatedBy: {
        type: String,
        enum: ["user", "bot"],
      },
      generatedAt: Date,
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      status: {
        type: String,
        enum: ["draft", "pending", "approved", "published"],
        default: "draft",
      },
    },

    // Enhanced tracking
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    watchers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    escalationHistory: [
      {
        level: Number,
        escalatedAt: Date,
        escalatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
      },
    ],

    // Remediation
    remediations: [RemediationStepSchema],
    runbookId: {
      type: String,
    },

    // External integrations
    ticketLinks: [TicketLinkSchema],

    // Technical details
    logs: {
      type: String,
      maxlength: 50000,
    },
    stackTrace: {
      type: String,
      maxlength: 10000,
    },
    environment: {
      type: String,
      required: true,
      default: "production",
    },
    affectedServices: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Metrics and analytics
    metrics: IncidentMetricsSchema,

    // Attachments and evidence
    attachments: [
      {
        type: String,
      },
    ],

    // Timeline and history
    timeline: [TimelineEntrySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
IncidentSchema.index({ service: 1, severity: 1 });
IncidentSchema.index({ status: 1, createdAt: -1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ tags: 1 });
IncidentSchema.index({ reporter: 1, createdAt: -1 });
IncidentSchema.index({ assignee: 1, status: 1 });

// Virtual for incident age in minutes
IncidentSchema.virtual("ageInMinutes").get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
});

// Virtual for resolution time in minutes
IncidentSchema.virtual("resolutionTimeMinutes").get(function () {
  if (this.resolvedAt && this.createdAt) {
    return Math.floor(
      (this.resolvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
    );
  }
  return null;
});

// Middleware to update timeline on status changes
IncidentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.timeline.push({
      timestamp: new Date(),
      action: "status_changed",
      actor: "system", // This should be replaced with actual user in the controller
      details: `Status changed to ${this.status}`,
    });
  }

  if (this.isModified("assignee")) {
    this.timeline.push({
      timestamp: new Date(),
      action: "assigned",
      actor: "system",
      details: `Assigned to ${this.assignee}`,
    });
  }

  next();
});

// Static method to find incidents by service
IncidentSchema.statics.findByService = function (service: string) {
  return this.find({ service }).sort({ createdAt: -1 });
};

// Static method to find open incidents
IncidentSchema.statics.findOpen = function () {
  return this.find({
    status: {
      $in: [
        IncidentStatus.OPEN,
        IncidentStatus.ACKNOWLEDGED,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.RESOLVING,
      ],
    },
  }).sort({ severity: 1, createdAt: -1 });
};

// Instance method to add timeline entry
IncidentSchema.methods.addTimelineEntry = function (
  action: string,
  actor: string,
  details: string
) {
  this.timeline.push({
    timestamp: new Date(),
    action,
    actor,
    details,
  });
  return this.save();
};

// Instance method to update metrics
IncidentSchema.methods.updateMetrics = function () {
  const now = new Date();

  if (
    this.status === IncidentStatus.ACKNOWLEDGED &&
    !this.metrics.acknowledgmentTime
  ) {
    this.metrics.acknowledgmentTime = now;
  }

  if (
    (this.status === IncidentStatus.RESOLVED ||
      this.status === IncidentStatus.CLOSED) &&
    !this.metrics.resolutionTime
  ) {
    this.metrics.resolutionTime = now;
    this.metrics.mttr = Math.floor(
      (now.getTime() - this.createdAt.getTime()) / (1000 * 60)
    );
  }

  return this.save();
};

const Incident = mongoose.model<IncidentDocument>("Incident", IncidentSchema);

export default Incident;
export { IncidentDocument };
