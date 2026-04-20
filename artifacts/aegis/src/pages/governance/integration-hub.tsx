import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Globe,
  HardDrive,
  Info,
  Lock,
  Mail,
  MessageSquare,
  Radio,
  Ticket,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  status: 'connected' | 'hook_ready' | 'not_configured';
  permission: string;
  tenantModel: string;
  auditLog: boolean;
  failureSurfacing: string;
  events: string[];
  hookPoint: string;
  configNote?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Notifications',
    icon: MessageSquare,
    status: 'connected',
    permission: 'send_message, read_channels',
    tenantModel: 'Per-tenant webhook URL',
    auditLog: true,
    failureSurfacing:
      'Alert surfaced in operator analytics if delivery fails; retry 3x with backoff',
    events: ['incident_created', 'approval_requested', 'severity_escalated', 'case_closed'],
    hookPoint: 'POST /api/integrations/slack/notify',
    configNote: 'Webhook URL stored encrypted per tenant. No cross-tenant access possible.',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Notifications',
    icon: MessageSquare,
    status: 'hook_ready',
    permission: 'send_adaptive_card',
    tenantModel: 'Per-tenant OAuth token',
    auditLog: true,
    failureSurfacing: 'Delivery failure logged to audit log; fallback to email if configured',
    events: ['incident_created', 'approval_requested', 'executive_brief_ready'],
    hookPoint: 'POST /api/integrations/teams/notify',
    configNote:
      'OAuth token stored in tenant secret vault. Hook ready — requires customer tenant app registration.',
  },
  {
    id: 'email',
    name: 'Email / SMTP',
    category: 'Notifications',
    icon: Mail,
    status: 'connected',
    permission: 'send_email',
    tenantModel: 'Per-tenant SMTP credentials',
    auditLog: true,
    failureSurfacing: 'Delivery bounce logged; SMTP error surfaced in operator console',
    events: ['executive_brief_ready', 'approval_overdue', 'incident_critical_new'],
    hookPoint: 'POST /api/integrations/email/send',
  },
  {
    id: 'siem',
    name: 'SIEM / Splunk / QRadar',
    category: 'Alert Ingestion',
    icon: Radio,
    status: 'hook_ready',
    permission: 'ingest_events (read-only input)',
    tenantModel: 'Per-tenant API key / HEC token',
    auditLog: true,
    failureSurfacing:
      'Ingestion lag and parse errors shown in operator analytics; dead-letter queue for failed events',
    events: ['alert_ingest', 'correlation_trigger'],
    hookPoint: 'GET /api/integrations/siem/ingest',
    configNote:
      'Hook ready. Adapter supports Splunk HEC and generic syslog. Customer provides SIEM endpoint and API key.',
  },
  {
    id: 'ticketing',
    name: 'Ticketing / Jira / ServiceNow',
    category: 'Case Management',
    icon: Ticket,
    status: 'hook_ready',
    permission: 'create_issue, update_issue, read_issue',
    tenantModel: 'Per-tenant OAuth / API token',
    auditLog: true,
    failureSurfacing:
      'API error surfaced with ticket ID and HTTP status; retry with exponential backoff',
    events: ['case_created', 'case_updated', 'case_closed', 'approval_triggered'],
    hookPoint: 'POST /api/integrations/ticketing/create',
    configNote: 'Jira and ServiceNow adapters implemented. Customer provides project key and auth.',
  },
  {
    id: 'evidence_store',
    name: 'File Storage / Evidence Store',
    category: 'Evidence',
    icon: HardDrive,
    status: 'connected',
    permission: 'put_object, get_object, list_objects',
    tenantModel: 'Per-tenant S3 bucket or compatible',
    auditLog: true,
    failureSurfacing: 'Upload failure shown inline in case detail; presigned URL expiry tracked',
    events: ['evidence_attached', 'artifact_captured'],
    hookPoint: 'POST /api/integrations/evidence/upload',
  },
  {
    id: 'identity',
    name: 'Identity Provider / SSO',
    category: 'Identity',
    icon: Users,
    status: 'hook_ready',
    permission: 'read_user, read_group, authenticate',
    tenantModel: 'Per-tenant OIDC/SAML configuration',
    auditLog: true,
    failureSurfacing:
      'Auth failure surfaced to user with error code; fallback to local credentials if configured',
    events: ['user_login', 'user_provisioned', 'user_deprovisioned'],
    hookPoint: 'GET /api/auth/sso/callback',
    configNote:
      'OIDC/SAML hook ready. Tested with mock IdP. Customer provides IdP metadata and client credentials.',
  },
  {
    id: 'calendar',
    name: 'Calendar / Exchange / Google',
    category: 'Scheduling',
    icon: Calendar,
    status: 'hook_ready',
    permission: 'create_event, read_calendar',
    tenantModel: 'Per-tenant OAuth',
    auditLog: true,
    failureSurfacing:
      'Calendar event creation failure logged; no silent retry — explicit error displayed',
    events: ['drill_scheduled', 'review_scheduled', 'briefing_scheduled'],
    hookPoint: 'POST /api/integrations/calendar/create-event',
    configNote:
      'Hook ready for Exchange Online and Google Workspace. Customer provides OAuth scope approval.',
  },
  {
    id: 'docs',
    name: 'Docs / Drive / SharePoint',
    category: 'Documentation',
    icon: FileText,
    status: 'hook_ready',
    permission: 'create_document, update_document, read_document',
    tenantModel: 'Per-tenant OAuth / service account',
    auditLog: true,
    failureSurfacing:
      'Document creation failure surfaced with link to retry; no auto-retry to avoid duplicate docs',
    events: ['report_published', 'after_action_created', 'playbook_updated'],
    hookPoint: 'POST /api/integrations/docs/publish',
    configNote:
      'Hook ready for SharePoint Online and Google Drive. Customer provides OAuth credentials and folder path.',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: 'Connected', color: '#22c55e', bg: 'bg-green-500/20 text-green-400' },
  hook_ready: { label: 'Hook Ready', color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  not_configured: { label: 'Not Configured', color: '#6b7280', bg: 'bg-gray-500/20 text-gray-400' },
};

