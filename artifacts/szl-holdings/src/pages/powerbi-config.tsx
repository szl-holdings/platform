import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  BarChart3, Settings, CheckCircle2, AlertCircle, ArrowLeft, ChevronRight,
  Info, ExternalLink, Save, Eye, EyeOff, Loader2, RefreshCw, Shield,
  Key, Globe, Monitor, Lock,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const j = await res.json();
  return (j.data ?? j) as T;
}

interface PbiWorkspaceConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  groupId: string;
  serviceAccount?: string;
  reportIds: Record<string, string>;
  updatedAt?: string;
}

interface ConfigResponse {
  configured: boolean;
  config: PbiWorkspaceConfig | null;
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
  required = false,
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
            mono && "font-mono text-xs",
            isPassword && "pr-10"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const REPORTS: Array<{
  id: string;
  name: string;
  app: string;
  appPath: string;
  description: string;
  color: string;
  icon: string;
}> = [
  {
    id: "security_posture",
    name: "Security Posture Report",
    app: "Aegis",
    appPath: "/aegis/powerbi",
    description: "Real-time security posture metrics, incident trends, control effectiveness, and compliance scores.",
    color: "#3b82f6",
    icon: "🛡️",
  },
  {
    id: "portfolio_analytics",
    name: "Portfolio Analytics Report",
    app: "Terra",
    appPath: "/terra/powerbi",
    description: "Property-level and portfolio-wide analytics including NOI, occupancy, IRR, and distress signals.",
    color: "#10b981",
    icon: "🏢",
  },
  {
    id: "operational_kpis",
    name: "Operational KPIs Report",
    app: "Lyte",
    appPath: "/command/operations/powerbi",
    description: "Business observability KPIs including SLA performance, escalation rates, and PRISM health scores.",
    color: "#f59e0b",
    icon: "⚡",
  },
];

export default function PowerBiConfigPage() {
  const queryClient = useQueryClient();

  const { data: loaded, isLoading: loadingConfig } = useQuery<ConfigResponse>({
    queryKey: ["pbi-config"],
    queryFn: () => apiFetch<ConfigResponse>("/admin/powerbi-config"),
    retry: 1,
  });

  const [config, setConfig] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    groupId: "",
    serviceAccount: "",
  });
  const [reportIds, setReportIds] = useState<Record<string, string>>({
    security_posture: "",
    portfolio_analytics: "",
    operational_kpis: "",
  });

  useEffect(() => {
    if (loaded?.config) {
      const c = loaded.config;
      setConfig({
        tenantId: c.tenantId ?? "",
        clientId: c.clientId ?? "",
        clientSecret: c.clientSecret ?? "",
        groupId: c.groupId ?? "",
        serviceAccount: c.serviceAccount ?? "",
      });
      setReportIds(c.reportIds ?? {});
    }
  }, [loaded]);

  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const testMutation = useMutation<{ ok: boolean; message: string }, Error, void>({
    mutationFn: async () => {
      return apiFetch<{ ok: boolean; message: string }>("/admin/powerbi-config/test", {
        method: "POST",
        body: JSON.stringify({
          tenantId: config.tenantId,
          clientId: config.clientId,
          clientSecret: config.clientSecret !== "***" ? config.clientSecret : undefined,
          groupId: config.groupId,
        }),
      });
    },
    onSuccess: (data) => setTestResult(data),
    onError: (err) => setTestResult({ ok: false, message: err.message }),
  });

  const saveMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => {
      return apiFetch("/admin/powerbi-config", {
        method: "PUT",
        body: JSON.stringify({
          ...config,
          reportIds,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pbi-config"] });
    },
  });

  const set = (key: keyof typeof config) => (v: string) => setConfig(c => ({ ...c, [key]: v }));

  const secretOk = !!(config.clientSecret && (config.clientSecret === "***" || config.clientSecret.length > 0));
  const canSave = !!(config.tenantId && config.clientId && config.groupId && secretOk);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3">
        <Link href="/admin">
          <a className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin
          </a>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground font-medium">Power BI Configuration</span>
        {loaded?.configured && (
          <span className="ml-auto text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Configured
            {loaded.config?.updatedAt && (
              <span className="text-muted-foreground ml-1">· {new Date(loaded.config.updatedAt).toLocaleDateString()}</span>
            )}
          </span>
        )}
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {loadingConfig ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/20">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Power BI Embedded Configuration</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your Microsoft Power BI workspace to embed live analytics reports across Aegis, Terra, and Lyte.
                    Credentials are encrypted at rest using AES-256-GCM.
                  </p>
                </div>
              </div>
            </m.div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                <p><strong className="text-foreground">Prerequisites:</strong> Power BI Pro or Premium Per User (PPU) license, or Premium capacity (P1+).</p>
                <p>Create an <strong className="text-foreground">Azure App Registration</strong> with Power BI service permissions (<code className="text-blue-400">Dataset.Read.All</code>, <code className="text-blue-400">Report.Read.All</code>). Use <strong className="text-foreground">service principal</strong> (client credentials) for embed token generation.</p>
                <a
                  href="https://learn.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Microsoft docs: Embed with service principal
                </a>
              </div>
            </div>

            <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">App Registration Credentials</h2>
              </div>

              <Field
                label="Azure AD Tenant ID"
                hint="The tenant ID of your Power BI service's Azure AD tenant"
                value={config.tenantId}
                onChange={set("tenantId")}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                mono required
              />
              <Field
                label="Client ID (Application ID)"
                hint="The Application (client) ID of your Azure App Registration"
                value={config.clientId}
                onChange={set("clientId")}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                mono required
              />
              <Field
                label="Client Secret"
                hint="The client secret value from your App Registration's certificates & secrets. Leave as *** to keep the stored value."
                value={config.clientSecret}
                onChange={set("clientSecret")}
                placeholder="Enter client secret…"
                type="password"
                required
              />
              <Field
                label="Power BI Workspace ID (Group ID)"
                hint="The workspace/group ID from the Power BI Service URL: app.powerbi.com/groups/{groupId}"
                value={config.groupId}
                onChange={set("groupId")}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                mono required
              />
              <Field
                label="Service Account (optional)"
                hint="Email of the master user account if using user-based embed instead of service principal"
                value={config.serviceAccount ?? ""}
                onChange={set("serviceAccount")}
                placeholder="pbi-service@yourtenant.onmicrosoft.com"
              />
            </m.div>

            <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Report ID Mapping</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Map each SZL platform report to a Power BI Report ID. Find the Report ID in the Power BI Service URL:
                <code className="text-primary ml-1">app.powerbi.com/groups/{"groupId"}/reports/{"{reportId}"}</code>
              </p>
              {REPORTS.map(report => (
                <div key={report.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{report.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{report.name}</div>
                      <div className="text-[10px] text-muted-foreground">{report.app} · {report.description}</div>
                    </div>
                    <a href={report.appPath} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" /> Preview
                    </a>
                  </div>
                  <input
                    type="text"
                    value={reportIds[report.id] ?? ""}
                    onChange={e => setReportIds(r => ({ ...r, [report.id]: e.target.value }))}
                    placeholder="Report ID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
            </m.div>

            <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Embed Token Settings</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Token Generation", value: "Server-side (secure)", desc: "Tokens minted by API server, never exposed client-side" },
                  { label: "Token Expiry", value: "60 minutes (default)", desc: "Power BI default; refresh by re-requesting embed token" },
                  { label: "Embed Mode", value: "App Owns Data", desc: "Service principal authentication via client credentials" },
                  { label: "Row-Level Security", value: "Not configured", desc: "Configure RLS roles in your Power BI dataset" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="text-xs font-semibold text-foreground">{item.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </m.div>

            {testResult && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border p-4 flex items-start gap-3",
                  testResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                )}
              >
                {testResult.ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                <div>
                  <div className={cn("text-sm font-semibold", testResult.ok ? "text-emerald-600" : "text-red-400")}>
                    {testResult.ok ? "Connection successful" : "Connection failed"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{testResult.message}</div>
                </div>
              </m.div>
            )}

            {saveMutation.isError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-red-400">Save failed</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{saveMutation.error?.message}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || !config.tenantId || !config.clientId}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
                  : <><RefreshCw className="w-4 h-4" /> Test Connection</>}
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !canSave}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saveMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : saveMutation.isSuccess
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" /> Security Notes
              </div>
              {[
                "Client secrets are encrypted at rest using AES-256-GCM before storage.",
                "Embed tokens are generated server-side via the Power BI REST API — tokens never appear in client-side URLs.",
                "Use Azure AD Conditional Access policies to restrict service principal access.",
                "Rotate client secrets every 90 days and update configuration accordingly.",
                "Consider enabling Power BI workspace audit logs for access tracking.",
              ].map(note => (
                <div key={note} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {note}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
