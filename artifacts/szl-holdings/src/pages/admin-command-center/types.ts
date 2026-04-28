export interface Tenant {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
  memberCount: number;
  subscription: { status: string; planId: number } | null;
  createdAt: string;
  updatedAt: string | null;
}
export interface TenantDetail {
  tenant: Tenant & { memberCount: number };
  members: {
    id: number;
    email: string;
    displayName: string | null;
    role: string;
    joinedAt: string;
  }[];
  subscription: {
    id: number;
    status: string;
    planId: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  usage: { featureKey: string; total: number }[];
}
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
}
export interface UserDetail {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: number; name: string }[];
  organizations: { id: number; name: string; slug: string; role: string }[];
}
export interface PlatformRole {
  id: number;
  name: string;
  description: string | null;
}
export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  result: string;
  timestamp: string;
  details: string | null;
  ipAddress: string | null;
  orgName?: string | null;
  entityType?: string;
  entityId?: string;
  orgId?: number;
}
export interface FeatureFlag {
  key: string;
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  updatedAt: string;
}
export interface FlagOverride {
  id: number;
  flagId: number;
  entityType: 'user' | 'org' | 'role';
  entityId: string;
  isEnabled: boolean;
}
export interface HealthCheck {
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  details: string;
}
export interface SupportTicket {
  id: number;
  formKey: string;
  fullName: string;
  email: string;
  company?: string;
  message?: string;
  createdAt: string;
  status?: string;
  notes?: string;
  ownerUserId?: number | null;
  leadStatusId?: number | null;
  submissionStatus?: 'open' | 'resolved';
  resolvedAt?: string | null;
  notificationSentAt?: string | null;
  emailOptOut?: boolean;
}
export interface OverviewData {
  counts: {
    users: number;
    activeUsers: number;
    apps: number;
    connectors: number;
    liveConnectors: number;
  };
  database: { status: string; latency: number };
  system: { uptime: number; memoryUsage: { rss: number; heapUsed: number } };
}
export interface AnalyticsData {
  platform: {
    totalUsers: number;
    activeUsers: number;
    totalTenants: number;
    activeFlags: number;
    totalAuditEvents: number;
    openSupportTickets: number;
  };
  topTenants: { orgId: number | null; name: string; totalUsage: number }[];
  billing: {
    plan: string;
    status: string;
    monthlyAmount: number;
    currency: string;
    seats: number;
  } | null;
  api: {
    requestCount: number;
    errorRate: number;
    p95Latency: number;
    throughputPerHour: number;
    authFailures: number;
  };
  uptime: number;
}
export interface KbArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ReplyModal {
  ticketId: number;
  email: string;
  name: string;
  subject: string;
  body: string;
}
export interface SupportReply {
  id: number;
  contactSubmissionId: number;
  subject: string;
  body: string;
  sentBy: string;
  emailSuccess: boolean;
  messageId: string | null;
  sentAt: string;
}
export interface EmailLogEntry {
  id: number;
  contactSubmissionId: number;
  recipient: string;
  subject: string;
  template: string;
  previousStatus: string | null;
  newStatus: string | null;
  deliveryStatus: 'sent' | 'failed';
  provider: string | null;
  messageId: string | null;
  error: string | null;
  sentAt: string;
}
export interface AuditGroup {
  orgName: string;
  count: number;
  logs: AuditEntry[];
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'tenants', label: 'Tenants', icon: 'Building2' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'support', label: 'Support Queue', icon: 'HeadphonesIcon' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'BookOpen' },
  { id: 'audit', label: 'Audit Log', icon: 'Shield' },
  { id: 'flags', label: 'Feature Flags', icon: 'Flag' },
  { id: 'health', label: 'System Health', icon: 'Activity' },
] as const;

export type Section = 'overview' | 'analytics' | 'tenants' | 'users' | 'support' | 'knowledge' | 'audit' | 'flags' | 'health';
export type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'neutral';
export type TicketStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
