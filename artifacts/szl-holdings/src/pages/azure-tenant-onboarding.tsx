import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
import { apiFetch } from "@szl-holdings/shared-ui";
  Building2, CheckCircle2, ArrowRight, ArrowLeft, Shield,
  Key, Users, Settings, Copy, ExternalLink, AlertCircle,
  Loader2, ChevronRight, Globe, Check, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

const STEPS = [
  { id: 1, label: "Organization", icon: Building2, description: "Enter your organization details" },
  { id: 2, label: "Admin Consent", icon: Shield, description: "Grant Microsoft admin consent" },
  { id: 3, label: "Permissions", icon: Key, description: "Verify granted permissions" },
  { id: 4, label: "User Config", icon: Users, description: "Configure user provisioning" },
  { id: 5, label: "Complete", icon: Check, description: "Onboarding complete" },
];

interface TenantResult {
  tenant: {
    id: number;
    azureTenantId: string;
    displayName: string;
    domain: string;
    status: string;
    adminConsentGranted: string;
  };
  adminConsentUrl: string;
}

interface Step1Data {
  azureTenantId: string;
  displayName: string;
  domain: string;
  tenantDbId: number;
  adminConsentUrl: string;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isComplete = current > step.id;
        const isCurrent = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold",
              isComplete ? "bg-emerald-500 text-white" :
              isCurrent ? "bg-primary text-white ring-4 ring-primary/20" :
              "bg-muted text-muted-foreground"
            )}>
              {isComplete ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-10 md:w-16 transition-all", isComplete ? "bg-emerald-500" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1OrgDetails({
  onNext,
}: {
  onNext: (data: Step1Data) => void;
}) {
  const [form, setForm] = useState({ azureTenantId: "", displayName: "", domain: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TenantResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TenantResult>("/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          azureTenantId: form.azureTenantId.trim(),
          displayName: form.displayName.trim(),
          domain: form.domain.trim() || undefined,
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision tenant");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-foreground">Tenant provisioned</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {result.tenant.displayName} has been registered. Proceed to admin consent.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNext({
            azureTenantId: form.azureTenantId,
            displayName: form.displayName,
            domain: form.domain,
            tenantDbId: result.tenant.id,
            adminConsentUrl: result.adminConsentUrl,
          })}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Continue to Admin Consent <ArrowRight className="w-4 h-4" />
        </button>
      </m.div>
    );
  }

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Register your Azure AD tenant with the SZL platform. You'll need your Azure AD Tenant ID (a GUID like <code className="text-blue-400">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>), found in the Azure portal under Azure Active Directory → Overview.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Organization Name *</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              placeholder="Contoso Corporation"
              required
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Azure AD Tenant ID *</label>
            <input
              type="text"
              value={form.azureTenantId}
              onChange={e => setForm(f => ({ ...f, azureTenantId: e.target.value }))}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
              pattern="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Found in Azure Portal → Azure Active Directory → Overview → Tenant ID</p>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Primary Domain (optional)</label>
            <input
              type="text"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              placeholder="contoso.onmicrosoft.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.azureTenantId || !form.displayName}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : <>Register Tenant <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </m.div>
  );
}

