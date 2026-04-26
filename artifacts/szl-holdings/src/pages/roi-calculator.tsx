import { useState, useMemo } from "react";
import { m } from "framer-motion";
import {
  ArrowRight, Clock,
  Zap, CheckCircle2, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const _fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

interface RoiInputs {
  teamSize: number;
  avgSalaryK: number;
  weeklyApprovalHours: number;
  approvalCyclesDays: number;
  signalsMissedMonthly: number;
  incidentResponseHours: number;
  decisionsChallengedMonthly: number;
}

const DEFAULT_INPUTS: RoiInputs = {
  teamSize: 50,
  avgSalaryK: 120,
  weeklyApprovalHours: 8,
  approvalCyclesDays: 4,
  signalsMissedMonthly: 12,
  incidentResponseHours: 6,
  decisionsChallengedMonthly: 3,
};

const PLATFORM_BENCHMARKS = {
  approvalHoursReduction: 0.62,
  cycleTimeReduction: 0.55,
  signalCaptureImprovement: 0.78,
  incidentResponseReduction: 0.48,
  auditTimeReduction: 0.71,
  signalToActionMinutes: 8.4,
  handoffSuccessRate: 0.98,
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  color = "hsl(38,90%,52%)",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  color?: string;
}) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <label style={{ fontSize: "13px", color: "hsl(210,5%,68%)", fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: "14px", fontWeight: 700, color }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: "4px" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
        <span style={{ fontSize: "11px", color: "hsl(210,5%,36%)" }}>{format(min)}</span>
        <span style={{ fontSize: "11px", color: "hsl(210,5%,36%)" }}>{format(max)}</span>
      </div>
    </div>
  );
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function formatHours(h: number) {
  return `${Math.round(h)}h`;
}

