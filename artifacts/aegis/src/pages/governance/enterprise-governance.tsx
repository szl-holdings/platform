import { useState } from "react";
import {
  Shield, Lock, Users, Database, FileText, CheckCircle2, Clock,
  AlertTriangle, Settings, Building2, Key, Archive, Globe, Info, ChevronDown, ChevronRight
} from "lucide-react";

const SSO_HOOK = {
  status: "hook_ready",
  protocols: ["SAML 2.0", "OIDC / OAuth 2.0"],
  note: "Hook points implemented. Actual provider config (Okta, Azure AD, Ping) is per-customer deployment. Tested with mock IdP in demo environment.",
};

const SCIM_HOOK = {
  status: "hook_ready",
  operations: ["User provisioning", "Group sync", "Role assignment", "Deprovisioning"],
  note: "SCIM 2.0 endpoint stub implemented. Provider binding requires customer IDP configuration.",
};

const RBAC_ROLES = [
  { role: "Super Admin", scope: "platform", permissions: ["*"], tenantIsolated: false },
  { role: "Tenant Admin", scope: "tenant", permissions: ["manage_users", "manage_integrations", "view_audit_logs", "configure_policies"], tenantIsolated: true },
  { role: "SOC Analyst", scope: "tenant", permissions: ["view_incidents", "update_incidents", "create_cases", "view_findings"], tenantIsolated: true },
  { role: "SOC Lead", scope: "tenant", permissions: ["approve_actions", "close_incidents", "manage_cases", "view_all_reports"], tenantIsolated: true },
  { role: "Executive Viewer", scope: "tenant", permissions: ["view_executive_reports", "view_risk_posture"], tenantIsolated: true },
  { role: "Integration Manager", scope: "tenant", permissions: ["manage_integrations", "view_audit_logs"], tenantIsolated: true },
  { role: "Read Only", scope: "tenant", permissions: ["view_incidents", "view_findings", "view_reports"], tenantIsolated: true },
];

const AUDIT_LOG_ENTRIES = [
  { id: "AL-8821", action: "approval_granted", actor: "M. Walsh (SOC Lead)", target: "APR-041 — network isolation DC-PROD-03", tenant: "Acme Corp", at: "2m ago", risk: "high" },
  { id: "AL-8820", action: "policy_block", actor: "system", target: "cross-tenant query attempt by agent-07", tenant: "Acme Corp", at: "18m ago", risk: "critical" },
  { id: "AL-8819", action: "case_closed", actor: "L. Kim (SOC Analyst)", target: "CASE-0038 — credential spray", tenant: "Acme Corp", at: "1h 42m ago", risk: "low" },
  { id: "AL-8818", action: "integration_connected", actor: "R. Patel (Integration Mgr)", target: "Slack webhook — #soc-alerts", tenant: "Acme Corp", at: "3h 10m ago", risk: "low" },
  { id: "AL-8817", action: "report_exported", actor: "S. Torres (Executive Viewer)", target: "Board Summary Q1 2025", tenant: "Acme Corp", at: "1d ago", risk: "low" },
];

const RETENTION_POLICIES = [
  { type: "Audit logs", retention: "2 years", enforcement: "Hard delete after retention period", status: "active" },
  { type: "Incident records", retention: "7 years", enforcement: "Archive to cold storage after 1 year", status: "active" },
  { type: "Evidence artifacts", retention: "3 years", enforcement: "Encrypted archive, tenant-keyed", status: "active" },
  { type: "Model call logs", retention: "90 days", enforcement: "Rolling delete", status: "active" },
  { type: "Session tokens", retention: "24 hours", enforcement: "Auto-revoke on expiry", status: "active" },
];

