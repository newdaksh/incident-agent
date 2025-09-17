import express from "express";
import crypto from "crypto";
import { asyncHandler } from "../middlewares/error.middleware";
import Incident from "../models/incident.model";
import AuditLog from "../models/audit.model";
import { IncidentSeverity, IncidentSource } from "../types";
import { logger } from "../utils/logger";

const router = express.Router();

// Webhook signature verification middleware
const verifyWebhookSignature = (req: any, res: any, next: any) => {
  const signature =
    req.get("X-Webhook-Signature") || req.get("X-Hub-Signature-256");
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn(
      "WEBHOOK_SECRET not configured, skipping signature verification"
    );
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: "Missing webhook signature" });
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  const providedSignature = signature.replace("sha256=", "");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    )
  ) {
    logger.warn("Invalid webhook signature received");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  next();
};

// POST /webhooks/alerts - External monitoring alerts
router.post(
  "/alerts",
  verifyWebhookSignature,
  asyncHandler(async (req, res) => {
    const alertData = req.body;
    logger.info("Received webhook alert:", alertData);

    // Map alert data to incident format
    const incidentData = {
      title: alertData.title || alertData.alert_name || "Unknown Alert",
      description: alertData.description || alertData.message || "",
      service: alertData.service || alertData.source || "unknown",
      severity: mapAlertSeverity(alertData.severity || alertData.priority),
      source: IncidentSource.WEBHOOK,
      reporter: "system",
      environment: alertData.environment || "production",
      logs: alertData.logs || alertData.details || "",
      tags: alertData.tags || [],
      affectedServices: alertData.affected_services || [
        alertData.service || "unknown",
      ],
    };

    // Create incident
    const incident = new Incident({
      ...incidentData,
      timeline: [
        {
          timestamp: new Date(),
          action: "created",
          actor: "webhook",
          details: `Alert received from ${
            alertData.source || "monitoring system"
          }`,
        },
      ],
    });

    await incident.save();

    // Log webhook receipt
    await (AuditLog as any).createEntry(
      "system",
      "webhook_alert_received",
      "incident",
      { alertData, incidentId: incident._id },
      {
        incidentId: incident._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    // Emit real-time event
    if (req.io) {
      req.io.emitIncidentCreated(incident);

      // Notify on-call engineers for critical/high severity
      if (
        incident.severity === IncidentSeverity.CRITICAL ||
        incident.severity === IncidentSeverity.HIGH
      ) {
        req.io.notifyRole("responder", {
          type: "critical_incident",
          message: `Critical incident created: ${incident.title}`,
          data: { incidentId: incident._id, severity: incident.severity },
        });
      }
    }

    logger.info(`Incident created from webhook: ${incident._id}`);

    res.status(201).json({
      message: "Alert processed successfully",
      incident: {
        id: incident._id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
      },
    });
  })
);

// POST /webhooks/n8n/:workflowId/callback - n8n workflow callbacks
router.post(
  "/n8n/:workflowId/callback",
  verifyWebhookSignature,
  asyncHandler(async (req, res) => {
    const { workflowId } = req.params;
    const callbackData = req.body;

    logger.info(
      `Received n8n callback for workflow ${workflowId}:`,
      callbackData
    );

    // Process different types of n8n callbacks
    switch (callbackData.type) {
      case "ticket_created":
        await handleTicketCreatedCallback(callbackData);
        break;
      case "remediation_approved":
        await handleRemediationApprovedCallback(callbackData);
        break;
      case "rca_published":
        await handleRCAPublishedCallback(callbackData);
        break;
      default:
        logger.warn(`Unknown n8n callback type: ${callbackData.type}`);
    }

    // Log n8n callback
    await (AuditLog as any).createEntry(
      "system",
      "n8n_callback_received",
      "workflow",
      { workflowId, callbackData },
      {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.json({
      message: "Callback processed successfully",
      workflowId,
      type: callbackData.type,
    });
  })
);

// POST /webhooks/monitoring/:provider - Provider-specific monitoring webhooks
router.post(
  "/monitoring/:provider",
  verifyWebhookSignature,
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const webhookData = req.body;

    logger.info(`Received ${provider} monitoring webhook:`, webhookData);

    // Provider-specific processing
    let incidentData;

    switch (provider.toLowerCase()) {
      case "prometheus":
        incidentData = processPrometheusAlert(webhookData);
        break;
      case "grafana":
        incidentData = processGrafanaAlert(webhookData);
        break;
      case "datadog":
        incidentData = processDatadogAlert(webhookData);
        break;
      case "newrelic":
        incidentData = processNewRelicAlert(webhookData);
        break;
      default:
        incidentData = processGenericAlert(webhookData);
    }

    if (incidentData) {
      const incident = new Incident({
        ...incidentData,
        source: IncidentSource.MONITORING,
        reporter: "system",
        timeline: [
          {
            timestamp: new Date(),
            action: "created",
            actor: provider,
            details: `Alert received from ${provider}`,
          },
        ],
      });

      await incident.save();

      // Emit real-time event
      if (req.io) {
        req.io.emitIncidentCreated(incident);
      }

      res.status(201).json({
        message: "Monitoring alert processed successfully",
        incident: {
          id: incident._id,
          title: incident.title,
          severity: incident.severity,
        },
      });
    } else {
      res.status(400).json({
        error: "Unable to process monitoring alert",
      });
    }
  })
);

// Helper functions
function mapAlertSeverity(severity: string): IncidentSeverity {
  const severityMap: { [key: string]: IncidentSeverity } = {
    critical: IncidentSeverity.CRITICAL,
    high: IncidentSeverity.HIGH,
    medium: IncidentSeverity.MEDIUM,
    low: IncidentSeverity.LOW,
    warning: IncidentSeverity.MEDIUM,
    error: IncidentSeverity.HIGH,
    info: IncidentSeverity.INFO,
  };

  return severityMap[severity?.toLowerCase()] || IncidentSeverity.MEDIUM;
}

async function handleTicketCreatedCallback(data: any) {
  if (data.incidentId && data.ticketId) {
    const incident = await Incident.findById(data.incidentId);
    if (incident) {
      incident.ticketLinks.push({
        provider: data.provider,
        externalId: data.ticketId,
        url: data.ticketUrl,
        status: data.status || "open",
        createdAt: new Date(),
      });

      incident.timeline.push({
        timestamp: new Date(),
        action: "ticket_created",
        actor: "n8n",
        details: `Ticket created: ${data.ticketId}`,
      });

      await incident.save();
    }
  }
}

async function handleRemediationApprovedCallback(data: any) {
  if (data.incidentId && data.remediationId) {
    const incident = await Incident.findById(data.incidentId);
    if (incident) {
      const remediation = incident.remediations.find(
        (r) => r.id === data.remediationId
      );
      if (remediation) {
        remediation.status = data.approved ? "approved" : "rejected";
        remediation.executedBy = data.approvedBy;

        incident.timeline.push({
          timestamp: new Date(),
          action: "remediation_" + (data.approved ? "approved" : "rejected"),
          actor: data.approvedBy || "n8n",
          details: `Remediation ${data.approved ? "approved" : "rejected"}: ${
            remediation.step
          }`,
        });

        await incident.save();
      }
    }
  }
}

async function handleRCAPublishedCallback(data: any) {
  if (data.incidentId) {
    const incident = await Incident.findById(data.incidentId);
    if (incident) {
      incident.timeline.push({
        timestamp: new Date(),
        action: "rca_published",
        actor: "n8n",
        details: `RCA published: ${data.rcaUrl || "RCA report"}`,
      });

      await incident.save();
    }
  }
}

function processPrometheusAlert(data: any): any {
  // Prometheus AlertManager webhook format
  return {
    title: data.groupLabels?.alertname || "Prometheus Alert",
    description: data.commonAnnotations?.description || "",
    service: data.groupLabels?.service || data.groupLabels?.job || "unknown",
    severity: mapAlertSeverity(data.groupLabels?.severity || "medium"),
    environment: data.groupLabels?.environment || "production",
    tags: Object.keys(data.groupLabels || {}),
  };
}

function processGrafanaAlert(data: any): any {
  // Grafana webhook format
  return {
    title: data.title || data.ruleName || "Grafana Alert",
    description: data.message || "",
    service: data.tags?.service || "unknown",
    severity: mapAlertSeverity(data.state || "medium"),
    environment: data.tags?.environment || "production",
    tags: Object.keys(data.tags || {}),
  };
}

function processDatadogAlert(data: any): any {
  // Datadog webhook format
  return {
    title: data.alert_title || "Datadog Alert",
    description: data.alert_message || "",
    service:
      data.tags
        ?.find((t: string) => t.startsWith("service:"))
        ?.replace("service:", "") || "unknown",
    severity: mapAlertSeverity(data.alert_priority || "medium"),
    environment:
      data.tags
        ?.find((t: string) => t.startsWith("env:"))
        ?.replace("env:", "") || "production",
    tags: data.tags || [],
  };
}

function processNewRelicAlert(data: any): any {
  // New Relic webhook format
  return {
    title: data.incident?.condition_name || "New Relic Alert",
    description: data.incident?.details || "",
    service: data.incident?.targets?.[0]?.name || "unknown",
    severity: mapAlertSeverity(data.incident?.priority || "medium"),
    environment: "production",
    tags: data.incident?.targets?.[0]?.labels || [],
  };
}

function processGenericAlert(data: any): any {
  // Generic alert format
  return {
    title: data.title || data.name || data.alert || "Alert",
    description: data.description || data.message || data.details || "",
    service: data.service || data.source || "unknown",
    severity: mapAlertSeverity(data.severity || data.priority || "medium"),
    environment: data.environment || "production",
    tags: data.tags || [],
  };
}

export default router;
