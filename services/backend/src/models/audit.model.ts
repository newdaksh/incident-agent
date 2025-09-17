// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { IAuditLog } from "../types";

interface AuditLogDocument extends IAuditLog, Document {}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    incidentId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    result: {
      type: String,
      enum: ["success", "failure", "partial"],
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ incidentId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ result: 1, timestamp: -1 });

// TTL index to automatically delete old audit logs after 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to create audit log entry
AuditLogSchema.statics.createEntry = function (
  userId: string,
  action: string,
  resource: string,
  details: any,
  options: {
    incidentId?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    result?: "success" | "failure" | "partial";
  } = {}
) {
  return this.create({
    userId,
    action,
    resource,
    details,
    result: options.result || "success",
    ...options,
  });
};

// Static method to find logs by user
AuditLogSchema.statics.findByUser = function (userId: string, limit = 100) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

// Static method to find logs by incident
AuditLogSchema.statics.findByIncident = function (incidentId: string) {
  return this.find({ incidentId }).sort({ timestamp: -1 });
};

// Static method to find logs by date range
AuditLogSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: -1 });
};

const AuditLog = mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;
export { AuditLogDocument };