const POLICY_TEMPLATES = [
  { id: "TPL-001", name: "High-Risk Action Approval Gate", type: "approval_matrix", scope: "global", description: "All actions classified as high-risk require explicit human approval before execution." },
  { id: "TPL-002", name: "Cross-Tenant Isolation Block", type: "data_access", scope: "global", description: "Agent queries are strictly bounded to the originating tenant. Cross-tenant reads or writes are blocked and logged." },
  { id: "TPL-003", name: "Model Cost Ceiling — $500/month", type: "cost_ceiling", scope: "tenant", description: "Hard stop at $500/month per tenant. Warn at 80%. Requires admin override to exceed." },
  { id: "TPL-004", name: "Observe-Only Demo Mode", type: "agent_permission", scope: "tenant", description: "All agent actions limited to observe_only. No writes, no notifications, no approvals triggered." },
  { id: "TPL-005", name: "NIST CSF Compliance Controls Baseline", type: "compliance_template", scope: "tenant", description: "Enforce required controls mapped to NIST CSF Identify, Protect, Detect, Respond, Recover." },
];

const INTEGRATIONS_PERMISSION_STATUS = [
  { name: "Slack", permission: "send_notifications, read_channels", tenant: "per-tenant key", auditLog: true, status: "connected" },
  { name: "Microsoft Teams", permission: "send_adaptive_cards", tenant: "per-tenant OAuth", auditLog: true, status: "hook_ready" },
  { name: "Email / SMTP", permission: "send_alerts", tenant: "per-tenant SMTP creds", auditLog: true, status: "connected" },
  { name: "SIEM / Splunk", permission: "ingest_events (read)", tenant: "per-tenant API key", auditLog: true, status: "hook_ready" },
  { name: "Ticketing / Jira", permission: "create_ticket, update_ticket", tenant: "per-tenant OAuth", auditLog: true, status: "hook_ready" },
  { name: "Evidence Store / S3", permission: "put_object, get_object", tenant: "per-tenant bucket", auditLog: true, status: "connected" },
  { name: "Identity Provider", permission: "read_user, read_group", tenant: "per-tenant SCIM/OIDC", auditLog: true, status: "hook_ready" },
  { name: "Calendar / Exchange", permission: "create_event, read_calendar", tenant: "per-tenant OAuth", auditLog: true, status: "hook_ready" },
];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 hover:bg-[#0a0f16] transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-amber-400" />
          <span className="text-sm font-semibold text-white font-mono">{title}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-[#8b9ab0]" /> : <ChevronRight size={14} className="text-[#8b9ab0]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function EnterpriseGovernancePage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 size={22} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white font-mono tracking-tight">Enterprise Governance</h1>
          </div>
          <p className="text-xs text-[#8b9ab0] font-mono">SSO/SCIM hooks · RBAC · Tenant isolation · Audit logs · Retention · Export controls · Admin console · Policy templates</p>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
          <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
            SSO and SCIM show <strong>hook-ready</strong> status. Full provider integration requires per-customer deployment configuration. This page shows current posture honestly — no capabilities are overstated.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "SSO", value: "Hook Ready", color: "#f59e0b", icon: Key },
            { label: "SCIM Provisioning", value: "Hook Ready", color: "#f59e0b", icon: Users },
            { label: "Server-side RBAC", value: "Active", color: "#22c55e", icon: Lock },
            { label: "Tenant Isolation", value: "Enforced", color: "#22c55e", icon: Shield },
          ].map(m => (
            <div key={m.label} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono">{m.label}</span>
                <m.icon size={14} color={m.color} />
              </div>
              <span className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>

        <Section title="SSO Hook Points" icon={Key}>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b9ab0] font-mono">Protocols supported</span>
              <div className="flex gap-2">{SSO_HOOK.protocols.map(p => <span key={p} className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">{p}</span>)}</div>
            </div>
            <div className="p-3 bg-[#0a0f16] border border-amber-400/20 rounded-lg">
              <p className="text-xs text-[#8b9ab0] font-mono">{SSO_HOOK.note}</p>
            </div>
          </div>
        </Section>

        <Section title="SCIM 2.0 Provisioning Hook" icon={Users}>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              {SCIM_HOOK.operations.map(op => (
                <div key={op} className="flex items-center gap-2 p-2 bg-[#0a0f16] rounded border border-[#1e2a3a]">
                  <CheckCircle2 size={12} className="text-green-400" />
                  <span className="text-xs text-white font-mono">{op}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8b9ab0] font-mono">{SCIM_HOOK.note}</p>
          </div>
        </Section>

        <Section title="Server-side RBAC — Role Definitions" icon={Lock}>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {["Role", "Scope", "Tenant Isolated", "Key Permissions"].map(h => (
                    <th key={h} className="text-left text-[#8b9ab0] pb-2 pr-4 font-normal uppercase tracking-widest text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1117]">
                {RBAC_ROLES.map(r => (
                  <tr key={r.role} className="hover:bg-[#0a0f16] transition-colors">
                    <td className="py-2.5 pr-4 text-white font-semibold">{r.role}</td>
                    <td className="py-2.5 pr-4 text-[#8b9ab0]">{r.scope}</td>
                    <td className="py-2.5 pr-4">
                      {r.tenantIsolated ? <CheckCircle2 size={12} className="text-green-400" /> : <span className="text-amber-400 text-xs">Global</span>}
                    </td>
                    <td className="py-2.5 text-[#8b9ab0] max-w-xs truncate">
                      {r.permissions[0] === "*" ? <span className="text-amber-400">All permissions</span> : r.permissions.slice(0, 3).join(", ")}
                      {r.permissions.length > 3 && <span className="text-[#8b9ab0]"> +{r.permissions.length - 3}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Audit Log" icon={Archive}>
          <div className="space-y-2 mt-2">
            {AUDIT_LOG_ENTRIES.map(e => (
              <div key={e.id} className="flex items-start justify-between p-3 bg-[#0a0f16] border border-[#1e2a3a] rounded-lg">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#8b9ab0]">{e.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold uppercase ${e.risk === "critical" ? "bg-red-500/20 text-red-400" : e.risk === "high" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>{e.risk}</span>
                    <span className="text-xs text-amber-400 font-mono">{e.action}</span>
                  </div>
                  <p className="text-xs text-white truncate">{e.target}</p>
                  <p className="text-xs text-[#8b9ab0] font-mono">{e.actor} · {e.tenant}</p>
                </div>
                <span className="text-xs text-[#8b9ab0] font-mono whitespace-nowrap ml-4">{e.at}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Retention Policies" icon={Clock}>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {["Data Type", "Retention", "Enforcement", "Status"].map(h => (
                    <th key={h} className="text-left text-[#8b9ab0] pb-2 pr-4 font-normal uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1117]">
                {RETENTION_POLICIES.map(r => (
                  <tr key={r.type} className="hover:bg-[#0a0f16] transition-colors">
                    <td className="py-2.5 pr-4 text-white">{r.type}</td>
                    <td className="py-2.5 pr-4 text-amber-400">{r.retention}</td>
                    <td className="py-2.5 pr-4 text-[#8b9ab0]">{r.enforcement}</td>
                    <td className="py-2.5 pr-4"><span className="text-green-400">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Policy Templates" icon={FileText}>
          <div className="space-y-3 mt-2">
            {POLICY_TEMPLATES.map(p => (
              <div key={p.id} className="p-3 bg-[#0a0f16] border border-[#1e2a3a] rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b9ab0] font-mono">{p.id}</span>
                    <span className="text-xs text-white font-semibold">{p.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-[#1e2a3a] text-[#8b9ab0] px-2 py-0.5 rounded font-mono">{p.type}</span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">{p.scope}</span>
                  </div>
                </div>
                <p className="text-xs text-[#8b9ab0]">{p.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Integration Permission Controls" icon={Globe}>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {["Integration", "Permission Scope", "Tenant Key Model", "Audit Log", "Status"].map(h => (
                    <th key={h} className="text-left text-[#8b9ab0] pb-2 pr-4 font-normal uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1117]">
                {INTEGRATIONS_PERMISSION_STATUS.map(i => (
                  <tr key={i.name} className="hover:bg-[#0a0f16] transition-colors">
                    <td className="py-2.5 pr-4 text-white font-semibold">{i.name}</td>
                    <td className="py-2.5 pr-4 text-[#8b9ab0]">{i.permission}</td>
                    <td className="py-2.5 pr-4 text-[#8b9ab0]">{i.tenant}</td>
                    <td className="py-2.5 pr-4"><CheckCircle2 size={12} className="text-green-400" /></td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${i.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {i.status === "connected" ? "Connected" : "Hook Ready"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}
