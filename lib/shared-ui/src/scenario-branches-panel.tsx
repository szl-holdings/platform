/**
 * ScenarioBranchesPanel — canonical shared scenario / what-if branching UI.
 *
 * Shows a tree of scenario branches with probability, delta from base,
 * confidence, and supporting evidence. Supports base / bull / bear views.
 *
 * Consumed by: Vessels (voyage scenarios), Terra (portfolio scenarios),
 * Aegis (threat scenarios), Lyte (decision simulations).
 *
 * Domain data is passed via props. The branching UI and interaction model
 * are shared across all surfaces.
 */
import React, { useState } from "react";
import { cn } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────

export type ScenarioCase = "base" | "bull" | "bear" | "tail" | "custom";

export interface ScenarioMetric {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaPositive?: boolean;
  unit?: string;
}

export interface ScenarioBranch {
  id: string;
  label: string;
  case: ScenarioCase;
  probability: number;
  description: string;
  metrics: ScenarioMetric[];
  confidence: number;
  evidenceCount?: number;
  childBranches?: ScenarioBranch[];
  tags?: string[];
  selected?: boolean;
}

export interface ScenarioBranchesPanelProps {
  title?: string;
  description?: string;
  branches: ScenarioBranch[];
  accentColor?: string;
  onSelectBranch?: (branch: ScenarioBranch) => void;
  onRunSimulation?: () => void;
  onExport?: () => void;
  className?: string;
}

// ─── Internal tokens ─────────────────────────────────────────────────────

const CASE_CFG: Record<ScenarioCase, { label: string; color: string; bg: string }> = {
  base:   { label: "Base",   color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  bull:   { label: "Bull",   color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
  bear:   { label: "Bear",   color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
  tail:   { label: "Tail",   color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  custom: { label: "Custom", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
};

const BG = { card: "#0c1018", selected: "#0f1828" } as const;
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_SELECTED = "rgba(255,255,255,0.14)";
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.52)",
  muted: "rgba(255,255,255,0.28)",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────

function ProbabilityBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums w-7 text-right" style={{ color: TEXT.muted }}>
        {pct}%
      </span>
    </div>
  );
}

function MetricChip({ metric }: { metric: ScenarioMetric }) {
  const hasPositiveDelta = metric.delta !== undefined && metric.deltaPositive === true;
  const hasNegativeDelta = metric.delta !== undefined && metric.deltaPositive === false;

  return (
    <div
      className="flex flex-col px-3 py-2 rounded-lg min-w-[90px]"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: TEXT.muted }}>
        {metric.label}
      </span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-[13px] font-semibold font-mono tabular-nums" style={{ color: TEXT.primary }}>
          {metric.value}
          {metric.unit && <span className="text-[10px] ml-0.5" style={{ color: TEXT.muted }}>{metric.unit}</span>}
        </span>
        {metric.delta !== undefined && (
          <span
            className="text-[10px] font-mono"
            style={{ color: hasPositiveDelta ? "#22c55e" : hasNegativeDelta ? "#ef4444" : TEXT.muted }}
          >
            {hasPositiveDelta ? "+" : ""}{metric.delta}{metric.unit ?? ""}
          </span>
        )}
      </div>
    </div>
  );
}

interface BranchCardProps {
  branch: ScenarioBranch;
  accentColor: string;
  depth?: number;
  onSelect?: (branch: ScenarioBranch) => void;
}

function BranchCard({ branch, accentColor, depth = 0, onSelect }: BranchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const caseCfg = CASE_CFG[branch.case];
  const isSelected = branch.selected;

  return (
    <div className={cn("flex flex-col", depth > 0 && "ml-4 pl-4 border-l")} style={depth > 0 ? { borderColor: BORDER } : undefined}>
      <div
        className="rounded-xl overflow-hidden cursor-pointer transition-all"
        style={{
          background: isSelected ? BG.selected : BG.card,
          border: `1px solid ${isSelected ? BORDER_SELECTED : BORDER}`,
        }}
        onClick={() => onSelect?.(branch)}
        role="button"
        aria-pressed={isSelected}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(branch); } }}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: caseCfg.bg, color: caseCfg.color, border: `1px solid ${caseCfg.color}25` }}
            >
              {caseCfg.label}
            </span>
            {isSelected && (
              <span
                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
              >
                Selected
              </span>
            )}
            {branch.tags?.map((t) => (
              <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: TEXT.muted }}>
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>
              {branch.label}
            </h4>
            <ProbabilityBar value={branch.probability} color={caseCfg.color} />
          </div>
          <p className="text-[11px] mt-1.5 leading-snug" style={{ color: TEXT.secondary }}>
            {branch.description}
          </p>
        </div>

        {/* Metrics */}
        {branch.metrics.length > 0 && (
          <div className="flex gap-2 flex-wrap px-4 py-3" style={{ borderBottom: branch.childBranches?.length ? `1px solid ${BORDER}` : undefined }}>
            {branch.metrics.map((m, i) => (
              <MetricChip key={i} metric={m} />
            ))}
          </div>
        )}

        {/* Footer: confidence + evidence + child branches toggle */}
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-mono" style={{ color: TEXT.muted }}>
          <span>Confidence {Math.round(branch.confidence * 100)}%</span>
          {branch.evidenceCount !== undefined && (
            <>
              <span>·</span>
              <span>{branch.evidenceCount} evidence</span>
            </>
          )}
          {branch.childBranches && branch.childBranches.length > 0 && (
            <>
              <div className="flex-1" />
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                className="transition-opacity hover:opacity-70"
                style={{ color: TEXT.muted }}
              >
                {expanded ? "▲ Collapse" : `▼ ${branch.childBranches.length} sub-scenario${branch.childBranches.length !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Child branches */}
      {expanded && branch.childBranches?.map((child) => (
        <div key={child.id} className="mt-2">
          <BranchCard branch={child} accentColor={accentColor} depth={depth + 1} {...(onSelect !== undefined ? { onSelect } : {})} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function ScenarioBranchesPanel({
  title = "Scenario Branches",
  description,
  branches,
  accentColor = "#8b7ac8",
  onSelectBranch,
  onRunSimulation,
  onExport,
  className,
}: ScenarioBranchesPanelProps) {
  const totalProb = branches.reduce((s, b) => s + b.probability, 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: TEXT.primary }}>
            {title}
          </h3>
          {description && (
            <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
              {description}
            </p>
          )}
          <div className="text-[10px] font-mono mt-1" style={{ color: TEXT.muted }}>
            {branches.length} scenario{branches.length !== 1 ? "s" : ""} · Σ probability {Math.round(totalProb * 100)}%
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRunSimulation && (
            <button
              onClick={onRunSimulation}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}
            >
              Run Simulation
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: TEXT.secondary }}
            >
              Export
            </button>
          )}
        </div>
      </div>

      {/* Branches */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${accentColor}10` }}
          >
            <span className="text-lg">🌿</span>
          </div>
          <p className="text-sm font-medium" style={{ color: TEXT.primary }}>
            No scenarios defined
          </p>
          <p className="text-[11px] mt-1" style={{ color: TEXT.muted }}>
            Run a simulation to generate scenario branches.
          </p>
          {onRunSimulation && (
            <button
              onClick={onRunSimulation}
              className="mt-4 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors hover:opacity-80"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}
            >
              Run First Simulation
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              accentColor={accentColor}
              {...(onSelectBranch !== undefined ? { onSelect: onSelectBranch } : {})}
            />
          ))}
        </div>
      )}
    </div>
  );
}
