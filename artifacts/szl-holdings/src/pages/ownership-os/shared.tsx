import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, FileText, CheckCircle2, AlertCircle, Loader2, Plus, Trash2,
  Edit3, BarChart3, ClipboardList, Circle, Flag, Award,
  AlertTriangle, X, Check, Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const API = "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OwnershipScenario {
  id: number;
  name: string;
  description?: string;
  isTemplate: boolean;
  isActive: boolean;
  isPreferred: boolean;
  status: string;
  certificationFitSummary?: string;
  fundraisingFitScore?: number;
  bankFitScore?: number;
  investorClarityScore?: number;
  notes?: string;
}

export interface Allocation {
  id: number;
  scenarioId: number;
  personName: string;
  role: string;
  equityPct: string;
  votingRightsPct?: string;
  isControlling: boolean;
  isMajorityOwner: boolean;
  citizenshipConfirmed: boolean;
  notes?: string;
}

export interface ControlRole {
  id: number;
  personName: string;
  roleType?: string;
  hasDayToDayControl: boolean;
  hasLongTermDecisionAuthority: boolean;
  hasHiringFiringAuthority: boolean;
  hasStrategicVeto: boolean;
  controlDescription?: string;
}

export interface OfficerRole {
  id: number;
  personName: string;
  title: string;
  isPrimaryOfficer: boolean;
  isOnRegistration: boolean;
  isOnBankAccount: boolean;
  isOnOperatingAgreement: boolean;
  notes?: string;
}

export interface ManagerRole {
  id: number;
  personName: string;
  managementArea: string;
  responsibility?: string;
  isDocumented: boolean;
}

export interface SignatureAuthority {
  id: number;
  personName: string;
  authorityType: string;
  institution?: string;
  isActive: boolean;
  documentationStatus: string;
  notes?: string;
}

export interface CertReadiness {
  id: number;
  certificationName: string;
  certificationBody?: string;
  fitLevel: string;
  keyRequirements?: string;
  gapSummary?: string;
  requiredDocuments?: string[];
}

export interface LegalFlag {
  id: number;
  flagType: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedTo?: string;
}

export interface GovernanceDoc {
  id: number;
  documentType: string;
  title: string;
  status: string;
  notes?: string;
}

export interface ScenarioDetail {
  scenario: OwnershipScenario;
  allocations: Allocation[];
  controlRoles: ControlRole[];
  officerRoles: OfficerRole[];
  managerRoles: ManagerRole[];
  signatureAuth: SignatureAuthority[];
  certReadiness: CertReadiness[];
  legalFlags: LegalFlag[];
  govDocs: GovernanceDoc[];
  decisionLog: Array<{ id: number; decisionType: string; summary: string; madeBy?: string; occurredAt: string; }>;
}