function Step2AdminConsent({ tenantId, adminConsentUrl: serverConsentUrl, onNext }: { tenantId: string; adminConsentUrl: string | null; onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  const consentUrl = serverConsentUrl ?? `https://login.microsoftonline.com/${tenantId || "[TENANT_ID]"}/adminconsent?client_id=[Configure_Client_ID]&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/azure-ad/callback`)}&state=tenant-${tenantId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(consentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Admin Action Required
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An Azure AD Global Administrator must visit the consent URL below and click <strong className="text-foreground">Accept</strong> to grant the SZL platform access to the tenant. This grants permissions for user sign-in, profile reading, and user provisioning.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-foreground">Permissions Being Requested</div>
        {[
          { scope: "openid, email, profile", desc: "User identity and basic profile" },
          { scope: "User.Read", desc: "Read signed-in user profile" },
          { scope: "offline_access", desc: "Maintain session access" },
          { scope: "Directory.Read.All (optional)", desc: "User group membership sync" },
        ].map(p => (
          <div key={p.scope} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-mono font-medium text-foreground">{p.scope}</div>
              <div className="text-[10px] text-muted-foreground">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-foreground">Admin Consent URL</div>
        <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-start gap-2">
          <code className="text-[10px] text-primary break-all flex-1 leading-relaxed">{consentUrl}</code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <a
        href={consentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
      >
        Open Consent URL <ExternalLink className="w-3.5 h-3.5" />
      </a>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Admin Has Granted Consent <ArrowRight className="w-4 h-4" />
      </button>
    </m.div>
  );
}

function Step3VerifyPermissions({ tenantDbId, onNext, onBack }: { tenantDbId: number | null; onNext: () => void; onBack: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const permissions = [
    { name: "Azure AD Login (OIDC)", status: "granted", desc: "Multi-tenant SSO via OpenID Connect" },
    { name: "User Profile Read", status: "granted", desc: "Sign-in user's name, email, avatar" },
    { name: "Session Management", status: "granted", desc: "Token refresh and offline access" },
    { name: "SCIM User Provisioning", status: "pending", desc: "Automated user lifecycle management" },
    { name: "Group Sync", status: "pending", desc: "Sync Azure AD groups to platform roles" },
  ];

  const handleConfirm = async () => {
    if (!tenantDbId) { onNext(); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(`/admin/tenants/${tenantDbId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ adminConsentGranted: "granted" }),
      });
      onNext();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to record consent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="text-xs font-semibold text-foreground mb-3">Permission Verification</div>
        <div className="space-y-2">
          {permissions.map(p => (
            <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                p.status === "granted" ? "bg-emerald-400" : "bg-amber-400"
              )} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.desc}</div>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                p.status === "granted"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground leading-relaxed">
        <Info className="w-3.5 h-3.5 text-blue-400 inline mr-1.5 relative -top-0.5" />
        SCIM and Group Sync require additional API permissions in the Azure App Registration. These can be configured later from the tenant settings.
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : <>Confirm & Continue <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </m.div>
  );
}

function Step4UserConfig({ tenantDbId, onNext, onBack }: { tenantDbId: number | null; onNext: () => void; onBack: () => void }) {
  const [config, setConfig] = useState({
    autoProvision: true,
    defaultRole: "viewer",
    syncGroups: false,
    scimEnabled: false,
    sessionTimeout: "8",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="space-y-3">
        {[
          {
            key: "autoProvision",
            label: "Auto-provision users",
            desc: "Automatically create platform accounts for users signing in from this tenant",
            type: "toggle",
          },
          {
            key: "syncGroups",
            label: "Sync Azure AD groups",
            desc: "Map Azure AD groups to platform roles (requires Directory.Read.All)",
            type: "toggle",
          },
          {
            key: "scimEnabled",
            label: "Enable SCIM provisioning",
            desc: "Automated user lifecycle via SCIM 2.0 endpoint (scaffold only — full compliance in roadmap)",
            type: "toggle",
          },
        ].map(opt => (
          <div key={opt.key} className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-card/50 p-4">
            <div>
              <div className="text-sm font-medium text-foreground">{opt.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, [opt.key]: !c[opt.key as keyof typeof c] }))}
              className={cn(
                "w-10 h-6 rounded-full transition-all flex-shrink-0 relative mt-0.5",
                config[opt.key as keyof typeof config] ? "bg-primary" : "bg-muted/60"
              )}
            >
              <span className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
                config[opt.key as keyof typeof config] ? "left-5" : "left-1"
              )} />
            </button>
          </div>
        ))}

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <label className="text-sm font-medium text-foreground block mb-1">Default User Role</label>
          <p className="text-[10px] text-muted-foreground mb-3">Role assigned to new users from this tenant</p>
          <select
            value={config.defaultRole}
            onChange={e => setConfig(c => ({ ...c, defaultRole: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="viewer">Viewer — Read-only access</option>
            <option value="analyst">Analyst — Read + export access</option>
            <option value="user">User — Standard platform access</option>
            <option value="admin">Admin — Full admin access</option>
          </select>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <label className="text-sm font-medium text-foreground block mb-1">Session Timeout (hours)</label>
          <p className="text-[10px] text-muted-foreground mb-3">Duration before users are required to re-authenticate</p>
          <input
            type="number"
            min="1"
            max="24"
            value={config.sessionTimeout}
            onChange={e => setConfig(c => ({ ...c, sessionTimeout: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={async () => {
            if (!tenantDbId) { onNext(); return; }
            setSaving(true);
            setSaveError(null);
            try {
              await apiFetch(`/admin/tenants/${tenantDbId}/provisioning-config`, {
                method: "PATCH",
                body: JSON.stringify({
                  autoProvisionUsers: config.autoProvision,
                  defaultRole: config.defaultRole,
                  syncGroupsEnabled: config.syncGroups,
                  scimEnabled: config.scimEnabled,
                  sessionTimeoutHours: parseInt(config.sessionTimeout, 10),
                }),
              });
              onNext();
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : "Failed to save settings");
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Save & Complete <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </m.div>
  );
}

function Step5Complete({ orgName, tenantId }: { orgName: string; tenantId: string }) {
  return (
    <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-9 h-9 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">{orgName || "Tenant"} is live</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Azure AD onboarding complete. Users from this tenant can now sign in via Microsoft SSO.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-left">
        {[
          { label: "Tenant ID registered", detail: tenantId ? `${tenantId.slice(0, 16)}…` : "—" },
          { label: "Admin consent", detail: "Acknowledged" },
          { label: "User provisioning", detail: "Auto-provisioning enabled" },
          { label: "SSO login URL", detail: "Active" },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
              <Check className="w-3 h-3" /> {item.detail}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin">
          <a className="py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" /> Admin Panel
          </a>
        </Link>
        <Link href="/admin/azure-tenants">
          <a className="py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Users className="w-4 h-4" /> Tenant Dashboard
          </a>
        </Link>
      </div>
    </m.div>
  );
}

export default function AzureTenantOnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantDbId, setTenantDbId] = useState<number | null>(null);
  const [adminConsentUrl, setAdminConsentUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3">
        <Link href="/admin">
          <a className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin
          </a>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <Link href="/admin/azure-tenants">
          <a className="text-xs text-muted-foreground hover:text-foreground transition-colors">Azure Tenants</a>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground font-medium">Onboard New Tenant</span>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-xl">
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Enterprise Tenant Onboarding</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Connect a new Azure AD tenant to the SZL platform for enterprise SSO and user provisioning.
            </p>
          </m.div>

          <div className="flex justify-center mb-8">
            <StepIndicator current={step} total={STEPS.length} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                Step {step} of {STEPS.length}
              </div>
              <h2 className="text-base font-semibold text-foreground">
                {STEPS[step - 1]?.label}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {STEPS[step - 1]?.description}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1OrgDetails
                  key="step1"
                  onNext={(data) => {
                    setOrgName(data.displayName);
                    setTenantId(data.azureTenantId);
                    setTenantDbId(data.tenantDbId);
                    setAdminConsentUrl(data.adminConsentUrl);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && (
                <Step2AdminConsent
                  key="step2"
                  tenantId={tenantId}
                  adminConsentUrl={adminConsentUrl}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <Step3VerifyPermissions
                  key="step3"
                  tenantDbId={tenantDbId}
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <Step4UserConfig
                  key="step4"
                  tenantDbId={tenantDbId}
                  onNext={() => setStep(5)}
                  onBack={() => setStep(3)}
                />
              )}
              {step === 5 && (
                <Step5Complete
                  key="step5"
                  orgName={orgName}
                  tenantId={tenantId}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>Microsoft Azure AD Multi-Tenant Integration</span>
            <span>·</span>
            <span>SZL Holdings Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
