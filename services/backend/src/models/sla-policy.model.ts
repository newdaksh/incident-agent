// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";

interface ISLAPolicy {
  name: string;
  description: string;
  conditions: {
    severity: string[];
    service?: string[];
    tags?: string[];
  };
  targets: {
    acknowledgmentTime: number; // in minutes
    resolutionTime: number; // in minutes
    escalationThreshold: number; // percentage of target time
  };
  escalation: {
    enabled: boolean;
    levels: Array<{
      level: number;
      triggerAt: number; // percentage of target time
      notifyUsers: mongoose.Types.ObjectId[];
      notifyChannels: string[];
      actions: string[];
    }>;
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface SLAPolicyDocument extends ISLAPolicy, Document {}

const SLAPolicySchema = new Schema<SLAPolicyDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    conditions: {
      severity: [
        {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
      ],
      service: [
        {
          type: String,
          trim: true,
        },
      ],
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    targets: {
      acknowledgmentTime: {
        type: Number,
        required: true,
        min: 1,
      },
      resolutionTime: {
        type: Number,
        required: true,
        min: 1,
      },
      escalationThreshold: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },
    },
    escalation: {
      enabled: {
        type: Boolean,
        default: true,
      },
      levels: [
        {
          level: {
            type: Number,
            required: true,
            min: 1,
          },
          triggerAt: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
          },
          notifyUsers: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          notifyChannels: [
            {
              type: String,
              trim: true,
            },
          ],
          actions: [
            {
              type: String,
              enum: ["notify", "reassign", "escalate", "auto-resolve"],
            },
          ],
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SLAPolicySchema.index({ "conditions.severity": 1 });
SLAPolicySchema.index({ "conditions.service": 1 });
SLAPolicySchema.index({ isActive: 1 });

// Static method to find applicable SLA for an incident
SLAPolicySchema.statics.findApplicable = function (incident: any) {
  return this.findOne({
    isActive: true,
    $or: [
      { "conditions.severity": incident.severity },
      { "conditions.service": incident.service },
      { "conditions.tags": { $in: incident.tags || [] } },
    ],
  }).sort({ "targets.resolutionTime": 1 }); // Most strict SLA first
};

const SLAPolicy = mongoose.model<SLAPolicyDocument>(
  "SLAPolicy",
  SLAPolicySchema
);

export default SLAPolicy;
export { SLAPolicyDocument, ISLAPolicy };