const CATEGORIES = [
  'All',
  'Notifications',
  'Alert Ingestion',
  'Case Management',
  'Evidence',
  'Identity',
  'Scheduling',
  'Documentation',
];

export default function IntegrationHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filtered =
    selectedCategory === 'All'
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Globe size={22} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white font-mono tracking-tight">
              Integration Hub
            </h1>
          </div>
          <p className="text-xs text-[#8b9ab0] font-mono">
            Teams · Slack · Email · SIEM · Ticketing · Evidence store · Identity · Calendar · Docs —
            all tenant-owned, all auditable
          </p>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
          <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
            All integrations are <strong>tenant-owned</strong>: credentials belong to and are
            controlled by each customer tenant. Aegis never shares credentials across tenants. Hook
            Ready means the adapter is built but requires per-customer configuration. Failure
            surfacing is explicit — no silent failures.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${selectedCategory === c ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'text-[#8b9ab0] border border-[#1e2a3a] hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((integration) => {
            const statusStyle = STATUS_LABELS[integration.status];
            const isSelected = selectedIntegration?.id === integration.id;
            return (
              <div key={integration.id}>
                <button
                  onClick={() => setSelectedIntegration(isSelected ? null : integration)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-amber-400/10 border-amber-400/40' : 'bg-[#0d1117] border-[#1e2a3a] hover:border-[#2e3a4a]'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <integration.icon size={14} className="text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold text-white">{integration.name}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${statusStyle.bg}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b9ab0]">
                        {integration.category} · {integration.permission}
                      </p>
                      <p className="text-xs text-[#8b9ab0]/60 font-mono truncate">
                        {integration.hookPoint}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {integration.auditLog && (
                        <span className="text-xs text-green-400 font-mono">Audited</span>
                      )}
                      <ChevronRight
                        size={14}
                        className={`text-[#8b9ab0] transition-transform ${isSelected ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {isSelected && (
                  <div className="mt-1 p-4 bg-[#0a0f16] border border-amber-400/20 border-t-0 rounded-b-xl space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#8b9ab0] font-mono mb-1">Tenant Model</p>
                        <p className="text-xs text-white">{integration.tenantModel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b9ab0] font-mono mb-1">Audit Logged</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-400" />
                          <p className="text-xs text-green-400">Every action</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#8b9ab0] font-mono mb-1">Events Triggered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {integration.events.map((e) => (
                          <span
                            key={e}
                            className="text-xs bg-[#1e2a3a] text-[#8b9ab0] px-2 py-0.5 rounded font-mono"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#8b9ab0] font-mono mb-1">Failure Surfacing</p>
                      <p className="text-xs text-white">{integration.failureSurfacing}</p>
                    </div>

                    {integration.configNote && (
                      <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded flex items-start gap-2">
                        <Info size={11} className="text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-200/80 font-mono">
                          {integration.configNote}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Connected',
              value: INTEGRATIONS.filter((i) => i.status === 'connected').length,
              color: '#22c55e',
            },
            {
              label: 'Hook Ready',
              value: INTEGRATIONS.filter((i) => i.status === 'hook_ready').length,
              color: '#f59e0b',
            },
            {
              label: 'All Audited',
              value: INTEGRATIONS.filter((i) => i.auditLog).length,
              color: '#3b82f6',
            },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-xs text-[#8b9ab0] font-mono mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