export interface NextActions {
  openLegalFlags: LegalFlag[];
  missingDocuments: GovernanceDoc[];
  documentsNeedingUpdate: GovernanceDoc[];
  unconfirmedCitizenships: Allocation[];
  pendingSignatureAuthority: SignatureAuthority[];
  totalActionItems: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function FitBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    strong: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    weak: "bg-red-500/10 text-red-500 border-red-500/20",
    not_applicable: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", map[level] ?? map.moderate)}>
      {level.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", map[priority] ?? map.medium)}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    current: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    missing: "bg-red-500/10 text-red-500 border-red-500/20",
    needs_update: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    draft: "bg-muted text-muted-foreground border-border",
    not_started: "bg-muted text-muted-foreground border-border",
    documented: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", map[status] ?? map.draft)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ScoreBar({ label, score, color = "bg-primary" }: { label: string; score?: number; color?: string }) {
  if (score == null) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function BoolCheck({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {value
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        : <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
      <span className={cn("text-xs", value ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-amber-200/80 text-xs leading-relaxed">
        <span className="font-semibold text-amber-400">Readiness Analysis Only.</span> This system evaluates structural readiness for potential certification, banking, and governance alignment. It does not constitute legal advice, confirm eligibility for any certification, or make any eligibility determination. All scenarios require qualified attorney and CPA review before any filings or applications.
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-400 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function EquityChart({ allocations }: { allocations: Allocation[] }) {
  const colors = ["bg-primary", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500"];
  const total = allocations.reduce((s, a) => s + parseFloat(a.equityPct), 0);
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {allocations.map((a, i) => (
          <div
            key={a.id}
            className={cn("h-full transition-all", colors[i % colors.length])}
            style={{ width: `${(parseFloat(a.equityPct) / total) * 100}%` }}
            title={`${a.personName}: ${a.equityPct}%`}
          />
        ))}
      </div>
      <div className="space-y-2">
        {allocations.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2.5">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", colors[i % colors.length])} />
            <span className="text-sm font-medium text-foreground flex-1">{a.personName}</span>
            <span className="text-xs text-muted-foreground">{a.role.replace(/_/g, " ")}</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{a.equityPct}%</span>
            {a.isControlling && <Shield className="w-3 h-3 text-primary" aria-label="Controlling" />}
            {!a.citizenshipConfirmed && a.isControlling && <AlertCircle className="w-3 h-3 text-amber-500" aria-label="Citizenship not confirmed" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ControlAuthorityMap({ controlRoles }: { controlRoles: ControlRole[] }) {
  const authorities = [
    { key: "hasDayToDayControl" as const, label: "Day-to-Day Control" },
    { key: "hasLongTermDecisionAuthority" as const, label: "Long-Term Decision Authority" },
    { key: "hasHiringFiringAuthority" as const, label: "Hiring / Firing Authority" },
    { key: "hasStrategicVeto" as const, label: "Strategic Veto" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Authority</th>
            {controlRoles.map(r => (
              <th key={r.id} className="text-center py-2 px-3 text-muted-foreground font-medium">{r.personName}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {authorities.map(auth => (
            <tr key={auth.key} className="hover:bg-muted/20 transition-colors">
              <td className="py-2 pr-4 text-foreground">{auth.label}</td>
              {controlRoles.map(r => (
                <td key={r.id} className="py-2 px-3 text-center">
                  {r[auth.key]
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                    : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OfficerMatrix({ officerRoles }: { officerRoles: OfficerRole[] }) {
  const cols = [
    { key: "isPrimaryOfficer" as const, label: "Primary Officer" },
    { key: "isOnRegistration" as const, label: "On Registration" },
    { key: "isOnBankAccount" as const, label: "On Bank Account" },
    { key: "isOnOperatingAgreement" as const, label: "In Op. Agreement" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Officer</th>
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Title</th>
            {cols.map(c => (
              <th key={c.key} className="text-center py-2 px-2 text-muted-foreground font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {officerRoles.map(r => (
            <tr key={r.id} className="hover:bg-muted/20 transition-colors">
              <td className="py-2 pr-4 text-foreground font-medium">{r.personName}</td>
              <td className="py-2 pr-4 text-muted-foreground">{r.title}</td>
              {cols.map(c => (
                <td key={c.key} className="py-2 px-2 text-center">
                  {r[c.key]
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                    : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CertFitComparison({ certReadiness }: { certReadiness: CertReadiness[] }) {
  return (
    <div className="space-y-4">
      {certReadiness.map(cert => (
        <div key={cert.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">{cert.certificationName}</div>
              {cert.certificationBody && <div className="text-xs text-muted-foreground mt-0.5">{cert.certificationBody}</div>}
            </div>
            <FitBadge level={cert.fitLevel} />
          </div>
          {cert.keyRequirements && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Requirements</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{cert.keyRequirements}</p>
            </div>
          )}
          {cert.gapSummary && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Gap Summary</div>
              <p className="text-xs text-amber-400/80 leading-relaxed">{cert.gapSummary}</p>
            </div>
          )}
          {cert.requiredDocuments && Array.isArray(cert.requiredDocuments) && cert.requiredDocuments.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Required Documents</div>
              <div className="flex flex-wrap gap-1.5">
                {cert.requiredDocuments.map((doc: string, i: number) => (
                  <span key={i} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function NextActionsPanel({ scenarioId }: { scenarioId?: number }) {
  const { data, isLoading } = useQuery<NextActions>({
    queryKey: ["ownership-next-actions"],
    queryFn: () => apiFetch("/ownership/next-actions"),
    enabled: !!scenarioId,
  });

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>;
  if (!data) return null;

  const priorityOrder = ["critical", "high", "medium", "low"];

  const allActions = [
    ...data.unconfirmedCitizenships.map(c => ({
      priority: "critical",
      title: `Confirm citizenship — ${c.personName}`,
      description: "U.S. citizenship documentation required for WOSB/MWBE certification eligibility of controlling owner.",
      category: "Citizenship",
    })),
    ...data.openLegalFlags.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)).map(f => ({
      priority: f.priority,
      title: f.title,
      description: f.description ?? "",
      category: f.flagType.replace(/_/g, " "),
    })),
    ...data.missingDocuments.map(d => ({
      priority: "high",
      title: `Create: ${d.title}`,
      description: d.notes ?? "Document is missing and must be created.",
      category: "Governance Document",
    })),
    ...data.documentsNeedingUpdate.map(d => ({
      priority: "medium",
      title: `Update: ${d.title}`,
      description: d.notes ?? "Document needs updates to align with current structure.",
      category: "Governance Document",
    })),
    ...data.pendingSignatureAuthority.map(s => ({
      priority: "high",
      title: `Document signature authority — ${s.personName} (${s.authorityType.replace(/_/g, " ")})`,
      description: s.notes ?? "Signature authority documentation required.",
      category: "Signature Authority",
    })),
  ].sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  return (
    <div className="space-y-3">
      {allActions.length === 0 ? (
        <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-400">No open action items. All readiness checks passed.</p>
        </div>
      ) : (
        allActions.map((action, i) => (
          <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-border/80 transition-colors">
            <PriorityBadge priority={action.priority} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{action.title}</div>
              {action.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.description}</p>}
              <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">{action.category}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function InlineForm({ fields, onSubmit, onCancel, submitLabel = "Add" }: {
  fields: Array<{ key: string; label: string; type: "text" | "select" | "number" | "checkbox"; options?: string[]; placeholder?: string; required?: boolean }>;
  onSubmit: (values: Record<string, string | number | boolean>) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
    const init: Record<string, string | number | boolean> = {};
    for (const f of fields) init[f.key] = f.type === "checkbox" ? false : f.type === "number" ? 0 : "";
    return init;
  });

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.type === "checkbox" ? "flex items-center gap-2" : "space-y-1"}>
            {f.type === "checkbox" ? (
              <>
                <input type="checkbox" checked={!!values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.checked }))} className="rounded" />
                <span className="text-xs text-foreground">{f.label}</span>
              </>
            ) : (
              <>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={String(values[f.key])}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={String(values[f.key] ?? "")}
                    onChange={e => setValues(v => ({ ...v, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        <button
          onClick={() => onSubmit(values)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> {submitLabel}
        </button>
      </div>
    </div>
  );
}

export function useEntityMutation(scenarioId: number, endpoint: string) {
  const qc = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch(`/ownership/scenarios/${scenarioId}/${endpoint}`, {
      method: "POST", body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/ownership/${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => apiFetch(`/ownership/${endpoint}/${id}`, {
      method: "PATCH", body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  return { addMutation, deleteMutation, updateMutation };
}
