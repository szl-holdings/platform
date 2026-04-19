import { useState } from "react";

import { Brain, CheckCircle, AlertTriangle, XCircle, FileText, Tag, ChevronDown, ChevronUp, Play, Shield } from "lucide-react";
import { HelpTip } from "@szl-holdings/shared-ui/onboarding";
import { useStandardMutation } from "@szl-holdings/api-client-react";

const ACCENT = "#40856a";
const API = "/api";

async function runUnderwritingCopilot(params: Record<string, unknown>) {
  const res = await fetch(`${API}/terra/cognitive/underwriting-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  return json.data ?? json;
}

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? "#40856a" : value >= 0.65 ? "#c8a060" : "#c04a2a";
  const label = value >= 0.85 ? "High" : value >= 0.65 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function StepCard({ step, index }: { step: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = step.passed
    ? step.flag ? AlertTriangle : CheckCircle
    : XCircle;
  const statusColor = step.passed ? (step.flag ? "#c8a060" : ACCENT) : "#c04a2a";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${statusColor}25` }}>
      <div
        className="p-4 flex items-start gap-3 cursor-pointer"
        style={{ background: `${statusColor}06` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
          <div className="text-[9px] font-mono w-5 h-5 rounded-full flex items-center justify-center font-bold"
            style={{ background: `${statusColor}20`, color: statusColor }}>
            {index + 1}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: statusColor }} />
            <span className="text-sm font-semibold" style={{ color: "#e8edf8" }}>{step.label}</span>
            {step.flag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "#c8a06020", color: "#c8a060" }}>
                Flag
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{step.finding}</p>
          {step.flag && (
            <div className="mt-2 flex items-start gap-1.5 text-[10px]" style={{ color: "#c8a060" }}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {step.flag}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
        </div>
      </div>
      {expanded && step.citations?.length > 0 && (
        <div className="p-4 space-y-2" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Citations</div>
          {step.citations.map((c: any, i: number) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
              <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium" style={{ color: "#e8edf8" }}>{c.source}</span>
                  <ConfidencePill value={c.confidence} />
                </div>
                <div className="text-[10px] mt-0.5 italic" style={{ color: "rgba(255,255,255,0.4)" }}>{c.excerpt}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const VERDICT_CONFIG: Record<string, { color: string; Icon: typeof CheckCircle }> = {
  PROCEED: { color: "#40856a", Icon: CheckCircle },
  "PROCEED WITH CONDITIONS": { color: "#c8a060", Icon: AlertTriangle },
  "HOLD FOR REVIEW": { color: "#c04a2a", Icon: XCircle },
};

export default function UnderwritingCopilotPage() {
  const [form, setForm] = useState({
    propertyId: "",
    dealType: "acquisition",
    purchasePrice: "45000000",
    noiEstimate: "2700000",
    capRate: "6.0",
    ltv: "0.65",
  });

  const mutation = useStandardMutation({
    mutationFn: runUnderwritingCopilot,
  });

  const result = mutation.data;
  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG["HOLD FOR REVIEW"] : null;
  const VerdictIcon = verdictCfg?.Icon ?? CheckCircle;

  function fmt(n: number) {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="flex items-start gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold flex items-center gap-1.5" style={{ color: "#e8edf8" }}>
              Underwriting Copilot
              <HelpTip
                tipId="terra.underwriting-copilot"
                platform="terra"
                title="Underwriting Copilot"
                content="A planner walks each underwriting step (sponsor, market, debt service, sensitivity); a verifier checks every result with citation-backed evidence. Outputs land in the proof chain so the file is review-ready."
                accentColor="#84cc16"
                iconSize={13}
              />
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Governed underwriting flow — planner walks each analysis step, verifier checks each result with citation-backed evidence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
              Deal Parameters
            </div>
            <div className="space-y-3">
              {[
                { key: "propertyId", label: "Property ID / Address", placeholder: "e.g. 245 Park Ave South" },
                { key: "dealType", label: "Deal Type", placeholder: "acquisition / refinance" },
                { key: "purchasePrice", label: "Purchase Price ($)", placeholder: "e.g. 45000000" },
                { key: "noiEstimate", label: "NOI Estimate ($)", placeholder: "e.g. 2700000" },
                { key: "capRate", label: "Market Cap Rate (%)", placeholder: "e.g. 6.0" },
                { key: "ltv", label: "Target LTV (0–1)", placeholder: "e.g. 0.65" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] mb-1 font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.key as keyof typeof form]}
                    placeholder={f.placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e8edf8",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() => mutation.mutate({
                  ...form,
                  purchasePrice: Number(form.purchasePrice),
                  noiEstimate: Number(form.noiEstimate),
                  capRate: Number(form.capRate),
                  ltv: Number(form.ltv),
                })}
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mutation.isPending ? "rgba(64,133,106,0.3)" : ACCENT,
                  color: "white",
                  opacity: mutation.isPending ? 0.7 : 1,
                }}
              >
                {mutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Run Underwriting Copilot
                  </>
                )}
              </button>
            </div>
          </div>

          {result?.metrics && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                Computed Metrics
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Implied Cap Rate", value: `${result.metrics.impliedCapRate}%` },
                  { label: "DSCR", value: `${result.metrics.dscr}x`, warn: result.metrics.dscr < 1.25 },
                  { label: "Cash-on-Cash", value: `${result.metrics.cashOnCash.toFixed(2)}%`, warn: result.metrics.cashOnCash < 7 },
                  { label: "Annual Debt Service", value: fmt(result.metrics.annualDebtService) },
                  { label: "Loan Amount", value: fmt(result.metrics.debtAmount) },
                  { label: "Equity Required", value: fmt(result.metrics.equityRequired) },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-xs py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</span>
                    <span className="font-mono font-semibold" style={{ color: m.warn ? "#c8a060" : "#e8edf8" }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.provenance && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Provenance</span>
                <ConfidencePill value={result.provenance.confidence} />
              </div>
              <div className="text-[10px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{result.provenance.source}</div>
              <div className="text-[9px]" style={{ color: "rgba(64,133,106,0.5)" }}>{result.provenance.traceRef}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{result.provenance.runtime}</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!result && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <Brain className="w-8 h-8 mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Configure deal parameters and run the copilot</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Planner+verifier will walk each underwriting step with citations</div>
            </div>
          )}

          {result && verdictCfg && (
            <>
              <div className="rounded-xl p-4" style={{ background: `${verdictCfg.color}10`, border: `1px solid ${verdictCfg.color}30` }}>
                <div className="flex items-center gap-3">
                  <VerdictIcon className="w-5 h-5" style={{ color: verdictCfg.color }} />
                  <div>
                    <div className="text-lg font-bold" style={{ color: verdictCfg.color }}>{result.verdict}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{result.verdictRationale}</div>
                  </div>
                </div>
                {result.flags?.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${verdictCfg.color}20` }}>
                    <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Active Flags</div>
                    {result.flags.map((f: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] py-1" style={{ color: "#c8a060" }}>
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span><span className="font-semibold">{f.label}:</span> {f.flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {result.steps.map((step: any, i: number) => (
                  <StepCard key={step.step} step={step} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
