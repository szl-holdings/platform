import { useState } from "react";
import { ClipboardList, AlertTriangle, Users, TrendingUp, Layers, ShieldAlert, Scale, FileDown, Ban, Loader2, Wifi, WifiOff } from "lucide-react";
import { ReviewCard } from "./review-card";
import {
  useReviewDeskOverview,
  useMyReviewQueue,
  useTeamReviewQueue,
  useHighRiskQueue,
  useLowConfidenceQueue,
  useContradictionQueue,
  useNeedsAttorneyQueue,
  useNeedsPartnerQueue,
  useReadyToExportQueue,
  useBlockedQueue,
} from "../../hooks/use-prism-review";

const DEMO_ITEMS = [
  {
    id: 1001,
    title: "Settlement demand section — Rodriguez v. National General",
    reviewWorkType: "draft_review",
    lifecycleState: "in_review",
    matterId: 1,
    description: "AI-generated demand section covering medical specials and pain & suffering",
    priorityScore: 0.88,
    confidence: 0.82,
    privilegeSensitive: false,
    exportSafe: false,
    sendSafe: false,
    whatThisIs: "AI-generated demand letter section covering $127K in medical specials plus non-economic damages",
    whyItsHere: "Draft requires attorney review before safe-to-send clearance",
    whatRiskExists: "Insurer deadline pressure approaching — delay risks counter-offer window",
    whatActionClearsIt: "Attorney approval clears for send review",
    whatItUnblocks: ["Safe-to-send clearance", "Mediation package", "Partner approval"],
    whoIsWaiting: ["Sarah Chen (partner)", "Insurance adjuster response"],
    deadlineRiskScore: 0.75,
    contradictionSeverityScore: 0.2,
    lowConfidenceScore: 0.18,
    workUnblockedScore: 0.88,
    partnerUrgencyScore: 0.72,
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
    privilegeSensitive: false,
    exportSafe: false,
    whatThisIs: "Three conflicting treatment dates identified between ER records and physical therapy intake",
    whyItsHere: "High-severity chronology conflict requires attorney review before chronology is finalized",
    whatRiskExists: "Inconsistency could be used by opposing counsel to undermine damages timeline",
    whatActionClearsIt: "Attorney confirms correct dates and flags resolution",
    whatItUnblocks: ["Chronology finalization", "Demand draft"],
    whoIsWaiting: ["Marcus Williams (attorney)"],
    deadlineRiskScore: 0.52,
    contradictionSeverityScore: 0.91,
    lowConfidenceScore: 0.39,
    workUnblockedScore: 0.65,
    partnerUrgencyScore: 0.40,
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 1003,
    title: "Lost wage extraction — Rodriguez matter",
    reviewWorkType: "low_confidence_extraction_review",
    lifecycleState: "triaged",
    matterId: 1,
    priorityScore: 0.52,
    confidence: 0.44,
    exportSafe: false,
    whatThisIs: "AI extracted wage figures from 2 payroll documents but confidence is below threshold",
    whyItsHere: "Extraction confidence 44% — requires human verification before damages calc",
    whatRiskExists: "Incorrect wage figure flows into demand — settlement exposure error",
    whatActionClearsIt: "Paralegal verifies figures against source documents",
    whatsMissing: ["2023 W-2", "YTD pay stubs from Q4"],
    whatItUnblocks: ["Damages calculation", "Demand finalization"],
    deadlineRiskScore: 0.38,
    contradictionSeverityScore: 0.1,
    lowConfidenceScore: 0.91,
    workUnblockedScore: 0.55,
    partnerUrgencyScore: 0.25,
    createdAt: new Date(Date.now() - 30 * 3600000).toISOString(),
  },
  {
    id: 1004,
    title: "Expert report — Safe to send to carrier",
    reviewWorkType: "safe_to_send_review",
    lifecycleState: "approved",
    matterId: 2,
    priorityScore: 0.62,
    confidence: 0.93,
    exportSafe: true,
    sendSafe: true,
    whatThisIs: "IME report from Dr. Thompson cleared for transmission to carrier counsel",
    whyItsHere: "Approved and export-safe — ready to move to export queue",
    whatActionClearsIt: "Generate export packet and send",
    deadlineRiskScore: 0.60,
    contradictionSeverityScore: 0,
    lowConfidenceScore: 0,
    workUnblockedScore: 0.50,
    partnerUrgencyScore: 0.55,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 1005,
    title: "Medicare lien — verification needed before settlement",
    reviewWorkType: "recovery_lien_review",
    lifecycleState: "needs_evidence",
    matterId: 1,
    priorityScore: 0.44,
    confidence: 0.70,
    exportSafe: false,
    whatThisIs: "Medicare secondary payer compliance review pending final lien figure",
    whyItsHere: "Lien holder has not confirmed final reduction — cannot close without clearance",
    whatsMissing: ["Medicare lien reduction letter", "BCRC final demand"],
    whatRiskExists: "Settlement disbursement without lien clearance triggers federal MSP liability",
    whatActionClearsIt: "Receive and confirm Medicare final demand letter",
    blockedReason: "Waiting on Medicare reduction letter from BCRC",
    deadlineRiskScore: 0.35,
    contradictionSeverityScore: 0,
    lowConfidenceScore: 0.30,
    workUnblockedScore: 0.70,
    partnerUrgencyScore: 0.60,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

const QUEUE_TABS = [
  { id: "my-queue", label: "My Queue", icon: ClipboardList, color: "#d4a054" },
  { id: "team-queue", label: "Team Queue", icon: Users, color: "#4a90b8" },
  { id: "high-risk", label: "High Risk", icon: AlertTriangle, color: "#c45a4a" },
  { id: "low-confidence", label: "Low Confidence", icon: TrendingUp, color: "#d4a054" },
  { id: "contradiction", label: "Contradictions", icon: Layers, color: "#c45a4a" },
  { id: "needs-attorney", label: "Needs Attorney", icon: Scale, color: "#8b7ac8" },
  { id: "needs-partner", label: "Needs Partner", icon: ShieldAlert, color: "#8b7ac8" },
  { id: "ready-to-export", label: "Ready to Export", icon: FileDown, color: "#4a90b8" },
  { id: "blocked", label: "Blocked", icon: Ban, color: "#c45a4a" },
];

function QueuePanel({ queueId }: { queueId: string }) {
  const myQ = useMyReviewQueue();
  const teamQ = useTeamReviewQueue();
  const highRiskQ = useHighRiskQueue();
  const lowConfQ = useLowConfidenceQueue();
  const contradictionQ = useContradictionQueue();
  const attorneyQ = useNeedsAttorneyQueue();
  const partnerQ = useNeedsPartnerQueue();
  const exportQ = useReadyToExportQueue();
  const blockedQ = useBlockedQueue();

  const qMap: Record<string, { data: any; isLoading: boolean }> = {
    "my-queue": myQ,
    "team-queue": teamQ,
    "high-risk": highRiskQ,
    "low-confidence": lowConfQ,
    contradiction: contradictionQ,
    "needs-attorney": attorneyQ,
    "needs-partner": partnerQ,
    "ready-to-export": exportQ,
    blocked: blockedQ,
  };

  const q = qMap[queueId] ?? myQ;
  const isLive = !!q.data?.items;
  const items = isLive ? q.data.items : DEMO_ITEMS.filter(i => {
    if (queueId === "my-queue" || queueId === "team-queue") return true;
    if (queueId === "high-risk") return i.priorityScore >= 0.70;
    if (queueId === "low-confidence") return i.reviewWorkType === "low_confidence_extraction_review";
    if (queueId === "contradiction") return i.reviewWorkType === "contradiction_review";
    if (queueId === "needs-attorney") return i.lifecycleState === "needs_attorney_review";
    if (queueId === "needs-partner") return i.lifecycleState === "needs_partner_review";
    if (queueId === "ready-to-export") return i.lifecycleState === "approved" && i.exportSafe;
    if (queueId === "blocked") return ["blocked", "needs_evidence"].includes(i.lifecycleState);
    return true;
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-mono">{items.length} items</span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"}`}>
          {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {isLive ? "LIVE" : "DEMO"}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <p className="text-xs text-slate-500">Queue is clear</p>
        </div>
      ) : (
        items.map((item: any) => <ReviewCard key={item.id} item={item} />)
      )}
    </div>
  );
}

export default function ReviewDeskPage() {
  const [activeQueue, setActiveQueue] = useState("my-queue");
  const overviewQ = useReviewDeskOverview();
  const overview = overviewQ.data;

  const kpis = [
    { label: "Active Items", value: overview?.totalActive ?? DEMO_ITEMS.length, color: "#d4a054" },
    { label: "High Priority", value: overview?.highPriority ?? DEMO_ITEMS.filter(i => i.priorityScore >= 0.70).length, color: "#c45a4a" },
    { label: "SLA Breaches", value: overview?.slaBreaches ?? 0, color: "#c45a4a" },
    { label: "Avg Age (hrs)", value: overview?.avgAgeHours ?? "—", color: "#4a90b8" },
  ];

  return (
    <div className="flex h-full">
      <aside className="w-[200px] border-r border-white/[0.06] flex flex-col" style={{ background: "#0a0f18" }}>
        <div className="p-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#d4a054]" />
            <span className="text-xs font-semibold text-slate-200">Review Desk</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Managed review operations</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {QUEUE_TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveQueue(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${activeQueue === t.id ? "bg-white/[0.08] text-slate-100" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeQueue === t.id ? t.color : undefined }} />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-100">
              {QUEUE_TABS.find(t => t.id === activeQueue)?.label ?? "Review Desk"}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-3">
            {kpis.map(k => (
              <div key={k.label} className="rounded border border-white/[0.06] px-3 py-1.5 text-center" style={{ background: "#0c1220" }}>
                <div className="text-base font-semibold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[9px] text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <QueuePanel queueId={activeQueue} />
      </main>
    </div>
  );
}
