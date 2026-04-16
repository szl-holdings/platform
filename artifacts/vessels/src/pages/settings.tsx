import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  SettingsShell,
  SettingsSectionPanel,
  SettingsCard,
  SettingsRow,
  type SettingsSection,
} from "@szl-holdings/shared-ui/settings-shell";
import {
  Loader2, Bell, BellOff, Users, Shield, Key,
  Activity, Lock, CreditCard, FileText,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const VESSELS_ACCENT = "#38bdf8";

interface ResolvedSetting {
  value: unknown;
  tier: "platform" | "tenant" | "user";
  namespace: string;
  key: string;
}

function useSettings(namespace: string) {
  return useQuery({
    queryKey: ["settings", "resolve", namespace],
    queryFn: () =>
      apiFetch<{ settings: ResolvedSetting[]; resolvedFor: { userId: number; orgId: number } }>(
        `/settings/resolve?namespace=${namespace}`
      ),
    staleTime: 30_000,
  });
}

function getValue(settings: ResolvedSetting[], key: string): unknown {
  return settings.find(s => s.key === key)?.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-panels
// ─────────────────────────────────────────────────────────────────────────────

function AccountPanel() {
  const { data: authData } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => apiFetch<{ user?: { id: number; name?: string; email?: string } }>("/auth/me"),
    staleTime: 60_000,
  });

  const user = authData?.user;

  return (
    <SettingsSectionPanel
      title="Account"
      description="Your personal profile and session settings"
    >
      <SettingsCard title="Profile">
        <SettingsRow label="Display Name" description="How your name appears to teammates">
          <p className="text-sm font-medium">{user?.name ?? "—"}</p>
        </SettingsRow>
        <SettingsRow label="Email" description="Your login email address">
          <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
        </SettingsRow>
        <SettingsRow label="User ID" description="Your unique platform identifier">
          <p className="text-xs font-mono text-muted-foreground">{user?.id ?? "—"}</p>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function TeamPanel() {
  const { data } = useQuery({
    queryKey: ["org-members"],
    queryFn: () => apiFetch<{ members: Array<{ id: number; role: string; joinedAt: string; user?: { name: string; email: string } }> }>("/auth/org/members"),
    staleTime: 30_000,
  });

  const members = data?.members ?? [];

  return (
    <SettingsSectionPanel
      title="Team"
      description="Manage members and roles in your organization"
    >
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

function NotificationsPanel() {
  const queryClient = useQueryClient();
  const { data } = useSettings("vessels.notifications");
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const items = [
    { key: "alert_emails", label: "Alert Emails", description: "Receive email for critical fleet alerts" },
    { key: "distress_push", label: "Distress Signals", description: "Push notifications for MAYDAY / distress signals" },
    { key: "ais_blackout_alert", label: "AIS Blackouts", description: "Notify when a vessel loses AIS signal" },
    { key: "sanctions_hit", label: "Sanctions Screening Hits", description: "Immediate notification on sanctions match" },
    { key: "voyage_departure", label: "Voyage Departure", description: "Alert when a tracked vessel departs port" },
    { key: "voyage_arrival", label: "Voyage Arrival", description: "Alert when a tracked vessel arrives at destination" },
  ];

  const toggle = async (key: string, current: boolean) => {
    setSaving(key);
    try {
      await apiFetch("/settings/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: "vessels.notifications", key, value: !current, valueType: "boolean" }),
      });
      queryClient.invalidateQueries({ queryKey: ["settings", "resolve", "vessels.notifications"] });
    } finally {
      setSaving(null);
    }
  };

  return (
    <SettingsSectionPanel
      title="Notifications"
      description="Configure how and when Vessels alerts you"
    >
      <SettingsCard title="Alert Preferences">
        {items.map(({ key, label, description }) => {
          const val = getValue(settings, key);
          const enabled = val !== false;
          const isSaving = saving === key;

          return (
            <SettingsRow key={key} label={label} description={description}>
              <button
                onClick={() => toggle(key, enabled)}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  enabled
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : enabled ? (
                  <Bell className="w-3 h-3" />
                ) : (
                  <BellOff className="w-3 h-3" />
                )}
                {enabled ? "Enabled" : "Disabled"}
              </button>
            </SettingsRow>
          );
        })}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function IntegrationsPanel() {
  const { data } = useQuery({
    queryKey: ["vessels-integrations-health"],
    queryFn: () =>
      fetch("/api/services/health/app/vessels").then(r => r.json()) as Promise<{
        services: Array<{ name: string; status: string; latencyMs?: number }>;
        summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
      }>,
    staleTime: 30_000,
  });

  const services = data?.services ?? [];

  return (
    <SettingsSectionPanel
      title="Integrations"
      description="Status of live data connections powering Vessels"
    >
      <SettingsCard title="Data Sources">
        {services.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading service health...
          </div>
        ) : (
          services.map(svc => (
            <SettingsRow key={svc.name} label={svc.name}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    svc.status === "live" ? "bg-emerald-400" : svc.status === "mock" ? "bg-amber-400" : "bg-red-400",
                  )}
                />
                <span className={cn(
                  "text-xs capitalize",
                  svc.status === "live" ? "text-emerald-400" : svc.status === "mock" ? "text-amber-400" : "text-red-400",
                )}>
                  {svc.status}
                </span>
                {svc.latencyMs != null && (
                  <span className="text-[10px] text-muted-foreground">{svc.latencyMs}ms</span>
                )}
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>

      <div className="mt-4 p-3 rounded-lg bg-sky-500/5 border border-sky-500/15">
        <p className="text-xs text-sky-400/80">
          Configure AIS feed credentials, satellite data providers, and port authority connections from the API settings console.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

function SecurityPanel() {
  return (
    <SettingsSectionPanel
      title="Security"
      description="Authentication, access control, and session management"
    >
      <SettingsCard title="Session">
        <SettingsRow label="Authentication" description="Your current authentication method">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-sm">Replit Auth (SSO)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Session Security" description="Multi-factor and session controls">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Managed by platform SSO</span>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Access Control" className="mt-4">
        <SettingsRow label="Role" description="Your role within the organization">
          <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground capitalize">
            Member
          </span>
        </SettingsRow>
        <SettingsRow label="API Keys" description="Manage API keys for programmatic access">
          <button className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
            <Key className="w-3 h-3" /> Manage API Keys
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function PreferencesPanel() {
  const queryClient = useQueryClient();
  const { data } = useSettings("vessels.prefs");
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const savePref = async (key: string, value: unknown, valueType = "string") => {
    setSaving(key);
    try {
      await apiFetch("/settings/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: "vessels.prefs", key, value, valueType }),
      });
      queryClient.invalidateQueries({ queryKey: ["settings", "resolve", "vessels.prefs"] });
    } finally {
      setSaving(null);
    }
  };

  const distanceUnit = (getValue(settings, "distance_unit") as string) ?? "nm";
  const speedUnit = (getValue(settings, "speed_unit") as string) ?? "knots";
  const mapStyle = (getValue(settings, "map_style") as string) ?? "dark";

  return (
    <SettingsSectionPanel
      title="Preferences"
      description="Personalize your Vessels experience"
    >
      <SettingsCard title="Units & Display">
        <SettingsRow label="Distance Unit" description="Unit used throughout the fleet map and reports">
          <div className="flex gap-2">
            {[{ value: "nm", label: "Nautical Miles" }, { value: "km", label: "Kilometres" }].map(opt => (
              <button
                key={opt.value}
                onClick={() => savePref("distance_unit", opt.value)}
                disabled={saving === "distance_unit"}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  distanceUnit === opt.value
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {saving === "distance_unit" && distanceUnit !== opt.value ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Speed Unit" description="Unit for vessel speed display">
          <div className="flex gap-2">
            {[{ value: "knots", label: "Knots" }, { value: "kmh", label: "km/h" }].map(opt => (
              <button
                key={opt.value}
                onClick={() => savePref("speed_unit", opt.value)}
                disabled={saving === "speed_unit"}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  speedUnit === opt.value
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Map Style" description="Default visual style for the fleet map">
          <div className="flex gap-2">
            {[{ value: "dark", label: "Dark" }, { value: "satellite", label: "Satellite" }, { value: "light", label: "Light" }].map(opt => (
              <button
                key={opt.value}
                onClick={() => savePref("map_style", opt.value)}
                disabled={saving === "map_style"}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  mapStyle === opt.value
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function BillingPanel() {
  return (
    <SettingsSectionPanel title="Billing" description="Subscription plan and billing information for your Vessels account">
      <SettingsCard title="Current Plan">
        <SettingsRow label="Plan">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-400" />
            <span className="text-sm">Managed via the SZL Holdings platform portal</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Invoices">
          <button className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
            <FileText className="w-3 h-3" /> View Invoices
          </button>
        </SettingsRow>
      </SettingsCard>
      <div className="mt-4 p-3 rounded-lg bg-sky-500/5 border border-sky-500/15">
        <p className="text-xs text-sky-400/70">
          Billing changes, plan upgrades, and invoice management are handled through the SZL Holdings platform admin panel.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

function AuditPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["vessels-settings-audit"],
    queryFn: () => apiFetch<unknown[]>("/settings/audit?namespace=vessels&limit=50"),
    staleTime: 30_000,
  });

  const entries = (data ?? []) as Array<{
    id: number; tier: string; namespace: string; key: string;
    action: string; oldValue: unknown; newValue: unknown; createdAt: string;
  }>;

  return (
    <SettingsSectionPanel title="Settings Audit" description="Record of all settings changes in Vessels">
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
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
              <span className={cn(
                "font-semibold uppercase text-[10px]",
                e.action === "create" ? "text-emerald-400" : e.action === "update" ? "text-sky-400" : "text-red-400"
              )}>
                {e.action}
              </span>
              {e.newValue != null && <span className="font-mono text-foreground">→ {JSON.stringify(e.newValue)}</span>}
              <span className="ml-auto text-muted-foreground shrink-0 text-[10px]">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function VesselsSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");

  const panels: Record<SettingsSection, React.ReactNode> = {
    account: <AccountPanel />,
    team: <TeamPanel />,
    notifications: <NotificationsPanel />,
    integrations: <IntegrationsPanel />,
    security: <SecurityPanel />,
    preferences: <PreferencesPanel />,
    billing: <BillingPanel />,
    audit: <AuditPanel />,
  };

  return (
    <div className="flex flex-col h-full bg-[#040c1a]">
      <div className="px-6 py-4 border-b border-sky-500/10 shrink-0">
        <h1 className="text-lg font-semibold text-sky-100">Settings</h1>
        <p className="text-sm text-sky-400/50 mt-0.5">Account, team, notifications, integrations &amp; more</p>
      </div>
      <div className="flex-1 min-h-0">
        <SettingsShell
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          availableSections={["account", "team", "notifications", "integrations", "security", "preferences", "billing", "audit"]}
          accentColor={VESSELS_ACCENT}
          appName="Vessels"
        >
          {panels[activeSection]}
        </SettingsShell>
      </div>
    </div>
  );
}
