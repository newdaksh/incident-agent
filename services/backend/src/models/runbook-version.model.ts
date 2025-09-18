// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";

interface IRunbookVersion {
  runbookId: mongoose.Types.ObjectId;
  version: string;
  title: string;
  description: string;
  service: string;
  tags: string[];
  steps: Array<{
    id: string;
    order: number;
    title: string;
    description: string;
    safe: boolean;
    requiresApproval: boolean;
    estimatedDuration: number;
    command?: string;
    validation?: string;
  }>;
  author: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: "draft" | "pending" | "approved" | "deprecated";
  changelog?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RunbookVersionDocument extends IRunbookVersion, Document {}

const RunbookVersionSchema = new Schema<RunbookVersionDocument>(
  {
    runbookId: {
      type: Schema.Types.ObjectId,
      ref: "Runbook",
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
    },
    title: {
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
    service: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    steps: [
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
          type: Number,
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
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "deprecated"],
      default: "draft",
      index: true,
    },
    changelog: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
RunbookVersionSchema.index({ runbookId: 1, version: 1 }, { unique: true });
RunbookVersionSchema.index({ service: 1, status: 1 });
RunbookVersionSchema.index({ isActive: 1, status: 1 });

// Virtual for formatted version
RunbookVersionSchema.virtual("formattedVersion").get(function () {
  return `v${this.version}`;
});

const RunbookVersion = mongoose.model<RunbookVersionDocument>(
  "RunbookVersion",
  RunbookVersionSchema
);

export default RunbookVersion;
export { RunbookVersionDocument, IRunbookVersion };
