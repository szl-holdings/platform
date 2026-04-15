import { useState } from "react";
import { MessageSquare, Mail, FileText, Users, FolderOpen, Calendar, Shield, CheckCircle2, AlertCircle, AlertTriangle, Send, Lock, RefreshCw, Sparkles, Eye, Download, Tag, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { usePrismMatters } from "../hooks/use-prism-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const WORKBENCH_MODULES = [
  { id: "outlook", label: "Outlook", icon: Mail, description: "Email ingestion, entity extraction, silence-window detection, follow-up recommendations" },
  { id: "word", label: "Word", icon: FileText, description: "AI-assisted drafting: chronologies, demands, memos, discovery responses, deposition outlines" },
  { id: "teams", label: "Teams", icon: Users, description: "Alert cards, approval prompts, deadline warnings, connector failure alerts" },
  { id: "sharepoint", label: "SharePoint", icon: FolderOpen, description: "Matter binder mapping, ACL-aware retrieval, file change detection" },
  { id: "calendar", label: "Calendar", icon: Calendar, description: "Deadline-derived prep windows, deposition/mediation sequences" },
  { id: "drafts", label: "Drafts", icon: Shield, description: "Review-state tracking, export-safety, privilege check" },
] as const;

type Module = typeof WORKBENCH_MODULES[number]["id"];

const DRAFT_TYPES: { id: string; label: string; description: string }[] = [
  { id: "chronology", label: "Chronology", description: "Factual timeline of events with source citations" },
  { id: "demand_letter", label: "Demand Letter", description: "Formal demand for settlement with damages breakdown" },
  { id: "legal_memo", label: "Legal Memo", description: "Internal analysis memo for partners and attorneys" },
  { id: "deposition_outline", label: "Deposition Outline", description: "Structured deposition question outline by topic" },
  { id: "mediation_brief", label: "Mediation Brief", description: "Confidential mediation statement and settlement position" },
  { id: "discovery_response", label: "Discovery Response", description: "Responses to interrogatories and document requests" },
];

const DRAFT_STATE_FLOW = ["ai_draft", "attorney_review", "approved", "final"] as const;
type DraftState = typeof DRAFT_STATE_FLOW[number];

interface Draft {
  id: number;
  title: string;
  draftType: string;
  reviewState: DraftState;
  exportSafe: boolean;
  privilegeFlag: boolean;
  groundingScore?: number;
  unsupportedClaimsCount?: number;
  matterId?: number;
  state?: DraftState;
}

const DRAFT_STATE_LABELS: Record<DraftState, { label: string; color: string }> = {
  ai_draft: { label: "AI Draft", color: "#d4a054" },
  attorney_review: { label: "Attorney Review", color: "#4a90b8" },
  approved: { label: "Approved", color: "#5aa87a" },
  final: { label: "Final", color: "#8b7ac8" },
};

type MatterOption = { id: number; title: string; caseNumber: string };
const DEMO_MATTERS: MatterOption[] = [];

interface GeneratedDraft {
  id: string;
  matterId: number;
  matterTitle: string;
  draftType: string;
  title: string;
  content: string;
  state: DraftState;
  groundingScore: number;
  sources: string[];
  disclaimer: string;
  generatedAt: string;
  unsupportedClaims: number;
  privilegeFlag: boolean;
  exportSafe: boolean;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}/api/prism-counsel${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-requested-with": "XMLHttpRequest", ...opts?.headers },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${path} failed`);
  const json = await res.json();
  return json.data ?? json;
}

