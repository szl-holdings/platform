import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Activity, Shield, ChevronDown, ChevronUp, Target } from "lucide-react";
import { predictions, type Prediction } from "@/data/brokerage";
import { RiskBadge, ConfidenceBadge, formatCurrency } from "@/components/brokerage-ui";
import { cn } from "@szl-holdings/shared-ui/utils";
import { InlineFeedbackBar } from "@szl-holdings/shared-ui";
import { useState } from "react";

function ProbabilityRing({ value, size = 80 }: { value: number; size?: number }) {
  const pct = Math.round(value * 100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(30,45,69,0.8)" strokeWidth="6" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 40 40)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-display font-bold text-terra-text">{pct}%</span>
      </div>
    </div>
  );
}

function AssumptionList({ items, label }: { items: string[]; label: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-terra-text-secondary">
            <span className="w-1 h-1 rounded-full bg-terra-primary mt-1.5 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CloseLikelihoodPanel({ pred }: { pred: Prediction }) {
  const [open, setOpen] = useState(true);
  const cl = pred.closeLikelihood;
  return (
    <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-terra-surface-hover transition-colors">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-terra-primary" />
          <div className="text-left">
            <p className="font-display font-bold text-terra-text">Close Likelihood</p>
            <p className="text-[10px] text-terra-text-muted">Probability · Rationale · Assumptions · Risks · Next Action</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProbabilityRing value={cl.probability} size={56} />
          {open ? <ChevronUp className="w-4 h-4 text-terra-text-muted" /> : <ChevronDown className="w-4 h-4 text-terra-text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-terra-border space-y-4 pt-4">
          <div>
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Rationale</p>
            <p className="text-xs text-terra-text-secondary leading-relaxed bg-terra-surface border border-terra-border rounded-lg p-3">{cl.rationale}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AssumptionList items={cl.assumptions} label="Assumptions" />
            <AssumptionList items={cl.risks} label="Risks" />
            <div>
              <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Next Action</p>
              <div className="rounded-lg bg-terra-primary/10 border border-terra-primary/20 p-3">
                <p className="text-xs text-terra-primary font-semibold leading-relaxed">→ {cl.nextAction}</p>
                <p className="text-[10px] text-terra-text-muted mt-1.5">{cl.nextActionOwner} · Due {cl.nextActionDue}</p>
              </div>
            </div>
          </div>
          <ConfidenceBadge value={cl.probability} />
          <div className="pt-2 border-t border-terra-border/40">
            <InlineFeedbackBar
              recommendationKey={`terra-close-likelihood-${pred.id}`}
              domain="real_estate"
              recommendationText={cl.nextAction}
              apiBaseUrl="/api"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PricingConfidencePanel({ pred }: { pred: Prediction }) {
  const [open, setOpen] = useState(false);
  const pc = pred.pricingConfidence;
  return (
    <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-terra-surface-hover transition-colors">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div className="text-left">
            <p className="font-display font-bold text-terra-text">Pricing Confidence</p>
            <p className="text-[10px] text-terra-text-muted">Price band · Over/under-pricing risk · Recommendation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-terra-text-muted">Est. Value</p>
            <p className="text-sm font-bold text-terra-text">{formatCurrency(pc.band.estimate)}</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-terra-text-muted" /> : <ChevronDown className="w-4 h-4 text-terra-text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-terra-border space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-terra-text-muted">Price Band</p>
              <p className="text-sm font-semibold text-terra-text">{formatCurrency(pc.band.low)} – {formatCurrency(pc.band.high)}</p>
            </div>
            <div>
              <p className="text-[10px] text-terra-text-muted">Overpricing Risk</p>
              <RiskBadge level={pc.riskOfOverpricing} />
            </div>
            <div>
              <p className="text-[10px] text-terra-text-muted">Underpricing Risk</p>
              <RiskBadge level={pc.riskOfUnderpricing} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Recommendation</p>
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 font-semibold">{pc.recommendation}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Rationale</p>
            <p className="text-xs text-terra-text-secondary leading-relaxed">{pc.rationale}</p>
          </div>
          <AssumptionList items={pc.assumptions} label="Assumptions" />
          <div className="pt-2 border-t border-terra-border/40">
            <InlineFeedbackBar
              recommendationKey={`terra-pricing-confidence-${pred.id}`}
              domain="real_estate"
              recommendationText={pc.recommendation}
              apiBaseUrl="/api"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StallRiskPanel({ pred }: { pred: Prediction }) {
  const [open, setOpen] = useState(true);
  const sr = pred.stallRisk;
  return (
    <div className={cn("rounded-xl border overflow-hidden",
      sr.riskLevel === "critical" ? "border-red-500/40" :
      sr.riskLevel === "high" ? "border-rose-500/30" :
      sr.riskLevel === "medium" ? "border-amber-500/30" : "border-terra-border"
    )}>
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-terra-surface-hover transition-colors bg-terra-surface/50">
        <div className="flex items-center gap-3">
          <AlertTriangle className={cn("w-5 h-5",
            sr.riskLevel === "critical" ? "text-red-400" :
            sr.riskLevel === "high" ? "text-rose-400" :
            sr.riskLevel === "medium" ? "text-amber-400" : "text-emerald-400"
          )} />
          <div className="text-left">
            <p className="font-display font-bold text-terra-text">Stall Risk Prediction</p>
            <p className="text-[10px] text-terra-text-muted">Bottleneck · Delay window · Recovery recommendation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={sr.riskLevel} />
          {open ? <ChevronUp className="w-4 h-4 text-terra-text-muted" /> : <ChevronDown className="w-4 h-4 text-terra-text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-terra-border/50 space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-terra-text-muted">Bottleneck Stage</p>
              <p className="text-sm font-semibold text-terra-text capitalize">{sr.bottleneckStage}</p>
            </div>
            <div>
              <p className="text-[10px] text-terra-text-muted">Delay Window</p>
              <p className="text-sm font-semibold text-terra-text">{sr.delayWindowDays === 0 ? "Already delayed" : `${sr.delayWindowDays} days`}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Recovery Recommendation</p>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 font-semibold leading-relaxed">{sr.recoveryRecommendation}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Rationale</p>
            <p className="text-xs text-terra-text-secondary leading-relaxed">{sr.rationale}</p>
          </div>
          <AssumptionList items={sr.triggerFactors} label="Trigger Factors" />
          <div className="pt-2 border-t border-terra-border/40">
            <InlineFeedbackBar
              recommendationKey={`terra-stall-risk-${pred.id ?? pred.dealAddress}`}
              domain="real_estate"
              recommendationText={sr.recoveryRecommendation}
              apiBaseUrl="/api"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DealHealthSummary({ pred }: { pred: Prediction }) {
  const dh = pred.dealHealth;
  const urgencyConfig = {
    normal: { label: "Normal", color: "text-emerald-400" },
    elevated: { label: "Elevated Urgency", color: "text-amber-400" },
    critical: { label: "Critical Urgency", color: "text-rose-400" },
  }[dh.urgencyLevel];
  return (
    <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-violet-400" />
        <h3 className="font-display font-bold text-terra-text">Deal Health</h3>
        <div className="flex items-center gap-2 ml-auto">
          <span className={cn("text-xs font-semibold", urgencyConfig.color)}>{urgencyConfig.label}</span>
          <div className={cn("w-24 h-1.5 bg-terra-border rounded-full overflow-hidden")}>
            <div className={cn("h-full rounded-full", dh.score >= 75 ? "bg-emerald-500" : dh.score >= 50 ? "bg-amber-500" : "bg-rose-500")}
              style={{ width: `${dh.score}%` }} />
          </div>
          <span className={cn("text-sm font-bold", dh.score >= 75 ? "text-emerald-400" : dh.score >= 50 ? "text-amber-400" : "text-rose-400")}>{dh.score}</span>
        </div>
      </div>
      <p className="text-xs text-terra-text-secondary leading-relaxed mb-3">{dh.summary}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-terra-text-muted">Timeline Confidence:</span>
        <ConfidenceBadge value={dh.timelineConfidence} />
      </div>
      {dh.missingDependencies.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-1.5">Missing Dependencies</p>
          <div className="flex flex-wrap gap-1.5">
            {dh.missingDependencies.map((dep, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{dep}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PredictionView({ pred }: { pred: Prediction }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h3 className="font-display font-bold text-terra-text text-lg">{pred.dealAddress}</h3>
          <p className="text-xs text-terra-text-muted">Agent: {pred.agentName} · Generated {new Date(pred.generatedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <DealHealthSummary pred={pred} />
      <CloseLikelihoodPanel pred={pred} />
      <StallRiskPanel pred={pred} />
      <PricingConfidencePanel pred={pred} />
    </div>
  );
}

export default function PredictionsPage() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Brain className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-display font-bold text-terra-text">Alloy Intelligence</h1>
        </div>
        <p className="text-sm text-terra-text-secondary">Close likelihood · Pricing confidence · Stall risk · Deal health — no black boxes. Every output shows confidence, rationale, assumptions, and next action.</p>
      </motion.div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/10">
        <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <p className="text-xs text-violet-300">
          <span className="font-semibold">Alloy Explainability Standard:</span> Every AI output below includes probability, confidence score, rationale, assumptions, risk factors, and a specific recommended next action with owner and due date.
        </p>
      </div>

      <div className="flex gap-2">
        {predictions.map((pred, i) => (
          <button key={pred.id} onClick={() => setSelected(i)}
            className={cn("flex-1 px-4 py-3 rounded-xl border text-left transition-all",
              selected === i ? "border-violet-500/50 bg-violet-500/10" : "border-terra-border bg-terra-surface/50 hover:border-terra-border-hover"
            )}>
            <p className="text-xs font-semibold text-terra-text truncate">{pred.dealAddress.split(",")[0]}</p>
            <p className="text-[10px] text-terra-text-muted mt-0.5">{pred.agentName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn("text-xs font-bold",
                pred.closeLikelihood.probability >= 0.7 ? "text-emerald-400" :
                pred.closeLikelihood.probability >= 0.5 ? "text-amber-400" : "text-rose-400"
              )}>{Math.round(pred.closeLikelihood.probability * 100)}% close</span>
              <RiskBadge level={pred.stallRisk.riskLevel} />
            </div>
          </button>
        ))}
      </div>

      <PredictionView pred={predictions[selected]} />
    </div>
  );
}
