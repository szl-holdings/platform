import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Pause, Play, RotateCcw,
  AlertTriangle, Loader2, Database, Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDecisionEngine } from "@/hooks/useDecisionEngine";
import type { EngineState } from "@/hooks/useDecisionEngine";
import { useLiveTheaterData } from "@/hooks/useLiveTheaterData";
import type { LiveMetrics, LiveRecommendation, LiveAuditRecord } from "@/hooks/useLiveTheaterData";
import { LOOP_STAGES, DEMO_SCENARIO } from "./scenarios";
import type { StageId } from "./scenarios";
import { SignalStage, LiveSignalStage } from "./stages/signal";
import { ContextStage, LiveContextStage } from "./stages/context";
import { RecommendationStage, LiveRecommendationStage } from "./stages/recommendation";
import { SimulationStage } from "./stages/simulation";
import { PolicyStage } from "./stages/policy";
import { ExecutionStage } from "./stages/execution";
import { ProofStage, LiveProofStage } from "./stages/proof";
import { OutcomeStage } from "./stages/outcome";
import { LearningStage } from "./stages/learning";
import { LiveDataBanner } from "./helpers";

type DataMode = "demo" | "live";

function StageProgressBar({ currentStage, stages, onStageClick }: {
  currentStage: number;
  stages: typeof LOOP_STAGES;
  onStageClick: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = idx === currentStage;
        const isCompleted = idx < currentStage;
        return (
          <button
            key={stage.id}
            onClick={() => onStageClick(idx)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 border",
              isActive
                ? "border-current bg-current/10 text-foreground"
                : isCompleted
                ? "border-transparent bg-muted/20 text-muted-foreground"
                : "border-transparent text-muted-foreground/50 hover:text-muted-foreground"
            )}
            style={isActive ? { borderColor: `${stage.color}40`, background: `${stage.color}12`, color: stage.color } : undefined}
          >
            <Icon className="w-3.5 h-3.5" style={isActive || isCompleted ? { color: stage.color } : undefined} />
            <span className="hidden sm:inline">{stage.label}</span>
            {idx < stages.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function LiveGenericStage({ stageId, metrics }: { stageId: StageId; metrics: LiveMetrics | null }) {
  if (!metrics) return <p className="text-sm text-muted-foreground">Loading live data…</p>;
  const metricItems = [
    { label: "AI Recommendations", value: metrics.alloy.total_recommendations.toLocaleString(), color: "#ec4899" },
    { label: "Workflow Runs (30d)", value: metrics.alloy.workflow_runs_30d.toLocaleString(), color: "#8b5cf6" },
    { label: "Distress Properties", value: metrics.beacon.total_distress_properties.toLocaleString(), color: "#10b981" },
    { label: "Open Vulnerabilities", value: metrics.firestorm.open_vulnerabilities.toLocaleString(), color: "#ef4444" },
    { label: "Audit Events (30d)", value: metrics.platform.audit_events_30d.toLocaleString(), color: "#14b8a6" },
    { label: "Active Leads", value: metrics.beacon.total_leads.toLocaleString(), color: "#f59e0b" },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground capitalize">Live platform telemetry for {stageId} stage — real metrics from the SZL Holdings platform.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metricItems.map((item, i) => (
          <m.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
            className="rounded-xl border border-border/40 bg-card/60 p-4 text-center"
          >
            <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
            <p className="text-xl font-bold font-display" style={{ color: item.color }}>{item.value}</p>
          </m.div>
        ))}
      </div>
    </div>
  );
}

const STAGE_COMPONENTS: Record<StageId, React.FC<{ engine: EngineState }>> = {
  signal: SignalStage,
  context: ContextStage,
  recommendation: RecommendationStage,
  simulation: SimulationStage,
  policy: PolicyStage,
  execution: ExecutionStage,
  proof: ProofStage,
  outcome: OutcomeStage,
  learning: LearningStage,
};

function LiveStageRouter({ stageId, metrics, recommendations, auditRecords, auditTotal, engine }: {
  stageId: StageId;
  metrics: LiveMetrics | null;
  recommendations: LiveRecommendation[];
  auditRecords: LiveAuditRecord[];
  auditTotal: number;
  engine: EngineState;
}) {
  switch (stageId) {
    case "signal":
      return <LiveSignalStage metrics={metrics} />;
    case "context":
      return <LiveContextStage metrics={metrics} recommendations={recommendations} />;
    case "recommendation":
      return <LiveRecommendationStage recommendations={recommendations} />;
    case "proof":
      return <LiveProofStage auditRecords={auditRecords} auditTotal={auditTotal} metrics={metrics} />;
    default: {
      if (metrics) return <LiveGenericStage stageId={stageId} metrics={metrics} />;
      const FallbackStage = STAGE_COMPONENTS[stageId];
      return <FallbackStage engine={engine} />;
    }
  }
}

