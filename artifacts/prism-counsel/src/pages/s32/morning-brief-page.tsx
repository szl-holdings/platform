import { useState } from "react";
import { Bell, TrendingUp, TrendingDown, Clock, AlertTriangle, FileText, MessageSquare, ChevronRight, Zap, Building2, Eye, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS } from "../../data/demo-matters";

const BRIEF_DATA = {
  asOf: new Date().toISOString(),
  attorney: "Sarah Chen",
  pressureShifts: [
    { matter: "Rodriguez v. National General", shift: "rising", label: "Insurer pressure up 6% — carrier response lag now 21 days", severity: "high" },
    { matter: "Vasquez v. GEICO", shift: "rising", label: "Settlement pressure rising — mediation in 19 days, no memo drafted", severity: "critical" },
    { matter: "Chen v. Allstate", shift: "falling", label: "Evidence pressure easing — IME report received and processed", severity: "info" },
  ],
  deadlineClusters: [
    { window: "Next 3 days", items: ["Interrogatory responses — Rodriguez", "Motion to compel — Vasquez"] },
    { window: "Next 2 weeks", items: ["Expert disclosure — Chen", "Mediation packet — Vasquez", "Summary judgment response — Kim"] },
  ],
  newRecords: [
    { matter: "Rodriguez v. National General", record: "IME report from Dr. Whitmore — orthopedic evaluation", type: "medical_record" },
    { matter: "Chen v. Allstate", record: "Carrier reserve increase notification — $28K raised to $41K", type: "communication" },
    { matter: "Park v. Liberty Mutual", record: "Updated medical billing summary — Queens Medical Center", type: "medical_record" },
  ],
  frictionSources: [
    { type: "carrier_silence", label: "Park v. Liberty Mutual — no carrier response in 18 days", severity: "high" },
    { type: "missing_records", label: "Rodriguez — 2 provider records outstanding for 14 days", severity: "medium" },
    { type: "lien_drag", label: "Kim v. Progressive — Medicare lien unresolved, blocking settlement", severity: "medium" },
  ],
  recommendedFirstActions: [
    { label: "Review reserve increase — Rodriguez", reason: "Carrier softening posture. Update demand strategy before mediation.", minutes: 10, href: "/matter-desk/1" },
    { label: "Clear interrogatory responses — Rodriguez", reason: "2-day deadline. 80% drafted. Requires final review and approval.", minutes: 20, href: "/review-before-send" },
    { label: "Draft mediation memo — Vasquez", reason: "Mediation in 19 days with no memo started. High leverage window.", minutes: 30, href: "/prep/mediation" },
    { label: "Escalate carrier silence — Park", reason: "18 days without response exceeds firm threshold. Escalation warranted.", minutes: 5, href: "/matter-desk/4" },
  ],
  quietRisks: [
    { matter: "Kim v. Progressive", risk: "SOL approaching in 45 days — matter appears quiet but filing must occur", severity: "critical" },
    { matter: "Park v. Liberty Mutual", risk: "No carrier communication in 18 days — silence pattern escalation needed", severity: "high" },
  ],
};

export default function MorningBriefPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-lg border border-[#d4a054]/20 p-5" style={{ background: "linear-gradient(135deg, #0c1220, #0f1a2a)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#d4a054]" />
            <span className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Morning Brief</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{today}</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Good morning, {BRIEF_DATA.attorney.split(" ")[0]}.</h1>
        <p className="text-sm text-slate-400">
          {BRIEF_DATA.pressureShifts.filter(p => p.severity === "critical" || p.severity === "high").length} matters need your attention today.
          {" "}{BRIEF_DATA.deadlineClusters[0].items.length} deadlines in the next 3 days.
          {" "}{BRIEF_DATA.quietRisks.length} matters appear quiet but carry risk.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BriefSection title="Pressure Shifts" icon={<TrendingUp className="w-3.5 h-3.5 text-[#c45a4a]" />}>
          {BRIEF_DATA.pressureShifts.map((p, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <div className="mt-0.5 flex-shrink-0">
                {p.shift === "rising" ? (
                  <TrendingUp className={`w-3 h-3 ${p.severity === "critical" ? "text-[#c45a4a]" : "text-[#d4a054]"}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#4a90b8]" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-200">{p.matter.split(" v. ")[0]}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.label}</div>
              </div>
            </div>
          ))}
        </BriefSection>

        <BriefSection title="Deadline Clusters" icon={<Clock className="w-3.5 h-3.5 text-[#c45a4a]" />}>
          {BRIEF_DATA.deadlineClusters.map((cluster, i) => (
            <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{cluster.window}</div>
              {cluster.items.map((item, j) => (
                <div key={j} className="flex items-center gap-1.5 py-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                  <span className="text-[11px] text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          ))}
        </BriefSection>

        <BriefSection title="New Records Arrived" icon={<FileText className="w-3.5 h-3.5 text-[#4a90b8]" />}>
          {BRIEF_DATA.newRecords.map((r, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <FileText className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-slate-200">{r.matter.split(" v. ")[0]}</div>
                <div className="text-[10px] text-slate-400">{r.record}</div>
                <div className="text-[9px] text-slate-600 capitalize mt-0.5">{r.type.replace(/_/g, " ")}</div>
              </div>
            </div>
          ))}
        </BriefSection>

        <BriefSection title="Friction Sources" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />}>
          {BRIEF_DATA.frictionSources.map((f, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${f.severity === "high" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.type.replace(/_/g, " ")}</div>
                <div className="text-[11px] text-slate-300">{f.label}</div>
              </div>
            </div>
          ))}
        </BriefSection>
      </div>

      <BriefSection title="Quiet but Dangerous" icon={<Eye className="w-3.5 h-3.5 text-[#c45a4a]" />}>
        <div className="grid grid-cols-2 gap-3">
          {BRIEF_DATA.quietRisks.map((q, i) => (
            <div key={i} className="rounded border border-[#c45a4a]/20 p-3" style={{ background: "#1a0c0c" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${q.severity === "critical" ? "bg-[#c45a4a] animate-pulse" : "bg-[#d4a054]"}`} />
                <span className="text-[11px] font-medium text-slate-200">{q.matter.split(" v. ")[0]}</span>
              </div>
              <p className="text-[10px] text-slate-400">{q.risk}</p>
            </div>
          ))}
        </div>
      </BriefSection>

      <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[#d4a054]" />
          <span className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Recommended First Actions</span>
        </div>
        <div className="space-y-2">
          {BRIEF_DATA.recommendedFirstActions.map((a, i) => (
            <Link key={i} href={a.href}>
              <div className="flex items-center gap-3 p-3 rounded border border-white/[0.04] hover:border-white/[0.10] cursor-pointer transition-colors" style={{ background: "#080c14" }}>
                <div className="w-5 h-5 rounded-full border border-[#d4a054]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-semibold text-[#d4a054]">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200">{a.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{a.reason}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">{a.minutes}m</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function BriefSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