export default function RoiCalculatorPage() {
  const __pageMeta = usePageMeta({
    title: "ROI Calculator — SZL Platform | SZL Holdings",
    description: "Calculate the operational value your team recovers with the SZL intelligence platform. Based on actual Pulse EVALS benchmarks and OUTCOME GRAPH data.",
    canonical: "https://szlholdings.com/roi",
  });

  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_INPUTS);

  const set = (key: keyof RoiInputs) => (v: number) => setInputs(prev => ({ ...prev, [key]: v }));

  const roi = useMemo(() => {
    const hourlyRate = (inputs.avgSalaryK * 1000) / 2080;

    const weeklyApprovalWaste = inputs.teamSize * inputs.weeklyApprovalHours * hourlyRate;
    const annualApprovalWaste = weeklyApprovalWaste * 52;
    const approvalRecovery = annualApprovalWaste * PLATFORM_BENCHMARKS.approvalHoursReduction;

    const cycleTimeCostPerDay = inputs.teamSize * 0.1 * hourlyRate * 8;
    const cycleTimeWasteAnnual = inputs.approvalCyclesDays * cycleTimeCostPerDay * 52;
    const cycleTimeRecovery = cycleTimeWasteAnnual * PLATFORM_BENCHMARKS.cycleTimeReduction;

    const signalMissCostAvg = inputs.avgSalaryK * 1000 * 0.02;
    const signalWasteAnnual = inputs.signalsMissedMonthly * signalMissCostAvg * 12;
    const signalRecovery = signalWasteAnnual * PLATFORM_BENCHMARKS.signalCaptureImprovement;

    const incidentCostPerHour = hourlyRate * inputs.teamSize * 0.05;
    const incidentAnnualCost = inputs.incidentResponseHours * incidentCostPerHour * inputs.signalsMissedMonthly * 12;
    const incidentRecovery = incidentAnnualCost * PLATFORM_BENCHMARKS.incidentResponseReduction;

    const auditCostPerDecision = hourlyRate * 4;
    const auditAnnualCost = inputs.decisionsChallengedMonthly * auditCostPerDecision * 12;
    const auditRecovery = auditAnnualCost * PLATFORM_BENCHMARKS.auditTimeReduction;

    const totalRecovery = approvalRecovery + cycleTimeRecovery + signalRecovery + incidentRecovery + auditRecovery;

    const hoursRecoveredWeekly = Math.round(
      (inputs.teamSize * inputs.weeklyApprovalHours * PLATFORM_BENCHMARKS.approvalHoursReduction) +
      (inputs.teamSize * 0.5 * PLATFORM_BENCHMARKS.cycleTimeReduction)
    );

    const paybackWeeks = totalRecovery > 0 ? Math.round((80_000 / (totalRecovery / 52))) : null;

    return {
      approvalRecovery,
      cycleTimeRecovery,
      signalRecovery,
      incidentRecovery,
      auditRecovery,
      totalRecovery,
      hoursRecoveredWeekly,
      paybackWeeks,
      breakdown: [
        { label: "Approval overhead eliminated", value: approvalRecovery, color: "hsl(192,72%,48%)" },
        { label: "Cycle time compression", value: cycleTimeRecovery, color: "hsl(38,90%,52%)" },
        { label: "Signal capture improvement", value: signalRecovery, color: "hsl(142,52%,48%)" },
        { label: "Incident response reduction", value: incidentRecovery, color: "hsl(0,72%,58%)" },
        { label: "Audit & compliance time saved", value: auditRecovery, color: "hsl(280,52%,62%)" },
      ],
    };
  }, [inputs]);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main className="pt-24">
  
          <section style={{ padding: "5rem 0 2rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,90%,52%)", marginBottom: "0.75rem" }}>
                  ROI Proof Calculator
                </p>
                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1rem" }}>
                  What does operational<br />drift cost your team?
                </h1>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "42rem" }}>
                  Benchmarks from Pulse EVALS and OUTCOME GRAPH across the SZL platform. Adjust the inputs for your team to see what you'd recover in year one.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 5rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2.5rem", alignItems: "start" }}>
  
                <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "16px", padding: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "hsl(38,12%,94%)" }}>Your team profile</div>
                    <button
                      onClick={() => setInputs(DEFAULT_INPUTS)}
                      style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "transparent", border: "none", color: "hsl(210,5%,42%)", fontSize: "12px", cursor: "pointer" }}
                    >
                      <RefreshCw size={11} />
                      Reset
                    </button>
                  </div>
  
                  <Slider
                    label="Team size (operators)"
                    value={inputs.teamSize}
                    min={10}
                    max={1000}
                    step={10}
                    onChange={set("teamSize")}
                    format={v => `${v} people`}
                  />
                  <Slider
                    label="Average annual salary (OPS roles)"
                    value={inputs.avgSalaryK}
                    min={60}
                    max={300}
                    step={10}
                    onChange={set("avgSalaryK")}
                    format={v => `$${v}K`}
                    color="hsl(192,72%,48%)"
                  />
                  <Slider
                    label="Hours/week per person in approval overhead"
                    value={inputs.weeklyApprovalHours}
                    min={1}
                    max={20}
                    step={0.5}
                    onChange={set("weeklyApprovalHours")}
                    format={v => `${v}h`}
                    color="hsl(142,52%,48%)"
                  />
                  <Slider
                    label="Average approval cycle time (days)"
                    value={inputs.approvalCyclesDays}
                    min={1}
                    max={14}
                    step={0.5}
                    onChange={set("approvalCyclesDays")}
                    format={v => `${v}d`}
                    color="hsl(38,90%,52%)"
                  />
                  <Slider
                    label="Operational signals missed per month"
                    value={inputs.signalsMissedMonthly}
                    min={0}
                    max={50}
                    step={1}
                    onChange={set("signalsMissedMonthly")}
                    format={v => `${v} signals`}
                    color="hsl(0,72%,58%)"
                  />
                  <Slider
                    label="Avg hours to respond to incidents"
                    value={inputs.incidentResponseHours}
                    min={1}
                    max={24}
                    step={0.5}
                    onChange={set("incidentResponseHours")}
                    format={formatHours}
                    color="hsl(280,52%,62%)"
                  />
                  <Slider
                    label="Decisions challenged/audited per month"
                    value={inputs.decisionsChallengedMonthly}
                    min={0}
                    max={20}
                    step={1}
                    onChange={set("decisionsChallengedMonthly")}
                    format={v => `${v}/mo`}
                    color="hsl(38,90%,52%)"
                  />
                </div>
  
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <m.div
                    key={roi.totalRecovery}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(38,90%,52%)30", borderRadius: "16px", padding: "2rem" }}
                  >
                    <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
                      Estimated Annual Recovery
                    </div>
                    <div style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, color: "hsl(38,90%,52%)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {formatCurrency(roi.totalRecovery)}
                    </div>
                    <div style={{ fontSize: "13px", color: "hsl(210,5%,42%)", marginTop: "0.5rem" }}>
                      per year in recovered operational capacity
                    </div>
                    {roi.paybackWeeks && (
                      <div style={{ marginTop: "1rem", padding: "0.625rem 1rem", borderRadius: "8px", background: "hsl(142,52%,48%)15", border: "1px solid hsl(142,52%,48%)30", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        <CheckCircle2 size={14} style={{ color: "hsl(142,52%,48%)" }} />
                        <span style={{ fontSize: "13px", color: "hsl(142,52%,48%)", fontWeight: 600 }}>
                          Est. payback: {roi.paybackWeeks} weeks
                        </span>
                      </div>
                    )}
                  </m.div>
  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Clock size={14} style={{ color: "hsl(192,72%,48%)" }} />
                        <span style={{ fontSize: "11px", color: "hsl(210,5%,42%)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Hours Recovered/wk</span>
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "hsl(192,72%,48%)", letterSpacing: "-0.02em" }}>{roi.hoursRecoveredWeekly}h</div>
                      <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginTop: "0.25rem" }}>across the team</div>
                    </div>
                    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Zap size={14} style={{ color: "hsl(38,90%,52%)" }} />
                        <span style={{ fontSize: "11px", color: "hsl(210,5%,42%)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Signal → Action</span>
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: "hsl(38,90%,52%)", letterSpacing: "-0.02em" }}>{PLATFORM_BENCHMARKS.signalToActionMinutes}m</div>
                      <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginTop: "0.25rem" }}>median time (platform avg)</div>
                    </div>
                  </div>
  
                  <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.5rem" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,94%)", marginBottom: "1.25rem" }}>Recovery breakdown</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {roi.breakdown.map(item => (
                        <div key={item.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                            <span style={{ fontSize: "12px", color: "hsl(210,5%,58%)" }}>{item.label}</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{formatCurrency(item.value)}</span>
                          </div>
                          <div style={{ height: "4px", borderRadius: "4px", background: "hsl(210,12%,14%)" }}>
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "4px",
                                background: item.color,
                                width: `${Math.min(100, (item.value / roi.totalRecovery) * 100)}%`,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.25rem" }}>
                    <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.75rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
                      Platform benchmarks (Pulse EVALS)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {[
                        { label: "Approval overhead reduction", value: `${Math.round(PLATFORM_BENCHMARKS.approvalHoursReduction * 100)}%` },
                        { label: "Cycle time compression", value: `${Math.round(PLATFORM_BENCHMARKS.cycleTimeReduction * 100)}%` },
                        { label: "Signal capture improvement", value: `${Math.round(PLATFORM_BENCHMARKS.signalCaptureImprovement * 100)}%` },
                        { label: "Handoff success rate", value: `${Math.round(PLATFORM_BENCHMARKS.handoffSuccessRate * 100)}%` },
                      ].map(b => (
                        <div key={b.label} style={{ background: "hsl(210,12%,6%)", borderRadius: "6px", padding: "0.625rem 0.75rem" }}>
                          <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.2rem" }}>{b.label}</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "hsl(142,52%,48%)" }}>{b.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Link href="/packages" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.875rem 1.5rem", borderRadius: "8px", background: "hsl(38,90%,52%)", color: "hsl(210,12%,5%)", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
                      See packages
                      <ArrowRight size={15} />
                    </Link>
                    <Link href="/contact" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.875rem 1.5rem", borderRadius: "8px", border: "1px solid hsl(210,12%,22%)", color: "hsl(38,12%,84%)", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
                      Talk to us
                    </Link>
                  </div>
  
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,36%)", lineHeight: 1.5, textAlign: "center" }}>
                    Estimates based on Pulse EVALS platform benchmarks and OUTCOME GRAPH outcome data. 
                    Individual results vary. Not a financial guarantee.
                  </p>
                </div>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
