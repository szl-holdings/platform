import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
import { apiFetch } from "@szl-holdings/shared-ui";
  Shield, Users, FileText, CheckCircle2, AlertCircle, Loader2, Plus, Trash2,
  Edit3, ChevronRight, Lock, ArrowLeft, RefreshCw, Star, Briefcase, Scale,
  Building2, BarChart3, ClipboardList, CheckSquare, Circle, Flag, Award,
  TrendingUp, Eye, EyeOff, Info, AlertTriangle, X, Check, Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OwnershipScenario {
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

interface Allocation {
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

interface ControlRole {
  id: number;
  personName: string;
  roleType?: string;
  hasDayToDayControl: boolean;
  hasLongTermDecisionAuthority: boolean;
  hasHiringFiringAuthority: boolean;
  hasStrategicVeto: boolean;
  controlDescription?: string;
}

interface OfficerRole {
  id: number;
  personName: string;
  title: string;
  isPrimaryOfficer: boolean;
  isOnRegistration: boolean;
  isOnBankAccount: boolean;
  isOnOperatingAgreement: boolean;
  notes?: string;
}

interface ManagerRole {
  id: number;
  personName: string;
  managementArea: string;
  responsibility?: string;
  isDocumented: boolean;
}

interface SignatureAuthority {
  id: number;
  personName: string;
  authorityType: string;
  institution?: string;
  isActive: boolean;
  documentationStatus: string;
  notes?: string;
}

interface CertReadiness {
  id: number;
  certificationName: string;
  certificationBody?: string;
  fitLevel: string;
  keyRequirements?: string;
  gapSummary?: string;
  requiredDocuments?: string[];
}

interface LegalFlag {
  id: number;
  flagType: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedTo?: string;
}

interface GovernanceDoc {
  id: number;
  documentType: string;
  title: string;
  status: string;
  notes?: string;
}

interface ScenarioDetail {
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

interface NextActions {
  openLegalFlags: LegalFlag[];
  missingDocuments: GovernanceDoc[];
  documentsNeedingUpdate: GovernanceDoc[];
  unconfirmedCitizenships: Allocation[];
  pendingSignatureAuthority: SignatureAuthority[];
  totalActionItems: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
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

function FitBadge({ level }: { level: string }) {
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

function PriorityBadge({ priority }: { priority: string }) {
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

function StatusBadge({ status }: { status: string }) {
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

function ScoreBar({ label, score, color = "bg-primary" }: { label: string; score?: number; color?: string }) {
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

function BoolCheck({ value, label }: { value: boolean; label: string }) {
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

function DisclaimerBanner() {
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

function EquityChart({ allocations }: { allocations: Allocation[] }) {
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

function ControlAuthorityMap({ controlRoles }: { controlRoles: ControlRole[] }) {
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

function OfficerMatrix({ officerRoles }: { officerRoles: OfficerRole[] }) {
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

function CertFitComparison({ certReadiness }: { certReadiness: CertReadiness[] }) {
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

function NextActionsPanel({ scenarioId }: { scenarioId?: number }) {
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

function InlineForm({ fields, onSubmit, onCancel, submitLabel = "Add" }: {
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

function useEntityMutation(scenarioId: number, endpoint: string) {
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

// ─── Scenario Detail View ─────────────────────────────────────────────────────

const DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "equity", label: "Equity & Voting", icon: Percent },
  { id: "control", label: "Control Map", icon: Shield },
  { id: "officers", label: "Officers & Governance", icon: Briefcase },
  { id: "certifications", label: "Cert Fit", icon: Award },
  { id: "signatures", label: "Signature Authority", icon: Edit3 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "actions", label: "Next Actions", icon: ClipboardList },
  { id: "log", label: "Decision Log", icon: Flag },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]["id"];

function ScenarioDetailView({ scenarioId, onBack }: { scenarioId: number; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<ScenarioDetail>({
    queryKey: ["ownership-scenario-detail", scenarioId],
    queryFn: () => apiFetch(`/ownership/scenarios/${scenarioId}`),
  });

  const activateMutation = useMutation({
    mutationFn: () => apiFetch(`/ownership/scenarios/${scenarioId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: true }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });

  const allocationCrud = useEntityMutation(scenarioId, "allocations");
  const controlRoleCrud = useEntityMutation(scenarioId, "control-roles");
  const officerCrud = useEntityMutation(scenarioId, "officer-roles");
  const managerCrud = useEntityMutation(scenarioId, "manager-roles");
  const signatureCrud = useEntityMutation(scenarioId, "signature-authority");
  const certReadinessCrud = useEntityMutation(scenarioId, "certification-readiness");
  const legalFlagCrud = useEntityMutation(scenarioId, "legal-flags");
  const govDocCrud = useEntityMutation(scenarioId, "governance-documents");
  const decisionLogCrud = useEntityMutation(scenarioId, "decision-log");

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-sm text-red-400">Failed to load scenario details.</p>
    </div>
  );

  const { scenario, allocations, controlRoles, officerRoles, managerRoles, signatureAuth, certReadiness, legalFlags, govDocs, decisionLog } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Scenarios
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-sm text-foreground font-medium truncate">{scenario.name}</span>
        {scenario.isPreferred && <Star className="w-3.5 h-3.5 text-amber-500" aria-label="Preferred structure" />}
        {scenario.isActive && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">ACTIVE</span>}
      </div>

      <DisclaimerBanner />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{scenario.name}</h2>
          {scenario.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">{scenario.description}</p>}
        </div>
        {!scenario.isActive && (
          <button
            onClick={() => activateMutation.mutate()}
            disabled={activateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {activateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Set as Active
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreBar label="Fundraising Fit" score={scenario.fundraisingFitScore} color="bg-violet-500" />
        <ScoreBar label="Banking Fit" score={scenario.bankFitScore} color="bg-sky-500" />
        <ScoreBar label="Investor Clarity" score={scenario.investorClarityScore} color="bg-emerald-500" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {DETAIL_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3 h-3" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "overview" && (
          <div className="space-y-5">
            {scenario.certificationFitSummary && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Certification Fit Summary
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{scenario.certificationFitSummary}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Ownership Summary
                </h3>
                {allocations.length > 0 ? <EquityChart allocations={allocations} /> : <p className="text-sm text-muted-foreground">No allocations defined.</p>}
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Open Flags
                </h3>
                {legalFlags.filter(f => f.status === "open").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open flags.</p>
                ) : (
                  <div className="space-y-2">
                    {legalFlags.filter(f => f.status === "open").slice(0, 5).map(flag => (
                      <div key={flag.id} className="flex items-center gap-2">
                        <PriorityBadge priority={flag.priority} />
                        <span className="text-xs text-foreground truncate">{flag.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {scenario.notes && (
              <div className="flex items-start gap-2.5 bg-muted/30 rounded-xl p-4 border border-border">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "equity" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" /> Equity Allocation
              </h3>
              {allocations.length > 0 ? <EquityChart allocations={allocations} /> : <p className="text-sm text-muted-foreground">No allocations defined.</p>}
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detailed Allocations</span>
                <button onClick={() => setShowAddForm(showAddForm === "allocation" ? null : "allocation")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <Plus className="w-3 h-3" /> Add Allocation
                </button>
              </div>
              {showAddForm === "allocation" && (
                <div className="px-4 py-3">
                  <InlineForm
                    fields={[
                      { key: "personName", label: "Person Name", type: "text", placeholder: "e.g. Angela (Mom)" },
                      { key: "equityPct", label: "Equity %", type: "number" },
                      { key: "votingRightsPct", label: "Voting Rights %", type: "number" },
                      { key: "membershipClass", label: "Membership Class", type: "text", placeholder: "e.g. Class A" },
                      { key: "isControlling", label: "Controlling Owner", type: "checkbox" },
                      { key: "isMajorityOwner", label: "Majority Owner (51%+)", type: "checkbox" },
                      { key: "citizenshipConfirmed", label: "U.S. Citizenship Confirmed", type: "checkbox" },
                      { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
                    ]}
                    onSubmit={(vals) => {
                      allocationCrud.addMutation.mutate(vals as Record<string, unknown>);
                      setShowAddForm(null);
                    }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {allocations.map(a => (
                <div key={a.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{a.personName}</span>
                      {a.isControlling && <Shield className="w-3 h-3 text-primary" aria-label="Controlling owner" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground tabular-nums">{a.equityPct}%</span>
                      <button onClick={() => allocationCrud.deleteMutation.mutate(a.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <BoolCheck value={a.isControlling} label="Controlling owner" />
                    <BoolCheck value={a.isMajorityOwner} label="Majority owner (51%+)" />
                    <BoolCheck value={a.citizenshipConfirmed} label="U.S. citizenship confirmed" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Voting:</span>
                      <span className="text-xs font-medium text-foreground">{a.votingRightsPct ?? a.equityPct}%</span>
                    </div>
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground/70 leading-relaxed">{a.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "control" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Control Authority Map
                </h3>
                <button onClick={() => setShowAddForm(showAddForm === "control" ? null : "control")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <Plus className="w-3 h-3" /> Add Control Role
                </button>
              </div>
              {showAddForm === "control" && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      { key: "personName", label: "Person Name", type: "text", placeholder: "e.g. Angela (Mom)" },
                      { key: "roleType", label: "Role Type", type: "select", options: ["managing_member", "ceo", "president", "board_chair", "majority_owner", "authorized_signer"] },
                      { key: "controlDescription", label: "Control Description", type: "text", placeholder: "Day-to-day operational decisions" },
                      { key: "hasHiringAuthority", label: "Hiring Authority", type: "checkbox" },
                      { key: "hasFiringAuthority", label: "Firing Authority", type: "checkbox" },
                      { key: "hasContractAuthority", label: "Contract Authority", type: "checkbox" },
                      { key: "hasBankingAuthority", label: "Banking Authority", type: "checkbox" },
                    ]}
                    onSubmit={(vals) => { controlRoleCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {controlRoles.length > 0 ? <ControlAuthorityMap controlRoles={controlRoles} /> : <p className="text-sm text-muted-foreground">No control roles defined.</p>}
            </div>
            {controlRoles.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{r.personName} — {(r.roleType || "").replace(/_/g, " ")}</div>
                  <button onClick={() => controlRoleCrud.deleteMutation.mutate(r.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {r.controlDescription && <p className="text-sm text-foreground leading-relaxed">{r.controlDescription}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "officers" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Officer Roles
                </h3>
                <button onClick={() => setShowAddForm(showAddForm === "officer" ? null : "officer")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <Plus className="w-3 h-3" /> Add Officer
                </button>
              </div>
              {showAddForm === "officer" && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      { key: "personName", label: "Person Name", type: "text", placeholder: "e.g. Angela (Mom)" },
                      { key: "title", label: "Title", type: "select", options: ["CEO", "President", "Secretary", "Treasurer", "CFO", "COO", "CTO", "VP"] },
                      { key: "responsibilities", label: "Responsibilities", type: "text", placeholder: "Key responsibilities" },
                      { key: "appointedBy", label: "Appointed By", type: "text", placeholder: "e.g. Board resolution" },
                      { key: "isDocumented", label: "Documented", type: "checkbox" },
                    ]}
                    onSubmit={(vals) => { officerCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {officerRoles.length > 0 ? <OfficerMatrix officerRoles={officerRoles} /> : <p className="text-sm text-muted-foreground">No officer roles defined.</p>}
              {officerRoles.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-t border-border/40 mt-2 first:mt-0">
                  <span className="text-xs text-muted-foreground">{r.personName} — {r.title}</span>
                  <button onClick={() => officerCrud.deleteMutation.mutate(r.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Management Roles
                </h3>
                <button onClick={() => setShowAddForm(showAddForm === "manager" ? null : "manager")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <Plus className="w-3 h-3" /> Add Manager
                </button>
              </div>
              {showAddForm === "manager" && (
                <div className="mb-4">
                  <InlineForm
                    fields={[
                      { key: "personName", label: "Person Name", type: "text", placeholder: "e.g. Stephen" },
                      { key: "managementArea", label: "Management Area", type: "select", options: ["operations", "finance", "technology", "strategy", "hr", "marketing", "compliance", "legal"] },
                      { key: "responsibility", label: "Responsibility", type: "text", placeholder: "Specific responsibility description" },
                      { key: "isDocumented", label: "Documented", type: "checkbox" },
                    ]}
                    onSubmit={(vals) => { managerCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                    onCancel={() => setShowAddForm(null)}
                  />
                </div>
              )}
              {managerRoles.length > 0 ? (
                <div className="space-y-2">
                  {managerRoles.map(r => (
                    <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border capitalize shrink-0">
                        {r.managementArea}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{r.personName}</span>
                        {r.responsibility && <p className="text-xs text-muted-foreground mt-0.5">{r.responsibility}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {r.isDocumented
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          : <AlertCircle className="w-3.5 h-3.5 text-amber-500/60" aria-label="Not yet documented" />}
                        <button onClick={() => managerCrud.deleteMutation.mutate(r.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No management roles defined.</p>}
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-xl p-3.5">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fit levels are structural readiness assessments only. They do not represent eligibility determinations or certification approvals. All applications require attorney review.
              </p>
            </div>
            <div className="flex items-center justify-end">
              <button onClick={() => setShowAddForm(showAddForm === "cert" ? null : "cert")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="w-3 h-3" /> Add Cert Readiness
              </button>
            </div>
            {showAddForm === "cert" && (
              <InlineForm
                fields={[
                  { key: "certType", label: "Certification Type", type: "select", options: ["WOSB", "EDWOSB", "MWBE", "SBA_8a", "HUBZone", "SDVOSB"] },
                  { key: "fitLevel", label: "Fit Level", type: "select", options: ["strong_fit", "moderate_fit", "weak_fit", "not_applicable"] },
                  { key: "notes", label: "Notes", type: "text", placeholder: "Readiness assessment notes" },
                  { key: "gapDescription", label: "Gap Description", type: "text", placeholder: "Known gaps or issues" },
                ]}
                onSubmit={(vals) => { certReadinessCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                onCancel={() => setShowAddForm(null)}
              />
            )}
            {certReadiness.length > 0
              ? <CertFitComparison certReadiness={certReadiness} />
              : <p className="text-sm text-muted-foreground">No certification readiness records.</p>}
          </div>
        )}

        {activeTab === "signatures" && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Signature Authority Tracker
              </span>
              <button onClick={() => setShowAddForm(showAddForm === "signature" ? null : "signature")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="w-3 h-3" /> Add Signer
              </button>
            </div>
            {showAddForm === "signature" && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    { key: "personName", label: "Person Name", type: "text", placeholder: "e.g. Angela (Mom)" },
                    { key: "authorityType", label: "Authority Type", type: "select", options: ["bank_signatory", "contract_signer", "tax_signer", "registered_agent", "corporate_officer"] },
                    { key: "institution", label: "Institution", type: "text", placeholder: "e.g. Chase Bank" },
                    { key: "documentationStatus", label: "Documentation Status", type: "select", options: ["documented", "pending", "missing"] },
                    { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
                  ]}
                  onSubmit={(vals) => { signatureCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                  onCancel={() => setShowAddForm(null)}
                />
              </div>
            )}
            {signatureAuth.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No signature authority records.</div>
            ) : signatureAuth.map(s => (
              <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{s.personName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{s.authorityType.replace(/_/g, " ")}</span>
                    {s.institution && <span className="text-xs text-muted-foreground">@ {s.institution}</span>}
                  </div>
                  {s.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={s.documentationStatus} />
                  <button onClick={() => signatureCrud.deleteMutation.mutate(s.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Governance Documents
              </span>
              <button onClick={() => setShowAddForm(showAddForm === "document" ? null : "document")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="w-3 h-3" /> Add Document
              </button>
            </div>
            {showAddForm === "document" && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    { key: "title", label: "Document Title", type: "text", placeholder: "e.g. Operating Agreement" },
                    { key: "documentType", label: "Document Type", type: "select", options: ["operating_agreement", "articles_of_organization", "bylaws", "board_resolution", "ownership_certificate", "banking_resolution", "tax_filing", "compliance_record"] },
                    { key: "status", label: "Status", type: "select", options: ["current", "draft", "expired", "missing", "needs_update"] },
                    { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
                  ]}
                  onSubmit={(vals) => { govDocCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                  onCancel={() => setShowAddForm(null)}
                />
              </div>
            )}
            {govDocs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No governance documents defined.</div>
            ) : govDocs.map(d => (
              <div key={d.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{d.title}</span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{d.documentType.replace(/_/g, " ")}</span>
                  </div>
                  {d.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{d.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={d.status} />
                  <button onClick={() => govDocCrud.deleteMutation.mutate(d.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "actions" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Next Actions Queue
            </h3>
            <NextActionsPanel scenarioId={scenarioId} />
          </div>
        )}

        {activeTab === "log" && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Decision Log
              </span>
              <button onClick={() => setShowAddForm(showAddForm === "decision" ? null : "decision")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="w-3 h-3" /> Log Decision
              </button>
            </div>
            {showAddForm === "decision" && (
              <div className="px-4 py-3">
                <InlineForm
                  fields={[
                    { key: "summary", label: "Decision Summary", type: "text", placeholder: "What was decided?" },
                    { key: "decisionType", label: "Decision Type", type: "select", options: ["ownership_change", "governance_update", "certification_action", "banking_change", "legal_review", "fundraising_decision"] },
                    { key: "madeBy", label: "Made By", type: "text", placeholder: "e.g. Angela + Stephen" },
                    { key: "rationale", label: "Rationale", type: "text", placeholder: "Why this decision was made" },
                  ]}
                  onSubmit={(vals) => { decisionLogCrud.addMutation.mutate(vals as Record<string, unknown>); setShowAddForm(null); }}
                  onCancel={() => setShowAddForm(null)}
                  submitLabel="Log"
                />
              </div>
            )}
            {decisionLog.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No decision log entries.</div>
            ) : decisionLog.map(entry => (
              <div key={entry.id} className="px-4 py-3 space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded capitalize">{entry.decisionType.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleDateString()}</span>
                    {entry.madeBy && <span className="text-xs text-muted-foreground">by {entry.madeBy}</span>}
                  </div>
                  <button onClick={() => decisionLogCrud.deleteMutation.mutate(entry.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-foreground">{entry.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scenario List ────────────────────────────────────────────────────────────

function ScenarioList({ onSelect }: { onSelect: (id: number) => void }) {
  const qc = useQueryClient();
  const [autoSeeded, setAutoSeeded] = useState(false);

  const { data: scenarios = [], isLoading } = useQuery<OwnershipScenario[]>({
    queryKey: ["ownership-scenarios"],
    queryFn: () => apiFetch("/ownership/scenarios?limit=50"),
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch("/ownership/seed-preferred-template", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenarios"] }),
  });

  useEffect(() => {
    if (!isLoading && scenarios.length === 0 && !autoSeeded && !seedMutation.isPending) {
      setAutoSeeded(true);
      seedMutation.mutate();
    }
  }, [isLoading, scenarios.length, autoSeeded, seedMutation]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/ownership/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenarios"] }),
  });

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiFetch("/ownership/scenarios", {
      method: "POST",
      body: JSON.stringify({ name: newName, description: newDesc }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownership-scenarios"] });
      setShowNew(false);
      setNewName("");
      setNewDesc("");
    },
  });


  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Ownership Scenarios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {scenarios.filter(s => s.isPreferred).length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-50 transition-colors"
            >
              {seedMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
              Load Preferred Template
            </button>
          )}
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Scenario
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">New Ownership Scenario</h3>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Scenario name (e.g. Mom 51% / Stephen 30% / Dad 19%)"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Create
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center space-y-3">
          <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">No scenarios yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Load the preferred mom-led template or create a custom scenario.</p>
          </div>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Load Preferred Mom-Led Structure
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map(s => (
            <div
              key={s.id}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => onSelect(s.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    {s.isPreferred && <Star className="w-3.5 h-3.5 text-amber-500" />}
                    {s.isActive && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">ACTIVE</span>}
                    {s.isTemplate && <span className="text-[10px] bg-violet-500/10 text-violet-500 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-semibold">TEMPLATE</span>}
                    <StatusBadge status={s.status} />
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    {s.fundraisingFitScore != null && <span className="text-[10px] text-muted-foreground">Fundraising: {s.fundraisingFitScore}/100</span>}
                    {s.bankFitScore != null && <span className="text-[10px] text-muted-foreground">Banking: {s.bankFitScore}/100</span>}
                    {s.investorClarityScore != null && <span className="text-[10px] text-muted-foreground">Investor Clarity: {s.investorClarityScore}/100</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm("Delete this scenario?")) deleteMutation.mutate(s.id); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScenarioComparisonView() {
  const { data: scenarios = [], isLoading } = useQuery<OwnershipScenario[]>({
    queryKey: ["ownership-scenarios"],
    queryFn: () => apiFetch("/ownership/scenarios?limit=50"),
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadedDetails, setLoadedDetails] = useState<Map<number, ScenarioDetail>>(new Map());

  useEffect(() => {
    const idsToLoad = selectedIds.filter(id => !loadedDetails.has(id));
    if (idsToLoad.length === 0) return;
    Promise.all(idsToLoad.map(id => apiFetch<ScenarioDetail>(`/ownership/scenarios/${id}`).then(d => [id, d] as const)))
      .then(results => {
        setLoadedDetails(prev => {
          const next = new Map(prev);
          for (const [id, d] of results) next.set(id, d);
          return next;
        });
      });
  }, [selectedIds]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const loaded = selectedIds.map(id => loadedDetails.get(id)).filter((d): d is ScenarioDetail => !!d);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>;

  const fitLevelRank: Record<string, number> = { strong: 3, moderate: 2, weak: 1, not_applicable: 0 };

  return (
    <div className="space-y-5">
      <DisclaimerBanner />
      <div>
        <h2 className="text-base font-semibold text-foreground">Compare Scenarios</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select up to 3 scenarios to compare side-by-side.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => toggleSelect(s.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              selectedIds.includes(s.id)
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground border-border hover:border-primary/20 hover:text-foreground"
            )}
          >
            {selectedIds.includes(s.id) ? <CheckSquare className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {s.name}
            {s.isPreferred && <Star className="w-3 h-3 text-amber-500" />}
          </button>
        ))}
      </div>

      {selectedIds.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <Scale className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Select scenarios above to begin comparison.</p>
        </div>
      )}

      {loaded.length >= 2 && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Readiness Scores
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Metric</th>
                    {loaded.map(d => (
                      <th key={d.scenario.id} className="text-center py-2 px-3 text-muted-foreground font-medium">
                        {d.scenario.name}
                        {d.scenario.isPreferred && <Star className="w-3 h-3 text-amber-500 inline ml-1" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { label: "Fundraising Fit", key: "fundraisingFitScore" as const },
                    { label: "Banking Fit", key: "bankFitScore" as const },
                    { label: "Investor Clarity", key: "investorClarityScore" as const },
                  ].map(metric => {
                    const vals = loaded.map(d => d.scenario[metric.key] ?? 0);
                    const best = Math.max(...vals);
                    return (
                      <tr key={metric.key} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4 text-foreground font-medium">{metric.label}</td>
                        {loaded.map((d, i) => {
                          const v = d.scenario[metric.key];
                          return (
                            <td key={d.scenario.id} className="py-2.5 px-3 text-center">
                              <span className={cn("text-sm font-bold tabular-nums", vals[i] === best ? "text-emerald-500" : "text-foreground")}>
                                {v ?? "—"}
                              </span>
                              {v != null && <span className="text-muted-foreground">/100</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Ownership Structure
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Owner</th>
                    {loaded.map(d => (
                      <th key={d.scenario.id} className="text-center py-2 px-3 text-muted-foreground font-medium">{d.scenario.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Array.from(new Set(loaded.flatMap(d => d.allocations.map(a => a.personName)))).map(name => (
                    <tr key={name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-4 text-foreground font-medium">{name}</td>
                      {loaded.map(d => {
                        const alloc = d.allocations.find(a => a.personName === name);
                        return (
                          <td key={d.scenario.id} className="py-2 px-3 text-center">
                            {alloc ? (
                              <div className="space-y-0.5">
                                <span className="text-sm font-bold tabular-nums text-foreground">{alloc.equityPct}%</span>
                                {alloc.isControlling && <Shield className="w-3 h-3 text-primary mx-auto" />}
                              </div>
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Certification Fit Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Certification</th>
                    {loaded.map(d => (
                      <th key={d.scenario.id} className="text-center py-2 px-3 text-muted-foreground font-medium">{d.scenario.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Array.from(new Set(loaded.flatMap(d => d.certReadiness.map(c => c.certificationName)))).map(certName => {
                    const certs = loaded.map(d => d.certReadiness.find(c => c.certificationName === certName));
                    const bestRank = Math.max(...certs.map(c => c ? fitLevelRank[c.fitLevel] ?? 0 : 0));
                    return (
                      <tr key={certName} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4 text-foreground font-medium">{certName}</td>
                        {certs.map((cert, i) => (
                          <td key={loaded[i].scenario.id} className="py-2.5 px-3 text-center">
                            {cert ? (
                              <div className="space-y-1">
                                <FitBadge level={cert.fitLevel} />
                                {cert.gapSummary && <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 max-w-[200px] mx-auto">{cert.gapSummary}</p>}
                              </div>
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Control Authority Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Authority</th>
                    {loaded.map(d => (
                      <th key={d.scenario.id} className="text-center py-2 px-3 text-muted-foreground font-medium">{d.scenario.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(["hasDayToDayControl", "hasLongTermDecisionAuthority", "hasHiringFiringAuthority", "hasStrategicVeto"] as const).map(auth => (
                    <tr key={auth} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-4 text-foreground">{auth.replace(/([A-Z])/g, " $1").replace(/^has /, "").trim()}</td>
                      {loaded.map(d => {
                        const controller = d.controlRoles.find(r => r.hasDayToDayControl || r.hasStrategicVeto);
                        const primaryRole = controller ?? d.controlRoles[0];
                        return (
                          <td key={d.scenario.id} className="py-2 px-3 text-center">
                            {primaryRole ? (
                              primaryRole[auth]
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                                : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedIds.length === 1 && (
        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">Select at least one more scenario to see the comparison.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "scenarios", label: "Scenarios", icon: Shield },
  { id: "compare", label: "Compare", icon: Scale },
  { id: "actions", label: "Next Actions", icon: ClipboardList },
] as const;

type NavItem = (typeof NAV_ITEMS)[number]["id"];

export default function OwnershipOsPage() {
  const [nav, setNav] = useState<NavItem>("scenarios");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const { data: featureEnabled, isLoading: flagLoading } = useQuery<boolean>({
    queryKey: ["ownership-feature-flag"],
    queryFn: async () => {
      try {
        await apiFetch("/ownership/health");
        return true;
      } catch {
        return false;
      }
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    document.title = "Ownership Readiness OS | SZL Holdings";
  }, []);

  if (flagLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md space-y-3">
          <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-semibold text-foreground">Ownership Readiness OS</h2>
          <p className="text-sm text-muted-foreground">This module is not currently enabled. Contact an administrator to enable the ownership readiness feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ownership Readiness OS</h1>
            <p className="text-xs text-muted-foreground">Internal — Certification, Banking & Governance Planning</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50 font-medium">PRIVATE</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setNav(item.id); setSelectedScenarioId(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  nav === item.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3 h-3" /> {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {nav === "scenarios" && !selectedScenarioId && (
            <m.div key="scenario-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioList onSelect={id => { setSelectedScenarioId(id); }} />
            </m.div>
          )}
          {nav === "scenarios" && selectedScenarioId && (
            <m.div key={`scenario-detail-${selectedScenarioId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioDetailView scenarioId={selectedScenarioId} onBack={() => setSelectedScenarioId(null)} />
            </m.div>
          )}
          {nav === "compare" && (
            <m.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioComparisonView />
            </m.div>
          )}
          {nav === "actions" && (
            <m.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-4">
                <DisclaimerBanner />
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> All Open Action Items
                </h2>
                <NextActionsPanel scenarioId={1} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
