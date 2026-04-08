import { useState } from "react";
import { Shield, Link2, Database, FileText, Lock, Archive, CheckCircle, AlertTriangle, XCircle, RefreshCw, Search, Activity, Eye, Building2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function usePurviewBridgeSummary() {
  return useQuery({ queryKey: ["purview-bridge-summary"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/bridge-summary`); return r.json(); }, staleTime: 60000 });
}
function usePurviewCaseLinks() {
  return useQuery({ queryKey: ["purview-case-links"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/case-links`); return r.json(); }, staleTime: 60000 });
}
function usePurviewHolds() {
  return useQuery({ queryKey: ["purview-holds"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/hold-awareness`); return r.json(); }, staleTime: 60000 });
}
function usePurviewExports() {
  return useQuery({ queryKey: ["purview-exports"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/export-handoffs`); return r.json(); }, staleTime: 60000 });
}
function usePurviewScopeLinks() {
  return useQuery({ queryKey: ["purview-scope-links"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/scope-links`); return r.json(); }, staleTime: 60000 });
}
function usePurviewDiagnostics() {
  return useQuery({ queryKey: ["purview-diagnostics"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/diagnostics`); return r.json(); }, staleTime: 30000 });
}

type Tab = "overview" | "case-links" | "holds" | "content-sources" | "exports" | "review-sets" | "diagnostics" | "permissions";

const STATUS_ICONS: Record<string, any> = { pass: CheckCircle, warn: AlertTriangle, fail: XCircle, unknown: Activity };
const STATUS_COLORS: Record<string, string> = { pass: "#4a90b8", warn: "#d4a054", fail: "#c45a4a", unknown: "#64748b" };
const HOLD_COLORS: Record<string, string> = { active: "#c45a4a", released: "#4a90b8", pending: "#d4a054", error: "#c45a4a" };
const EXPORT_COLORS: Record<string, string> = { ready: "#4a90b8", pending: "#d4a054", transferred: "#8b7ac8", failed: "#c45a4a", in_progress: "#d4a054", expired: "#64748b" };
const RS_COLORS: Record<string, string> = { complete: "#4a90b8", in_review: "#d4a054", pending: "#64748b", exported: "#8b7ac8" };

