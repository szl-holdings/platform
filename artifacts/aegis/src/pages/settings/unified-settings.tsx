import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  SettingsShell,
  SettingsSectionPanel,
  SettingsCard,
  SettingsRow,
  type SettingsSection,
} from "@szl-holdings/shared-ui/settings-shell";
import {
  Bell, BellOff, Shield, Key, Lock, Users, Loader2, Activity,
  FileText, CreditCard, Building,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import ProviderSettings from "@/pages/msp/provider-settings";

const AEGIS_ACCENT = "#6366f1";

interface ResolvedSetting {
  value: unknown;
  tier: "platform" | "tenant" | "user";
  namespace: string;
  key: string;
}

function getValue(settings: ResolvedSetting[], key: string): unknown {
  return settings.find(s => s.key === key)?.value;
}

function AccountPanel() {
  const { data } = useQuery({
    queryKey: ["auth-me-aegis"],
    queryFn: () => apiFetch<{ user?: { id: number; name?: string; email?: string; roles?: string[] } }>("/auth/me"),
    staleTime: 60_000,
  });
  const user = data?.user;

  return (
    <SettingsSectionPanel title="Account" description="Your profile on the Aegis MSP platform">
      <SettingsCard title="Profile">
        <SettingsRow label="Display Name">
          <p className="text-sm">{user?.name ?? "—"}</p>
        </SettingsRow>
        <SettingsRow label="Email">
          <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
        </SettingsRow>
        <SettingsRow label="Roles">
          <div className="flex flex-wrap gap-1.5">
            {(user?.roles ?? []).map(r => (
              <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 capitalize">{r}</span>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function NotificationsPanel() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["aegis-notif-settings"],
    queryFn: () => apiFetch<{ settings: ResolvedSetting[] }>("/settings/resolve?namespace=aegis.notifications"),
    staleTime: 30_000,
  });
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (key: string, current: boolean) => {
    setSaving(key);
    try {
      await apiFetch("/settings/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: "aegis.notifications", key, value: !current, valueType: "boolean" }),
      });
      queryClient.invalidateQueries({ queryKey: ["aegis-notif-settings"] });
    } finally {
      setSaving(null);
    }
  };

  const items = [
    { key: "device_offline", label: "Device Offline Alerts", description: "Alert when managed devices go offline" },
    { key: "patch_critical", label: "Critical Patch Alerts", description: "Immediate alert on critical CVEs for managed devices" },
    { key: "ticket_breached_sla", label: "SLA Breach Alerts", description: "When a PSA ticket breaches SLA threshold" },
    { key: "provider_error", label: "Provider Connection Errors", description: "When an RMM/PSA integration loses connectivity" },
    { key: "daily_digest", label: "Daily MSP Digest", description: "Morning digest of client health and open tickets" },
  ];

  return (
    <SettingsSectionPanel title="Notifications" description="Configure MSP alert delivery preferences">
      <SettingsCard title="Alert Preferences">
        {items.map(({ key, label, description }) => {
          const val = getValue(settings, key);
          const enabled = val !== false;
          return (
            <SettingsRow key={key} label={label} description={description}>
              <button
                onClick={() => toggle(key, enabled)}
                disabled={saving === key}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  enabled
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {saving === key ? <Loader2 className="w-3 h-3 animate-spin" /> : enabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                {enabled ? "On" : "Off"}
              </button>
            </SettingsRow>
          );
        })}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function SecurityPanel() {
  return (
    <SettingsSectionPanel title="Security" description="Access control, session management, and admin PIN configuration">
      <SettingsCard title="Authentication">
        <SettingsRow label="Auth Method" description="Current sign-in provider">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">Platform SSO</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Admin PIN" description="Required to confirm destructive admin operations">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Set via ADMIN_PIN environment secret</span>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="API Access" className="mt-4">
        <SettingsRow label="API Keys" description="Programmatic access credentials">
          <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            <Key className="w-3 h-3" /> Manage API Keys
          </button>
        </SettingsRow>
        <SettingsRow label="Webhook Endpoints" description="Outbound webhook receivers for PSA events">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Activity className="w-3 h-3" /> Configure Webhooks
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function TeamPanel() {
  const { data } = useQuery({
    queryKey: ["aegis-org-members"],
    queryFn: () => apiFetch<{ members: Array<{ id: number; role: string; joinedAt: string; user?: { name: string; email: string } }> }>("/auth/org/members"),
    staleTime: 30_000,
  });
  const members = data?.members ?? [];

  return (
    <SettingsSectionPanel title="Team" description="Members and roles in your MSP organization">
      <SettingsCard title="Members">
        {members.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No members found</p>
          </div>
        ) : (
          members.map(m => (
            <SettingsRow key={m.id} label={m.user?.name ?? `Member #${m.id}`} description={m.user?.email}>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground capitalize">
                  {m.role}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function BillingPanel() {
  return (
    <SettingsSectionPanel title="Billing" description="Subscription, plan, and usage billing for your Aegis MSP account">
      <SettingsCard title="Current Plan">
        <SettingsRow label="Plan">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">Managed via the SZL Holdings platform portal</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Billing Portal">
          <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            <CreditCard className="w-3 h-3" /> Open Billing Portal
          </button>
        </SettingsRow>
      </SettingsCard>
      <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
        <p className="text-xs text-indigo-400/70">
          Billing changes and invoices are managed through the SZL Holdings platform admin panel. Contact your platform administrator for billing assistance.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

function AuditPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["aegis-settings-audit"],
    queryFn: () => apiFetch<unknown[]>("/settings/audit?namespace=aegis&limit=50"),
    staleTime: 30_000,
  });

  const entries = (data ?? []) as Array<{
    id: number; tier: string; namespace: string; key: string;
    action: string; oldValue: unknown; newValue: unknown; createdAt: string;
  }>;

  return (
    <SettingsSectionPanel title="Settings Audit" description="Record of all settings changes in Aegis">
      {isLoading ? (
        <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No settings changes logged yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map(e => (
            <div key={e.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors text-xs">
              <span className="font-mono text-muted-foreground shrink-0">{e.namespace}.{e.key}</span>
              <span className={cn("font-semibold uppercase text-[10px]", e.action === "create" ? "text-emerald-400" : e.action === "update" ? "text-sky-400" : "text-red-400")}>
                {e.action}
              </span>
              {e.newValue != null && <span className="font-mono text-foreground">→ {JSON.stringify(e.newValue)}</span>}
              <span className="ml-auto text-muted-foreground shrink-0 text-[10px]">{new Date(e.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionPanel>
  );
}

export default function AegisUnifiedSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("integrations");

  const panels: Partial<Record<SettingsSection, React.ReactNode>> = {
    account: <AccountPanel />,
    team: <TeamPanel />,
    integrations: <ProviderSettings />,
    notifications: <NotificationsPanel />,
    security: <SecurityPanel />,
    billing: <BillingPanel />,
    audit: <AuditPanel />,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Account, team, integrations, notifications, billing, and security
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <SettingsShell
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          availableSections={["account", "team", "integrations", "notifications", "security", "billing", "audit"]}
          accentColor={AEGIS_ACCENT}
          appName="Aegis MSP"
        >
          {panels[activeSection] ?? <div className="p-6 text-sm text-muted-foreground">Coming soon.</div>}
        </SettingsShell>
      </div>
    </div>
  );
}
