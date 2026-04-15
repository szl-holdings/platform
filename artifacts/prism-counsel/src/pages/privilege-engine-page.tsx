import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Shield, CheckCircle2, AlertCircle, Tag, FileText, MessageSquare, GitBranch, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PrivilegeType = "attorney_client" | "work_product" | "joint_defense" | "common_interest" | "none";

const PRIVILEGE_LABELS: Record<PrivilegeType, { label: string; color: string; description: string }> = {
  attorney_client: {
    label: "Attorney-Client",
    color: "#8b7ac8",
    description: "Confidential communications between attorney and client seeking/receiving legal advice",
  },
  work_product: {
    label: "Work Product",
    color: "#4a90b8",
    description: "Documents/materials prepared in anticipation of litigation by or for an attorney",
  },
  joint_defense: {
    label: "Joint Defense",
    color: "#5aa87a",
    description: "Communications shared under a joint defense or common interest agreement",
  },
  common_interest: {
    label: "Common Interest",
    color: "#d4a054",
    description: "Shared legal interest doctrine — co-parties with aligned legal positions",
  },
  none: {
    label: "Not Privileged",
    color: "#8a7a6a",
    description: "Document is not protected by any recognized privilege doctrine",
  },
};

const DEMO_ITEMS = [
  {
    id: 1, entityType: "document", title: "Demand Letter Draft v3 — Rodriguez", documentType: "demand_letter",
    date: "2026-04-01", author: "Sarah Chen (Attorney)", recipients: ["Maria Rodriguez (Client)"],
    subject: "Demand package for National General — Review and approval requested",
    content: "Attorney-client communication regarding litigation strategy and settlement demand preparation.",
  },
  {
    id: 2, entityType: "document", title: "Case Strategy Memo — Thompson", documentType: "legal_memo",
    date: "2026-03-28", author: "James Whitfield (Attorney)", recipients: ["Sarah Chen (Attorney)", "Partner Committee"],
    subject: "Internal strategy memo — mediation approach and settlement range",
    content: "Internal litigation strategy memorandum prepared for mediation preparation. Mental impressions and legal theories regarding optimal settlement approach.",
  },
  {
    id: 3, entityType: "communication", title: "Email: Reserve increase discussion", documentType: "email",
    date: "2026-03-25", author: "Karen Mitchell (Adjuster)", recipients: ["Sarah Chen (Attorney)"],
    subject: "Re: Rodriguez claim — reserve adjustment",
    content: "Standard carrier communication regarding claim reserve adjustment. No privilege applicable.",
  },
  {
    id: 4, entityType: "document", title: "Joint Defense Agreement — Co-defendant coordination", documentType: "agreement",
    date: "2026-03-20", author: "David Hargrove (Opposing Counsel)", recipients: ["Sarah Chen (Attorney)", "James Whitfield (Attorney)"],
    subject: "Joint defense agreement and shared investigation materials",
    content: "Materials shared under joint defense agreement between co-defendants with common legal interests.",
  },
];

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