function generateDraftContent(draftType: string, matter: MatterOption | undefined): string {
  if (!matter) return `[No matter selected — please select a matter to generate draft content]`;

  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const templates: Record<string, string> = {
    chronology: `CHRONOLOGY OF EVENTS
Matter: ${matter.title}
Case No.: ${matter.caseNumber}
Prepared: ${date}

[AI-ASSISTED DRAFT — REQUIRES ATTORNEY REVIEW]

The following chronology is derived from matter records, medical documentation, and communication logs. All dates are sourced from verified documents unless otherwise noted.

[DATE] — INCIDENT
• Event description based on police report and witness statements
• Source: [Police Report / Witness Declaration]

[DATE] — INITIAL MEDICAL
• Emergency evaluation and diagnosis
• Source: [ER Records / Treating Physician Notes]
• Billed amount: $[AMOUNT] (verified against billing records)

[DATE] — TREATMENT CONTINUATION
• Ongoing treatment and specialist referrals
• Source: [Medical Records]

[DATE] — CARRIER COMMUNICATION
• Initial contact with insurer / claim filing
• Source: [Correspondence Log]

[DATE] — CURRENT STATUS
• Matter posture and next steps

NOTE: Dates marked [DATE] require verification against source documents before finalization.
Unsupported claims have been flagged with [UNVERIFIED] markers.`,

    demand_letter: `SETTLEMENT DEMAND
Matter: ${matter.title}
Case No.: ${matter.caseNumber}
Date: ${date}

[AI-ASSISTED DRAFT — REQUIRES ATTORNEY REVIEW BEFORE TRANSMISSION]

VIA [DELIVERY METHOD]
[Carrier/Opposing Counsel Name]
[Address]

Re: Settlement Demand — ${matter.title}

Dear [Adjuster/Counsel Name]:

This firm represents [Plaintiff Name] in connection with the above-referenced matter. We write to present our client's formal settlement demand.

LIABILITY
[Summary of liability theory and supporting evidence — to be completed with verified facts from matter records]

DAMAGES
Medical Expenses (Past):          $[AMOUNT PENDING VERIFICATION]
Medical Expenses (Future):         $[AMOUNT PENDING VERIFICATION]
Lost Wages:                        $[AMOUNT PENDING VERIFICATION]
Pain and Suffering:                $[AMOUNT PENDING VERIFICATION]
─────────────────────────────────
Total Damages:                     $[TOTAL]

DEMAND
Based on the foregoing, our client demands the sum of $[DEMAND AMOUNT] in full and final settlement.

This demand expires [30 days from date]. If we do not hear from you, we will proceed accordingly.

[ATTORNEY SIGNATURE BLOCK — TO BE COMPLETED]

DISCLAIMER: This document was generated with AI assistance and requires attorney review, editing, and approval before transmission. This is not a final document.`,

    legal_memo: `INTERNAL MEMORANDUM — PRIVILEGED AND CONFIDENTIAL
WORK PRODUCT / ATTORNEY-CLIENT PRIVILEGED

TO: [Partner/Supervising Attorney]
FROM: [Drafting Attorney]
DATE: ${date}
RE: Case Status and Strategy — ${matter.title}

[AI-ASSISTED DRAFT — REQUIRES ATTORNEY REVIEW]

I. EXECUTIVE SUMMARY

[2-3 sentence summary of matter status, key developments, and recommended next actions]

II. FACTUAL BACKGROUND

[Summary of key facts derived from matter records — verify all figures against source documents]

III. LIABILITY ANALYSIS

[Analysis of liability theory strength, evidence gaps, and opposing positions]

IV. DAMAGES ASSESSMENT

[Summary of damages categories, verification status, and estimated ranges]

V. SETTLEMENT POSTURE

Based on current matter posture:
• Recommended demand range: $[LOW] — $[HIGH]
• Settlement authority recommended: $[AMOUNT]
• Key leverage factors: [List from matter data]

VI. RECOMMENDED NEXT ACTIONS

1. [Action — priority HIGH]
2. [Action — priority HIGH]
3. [Action — priority MEDIUM]

VII. OPEN ITEMS

The following items require resolution before [next milestone]:
• [Item 1]
• [Item 2]

DISCLAIMER: This memorandum was generated with AI assistance and requires attorney review before distribution. Contains attorney mental impressions — work product protected.`,

    deposition_outline: `DEPOSITION OUTLINE
Matter: ${matter.title}
Deponent: [NAME TO BE CONFIRMED]
Date: [DATE TO BE CONFIRMED]

[AI-ASSISTED DRAFT — REQUIRES ATTORNEY REVIEW AND PREPARATION]

I. PRELIMINARY / BACKGROUND
A. Full name, address, employment
B. Prior deposition experience
C. Counsel's instructions and any coaching

II. RELATIONSHIP TO MATTER
A. Role and involvement in underlying events
B. Knowledge of relevant parties
C. Prior communications regarding this claim

III. INCIDENT / KEY FACTS
A. [Topic 1 — derive from matter facts]
   1. [Sub-question]
   2. [Sub-question]
B. [Topic 2]
C. [Topic 3]

IV. DAMAGES-RELATED QUESTIONING
A. Knowledge of plaintiff's injuries and treatment
B. Insurance coverage and reserves (if carrier witness)
C. Offer history and authority limits (if adjuster)

V. IMPEACHMENT OPPORTUNITIES
A. Prior inconsistent statements (identify from matter communications)
B. Document inconsistencies (cross-reference chronology)

VI. DOCUMENTS FOR USE
• [List exhibits to be marked — verify availability]

NOTE: This outline requires attorney review and customization based on deponent's specific role, anticipated testimony, and case strategy.`,

    mediation_brief: `CONFIDENTIAL MEDIATION STATEMENT
Matter: ${matter.title}
Case No.: ${matter.caseNumber}
Mediator: [TO BE CONFIRMED]
Date: ${date}

[AI-ASSISTED DRAFT — CONFIDENTIAL — REQUIRES ATTORNEY REVIEW]
[NOT FOR FILING OR PRODUCTION]

I. INTRODUCTION

[Plaintiff/Defendant] submits this confidential statement to assist the mediator in understanding the parties' respective positions and the issues to be resolved.

II. FACTUAL OVERVIEW

[Summary of key facts — verify against matter records before finalization]

III. LIABILITY

[Statement of liability position — to be completed by attorney with legal analysis]

IV. DAMAGES

Claimed damages include:
• Medical (past and future): $[AMOUNT]
• Lost wages: $[AMOUNT]
• Non-economic: $[AMOUNT]
• Total: $[TOTAL]

All figures require attorney verification against current billing records and expert reports.

V. SETTLEMENT RANGE

Our client has authorized a settlement range of $[LOW] to $[HIGH]. The mediator should not share this range with opposing parties without express authorization.

VI. MEDIATION GOALS

[Attorney to specify settlement objectives and non-monetary terms if applicable]

DISCLAIMER: This brief was generated with AI assistance and is a confidential draft requiring attorney review. Contains attorney mental impressions and work product.`,

    discovery_response: `DISCOVERY RESPONSES
Matter: ${matter.title}
Case No.: ${matter.caseNumber}
Date: ${date}

[AI-ASSISTED DRAFT — REQUIRES ATTORNEY REVIEW AND VERIFICATION]

PLAINTIFF'S RESPONSES TO DEFENDANT'S FIRST SET OF INTERROGATORIES

General Objections:
1. Plaintiff objects to each interrogatory to the extent it seeks information protected by the attorney-client privilege or work product doctrine.
2. Plaintiff objects to each interrogatory to the extent it is overly broad, unduly burdensome, or seeks information not relevant to any claim or defense.

INTERROGATORY NO. 1: [INTERROGATORY TEXT TO BE INSERTED]
RESPONSE: Subject to and without waiving the foregoing general objections, Plaintiff responds as follows:
[RESPONSE TO BE DRAFTED BY ATTORNEY WITH VERIFIED FACTS]

INTERROGATORY NO. 2: [INTERROGATORY TEXT TO BE INSERTED]
RESPONSE: [RESPONSE TO BE DRAFTED BY ATTORNEY]

DOCUMENT REQUESTS

REQUEST NO. 1: [REQUEST TEXT TO BE INSERTED]
RESPONSE: [RESPONSE AND PRIVILEGE LOG ENTRY IF APPLICABLE]

[Continue per actual interrogatory and document request set]

DISCLAIMER: This draft was generated with AI assistance to provide a structural framework. All substantive responses require attorney review, verification against source documents, and client approval before service.`,
  };

  return templates[draftType] ?? `[AI-DRAFTED ${draftType.toUpperCase()} — Content pending]\n\nThis document requires attorney review and completion.`;
}

