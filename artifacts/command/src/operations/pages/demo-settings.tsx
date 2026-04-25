import {
  Bell,
  ChevronRight,
  Database,
  Eye,
  Key,
  LifeBuoy,
  Save,
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const TABS = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'roles', label: 'Roles & Access', icon: Users },
  { key: 'data', label: 'Data & Privacy', icon: Database },
  { key: 'support', label: 'Support', icon: LifeBuoy },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center transition-colors">
      {value ? (
        <ToggleRight className="w-5 h-5" style={{ color: '#d4a054' }} />
      ) : (
        <ToggleLeft className="w-5 h-5" style={{ color: TEXT.muted as string }} />
      )}
    </button>
  );
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: BORDER.subtle }}
    >
      <div>
        <div className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
          {label}
        </div>
        {description && (
          <div className="text-[9px] mt-0.5" style={{ color: TEXT.muted }}>
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0 ml-4">{control}</div>
    </div>
  );
}

export default function DemoSettingsPage() {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState({
    realtimeAlerts: true,
    emailDigest: true,
    slackNotifications: true,
    pagerdutyIntegration: false,
    criticalAlerts: true,
    weeklyReport: true,
    mfaRequired: true,
    sessionTimeout: 480,
    ipAllowlist: false,
    ssoEnabled: true,
    auditLog: true,
    dataRetention: 365,
    anonymizeData: false,
    sandboxMode: false,
    demoMode: true,
  });

  const [supportEmail, setSupportEmail] = useState('');
  const [supportEmailSaving, setSupportEmailSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [supportEmailLoading, setSupportEmailLoading] = useState(true);

  useEffect(() => {
    const BASE_URL = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    fetch(`${BASE_URL}api/orgs/szl-holdings/support-settings`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((json: { notificationEmail?: string | null }) => {
        setSupportEmail(json.notificationEmail ?? '');
      })
      .catch(() => {})
      .finally(() => setSupportEmailLoading(false));
  }, []);

  async function handleSupportEmailSave() {
    setSupportEmailSaving('saving');
    try {
      const BASE_URL = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
      const res = await fetch(`${BASE_URL}api/orgs/szl-holdings/support-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationEmail: supportEmail }),
      });
      if (!res.ok) throw new Error('Failed');
      setSupportEmailSaving('saved');
      setTimeout(() => setSupportEmailSaving('idle'), 2500);
    } catch {
      setSupportEmailSaving('error');
      setTimeout(() => setSupportEmailSaving('idle'), 2500);
    }
  }

  function set(key: string, val: boolean) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  const [saved, setSaved] = useState(false);
  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 max-w-[900px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Settings className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: '#d4a054' }}
            >
              Command · Admin
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
            Settings
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            System configuration, notification preferences, and access management
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border transition-all"
          style={{
            color: saved ? '#6b8f71' : '#d4a054',
            background: saved ? 'rgba(107,143,113,0.1)' : 'rgba(212,160,84,0.1)',
            borderColor: saved ? 'rgba(107,143,113,0.3)' : 'rgba(212,160,84,0.3)',
          }}
        >
          <Save className="w-3 h-3" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div
        className="flex gap-0 rounded-md overflow-hidden"
        style={{ border: `1px solid ${BORDER.subtle}`, background: BG.surface }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-2.5 border-b-2 transition-all"
              style={{
                color: tab === t.key ? '#d4a054' : TEXT.muted,
                borderBottomColor: tab === t.key ? '#d4a054' : 'transparent',
                background: tab === t.key ? 'rgba(212,160,84,0.05)' : 'transparent',
              }}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div className="px-4 py-2 border-b" style={{ borderColor: BORDER.subtle }}>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: TEXT.primary }}
          >
            {TABS.find((t) => t.key === tab)?.label} Settings
          </span>
        </div>
        <div className="px-4">
          {tab === 'general' && (
            <>
              <SettingRow
                label="Workspace Name"
                description="Organization display name across all Command surfaces"
                control={
                  <input
                    defaultValue="SZL Holdings"
                    className="bg-transparent text-[10px] border rounded px-2 py-1 text-right"
                    style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                  />
                }
              />
              <SettingRow
                label="Default Role View"
                description="The default role dashboard shown to new users"
                control={
                  <select
                    className="bg-[#10141e] text-[10px] border rounded px-2 py-1"
                    style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                  >
                    <option>Executive</option>
                    <option>Operator</option>
                    <option>Manager</option>
                    <option>Compliance</option>
                  </select>
                }
              />
              <SettingRow
                label="Demo / Sandbox Mode"
                description="Show seeded demo data instead of live data"
                control={<Toggle value={settings.demoMode} onChange={(v) => set('demoMode', v)} />}
              />
              <SettingRow
                label="Real-time Refresh"
                description="Auto-refresh signal and priority data every 60 seconds"
                control={
                  <Toggle
                    value={settings.realtimeAlerts}
                    onChange={(v) => set('realtimeAlerts', v)}
                  />
                }
              />
              <SettingRow
                label="Weekly Summary Report"
                description="Automated executive summary sent every Monday 6 AM"
                control={
                  <Toggle value={settings.weeklyReport} onChange={(v) => set('weeklyReport', v)} />
                }
              />
            </>
          )}
          {tab === 'alerts' && (
            <>
              <SettingRow
                label="Email Digest"
                description="Daily signal digest sent to all configured recipients"
                control={
                  <Toggle value={settings.emailDigest} onChange={(v) => set('emailDigest', v)} />
                }
              />
              <SettingRow
                label="Slack Notifications"
                description="Push alerts and priority updates to configured Slack channels"
                control={
                  <Toggle
                    value={settings.slackNotifications}
                    onChange={(v) => set('slackNotifications', v)}
                  />
                }
              />
              <SettingRow
                label="PagerDuty Integration"
                description="Escalate critical alerts to PagerDuty on-call schedules"
                control={
                  <Toggle
                    value={settings.pagerdutyIntegration}
                    onChange={(v) => set('pagerdutyIntegration', v)}
                  />
                }
              />
              <SettingRow
                label="Critical Signal Threshold"
                description="Number of concurrent critical signals before executive escalation"
                control={
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      defaultValue={3}
                      min={1}
                      max={10}
                      className="w-12 bg-[#10141e] text-[10px] border rounded px-2 py-1 text-center"
                      style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                    />
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      signals
                    </span>
                  </div>
                }
              />
              <SettingRow
                label="Alert Quiet Hours"
                description="Suppress non-critical alerts during specified hours"
                control={
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      defaultValue="22:00"
                      className="bg-[#10141e] text-[10px] border rounded px-2 py-1"
                      style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                    />
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      –
                    </span>
                    <input
                      type="time"
                      defaultValue="07:00"
                      className="bg-[#10141e] text-[10px] border rounded px-2 py-1"
                      style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                    />
                  </div>
                }
              />
            </>
          )}
          {tab === 'security' && (
            <>
              <SettingRow
                label="Multi-Factor Authentication"
                description="Require MFA for all users accessing Command"
                control={
                  <Toggle value={settings.mfaRequired} onChange={(v) => set('mfaRequired', v)} />
                }
              />
              <SettingRow
                label="Single Sign-On (SSO)"
                description="Enforce Okta SSO for all user authentication"
                control={
                  <Toggle value={settings.ssoEnabled} onChange={(v) => set('ssoEnabled', v)} />
                }
              />
              <SettingRow
                label="IP Allowlist"
                description="Restrict access to approved IP ranges only"
                control={
                  <Toggle value={settings.ipAllowlist} onChange={(v) => set('ipAllowlist', v)} />
                }
              />
              <SettingRow
                label="Session Timeout"
                description="Auto-logout inactive sessions after configured minutes"
                control={
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      readOnly
                      className="w-16 bg-[#10141e] text-[10px] border rounded px-2 py-1 text-center"
                      style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                    />
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      min
                    </span>
                  </div>
                }
              />
              <SettingRow
                label="Full Audit Logging"
                description="Record all user actions and system events to the audit trail"
                control={<Toggle value={settings.auditLog} onChange={(v) => set('auditLog', v)} />}
              />
              <div className="py-3">
                <div className="text-[10px] font-medium mb-1.5" style={{ color: TEXT.primary }}>
                  API Keys
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Production API Key', created: 'Jan 12, 2025', lastUsed: '2m ago' },
                    { name: 'Reporting Service Key', created: 'Feb 3, 2025', lastUsed: '1h ago' },
                  ].map((k) => (
                    <div
                      key={k.name}
                      className="flex items-center gap-3 rounded px-3 py-2"
                      style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                    >
                      <Key className="w-3 h-3 shrink-0" style={{ color: TEXT.muted }} />
                      <div className="flex-1">
                        <div className="text-[10px]" style={{ color: TEXT.primary }}>
                          {k.name}
                        </div>
                        <div className="text-[8px]" style={{ color: TEXT.muted }}>
                          Created {k.created} · Last used {k.lastUsed}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                        sk_live_••••••••
                      </span>
                      <button
                        className="text-[9px] px-2 py-1 rounded border"
                        style={{ color: '#c45a4a', borderColor: 'rgba(196,90,74,0.2)' }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {tab === 'roles' && (
            <div className="py-3">
              <div className="text-[10px] font-medium mb-3" style={{ color: TEXT.primary }}>
                Role Definitions
              </div>
              <div className="space-y-2">
                {[
                  {
                    role: 'Executive',
                    description:
                      'Access to all dashboard views, VAR summaries, and strategic KPIs. Read-only.',
                    users: 3,
                    color: '#d4a054',
                  },
                  {
                    role: 'Operator',
                    description:
                      'Full access to signal intake, priority queue, and workflow management. Can acknowledge and resolve.',
                    users: 8,
                    color: '#4a90b8',
                  },
                  {
                    role: 'Manager',
                    description:
                      'Team view focused on ownership, renewals, and CS operational metrics.',
                    users: 5,
                    color: '#c8953c',
                  },
                  {
                    role: 'Compliance / Audit',
                    description:
                      'Read-only access to audit trail, readiness items, and exception queue.',
                    users: 2,
                    color: '#8b7ac8',
                  },
                  {
                    role: 'Admin',
                    description:
                      'Full system access including settings, user management, and integration configuration.',
                    users: 2,
                    color: '#c45a4a',
                  },
                ].map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center gap-3 rounded px-3 py-3"
                    style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: r.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold" style={{ color: r.color }}>
                        {r.role}
                      </div>
                      <div className="text-[9px]" style={{ color: TEXT.muted }}>
                        {r.description}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
                        {r.users}
                      </div>
                      <div className="text-[8px]" style={{ color: TEXT.muted }}>
                        users
                      </div>
                    </div>
                    <button
                      className="text-[9px] px-2 py-1 rounded border"
                      style={{ color: TEXT.muted, borderColor: BORDER.subtle }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'support' && (
            <>
              <div className="py-3 space-y-4">
                <div>
                  <div className="text-[10px] font-medium mb-1" style={{ color: TEXT.primary }}>
                    Support Notification Email
                  </div>
                  <div className="text-[9px] mb-2" style={{ color: TEXT.secondary }}>
                    New support tickets will be routed to this address. Falls back to the platform
                    default when not set.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      disabled={supportEmailLoading}
                      placeholder={supportEmailLoading ? 'Loading…' : 'support@example.com'}
                      className="flex-1 bg-transparent text-[10px] border rounded px-2 py-1.5"
                      style={{
                        color: TEXT.primary,
                        borderColor: BORDER.muted,
                        opacity: supportEmailLoading ? 0.5 : 1,
                      }}
                    />
                    <button
                      onClick={handleSupportEmailSave}
                      disabled={supportEmailLoading || supportEmailSaving === 'saving'}
                      className="flex items-center gap-1 text-[9px] px-3 py-1.5 rounded border transition-all shrink-0"
                      style={{
                        color:
                          supportEmailSaving === 'saved'
                            ? '#6b8f71'
                            : supportEmailSaving === 'error'
                              ? '#c45a4a'
                              : '#d4a054',
                        background:
                          supportEmailSaving === 'saved'
                            ? 'rgba(107,143,113,0.1)'
                            : supportEmailSaving === 'error'
                              ? 'rgba(196,90,74,0.1)'
                              : 'rgba(212,160,84,0.1)',
                        borderColor:
                          supportEmailSaving === 'saved'
                            ? 'rgba(107,143,113,0.3)'
                            : supportEmailSaving === 'error'
                              ? 'rgba(196,90,74,0.3)'
                              : 'rgba(212,160,84,0.3)',
                        opacity: supportEmailSaving === 'saving' ? 0.6 : 1,
                      }}
                    >
                      <Save className="w-3 h-3" />
                      {supportEmailSaving === 'saving'
                        ? 'Saving…'
                        : supportEmailSaving === 'saved'
                          ? 'Saved!'
                          : supportEmailSaving === 'error'
                            ? 'Error'
                            : 'Save'}
                    </button>
                  </div>
                </div>

                <div
                  className="rounded px-3 py-2.5 flex items-start gap-2"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                >
                  <LifeBuoy className="w-3 h-3 mt-0.5 shrink-0" style={{ color: TEXT.muted }} />
                  <div className="text-[9px]" style={{ color: TEXT.secondary }}>
                    This setting overrides the <span style={{ color: TEXT.primary }}>SUPPORT_ADMIN_EMAIL</span> environment
                    variable for this organization. Changes take effect immediately on the next
                    submitted ticket — no restart required.
                  </div>
                </div>
              </div>
            </>
          )}
          {tab === 'data' && (
            <>
              <SettingRow
                label="Data Retention Period"
                description="How long signal, audit, and exception data is retained"
                control={
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={settings.dataRetention}
                      readOnly
                      className="w-16 bg-[#10141e] text-[10px] border rounded px-2 py-1 text-center"
                      style={{ color: TEXT.primary, borderColor: BORDER.muted }}
                    />
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      days
                    </span>
                  </div>
                }
              />
              <SettingRow
                label="Anonymize Exported Data"
                description="Mask PII (names, email addresses) in CSV and audit exports"
                control={
                  <Toggle
                    value={settings.anonymizeData}
                    onChange={(v) => set('anonymizeData', v)}
                  />
                }
              />
              <div className="py-3">
                <div className="text-[10px] font-medium mb-2" style={{ color: TEXT.primary }}>
                  Data Export
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Export All Signals (CSV)', size: '~2.4 MB' },
                    { label: 'Export Audit Log (CSV)', size: '~1.2 MB' },
                    { label: 'Export Priority Queue (CSV)', size: '~180 KB' },
                  ].map((e) => (
                    <button
                      key={e.label}
                      className="flex items-center gap-2 w-full text-left rounded px-3 py-2 transition-colors hover:bg-white/[0.02]"
                      style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                    >
                      <Eye className="w-3 h-3 shrink-0" style={{ color: TEXT.muted }} />
                      <span className="flex-1 text-[10px]" style={{ color: TEXT.secondary }}>
                        {e.label}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                        {e.size}
                      </span>
                      <ChevronRight className="w-3 h-3" style={{ color: TEXT.muted }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="rounded-md px-4 py-3 flex items-center gap-3"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#d4a054' }} />
        <div className="flex-1">
          <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
            SZL Holdings · Command Business Observability
          </div>
          <div className="text-[9px]" style={{ color: TEXT.muted }}>
            Version 3.4.2 · Environment: Demo · Workspace: szl-holdings · Plan: Enterprise
          </div>
        </div>
        <span
          className="text-[8px] px-2 py-px rounded"
          style={{
            color: '#6b8f71',
            background: 'rgba(107,143,113,0.08)',
            border: '1px solid rgba(107,143,113,0.15)',
          }}
        >
          SEEDED DEMO
        </span>
      </div>
    </div>
  );
}
