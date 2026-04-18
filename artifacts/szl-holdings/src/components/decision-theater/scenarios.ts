import {
  Radio, Layers, Brain, BarChart3, ShieldCheck, Play,
  FileCheck, Target, BookOpen,
} from "lucide-react";

export const LOOP_STAGES = [
  { id: "signal", label: "Signal", icon: Radio, color: "#0ea5e9", description: "Ingest raw signals from domain packs" },
  { id: "context", label: "Context", icon: Layers, color: "#8b5cf6", description: "Correlate across domains" },
  { id: "recommendation", label: "Recommendation", icon: Brain, color: "#ec4899", description: "AI-generated advisory with confidence" },
  { id: "simulation", label: "Simulation", icon: BarChart3, color: "#f59e0b", description: "Monte Carlo scenario analysis" },
  { id: "policy", label: "Policy", icon: ShieldCheck, color: "#10b981", description: "Covenant governance check" },
  { id: "execution", label: "Execution", icon: Play, color: "#6366f1", description: "Governed workflow trigger" },
  { id: "proof", label: "Proof", icon: FileCheck, color: "#14b8a6", description: "Immutable attribution chain" },
  { id: "outcome", label: "Outcome", icon: Target, color: "#ef4444", description: "Measured result vs prediction" },
  { id: "learning", label: "Learning", icon: BookOpen, color: "#f97316", description: "Decision memory & calibration" },
] as const;

export type StageId = (typeof LOOP_STAGES)[number]["id"];

export const DEMO_SCENARIO = {
  title: "Cross-Domain Threat: Port Facility Breach + Vessel Route Deviation",
  description:
    "Aegis detects unauthorized network access at a partner port facility while Vessels flags an AIS anomaly on an approaching tanker. The platform correlates both signals and routes a governed response.",
} as const;
