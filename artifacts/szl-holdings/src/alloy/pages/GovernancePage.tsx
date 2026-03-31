import { ArrowRight } from "lucide-react";
import { GOVERNANCE_CONTROLS } from "../data/governance";

interface NavProps {
  onNavigate: (page: string) => void;
}

const CATEGORY_ACCENT: Record<string, string> = {
  Approval: "#f59e0b",
  Quality: "#10b981",
  Audit: "#a78bfa",
  Transparency: "#00d4ff",
  Control: "#ef4444",
  Access: "#6366f1",
  Boundaries: "#f472b6",
};

export default function GovernancePage({ onNavigate }: NavProps) {
  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Governance</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Built to orchestrate workflows without losing accountability</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          Alloy's governance layer wraps every workflow in accountability controls. Human approval is not bolted on — it's designed in. Every high-stakes output requires a human decision, every decision is recorded, every rejection is captured.
        </p>
      </div>

      {/* Principle Statement */}
      <div className="mb-14 p-8 rounded-2xl border" style={{ borderColor: "rgba(0,212,255,0.15)", background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(99,102,241,0.04))" }}>
        <div className="md:flex md:gap-12 md:items-center">
          <div className="md:flex-1 mb-6 md:mb-0">
            <h2 className="text-xl font-bold mb-3">The Alloy governance principle</h2>
            <p className="text-white/60 leading-relaxed">
              Automation accelerates work. Governance keeps it accountable. Alloy is designed on the premise that the right place for human judgment is not everywhere — but it must be precisely where it matters.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Confidence signals flag uncertainty. Escalation rules surface exceptions. Role-based controls ensure the right people make the right decisions. And every outcome — approved or rejected — becomes a permanent record.
            </p>
          </div>
          <div className="md:w-72 shrink-0">
            <div className="space-y-3">
              {[
                { label: "Human approval before consequential actions", icon: "✓" },
                { label: "Confidence signals on every output", icon: "✓" },
                { label: "Immutable audit trail on every workflow", icon: "✓" },
                { label: "Rejection records, not just approvals", icon: "✓" },
                { label: "Configurable escalation logic", icon: "✓" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="text-emerald-400 font-bold">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Cards */}
      <div className="mb-14">
        <div className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: "#00d4ff" }}>Governance Controls</div>
        <div className="grid md:grid-cols-2 gap-4">
          {GOVERNANCE_CONTROLS.map(control => {
            const accent = CATEGORY_ACCENT[control.category] ?? "#00d4ff";
            return (
              <div key={control.id} className="p-6 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{control.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white/90 mb-1">{control.name}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${accent}15`, color: accent }}>{control.category}</span>
                  </div>
                </div>

                <p className="text-xs text-white/55 leading-relaxed mb-4">{control.description}</p>

                <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Mechanism</div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{control.mechanism}</p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Applies To</div>
                  <div className="flex flex-wrap gap-1.5">
                    {control.appliesTo.map(a => (
                      <span key={a} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: `${accent}20`, background: `${accent}06`, color: `${accent}80` }}>{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Flow Diagram */}
      <div className="mb-14">
        <div className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: "#00d4ff" }}>Human-in-the-Loop Flow</div>
        <div className="rounded-xl border p-8" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex flex-col md:flex-row items-center gap-3 flex-wrap justify-center">
            {[
              { label: "Alloy Output", sub: "Generated with confidence score", color: "#00d4ff" },
              { label: "→" , sub: "", color: "rgba(255,255,255,0.2)" },
              { label: "Confidence Gate", sub: "Auto-route if above threshold", color: "#3b82f6" },
              { label: "→", sub: "", color: "rgba(255,255,255,0.2)" },
              { label: "Human Review", sub: "Approval agent provides full context", color: "#f59e0b" },
              { label: "↓", sub: "", color: "rgba(255,255,255,0.2)" },
              { label: "Decision Captured", sub: "Approved or rejected with record", color: "#10b981" },
              { label: "→", sub: "", color: "rgba(255,255,255,0.2)" },
              { label: "Audit Trail", sub: "Immutable log entry created", color: "#a78bfa" },
            ].map((node, i) => (
              node.label === "→" || node.label === "↓" ? (
                <div key={i} className="text-xl font-bold" style={{ color: node.color }}>{node.label}</div>
              ) : (
                <div key={i} className="text-center p-4 rounded-lg border min-w-[120px]" style={{ borderColor: `${node.color}30`, background: `${node.color}08` }}>
                  <div className="text-xs font-bold mb-1" style={{ color: node.color }}>{node.label}</div>
                  <div className="text-[10px] text-white/35 leading-tight">{node.sub}</div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(0,212,255,0.15)", background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(99,102,241,0.04))" }}>
        <h3 className="text-xl font-bold mb-3">See governance in context</h3>
        <p className="text-white/50 mb-6">Explore how approval flows integrate with the Workflow Coordinator and Approval Agent.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => onNavigate("agents")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black" style={{ background: "#00d4ff" }}>
            View Agents <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => onNavigate("workflows")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}>
            View Workflows
          </button>
        </div>
      </div>
    </div>
  );
}
