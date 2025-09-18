export interface ChatMessage {
  author: "user" | "bot";
  text: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  followups?: string[];
}

export interface RemediationStep {
  id: string;
  step: string;
  description: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "executing"
    | "completed"
    | "failed";
  executedBy?: string;
  timestamp: Date;
  requiresApproval: boolean;
  safe: boolean;
  result?: string;
  error?: string;
}

export interface TicketLink {
  provider: "jira" | "pagerduty" | "servicenow";
  externalId: string;
  url: string;
  status: string;
  createdAt: Date;
}

export interface IncidentMetrics {
  detectionTime?: Date;
  acknowledgmentTime?: Date;
  resolutionTime?: Date;
  mttr?: number; // Mean Time To Resolution in minutes
  escalations: number;
  automatedActions: number;
}

export enum IncidentStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  INVESTIGATING = "investigating",
  RESOLVING = "resolving",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum IncidentSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

export enum IncidentSource {
  MONITORING = "monitoring",
  USER_REPORT = "user_report",
  API = "api",
  WEBHOOK = "webhook",
  MANUAL = "manual",
}

export interface IIncident {
  _id?: string;
  title: string;
  description?: string;
  service: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  reporter: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // Chat and bot interaction
  botTranscript: ChatMessage[];
  botAnalysis?: {
    confidence: number;
    rootCause?: string;
    impact?: string;
    recommendations: string[];
    analysisTimestamp: Date;
  };

  // Remediation
  remediations: RemediationStep[];
  runbookId?: string;

  // External integrations
  ticketLinks: TicketLink[];

  // Technical details
  logs?: string;
  stackTrace?: string;
  environment: string;
  affectedServices: string[];
  tags: string[];

  // Metrics and analytics
  metrics: IncidentMetrics;

  // SLA tracking
  sla?: {
    policy: string;
    responseTarget: number;
    resolutionTarget: number;
    breached: boolean;
    breachType?: "response" | "resolution";
    escalationLevel: number;
  };

  // RCA (Root Cause Analysis)
  rca?: {
    summary: string;
    timeline: string;
    rootCause: string;
    impact: string;
    contributingFactors: string[];
    preventionMeasures: string[];
    generatedBy: "user" | "bot";
    generatedAt: Date;
    status: "draft" | "approved" | "published";
    approvedBy?: string;
    approvedAt?: Date;
  };

  // Escalation history
  escalationHistory: {
    level: number;
    escalatedTo: string;
    escalatedBy: string;
    escalatedAt: Date;
    reason: string;
  }[];

  // Attachments and evidence
  attachments: string[];

  // Timeline and history
  timeline: {
    timestamp: Date;
    action: string;
    actor: string;
    details: string;
  }[];
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: "viewer" | "responder" | "admin" | "manager";
  permissions: string[];
  department?: string;
  teams: string[];
  skillTags: string[];
  onCall: boolean;
  timezone: string;
  authProvider: "local" | "azure" | "okta";
  preferences: {
    notifications: {
      email: boolean;
      slack: boolean;
      push: boolean;
    };
    dashboard: {
      defaultFilter: string;
      autoRefresh: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface IRunbook {
  _id?: string;
  name: string;
  description: string;
  serviceTags: string[];
  category: string;
  version: string;
  currentVersion: string;
  isActive: boolean;
  approvalStatus: "draft" | "pending" | "approved" | "rejected" | "deprecated";
  steps: {
    id: string;
    order: number;
    title: string;
    description: string;
    safe: boolean;
    requiresApproval: boolean;
    estimatedDuration: number; // in minutes
    command?: string;
    validation?: string;
  }[];
  versionHistory: {
    version: string;
    changes: string;
    author: string;
    createdAt: Date;
  }[];
  usageStats: {
    totalExecutions: number;
    successfulExecutions: number;
    lastUsed: Date;
    avgExecutionTime: number;
    userFeedback: {
      userId: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }[];
  };
  approvalHistory: {
    status: "approved" | "rejected";
    approvedBy: string;
    comment: string;
    createdAt: Date;
  }[];
  metadata: {
    author: string;
    reviewedBy?: string;
    approvedBy?: string;
    lastTested?: Date;
    successRate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id?: string;
  incidentId?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  result: "success" | "failure" | "partial";
}

// Socket.IO event types
export interface ServerToClientEvents {
  "incident.created": (incident: IIncident) => void;
  "incident.updated": (incident: IIncident) => void;
  "incident.chat_updated": (incidentId: string, message: ChatMessage) => void;
  "incident.status_changed": (
    incidentId: string,
    status: IncidentStatus
  ) => void;
  "incident.assigned": (incidentId: string, assignee: string) => void;
  "remediation.status_changed": (
    incidentId: string,
    remediationId: string,
    status: string
  ) => void;
  notification: (notification: {
    type: string;
    message: string;
    data?: any;
  }) => void;
}

export interface ClientToServerEvents {
  join_incident: (incidentId: string) => void;
  leave_incident: (incidentId: string) => void;
  typing: (incidentId: string, isTyping: boolean) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  role: string;
}

// API Request/Response types
export interface CreateIncidentRequest {
  title: string;
  description?: string;
  service: string;
  severity: IncidentSeverity;
  logs?: string;
  environment: string;
  source?: IncidentSource;
  tags?: string[];
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assignee?: string;
  tags?: string[];
}

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

export interface CreateTicketRequest {
  provider: "jira" | "pagerduty" | "servicenow";
  summary?: string;
  description?: string;
  priority?: string;
}