export default function DecisionTheater() {
  const [currentStage, setCurrentStage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("demo");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const engine = useDecisionEngine();
  const liveData = useLiveTheaterData(dataMode === "live");

  const stage = LOOP_STAGES[currentStage]!;
  const StageComponent = STAGE_COMPONENTS[stage.id];

  const goNext = useCallback(() => {
    setCurrentStage((prev) => (prev < LOOP_STAGES.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStage((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const resetDemo = useCallback(() => {
    setCurrentStage(0);
    setDemoMode(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (demoMode) {
      intervalRef.current = setInterval(() => {
        setCurrentStage((prev) => {
          if (prev >= LOOP_STAGES.length - 1) {
            setDemoMode(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 6000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [demoMode]);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold font-display">Decision Theater</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              The canonical governed decision loop — Signal to Learning, nine steps, every domain
            </p>
          </div>
          <div className="flex items-center gap-2">
            {engine.status === "running" && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initializing engines...
              </span>
            )}

            <div className="flex items-center rounded-lg border border-border/30 bg-muted/10 p-0.5 gap-0.5">
              <button
                onClick={() => setDataMode("demo")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all",
                  dataMode === "demo"
                    ? "bg-muted/40 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Database className="w-3 h-3" />
                Demo
              </button>
              <button
                onClick={() => setDataMode("live")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all",
                  dataMode === "live"
                    ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wifi className="w-3 h-3" />
                Live
              </button>
            </div>

            <button
              onClick={() => {
                if (demoMode) {
                  setDemoMode(false);
                } else {
                  setCurrentStage(0);
                  setDemoMode(true);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                demoMode
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
              )}
              title={demoMode ? "Pause guided demo" : "Start guided demo"}
            >
              {demoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {demoMode ? "Pause" : "Guided Demo"}
            </button>
            <button
              onClick={resetDemo}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {dataMode === "demo" && (
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">{DEMO_SCENARIO.title}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{DEMO_SCENARIO.description}</p>
              </div>
            </div>
          </div>
        )}

        {dataMode === "live" && (
          <LiveDataBanner
            status={liveData.status}
            lastFetchedAt={liveData.lastFetchedAt}
            onRefresh={liveData.refetch}
          />
        )}

        <StageProgressBar currentStage={currentStage} stages={LOOP_STAGES} onStageClick={setCurrentStage} />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={`${stage.id}-${dataMode}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stage.color}20` }}>
              <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>Step {currentStage + 1} of 9</span>
                {demoMode && (
                  <span className="text-[9px] text-muted-foreground animate-pulse">Auto-advancing in 6s…</span>
                )}
                {dataMode === "live" && liveData.status === "success" && (
                  <m.span
                    className="flex items-center gap-1 text-[9px] font-bold text-emerald-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    ● LIVE
                  </m.span>
                )}
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">{stage.label}</h3>
            </div>
          </div>

          {dataMode === "live" ? (
            <LiveStageRouter
              stageId={stage.id}
              metrics={liveData.metrics}
              recommendations={liveData.recommendations}
              auditRecords={liveData.auditRecords}
              auditTotal={liveData.auditTotal}
              engine={engine}
            />
          ) : (
            <StageComponent engine={engine} />
          )}
        </m.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <button
          data-testid="nav-prev"
          onClick={goPrev}
          disabled={currentStage === 0}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
            currentStage === 0
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStage > 0 ? LOOP_STAGES[currentStage - 1]!.label : "Previous"}
        </button>

        <div className="flex items-center gap-1">
          {LOOP_STAGES.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                idx === currentStage ? "bg-foreground w-3" : idx < currentStage ? "bg-muted-foreground/50" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>

        <button
          data-testid="nav-next"
          onClick={goNext}
          disabled={currentStage === LOOP_STAGES.length - 1}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
            currentStage === LOOP_STAGES.length - 1
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-foreground bg-muted/20 hover:bg-muted/30"
          )}
        >
          {currentStage < LOOP_STAGES.length - 1 ? LOOP_STAGES[currentStage + 1]!.label : "Complete"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </m.div>
  );
}