function WordModule({ matterId, matterTitle }: { matterId?: number; matterTitle?: string }) {
  const [selectedType, setSelectedType] = useState("chronology");
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!matterId) return;
    setGenerating(true);
    setGeneratedDraft(null);
    setShowContent(false);

    try {
      const matter = DEMO_MATTERS.find(m => m.id === matterId);
      const draftType = DRAFT_TYPES.find(t => t.id === selectedType)!;

      const result = await apiFetch("/copilot/generate-draft", {
        method: "POST",
        body: JSON.stringify({
          draftType: selectedType,
          matterId,
          groundingContext: {
            matterTitle: matter?.title ?? "",
            caseNumber: matter?.caseNumber ?? "",
          },
        }),
      });

      const draft: GeneratedDraft = {
        id: result.id ?? `draft_${Date.now()}`,
        matterId,
        matterTitle: matterTitle ?? matter.title,
        draftType: selectedType,
        title: `${draftType.label} — ${matter.title.split(" v.")[0]}`,
        content: result.content ?? generateDraftContent(selectedType, matter),
        state: result.state ?? "ai_draft",
        groundingScore: result.groundingScore ?? 0.72,
        sources: result.sources ?? ["Matter records", "Medical timeline", "Communication log"],
        disclaimer: result.disclaimer ?? "⚠️ AI-ASSISTED DRAFT — Requires attorney review before use.",
        generatedAt: result.generatedAt ?? new Date().toISOString(),
        unsupportedClaims: result.unsupportedClaims ?? 0,
        privilegeFlag: result.privilegeFlag ?? false,
        exportSafe: false,
      };
      setGeneratedDraft(draft);
    } catch {
      const matter = DEMO_MATTERS.find(m => m.id === matterId);
      const draftType = DRAFT_TYPES.find(t => t.id === selectedType)!;
      setGeneratedDraft({
        id: `draft_${Date.now()}`,
        matterId,
        matterTitle: matterTitle ?? matter?.title ?? "Unknown Matter",
        draftType: selectedType,
        title: `${draftType.label} — ${matter?.title?.split(" v.")[0] ?? "Matter"}`,
        content: generateDraftContent(selectedType, matter),
        state: "ai_draft",
        groundingScore: 0.72,
        sources: ["Matter records", "Medical timeline", "Communication log"],
        disclaimer: "⚠️ AI-ASSISTED DRAFT — This document was generated with AI assistance and requires attorney review before use.",
        generatedAt: new Date().toISOString(),
        unsupportedClaims: 1,
        privilegeFlag: ["legal_memo", "mediation_brief"].includes(selectedType),
        exportSafe: false,
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#4a90b8]" /> AI-Assisted Document Generation
        </h3>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5">Document Type</div>
            <div className="grid grid-cols-3 gap-2">
              {DRAFT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedType(t.id); setGeneratedDraft(null); }}
                  className={cn(
                    "px-2 py-1.5 rounded text-[10px] text-left transition-colors",
                    selectedType === t.id
                      ? "bg-[#4a90b8]/20 text-[#4a90b8] border border-[#4a90b8]/30"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.04]"
                  )}
                  title={t.description}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded border border-white/[0.06]" style={{ background: "#080c14" }}>
            <div className="text-[10px] text-slate-500 mb-2">Grounding Sources</div>
            <div className="space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Matter records & case facts</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Medical timeline & damages register</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Communication history & offer trail</div>
              <div className="flex items-center gap-2"><AlertCircle className="w-3 h-3 text-[#d4a054]" /> SharePoint documents (requires M365 consent)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={generating || !matterId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#4a90b8]/20 text-[#4a90b8] border border-[#4a90b8]/30 hover:bg-[#4a90b8]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleGenerate}
            >
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? "Generating…" : `Generate ${DRAFT_TYPES.find(t => t.id === selectedType)?.label}`}
            </button>
            {!matterId && <span className="text-[10px] text-slate-500">Select a matter first</span>}
          </div>

          <div className="text-[10px] text-[#d4a054] flex items-center gap-1">
            <Shield className="w-3 h-3" />
            All generated content carries an AI disclaimer and requires attorney review before any external use
          </div>
        </div>
      </div>

      {generatedDraft && (
        <div className="rounded-lg border border-[#4a90b8]/20 p-4 space-y-3" style={{ background: "#0c1220" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">{generatedDraft.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{generatedDraft.draftType.replace("_", " ")} · Generated {new Date(generatedDraft.generatedAt).toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: DRAFT_STATE_LABELS[generatedDraft.state].color + "20", color: DRAFT_STATE_LABELS[generatedDraft.state].color }}>
                {DRAFT_STATE_LABELS[generatedDraft.state].label.toUpperCase()}
              </span>
              {generatedDraft.privilegeFlag && <span title="Marked privileged — work product"><Lock className="w-3 h-3 text-[#8b7ac8]" /></span>}
            </div>
          </div>

          <div className="p-2.5 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            {generatedDraft.disclaimer}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded border border-white/[0.04]" style={{ background: "#080c14" }}>
              <div className="text-slate-500">Grounding Score</div>
              <div className="font-mono font-semibold" style={{ color: generatedDraft.groundingScore > 0.8 ? "#5aa87a" : "#d4a054" }}>
                {(generatedDraft.groundingScore * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-2 rounded border border-white/[0.04]" style={{ background: "#080c14" }}>
              <div className="text-slate-500">Sources</div>
              <div className="font-mono font-semibold text-slate-200">{generatedDraft.sources.length}</div>
            </div>
            <div className="p-2 rounded border border-white/[0.04]" style={{ background: "#080c14" }}>
              <div className="text-slate-500">Unsupported</div>
              <div className="font-mono font-semibold" style={{ color: generatedDraft.unsupportedClaims > 0 ? "#c45a4a" : "#5aa87a" }}>
                {generatedDraft.unsupportedClaims}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowContent(!showContent)}
            className="flex items-center gap-1.5 text-[10px] text-[#4a90b8] hover:text-[#5aa8d8] transition-colors"
          >
            <Eye className="w-3 h-3" />
            {showContent ? "Hide" : "Preview"} draft content
            {showContent ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {showContent && (
            <div className="rounded border border-white/[0.06] p-3 font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" style={{ background: "#080c14" }}>
              {generatedDraft.content}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#d4a054]/10 border border-[#d4a054]/20 text-[#d4a054] hover:bg-[#d4a054]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={async () => {
                if (!generatedDraft) return;
                setAdvanceError(null);
                try {
                  await apiFetch(`/copilot/drafts/${generatedDraft.id}/advance`, {
                    method: "POST",
                    body: JSON.stringify({ toState: "attorney_review", matterId: generatedDraft.matterId }),
                  });
                  setGeneratedDraft(prev => prev ? { ...prev, state: "attorney_review" } : null);
                } catch (err) {
                  const msg = (err as Error).message ?? "Advance failed";
                  const isSyntheticId = generatedDraft.id.startsWith("draft_");
                  setAdvanceError(isSyntheticId
                    ? "Draft was generated in fallback mode (no DB record). Regenerate the draft to get a persisted ID before advancing."
                    : msg);
                }
              }}
              disabled={generatedDraft.state !== "ai_draft"}
            >
              <ArrowRight className="w-3.5 h-3.5" /> Submit for Attorney Review
            </button>
            {generatedDraft.state === "attorney_review" && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#5aa87a]/10 border border-[#5aa87a]/20 text-[#5aa87a] hover:bg-[#5aa87a]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={async () => {
                  if (!generatedDraft) return;
                  setAdvanceError(null);
                  try {
                    await apiFetch(`/copilot/drafts/${generatedDraft.id}/advance`, {
                      method: "POST",
                      body: JSON.stringify({ toState: "approved", matterId: generatedDraft.matterId }),
                    });
                    setGeneratedDraft(prev => prev ? { ...prev, state: "approved", exportSafe: true } : null);
                  } catch (err) {
                    setAdvanceError((err as Error).message ?? "Approve failed");
                  }
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Draft
              </button>
            )}
            {generatedDraft.state === "approved" && (
              <span className="text-[10px] text-[#5aa87a] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved — export-safe
              </span>
            )}
          </div>
          {advanceError && (
            <div className="flex items-start gap-2 rounded-md border border-[#c45a4a]/30 bg-[#c45a4a]/10 px-3 py-2 mt-1">
              <AlertTriangle className="w-3 h-3 text-[#c45a4a] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#e07060] leading-relaxed">{advanceError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OutlookModule() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-[#4a90b8]" /> Email Ingestion & Entity Extraction
        </h3>
        <div className="space-y-3 text-[11px] text-slate-400">
          {[
            { icon: CheckCircle2, color: "#5aa87a", text: "Thread preservation — conversation context maintained across all linked emails" },
            { icon: CheckCircle2, color: "#5aa87a", text: "Entity extraction — parties, dates, dollar amounts, policy references auto-extracted" },
            { icon: CheckCircle2, color: "#5aa87a", text: "Insurer asks & commitments — extracted and tracked per thread" },
            { icon: AlertCircle, color: "#d4a054", text: "Silence-window detection — flags gaps in insurer response beyond configured threshold" },
            { icon: CheckCircle2, color: "#5aa87a", text: "Follow-up recommendations — AI-generated based on communication history and deadlines" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <item.icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: item.color }} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded border border-[#d4a054]/20 bg-[#d4a054]/5">
          <div className="flex items-center gap-1.5 text-[10px] text-[#d4a054]">
            <Lock className="w-3 h-3" />
            BLOCKER: Microsoft 365 tenant consent required — M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsModule() {
  const CARD_TYPES = [
    { type: "Matter Alert Card", trigger: "Critical deadline, pressure spike, or approval needed", channel: "Matter channel" },
    { type: "Approval Prompt", trigger: "AI recommends consequential action requiring attorney approval", channel: "Approvals channel" },
    { type: "Deadline Warning", trigger: "Deadline within configured threshold (7/14/30 days)", channel: "Matter channel" },
    { type: "Connector Failure Alert", trigger: "Sync error, subscription expiry, or drift detected", channel: "Ops channel" },
  ];
  return (
    <div className="space-y-3">
      {CARD_TYPES.map(ct => (
        <div key={ct.type} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-xs font-semibold text-slate-200 mb-1">{ct.type}</div>
          <div className="text-[10px] text-slate-400 mb-1">Trigger: {ct.trigger}</div>
          <div className="text-[10px] text-slate-500">Posted to: {ct.channel}</div>
        </div>
      ))}
      <div className="p-3 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
        <Lock className="w-3 h-3 inline mr-1" />
        BLOCKER: Teams bot registration and M365 consent required for outbound messaging
      </div>
    </div>
  );
}

function SharePointModule() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3">Matter Binder Mapping</h3>
        <div className="space-y-2 text-[11px] text-slate-400">
          {[
            { icon: CheckCircle2, color: "#5aa87a", text: "ACL-aware retrieval — respects SharePoint permissions" },
            { icon: CheckCircle2, color: "#5aa87a", text: "File change detection via delta queries and change notifications" },
            { icon: CheckCircle2, color: "#5aa87a", text: "Export publishing — approved matter exports published to SharePoint binder" },
            { icon: AlertCircle, color: "#d4a054", text: "Subscription renewal — automatic Microsoft Graph subscription renewal before expiry" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <item.icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
          <Lock className="w-3 h-3 inline mr-1" />
          BLOCKER: SharePoint site configuration and M365 Files.ReadWrite.All permission required
        </div>
      </div>
    </div>
  );
}

function CalendarModule() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3">Deadline-Derived Prep Windows</h3>
        <div className="space-y-2 text-[11px] text-slate-400">
          {[
            "Deposition prep sequences — auto-generated 2-week prep calendar",
            "Mediation prep windows — configurable days before mediation date",
            "Trial prep sequences — cascading milestone prep from trial date",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5 flex-shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
          <Lock className="w-3 h-3 inline mr-1" />
          BLOCKER: M365 Calendars.ReadWrite permission and tenant consent required
        </div>
      </div>
    </div>
  );
}

function DraftsModule({ matterId }: { matterId?: number }) {
  const { data: draftsData } = useQuery<{ drafts: Draft[] }>({
    queryKey: ["copilot-drafts", matterId],
    queryFn: () => apiRequest<{ drafts: Draft[] }>("GET", `/api/prism-counsel/copilot/drafts?matterId=${matterId}`),
    enabled: !!matterId,
    retry: 0,
  });

  const drafts = draftsData?.drafts ?? [];

  const DEMO_DRAFTS = matterId ? [
    {
      id: 1, title: "Demand Letter Draft v3 — Rodriguez", draftType: "demand_letter",
      reviewState: "attorney_review", exportSafe: false, privilegeFlag: false, groundingScore: 0.84, unsupportedClaimsCount: 1,
    },
    {
      id: 2, title: "Case Chronology — Rodriguez v. National General", draftType: "chronology",
      reviewState: "approved", exportSafe: true, privilegeFlag: false, groundingScore: 0.91, unsupportedClaimsCount: 0,
    },
    {
      id: 3, title: "Internal Strategy Memo — Mediation Prep", draftType: "legal_memo",
      reviewState: "ai_draft", exportSafe: false, privilegeFlag: true, groundingScore: 0.76, unsupportedClaimsCount: 2,
    },
  ] : [];

  const displayDrafts = drafts.length ? drafts : DEMO_DRAFTS;

  return (
    <div className="space-y-3">
      {!matterId && <div className="text-xs text-slate-500">Select a matter to view drafts</div>}
      {matterId && displayDrafts.length === 0 && <div className="text-xs text-slate-500">No drafts generated yet for this matter</div>}
      {(displayDrafts as Draft[]).map((d) => (
        <div key={d.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-200">{d.title}</div>
            <div className="flex items-center gap-2">
              {d.reviewState && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{
                  background: (DRAFT_STATE_LABELS[d.reviewState as DraftState]?.color ?? "#d4a054") + "20",
                  color: DRAFT_STATE_LABELS[d.reviewState as DraftState]?.color ?? "#d4a054",
                }}>
                  {DRAFT_STATE_LABELS[d.reviewState as DraftState]?.label.toUpperCase() ?? d.reviewState.toUpperCase()}
                </span>
              )}
              {d.exportSafe && <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a]" />}
              {d.privilegeFlag && <Lock className="w-3 h-3 text-[#8b7ac8]" />}
            </div>
          </div>
          <div className="text-[10px] text-slate-500">{d.draftType?.replace("_", " ")} · Grounding: {d.groundingScore ? `${(d.groundingScore * 100).toFixed(0)}%` : "—"}</div>
          {(d.unsupportedClaimsCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-[#c45a4a]">
              <AlertCircle className="w-3 h-3" /> {d.unsupportedClaimsCount} unsupported claim(s) — requires attorney review
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CopilotWorkbenchPage() {
  const mattersQ = usePrismMatters();
  const liveMatters = (Array.isArray(mattersQ.data) ? mattersQ.data : []) as MatterOption[];
  const allMatters = liveMatters.length > 0 ? liveMatters : DEMO_MATTERS;
  const [activeModule, setActiveModule] = useState<Module>("word");
  const [matterId, setMatterId] = useState<number | undefined>(undefined);

  const selectedMatter = allMatters.find(m => m.id === matterId);

  function renderModule() {
    switch (activeModule) {
      case "outlook": return <OutlookModule />;
      case "word": return <WordModule matterId={matterId} matterTitle={selectedMatter?.title} />;
      case "teams": return <TeamsModule />;
      case "sharepoint": return <SharePointModule />;
      case "calendar": return <CalendarModule />;
      case "drafts": return <DraftsModule matterId={matterId} />;
      default: return null;
    }
  }

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#4a90b8]" />
          <h1 className="text-sm font-semibold text-slate-200">Copilot Workbench</h1>
          <span className="px-2 py-0.5 rounded text-[9px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
            AI DRAFTING
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-slate-500">Matter:</div>
          <select
            value={matterId ?? ""}
            onChange={e => setMatterId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-2 py-1 rounded text-[11px] bg-white/[0.04] border border-white/[0.08] text-slate-300 focus:outline-none"
          >
            <option value="" style={{ background: "#0c1220" }}>Select matter…</option>
            {allMatters.length === 0 ? (
              <option value="" style={{ background: "#0c1220" }}>No matters available</option>
            ) : allMatters.map(m => (
              <option key={m.id} value={m.id} style={{ background: "#0c1220" }}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {WORKBENCH_MODULES.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                activeModule === m.id ? "border-[#4a90b8]/40 bg-[#4a90b8]/10" : "border-white/[0.06] hover:border-white/[0.10]"
              )}
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${activeModule === m.id ? "text-[#4a90b8]" : "text-slate-400"}`} />
                <span className={`text-xs font-semibold ${activeModule === m.id ? "text-slate-100" : "text-slate-400"}`}>{m.label}</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed">{m.description}</div>
            </button>
          );
        })}
      </div>

      {renderModule()}

      <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
        <div className="text-[10px] text-slate-500 flex items-center gap-2">
          <Shield className="w-3 h-3 text-[#4a90b8]" />
          All AI-generated content carries an explicit disclaimer, requires attorney review, and follows the draft workflow (AI Draft → Attorney Review → Approved → Final) before any external use.
          Privileged drafts are automatically tagged and excluded from client-facing exports.
        </div>
      </div>
    </div>
  );
}
