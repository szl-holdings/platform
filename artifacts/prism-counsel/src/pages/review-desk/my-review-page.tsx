import { ClipboardCheck, AlertTriangle, HelpCircle, CheckCircle, Zap, Loader2 } from "lucide-react";
import { useMyReviewSummary, useMaxUnblockItem } from "../../hooks/use-prism-review";
import { ReviewCard } from "./review-card";

const DEMO_SUMMARY = {
  needsAction: 3,
  risky: 1,
  missing: 1,
  readyToClear: 1,
  topItems: [
    {
      id: 1001,
      title: "Settlement demand section — Rodriguez v. National General",
      reviewWorkType: "draft_review",
      lifecycleState: "in_review",
      matterId: 1,
      priorityScore: 0.88,
      confidence: 0.82,
      whatThisIs: "AI-generated demand letter section covering $127K in medical specials",
      whatActionClearsIt: "Attorney approval clears for send review",
      workUnblockedScore: 0.88,
      deadlineRiskScore: 0.75,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: 1002,
      title: "Medical chronology contradictions — Thompson v. Westfield",
      reviewWorkType: "contradiction_review",
      lifecycleState: "needs_attorney_review",
      matterId: 2,
      priorityScore: 0.75,
      confidence: 0.61,
      whatThisIs: "Three conflicting treatment dates identified between records",
      whatActionClearsIt: "Attorney confirms correct dates",
      workUnblockedScore: 0.65,
      contradictionSeverityScore: 0.91,
      deadlineRiskScore: 0.52,
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
  ],
  riskyItems: [
    {
      id: 1001,
      title: "Settlement demand section — Rodriguez v. National General",
      reviewWorkType: "draft_review",
      lifecycleState: "in_review",
      matterId: 1,
      priorityScore: 0.88,
      whatRiskExists: "Insurer deadline pressure approaching — delay risks counter-offer window",
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ],
  missingItems: [
    {
      id: 1005,
      title: "Medicare lien — verification needed",
      reviewWorkType: "recovery_lien_review",
      lifecycleState: "needs_evidence",
      matterId: 1,
      priorityScore: 0.44,
      whatsMissing: ["Medicare lien reduction letter", "BCRC final demand"],
      blockedReason: "Waiting on Medicare reduction letter",
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    },
  ],
  topUnblockers: [
    {
      id: 1001,
      title: "Settlement demand section — Rodriguez",
      reviewWorkType: "draft_review",
      lifecycleState: "in_review",
      workUnblockedScore: 0.88,
      whatItUnblocks: ["Safe-to-send clearance", "Mediation package", "Partner approval"],
    },
  ],
};

const DEMO_UNBLOCKER = {
  topUnblocker: {
    id: 1001,
    title: "Settlement demand section — Rodriguez v. National General",
    reviewWorkType: "draft_review",
    lifecycleState: "in_review",
    workUnblockedScore: 0.88,
    whatItUnblocks: ["Safe-to-send clearance", "Mediation package", "Partner approval"],
    whatActionClearsIt: "Attorney approval clears for send review",
    priorityScore: 0.88,
  },
};

export default function MyReviewPage() {
  const { data: summaryData } = useMyReviewSummary();
  const { data: unblockerData } = useMaxUnblockItem();

  const s = summaryData ?? DEMO_SUMMARY;
  const u = unblockerData ?? DEMO_UNBLOCKER;
  const isLive = !!summaryData;

  const kpis = [
    { label: "Needs Action", value: s.needsAction, color: "#d4a054", icon: ClipboardCheck },
    { label: "Risky", value: s.risky, color: "#c45a4a", icon: AlertTriangle },
    { label: "Missing Support", value: s.missing, color: "#c45a4a", icon: HelpCircle },
    { label: "Ready to Clear", value: s.readyToClear, color: "#4a90b8", icon: CheckCircle },
  ];

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">My Review</h1>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLive ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">What needs review, what's risky, what's missing, what's ready to clear</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                <span className="text-[10px] text-slate-500">{k.label}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: k.value > 0 ? k.color : "#64748b" }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {u.topUnblocker && (
        <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#d4a054]" />
            <h3 className="text-sm font-semibold text-slate-200">Highest Leverage: Clears the Most Downstream Work</h3>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-200">{u.topUnblocker.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {u.topUnblocker.reviewWorkType?.replace(/_/g, " ")} · Priority {Math.round(u.topUnblocker.priorityScore * 100)}
              </div>
              {u.topUnblocker.whatItUnblocks && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Array.isArray(u.topUnblocker.whatItUnblocks) ? u.topUnblocker.whatItUnblocks : []).map((item: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {u.topUnblocker.whatActionClearsIt && (
                <p className="text-[10px] text-[#4a90b8] mt-1">{u.topUnblocker.whatActionClearsIt}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-[#d4a054]">Unblock Score</div>
              <div className="text-xl font-bold text-[#d4a054]">{Math.round(u.topUnblocker.workUnblockedScore * 100)}</div>
            </div>
          </div>
        </div>
      )}

      {s.topItems && s.topItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Needs Action ({s.needsAction})</h2>
          {(s.topItems as any[]).map((item: any) => (
            <ReviewCard key={item.id} item={item} compact />
          ))}
        </div>
      )}

      {s.riskyItems && s.riskyItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#c45a4a] uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Risky ({s.risky})
          </h2>
          {(s.riskyItems as any[]).map((item: any) => (
            <div key={item.id} className="rounded border border-[#c45a4a]/20 p-3" style={{ background: "#0c1220" }}>
              <div className="text-xs text-slate-200">{item.title}</div>
              {item.whatRiskExists && <p className="text-[10px] text-[#c45a4a] mt-0.5">{item.whatRiskExists}</p>}
            </div>
          ))}
        </div>
      )}

      {s.missingItems && s.missingItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Missing Support ({s.missing})
          </h2>
          {(s.missingItems as any[]).map((item: any) => (
            <div key={item.id} className="rounded border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="text-xs text-slate-200">{item.title}</div>
              {item.whatsMissing && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(item.whatsMissing) ? item.whatsMissing : []).map((m: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">{m}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
