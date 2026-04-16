import type { ElementType } from "react";
import { Radio, Brain, Zap, Shield, Search, Sparkles } from "lucide-react";

export const API_BASE = "/api";

export type LayerTab = "sense" | "decide" | "act" | "govern" | "search" | "evolve";

export const LAYER_CONFIG: Record<LayerTab, { label: string; icon: ElementType; color: string; description: string }> = {
  sense: { label: "Sense", icon: Radio, color: "text-sky-400", description: "Signal Bus — unified event stream from all domain agents" },
  decide: { label: "Decide", icon: Brain, color: "text-violet-400", description: "Decision Mesh — agent registry, decision journal, orchestration" },
  act: { label: "Act", icon: Zap, color: "text-amber-400", description: "Pipeline Builder — visual workflow execution and monitoring" },
  govern: { label: "Govern", icon: Shield, color: "text-emerald-400", description: "Governance Console — scope certificates, compliance posture, audit trail" },
  search: { label: "Search", icon: Search, color: "text-rose-400", description: "Federated Search — query across all domain signals, decisions, and artifacts" },
  evolve: { label: "Evolve", icon: Sparkles, color: "text-fuchsia-400", description: "Self-Evolution — agent performance metrics and optimization proposals" },
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  info: "text-muted-foreground bg-muted/20 border-border/30",
};

export const DOMAIN_COLORS: Record<string, string> = {
  aegis: "text-red-400",
  vessels: "text-sky-400",
  terra: "text-green-400",
  lyte: "text-amber-400",
  prism: "text-violet-400",
  alloy: "text-fuchsia-400",
  orchestration: "text-cyan-400",
  pipeline: "text-orange-400",
};

export type ComposerStage = { id: string; type: string; name: string };

export const STAGE_LIBRARY: { type: string; label: string; color: string; description: string }[] = [
  { type: "ingest",    label: "Ingest",    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",          description: "Pull data from source" },
  { type: "classify",  label: "Classify",  color: "bg-violet-500/20 text-violet-400 border-violet-500/30", description: "Tag and categorise input" },
  { type: "score",     label: "Score",     color: "bg-amber-500/20 text-amber-400 border-amber-500/30",    description: "Risk / relevance scoring" },
  { type: "enrich",    label: "Enrich",    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", description: "Add context from knowledge-base" },
  { type: "recommend", label: "Recommend", color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", description: "Generate ranked recommendations" },
  { type: "audit",     label: "Audit",     color: "bg-rose-500/20 text-rose-400 border-rose-500/30",       description: "Compliance & governance check" },
];

export const STAGE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  STAGE_LIBRARY.map(s => [s.type, s.color]),
);
