// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { IRunbook } from "../types";

interface RunbookDocument extends IRunbook, Document {}

const RunbookStepSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    safe: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 5,
    },
    command: {
      type: String,
      trim: true,
    },
    validation: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const RunbookSchema = new Schema<RunbookDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    serviceTags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Version control
    currentVersion: {
      type: String,
      default: "1.0.0",
    },
    versionHistory: [
      {
        version: String,
        changes: String,
        author: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Usage tracking
    usageStats: {
      totalExecutions: {
        type: Number,
        default: 0,
      },
      successfulExecutions: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
      avgExecutionTime: {
        type: Number,
        default: 0,
      },
      userFeedback: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          comment: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Enhanced metadata
    approvalStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "deprecated"],
      default: "draft",
    },
    approvalHistory: [
      {
        status: String,
        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        comment: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    steps: [RunbookStepSchema],
    metadata: {
      author: {
        type: String,
        required: true,
      },
      reviewedBy: {
        type: String,
      },
      approvedBy: {
        type: String,
      },
      lastTested: {
        type: Date,
      },
      successRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
RunbookSchema.index({ name: 1 });
RunbookSchema.index({ serviceTags: 1 });
RunbookSchema.index({ category: 1 });
RunbookSchema.index({ isActive: 1 });

// Virtual for total estimated duration
RunbookSchema.virtual("totalEstimatedDuration").get(function () {
  return this.steps.reduce(
    (total: number, step: any) => total + step.estimatedDuration,
    0
  );
});

// Static method to find runbooks by service tag
RunbookSchema.statics.findByServiceTag = function (tag: string) {
  return this.find({ serviceTags: tag, isActive: true });
};

// Static method to find active runbooks
RunbookSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

const Runbook = mongoose.model<RunbookDocument>("Runbook", RunbookSchema);

export default Runbook;
export { RunbookDocument };
