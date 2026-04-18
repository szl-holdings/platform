import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Pause, Play, RotateCcw,
  AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDecisionEngine } from "@/hooks/useDecisionEngine";
import type { EngineState } from "@/hooks/useDecisionEngine";
import { LOOP_STAGES, DEMO_SCENARIO } from "./scenarios";
import type { StageId } from "./scenarios";
import { SignalStage } from "./stages/signal";
import { ContextStage } from "./stages/context";
import { RecommendationStage } from "./stages/recommendation";
import { SimulationStage } from "./stages/simulation";
import { PolicyStage } from "./stages/policy";
import { ExecutionStage } from "./stages/execution";
import { ProofStage } from "./stages/proof";
import { OutcomeStage } from "./stages/outcome";
import { LearningStage } from "./stages/learning";

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

export default function DecisionTheater() {
  const [currentStage, setCurrentStage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const engine = useDecisionEngine();

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

        <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{DEMO_SCENARIO.title}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{DEMO_SCENARIO.description}</p>
            </div>
          </div>
        </div>

        <StageProgressBar currentStage={currentStage} stages={LOOP_STAGES} onStageClick={setCurrentStage} />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={stage.id}
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
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">{stage.label}</h3>
            </div>
          </div>

          <StageComponent engine={engine} />
        </m.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <button
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
