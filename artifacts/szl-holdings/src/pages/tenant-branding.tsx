import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { m } from "framer-motion";
import {
  Palette, Eye, EyeOff, Save, Loader2, ArrowLeft,
  Building2, Image, Mail, AlertCircle, CheckCircle2, Trash2,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers as Record<string, string> ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `API error ${res.status}`);
  }
  const j = await res.json();
  return j.data ?? j;
}

interface TenantBranding {
  id?: number;
  tenantId?: number;
  companyName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  sidebarHeaderText: string | null;
  customDomainLabel: string | null;
  emailFromName: string | null;
  emailFooterText: string | null;
}

interface AzureTenant {
  id: number;
  azureTenantId: string;
  displayName: string;
  domain: string | null;
  status: string;
}

const EMPTY_BRANDING: Omit<TenantBranding, "id" | "tenantId"> = {
  companyName: "",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#6366f1",
  accentColor: "#7c3aed",
  sidebarHeaderText: "",
  customDomainLabel: "",
  emailFromName: "",
  emailFooterText: "",
};

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value || "#6366f1"}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-1"
          title={label}
        />
      </div>
      <div className="flex-1">
        <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</label>
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder="#6366f1"
          className="w-full bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseClass = "w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
  return (
    <div>
      <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(baseClass, "resize-none")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

function BrandPreview({ form, tenant }: { form: typeof EMPTY_BRANDING; tenant: AzureTenant }) {
  const primary = form.primaryColor || "#6366f1";
  const accent = form.accentColor || "#7c3aed";
  const name = form.companyName || tenant.displayName || "Your Company";
  const sidebarText = form.sidebarHeaderText || name;

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-xl">
      <div
        className="text-[9px] font-semibold uppercase tracking-widest px-3 py-1.5 text-white/60"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        Live Preview
      </div>

      <div className="flex" style={{ minHeight: 260, background: "#0d0f18" }}>
        <div
          className="flex flex-col w-44 shrink-0 border-r"
          style={{ borderColor: `${primary}30`, background: `linear-gradient(180deg, ${primary}12 0%, transparent 100%)` }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: `${primary}20` }}>
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo"
                className="h-6 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="flex items-center gap-2"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
                >
                  {name.charAt(0)}
                </div>
                <span className="text-[11px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {sidebarText}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 px-2 py-3 space-y-0.5">
            {["Dashboard", "Tenants", "Analytics", "Settings"].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer"
                style={{
                  color: i === 0 ? primary : "rgba(255,255,255,0.5)",
                  background: i === 0 ? `${primary}20` : "transparent",
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: i === 0 ? primary : "rgba(255,255,255,0.2)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ borderColor: `${primary}20`, background: `${primary}08` }}
          >
            <div>
              <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{name}</div>
              {form.tagline && (
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{form.tagline}</div>
              )}
            </div>
            <div
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${primary}25`, color: primary }}
            >
              ACTIVE
            </div>
          </div>

          <div className="flex-1 p-4 grid grid-cols-2 gap-2 content-start">
            {["Tenants", "Users", "Revenue", "Uptime"].map((metric, i) => (
              <div
                key={metric}
                className="rounded-lg p-3 border"
                style={{ background: `${primary}08`, borderColor: `${primary}20` }}
              >
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{metric}</div>
                <div className="text-sm font-bold" style={{ color: i === 0 ? primary : "rgba(255,255,255,0.75)" }}>
                  {["24", "1,240", "$48K", "99.9%"][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="px-4 py-3 border-t text-[10px]"
        style={{ borderColor: `${primary}20`, background: "#0a0c15", color: "rgba(255,255,255,0.3)" }}
      >
        {form.emailFooterText || `${name} · Enterprise Platform`}
      </div>
    </div>
  );
}

function EmailPreview({ form, tenant }: { form: typeof EMPTY_BRANDING; tenant: AzureTenant }) {
  const primary = form.primaryColor || "#6366f1";
  const name = form.companyName || tenant.displayName || "Your Company";
  const fromName = form.emailFromName || name;
  const footer = form.emailFooterText || `${name} · Enterprise Platform`;

  return (
    <div className="rounded-xl border border-border overflow-hidden text-xs">
      <div className="bg-muted/20 px-4 py-2 border-b border-border flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Email Preview — From: <span className="text-foreground font-medium">{fromName}</span></span>
      </div>
      <div className="p-4 space-y-3 bg-[#f8f8f8]">
        <div className="bg-white rounded-xl p-5 border border-gray-200 max-w-md mx-auto shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo"
                className="h-5 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold"
                style={{ background: `linear-gradient(135deg, ${primary}, ${form.accentColor || "#7c3aed"})` }}
              >
                {name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-800">{name}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Welcome to the platform</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
            You have been granted access to your enterprise dashboard. Click below to get started.
          </p>
          <div
            className="inline-block px-4 py-2 rounded-lg text-white text-[11px] font-semibold"
            style={{ background: primary }}
          >
            Access Dashboard →
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantBrandingPage() {
  const [, params] = useRoute("/admin/tenant-branding/:id");
  const tenantId = params?.id ? parseInt(params.id, 10) : null;

  const [showPreview, setShowPreview] = useState(true);
  const [form, setForm] = useState<typeof EMPTY_BRANDING>({ ...EMPTY_BRANDING });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: tenant, isLoading: tenantLoading } = useStandardQuery<AzureTenant>({
    queryKey: ["azure-tenant", tenantId],
    queryFn: () => apiFetch<{ tenant: AzureTenant }>(`/admin/tenants/${tenantId}`).then(r => r.tenant),
    enabled: tenantId !== null,
  });

  const { data: brandingData, isLoading: brandingLoading } = useStandardQuery<{ branding: TenantBranding | null }>({
    queryKey: ["tenant-branding", tenantId],
    queryFn: () => apiFetch(`/admin/tenants/${tenantId}/branding`),
    enabled: tenantId !== null,
  });

  useEffect(() => {
    if (!hasLoaded && brandingData) {
      const b = brandingData?.branding;
      if (b) {
        setForm({
          companyName: b.companyName ?? "",
          tagline: b.tagline ?? "",
          logoUrl: b.logoUrl ?? "",
          faviconUrl: b.faviconUrl ?? "",
          primaryColor: b.primaryColor ?? "#6366f1",
          accentColor: b.accentColor ?? "#7c3aed",
          sidebarHeaderText: b.sidebarHeaderText ?? "",
          customDomainLabel: b.customDomainLabel ?? "",
          emailFromName: b.emailFromName ?? "",
          emailFooterText: b.emailFooterText ?? "",
        });
      }
      setHasLoaded(true);
    }
  }, [brandingData, hasLoaded]);

  const saveMutation = useStandardMutation({
    mutationFn: (data: typeof EMPTY_BRANDING) =>
      apiFetch(`/admin/tenants/${tenantId}/branding`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", tenantId] });
      setSuccessMsg("Branding saved successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const resetMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch(`/admin/tenants/${tenantId}/branding`, { method: "DELETE" }),
    onSuccess: () => {
      setForm({ ...EMPTY_BRANDING });
      setHasLoaded(false);
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", tenantId] });
      setSuccessMsg("Branding reset to defaults");
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate(form);
  }, [form, saveMutation]);

  const update = useCallback((key: keyof typeof EMPTY_BRANDING, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">No tenant ID provided.</div>
        <Link href="/admin/tenants" className="text-xs text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tenants
        </Link>
      </div>
    );
  }

  const isLoading = tenantLoading || brandingLoading;
  const isSaving = saveMutation.isPending;
  const error = saveMutation.error ?? resetMutation.error;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Tenant Branding</span>
            </div>
            {tenant && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {tenant.displayName} · <span className="font-mono">{tenant.azureTenantId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {successMsg && (
            <m.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {successMsg}
            </m.div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              {(error as Error).message}
            </div>
          )}

          <button
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          <button
            onClick={() => {
              if (confirm("Reset all branding to SZL defaults?")) resetMutation.mutate();
            }}
            disabled={resetMutation.isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted/30 border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors text-muted-foreground"
          >
            {resetMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Branding
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-0 h-[calc(100vh-73px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-2xl space-y-8">

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Identity</h2>
                </div>
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card">
                  <FieldInput
                    label="Company Name"
                    value={form.companyName ?? ""}
                    onChange={v => update("companyName", v)}
                    placeholder={tenant?.displayName ?? "Acme Corporation"}
                  />
                  <FieldInput
                    label="Tagline"
                    value={form.tagline ?? ""}
                    onChange={v => update("tagline", v)}
                    placeholder="Powering enterprise intelligence"
                  />
                  <FieldInput
                    label="Sidebar Header Text"
                    value={form.sidebarHeaderText ?? ""}
                    onChange={v => update("sidebarHeaderText", v)}
                    placeholder="Shown at top of navigation sidebar"
                  />
                  <FieldInput
                    label="Custom Domain Display Label"
                    value={form.customDomainLabel ?? ""}
                    onChange={v => update("customDomainLabel", v)}
                    placeholder="acme.szlholdings.com"
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Image className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Logo & Assets</h2>
                </div>
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card">
                  <FieldInput
                    label="Logo URL"
                    value={form.logoUrl ?? ""}
                    onChange={v => update("logoUrl", v)}
                    placeholder="https://example.com/logo.png"
                  />
                  {form.logoUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        className="h-8 object-contain"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = ""; }}
                      />
                      <span className="text-xs text-muted-foreground">Logo preview</span>
                    </div>
                  )}
                  <FieldInput
                    label="Favicon URL"
                    value={form.faviconUrl ?? ""}
                    onChange={v => update("faviconUrl", v)}
                    placeholder="https://example.com/favicon.ico"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Provide publicly accessible HTTPS URLs. Logos display best at 2:1 aspect ratio, minimum 200×100 px.
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Colors</h2>
                </div>
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card">
                  <ColorInput
                    label="Primary Color"
                    value={form.primaryColor ?? "#6366f1"}
                    onChange={v => update("primaryColor", v)}
                  />
                  <ColorInput
                    label="Accent Color"
                    value={form.accentColor ?? "#7c3aed"}
                    onChange={v => update("accentColor", v)}
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Colors are applied to sidebar highlights, buttons, charts, and data badges. Use hex format (e.g. #6366f1).
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Email Branding</h2>
                </div>
                <div className="space-y-4 rounded-xl border border-border p-4 bg-card">
                  <FieldInput
                    label="From Name"
                    value={form.emailFromName ?? ""}
                    onChange={v => update("emailFromName", v)}
                    placeholder={form.companyName || tenant?.displayName || "Acme Corporation"}
                  />
                  <FieldInput
                    label="Email Footer Text"
                    value={form.emailFooterText ?? ""}
                    onChange={v => update("emailFooterText", v)}
                    placeholder="Acme Corp · enterprise@acme.com · Powered by SZL Holdings"
                    multiline
                  />
                  <div className="text-[10px] text-muted-foreground">
                    These settings customize all notification emails sent to users from this tenant. The sending address remains SZL's managed domain for deliverability.
                  </div>
                </div>
              </section>

            </div>
          </div>

          {showPreview && tenant && (
            <div className="w-[460px] shrink-0 border-l border-border/40 overflow-y-auto bg-muted/5">
              <div className="p-5 space-y-5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Live Preview</div>
                <BrandPreview form={form} tenant={tenant} />
                <EmailPreview form={form} tenant={tenant} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