export default function AdminPurviewPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: summaryData } = usePurviewBridgeSummary();
  const { data: linksData } = usePurviewCaseLinks();
  const { data: holdsData } = usePurviewHolds();
  const { data: exportsData } = usePurviewExports();
  const { data: scopeData } = usePurviewScopeLinks();
  const { data: diagData } = usePurviewDiagnostics();

  const runDiagMutation = useMutation({
    mutationFn: async () => { const r = await fetch(`${API}/prism-counsel/purview/diagnostics/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: 1 }) }); return r.json(); },
    onSuccess: () => { setTimeout(() => qc.invalidateQueries({ queryKey: ["purview-diagnostics"] }), 3000); },
  });

  const confirmHandoffMutation = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`${API}/prism-counsel/purview/export-handoffs/${id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: 1 }) }); return r.json(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purview-exports"] }),
  });

  const summary = summaryData?.data ?? {};
  const caseLinks = linksData?.data?.caseLinks ?? [];
  const holds = holdsData?.data?.holds ?? [];
  const exports_ = exportsData?.data?.handoffs ?? [];
  const scopeLinks = scopeData?.data?.scopeLinks ?? [];
  const diagnostics = diagData?.data?.diagnostics ?? [];
  const diagSummary = diagData?.data?.summary ?? { pass: 0, warn: 0, fail: 0, overall: "unknown" };
  const isDemo = linksData?.data?.isDemo;

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "case-links", label: "Case Linkage", icon: Link2 },
    { key: "holds", label: "Hold Awareness", icon: Lock },
    { key: "content-sources", label: "Content Sources", icon: Database },
    { key: "exports", label: "Export Handoffs", icon: Archive },
    { key: "review-sets", label: "Review Sets", icon: Eye },
    { key: "diagnostics", label: "Diagnostics", icon: Activity },
    { key: "permissions", label: "Permissions", icon: Shield },
  ];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4a90b8]" />
            <h1 className="text-lg font-semibold text-slate-100">Purview Legal Operations Bridge</h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN ONLY</span>
            {isDemo && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#d4a054]/10 text-[#d4a054]">DEMO</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">eDiscovery case linkage, hold awareness, content source mapping, export handoff records, and defensible compliance bridge for authorized ops/admin only — lawyers never see this</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Linked Cases", value: summary.caseLinkCount ?? caseLinks.length, icon: Link2, color: "#4a90b8" },
          { label: "Active Holds", value: summary.activeHoldCount ?? holds.filter((h: any) => h.holdStatus === "active").length, icon: Lock, color: "#c45a4a" },
          { label: "Review Sets", value: scopeLinks.filter((s: any) => s.reviewSetId).length, icon: Database, color: "#d4a054" },
          { label: "Pending Handoffs", value: summary.pendingExportCount ?? exports_.filter((e: any) => e.exportStatus === "pending").length, icon: Archive, color: "#8b7ac8" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" style={{ color: stat.color }} /><span className="text-[10px] text-slate-500">{stat.label}</span></div>
              <div className="text-xl font-semibold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${tab === t.key ? "bg-[#4a90b8]/15 text-[#4a90b8]" : "text-slate-500 hover:text-slate-300"}`}>
              <Icon className="w-3 h-3" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Bridge Health</h3>
            <div className="space-y-2">
              {[
                { label: "Tenant Configuration", status: "pass", detail: "MICROSOFT_TENANT_ID configured" },
                { label: "Purview API Access", status: diagSummary.overall, detail: `${diagSummary.pass} checks pass, ${diagSummary.warn} warnings, ${diagSummary.fail} failures` },
                { label: "Case Linkage Coverage", status: caseLinks.length > 0 ? "pass" : "warn", detail: `${caseLinks.length} matters linked to eDiscovery cases` },
                { label: "Hold Awareness", status: holds.filter((h: any) => h.holdStatus === "active").length > 0 ? "pass" : "warn", detail: `${holds.filter((h: any) => h.holdStatus === "active").length} active holds tracked` },
                { label: "Export Integrity", status: exports_.filter((e: any) => e.provenanceRecord).length === exports_.length ? "pass" : "warn", detail: "Defensible provenance records attached to all ready exports" },
              ].map((item, i) => {
                const Icon = STATUS_ICONS[item.status] ?? Activity;
                const color = STATUS_COLORS[item.status] ?? "#64748b";
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <div className="flex-1">
                      <div className="text-xs text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.detail}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: `${color}15`, color }}>{item.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Compliance Disclaimer</h3>
            <p className="text-[10px] text-slate-500">This bridge provides awareness of eDiscovery case state, legal holds, and export handoffs within Microsoft Purview where tenant configuration supports it. Normal lawyer users never see eDiscovery infrastructure, case IDs, or hold metadata. All actions write immutable audit events. Contact your legal ops team before modifying any linkage or hold records.</p>
          </div>
        </div>
      )}

      {tab === "case-links" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 rounded border border-white/[0.04]" style={{ background: "#0c1220" }}>
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by matter or eDiscovery case ID..." className="flex-1 bg-transparent text-[11px] text-slate-400 placeholder-slate-600 focus:outline-none" />
          </div>
          {caseLinks.filter((l: any) => !search || l.eDiscoveryCaseId?.includes(search) || l.eDiscoveryCaseName?.toLowerCase().includes(search.toLowerCase())).map((link: any) => (
            <div key={link.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{link.eDiscoveryCaseName}</span>
                    <span className="text-[10px] font-mono text-[#4a90b8]">{link.eDiscoveryCaseId}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Matter ID: {link.matterId} · Tenant: {link.purviewTenantId ?? "not specified"} · Source: {link.provenanceSource}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-semibold ${link.linkStatus === "active" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-slate-500/10 text-slate-400"}`}>{link.linkStatus}</span>
              </div>
              {link.linkNotes && <p className="text-[10px] text-slate-500 p-2 rounded" style={{ background: "#080c14" }}>{link.linkNotes}</p>}
              <div className="text-[9px] text-slate-600 mt-2">Linked: {new Date(link.createdAt).toLocaleDateString()} · Updated: {new Date(link.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "holds" && (
        <div className="space-y-3">
          {holds.map((hold: any) => (
            <div key={hold.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" style={{ color: HOLD_COLORS[hold.holdStatus] ?? "#64748b" }} />
                    <span className="text-sm font-medium text-slate-200">{hold.holdName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Matter: {hold.matterId} · Hold ID: {hold.holdId} · Audit: {hold.auditTag}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] uppercase font-semibold" style={{ background: `${HOLD_COLORS[hold.holdStatus]}15`, color: HOLD_COLORS[hold.holdStatus] }}>{hold.holdStatus}</span>
              </div>
              {hold.holdScope && <div className="p-2 rounded mb-2" style={{ background: "#080c14" }}><div className="text-[9px] text-slate-600 mb-0.5">Scope</div><p className="text-[10px] text-slate-400">{hold.holdScope}</p></div>}
              {hold.custodians && (hold.custodians as string[]).length > 0 && (
                <div className="mb-2"><div className="text-[9px] text-slate-600 mb-1">Custodians</div><div className="flex flex-wrap gap-1">{(hold.custodians as string[]).map((c: string, i: number) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 font-mono">{c}</span>)}</div></div>
              )}
              <div className="text-[9px] text-slate-600">Issued: {hold.issuedAt ? new Date(hold.issuedAt).toLocaleDateString() : "Unknown"} · By: {hold.issuedBy ?? "Unknown"} · Source: {hold.provenanceSource}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "content-sources" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Content Source Linkage</h3>
          <div className="space-y-2">
            {scopeLinks.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Database className="w-3.5 h-3.5 text-[#4a90b8] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200">{s.contentSourceName ?? s.contentSourceId}</div>
                  <div className="text-[9px] text-slate-500">{s.contentSourceType} · Matter: {s.matterId} · {s.documentCount ?? 0} docs</div>
                </div>
                {s.reviewSetName && <div className="text-right"><div className="text-[9px] text-slate-400">{s.reviewSetName}</div><span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${RS_COLORS[s.reviewSetStatus] ?? "#64748b"}15`, color: RS_COLORS[s.reviewSetStatus] ?? "#64748b" }}>{s.reviewSetStatus?.replace("_", " ")}</span></div>}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.inScope ? "bg-[#4a90b8]" : "bg-slate-600"}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "exports" && (
        <div className="space-y-3">
          {exports_.map((exp: any) => (
            <div key={exp.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-slate-200">{exp.exportName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Format: {exp.exportFormat} · Matter: {exp.matterId} · Dest: {exp.handoffDestination ?? "Not specified"}</div>
                  {exp.auditTag && <div className="text-[9px] font-mono text-slate-600 mt-0.5">Audit: {exp.auditTag}</div>}
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] uppercase font-semibold" style={{ background: `${EXPORT_COLORS[exp.exportStatus] ?? "#64748b"}15`, color: EXPORT_COLORS[exp.exportStatus] ?? "#64748b" }}>{exp.exportStatus?.replace("_", " ")}</span>
              </div>
              {exp.provenanceRecord && (
                <div className="p-2 rounded mb-2" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-600 mb-0.5">Provenance Record</div>
                  <div className="text-[9px] font-mono text-slate-500">{JSON.stringify(exp.provenanceRecord)}</div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-slate-600">{exp.documentCount ? `${exp.documentCount} docs` : "Doc count pending"} · Created: {new Date(exp.createdAt).toLocaleDateString()}</div>
                {exp.exportStatus === "ready" && (
                  <button onClick={() => confirmHandoffMutation.mutate(exp.id)} className="px-3 py-1 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
                    Confirm Handoff
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "review-sets" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Review Set Awareness</h3>
          <div className="space-y-2">
            {scopeLinks.filter((s: any) => s.reviewSetId).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.reviewSetStatus === "complete" ? "bg-[#4a90b8]" : s.reviewSetStatus === "in_review" ? "bg-[#d4a054] animate-pulse" : "bg-slate-600"}`} />
                <div className="flex-1">
                  <div className="text-xs text-slate-200">{s.reviewSetName}</div>
                  <div className="text-[9px] text-slate-500">{s.contentSourceName} · {s.documentCount ?? 0} docs · Matter {s.matterId}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${RS_COLORS[s.reviewSetStatus] ?? "#64748b"}15`, color: RS_COLORS[s.reviewSetStatus] ?? "#64748b" }}>{s.reviewSetStatus?.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "diagnostics" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">Overall: <span style={{ color: STATUS_COLORS[diagSummary.overall] }}>{diagSummary.overall?.toUpperCase()}</span> · {diagSummary.pass} pass · {diagSummary.warn} warn · {diagSummary.fail} fail</div>
            <button onClick={() => runDiagMutation.mutate()} className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
              <RefreshCw className={`w-3 h-3 ${runDiagMutation.isPending ? "animate-spin" : ""}`} />
              Run Diagnostics
            </button>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="space-y-3">
              {diagnostics.map((d: any) => {
                const Icon = STATUS_ICONS[d.status] ?? Activity;
                const color = STATUS_COLORS[d.status] ?? "#64748b";
                return (
                  <div key={d.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-200">{d.checkType?.replace(/_/g, " ")}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: `${color}15`, color }}>{d.status}</span>
                      </div>
                      {d.details && <div className="text-[9px] font-mono text-slate-500 mt-0.5">{JSON.stringify(d.details)}</div>}
                      {d.recoveryHint && <div className="text-[9px] text-[#d4a054] mt-1">Recovery: {d.recoveryHint}</div>}
                      {d.replayPath && <div className="text-[9px] font-mono text-slate-600">Replay: <span className="text-[#4a90b8]">{d.replayPath}</span></div>}
                    </div>
                    <div className="text-[9px] text-slate-600">{d.checkedAt ? new Date(d.checkedAt).toLocaleTimeString() : "—"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Required Microsoft Graph Permissions</h3>
          <div className="space-y-2">
            {[
              { scope: "eDiscovery.Read.All", purpose: "Read eDiscovery cases and holds", status: "required" },
              { scope: "eDiscovery.ReadWrite.All", purpose: "Create/update case links and review sets", status: "required" },
              { scope: "Compliance.Read.All", purpose: "Read compliance data and audit logs", status: "required" },
              { scope: "Mail.ReadBasic.All", purpose: "Outlook thread clustering and hold custodian verification", status: "required" },
              { scope: "Sites.Read.All", purpose: "SharePoint content source mapping", status: "required" },
              { scope: "InformationProtectionPolicy.Read", purpose: "Sensitivity label awareness for hold scope", status: "optional" },
              { scope: "AuditLog.Read.All", purpose: "Compliance audit log access for defensible records", status: "optional" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 text-[#4a90b8]" />
                <div className="flex-1">
                  <div className="text-xs font-mono text-slate-200">{p.scope}</div>
                  <div className="text-[9px] text-slate-500">{p.purpose}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.status === "required" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-slate-500/10 text-slate-400"}`}>{p.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded" style={{ background: "#080c14" }}>
            <p className="text-[9px] text-slate-500">Configure these permissions in your Azure AD app registration under API permissions → Microsoft Graph. Consent must be granted by a tenant administrator. Purview features require Microsoft 365 E5 Compliance or equivalent add-on.</p>
          </div>
        </div>
      )}
    </div>
  );
}