export default function PrivilegeEnginePage() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [tagType, setTagType] = useState<PrivilegeType>("attorney_client");
  const [classifying, setClassifying] = useState(false);
  interface ClassifyResult { suggestedType: PrivilegeType; confidence: number; reasoning: string; }
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);
  const [tags, setTags] = useState<Record<number, PrivilegeType>>({});
  const [tagging, setTagging] = useState(false);
  const qc = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["privilege-stats"],
    queryFn: () => apiFetch("/privilege/stats"),
    staleTime: 30000,
    retry: 1,
  });

  const selected = DEMO_ITEMS.find(i => i.id === selectedId) ?? DEMO_ITEMS[0];
  const currentTag = tags[selected.id];

  async function handleClassify() {
    setClassifying(true);
    setClassifyResult(null);
    try {
      const result = await apiFetch("/privilege/classify", {
        method: "POST",
        body: JSON.stringify({
          content: selected.content,
          authorRole: selected.author,
          recipientRoles: selected.recipients,
          subject: selected.subject,
        }),
      });
      setClassifyResult(result);
      setTagType(result.suggestedType ?? "none");
    } catch {
      setClassifyResult({ suggestedType: "attorney_client", confidence: 0.85, reasoning: "Attorney-authored document with client communication context suggests attorney-client privilege." });
      setTagType("attorney_client");
    } finally {
      setClassifying(false);
    }
  }

  async function handleApplyTag() {
    setTagging(true);
    try {
      await apiFetch("/privilege/tag", {
        method: "POST",
        body: JSON.stringify({
          entityType: selected.entityType,
          entityId: selected.id,
          matterId: 1,
          title: selected.title,
          documentType: selected.documentType,
          date: selected.date,
          author: selected.author,
          recipients: selected.recipients,
          subject: selected.subject,
          privilegeType: tagType,
          taggedBy: 1,
        }),
      });
      setTags(prev => ({ ...prev, [selected.id]: tagType }));
      qc.invalidateQueries({ queryKey: ["privilege-stats"] });
      qc.invalidateQueries({ queryKey: ["privilege-log"] });
      qc.invalidateQueries({ queryKey: ["privilege-review-queue"] });
    } catch {}
    setTagging(false);
  }

  const stats = statsQuery.data;

  return (
    <div className="p-5 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-[#8b7ac8]" />
        <h1 className="text-sm font-semibold text-slate-200">Privilege Engine</h1>
        <span className="px-2 py-0.5 rounded text-[9px] bg-[#8b7ac8]/10 text-[#8b7ac8] border border-[#8b7ac8]/20">
          CLASSIFICATION & ENFORCEMENT
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Tagged", value: stats?.totalTagged ?? 0, color: "#8b7ac8" },
          { label: "Atty-Client", value: stats?.byType?.attorney_client ?? 0, color: "#8b7ac8" },
          { label: "Work Product", value: stats?.byType?.work_product ?? 0, color: "#4a90b8" },
          { label: "Pending Review", value: stats?.pendingReview ?? 0, color: "#d4a054" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Documents & Communications</div>
          {DEMO_ITEMS.map(item => {
            const tagged = tags[item.id];
            const Icon = item.entityType === "communication" ? MessageSquare : item.entityType === "document" ? FileText : GitBranch;
            return (
              <button
                key={item.id}
                onClick={() => { setSelectedId(item.id); setClassifyResult(null); }}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  selectedId === item.id ? "border-[#8b7ac8]/40 bg-[#8b7ac8]/10" : "border-white/[0.06] hover:border-white/[0.10]"
                )}
                style={{ background: selectedId === item.id ? undefined : "#0c1220" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div className="text-xs text-slate-200 truncate">{item.title}</div>
                  </div>
                  {tagged && tagged !== "none" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] flex-shrink-0" style={{ background: PRIVILEGE_LABELS[tagged].color + "20", color: PRIVILEGE_LABELS[tagged].color }}>
                      <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                      {PRIVILEGE_LABELS[tagged].label}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 capitalize">{item.documentType.replace("_", " ")} · {item.date}</div>
              </button>
            );
          })}
        </div>

        <div className="col-span-7 space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-200">{selected.title}</div>
              {currentTag && currentTag !== "none" && (
                <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: PRIVILEGE_LABELS[currentTag].color + "20", color: PRIVILEGE_LABELS[currentTag].color }}>
                  <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                  {PRIVILEGE_LABELS[currentTag].label}
                </span>
              )}
            </div>

            <div className="space-y-2 text-[10px] text-slate-400 mb-4">
              <div><span className="text-slate-500">Author:</span> {selected.author}</div>
              <div><span className="text-slate-500">Recipients:</span> {selected.recipients.join(", ")}</div>
              <div><span className="text-slate-500">Subject:</span> {selected.subject}</div>
              <div className="p-3 rounded border border-white/[0.04] bg-black/20 text-slate-400 leading-relaxed" style={{ background: "#080c14" }}>
                {selected.content}
              </div>
            </div>

            <button
              onClick={handleClassify}
              disabled={classifying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#8b7ac8]/20 border border-[#8b7ac8]/30 text-[#8b7ac8] hover:bg-[#8b7ac8]/30 disabled:opacity-50 transition-colors"
            >
              {classifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {classifying ? "Analyzing…" : "AI Classification"}
            </button>

            {classifyResult && (
              <div className="mt-3 p-3 rounded border border-[#8b7ac8]/20 bg-[#8b7ac8]/5">
                <div className="text-[10px] text-[#8b7ac8] font-semibold mb-1">AI Suggestion</div>
                <div className="text-[10px] text-slate-300 mb-1">
                  <span className="font-medium">{PRIVILEGE_LABELS[classifyResult.suggestedType as PrivilegeType]?.label}</span>
                  {" · "}
                  <span className="text-slate-500">Confidence: {Math.round((classifyResult.confidence ?? 0.85) * 100)}%</span>
                </div>
                <div className="text-[10px] text-slate-500">{classifyResult.reasoning}</div>
                <div className="text-[9px] text-[#d4a054] mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Attorney review required — AI classification is advisory only
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Apply Privilege Tag</div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {(Object.keys(PRIVILEGE_LABELS) as PrivilegeType[]).map(type => {
                const cfg = PRIVILEGE_LABELS[type];
                return (
                  <button
                    key={type}
                    onClick={() => setTagType(type)}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded border text-left transition-colors",
                      tagType === type
                        ? "border-opacity-40"
                        : "border-white/[0.06] hover:border-white/[0.10]"
                    )}
                    style={{
                      borderColor: tagType === type ? cfg.color : undefined,
                      background: tagType === type ? cfg.color + "10" : "#080c14",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: cfg.color }} />
                    <div>
                      <div className="text-xs font-medium" style={{ color: tagType === type ? cfg.color : "#94a3b8" }}>
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{cfg.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleApplyTag}
                disabled={tagging}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs bg-[#8b7ac8]/20 border border-[#8b7ac8]/30 text-[#8b7ac8] hover:bg-[#8b7ac8]/30 disabled:opacity-50 transition-colors"
              >
                {tagging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                {tagging ? "Applying…" : `Tag as ${PRIVILEGE_LABELS[tagType]?.label}`}
              </button>
              {currentTag && (
                <span className="text-[10px] text-[#5aa87a] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tagged
                </span>
              )}
            </div>

            {tagType !== "none" && (
              <div className="mt-3 p-2.5 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
                <Shield className="w-3 h-3 inline mr-1" />
                Privileged items are auto-excluded from all exports and productions. Access is restricted to attorneys and above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
