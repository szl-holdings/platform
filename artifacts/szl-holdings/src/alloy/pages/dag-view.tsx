import { useQuery } from "@tanstack/react-query";
import { apiFetch, isAuthError } from "@workspace/shared-ui";
import { useState } from "react";
import { CheckCircle, XCircle, Clock, Activity, AlertTriangle, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface Step {
  id: string;
  label: string;
  deps: string[];
  status?: "pending" | "running" | "completed" | "failed";
  durationMs?: number | null;
}

interface WorkflowDetail {
  id: number;
  name: string;
  description: string | null;
  steps: Step[];
}

function useWorkflow(id: number) {
  return useQuery({
    queryKey: ["alloyWorkflowDetail", id],
    queryFn: async () => {
      const resp = await apiFetch<WorkflowDetail | { data: WorkflowDetail }>(`/alloy/workflows/${id}`);
      if (resp && typeof resp === "object" && "data" in resp) return resp.data as WorkflowDetail;
      return resp as WorkflowDetail;
    },
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
    },
  });
}

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  completed: { fill: "rgba(16,185,129,0.12)", stroke: "#10b981", text: "#10b981" },
  failed: { fill: "rgba(239,68,68,0.12)", stroke: "#ef4444", text: "#ef4444" },
  running: { fill: "rgba(75,139,219,0.12)", stroke: "#4B8BDB", text: "#4B8BDB" },
  pending: { fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.5)" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5" />,
  failed: <XCircle className="w-3.5 h-3.5" />,
  running: <Activity className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  waiting_approval: <AlertTriangle className="w-3.5 h-3.5" />,
};

function layoutDAG(steps: Step[]): Map<string, { x: number; y: number; col: number; row: number }> {
  const positions = new Map<string, { x: number; y: number; col: number; row: number }>();
  if (!steps || steps.length === 0) return positions;

  const colWidth = 160;
  const rowHeight = 90;
  const padX = 20;
  const padY = 20;

  const inDegree = new Map<string, number>();
  const stepMap = new Map<string, Step>();
  steps.forEach(s => {
    stepMap.set(s.id, s);
    inDegree.set(s.id, 0);
  });
  steps.forEach(s => {
    s.deps.forEach(dep => {
      if (inDegree.has(s.id)) inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
    });
  });

  const levels = new Map<string, number>();
  const queue = steps.filter(s => (inDegree.get(s.id) ?? 0) === 0);
  queue.forEach(s => levels.set(s.id, 0));

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    steps.forEach(s => {
      if (s.deps.includes(cur.id)) {
        const newLevel = (levels.get(cur.id) ?? 0) + 1;
        if (newLevel > (levels.get(s.id) ?? -1)) {
          levels.set(s.id, newLevel);
        }
        if (!queue.includes(s)) queue.push(s);
      }
    });
  }

  const byLevel = new Map<number, Step[]>();
  steps.forEach(s => {
    const l = levels.get(s.id) ?? 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(s);
  });

  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  for (let l = 0; l <= maxLevel; l++) {
    const levelSteps = byLevel.get(l) ?? [];
    levelSteps.forEach((s, rowIdx) => {
      positions.set(s.id, {
        x: padX + l * colWidth,
        y: padY + rowIdx * rowHeight,
        col: l,
        row: rowIdx,
      });
    });
  }

  return positions;
}

function formatDuration(ms: number | null | undefined) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m`;
}

const NODE_W = 130;
const NODE_H = 52;

export function DAGView({ workflowId, steps: propSteps, highlightStepId }: {
  workflowId?: number;
  steps?: Step[];
  highlightStepId?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(highlightStepId ?? null);
  const { data: wfData } = useWorkflow(workflowId ?? 0);

  const rawSteps: Step[] = propSteps ?? ((wfData?.steps ?? []) as Step[]);
  const positions = layoutDAG(rawSteps);

  const xs = Array.from(positions.values()).map(p => p.x);
  const ys = Array.from(positions.values()).map(p => p.y);
  const svgW = Math.max(...xs, 0) + NODE_W + 40;
  const svgH = Math.max(...ys, 0) + NODE_H + 40;

  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; depId: string; stepId: string }> = [];
  rawSteps.forEach(step => {
    const pos = positions.get(step.id);
    if (!pos) return;
    step.deps.forEach(dep => {
      const depPos = positions.get(dep);
      if (!depPos) return;
      edges.push({
        x1: depPos.x + NODE_W,
        y1: depPos.y + NODE_H / 2,
        x2: pos.x,
        y2: pos.y + NODE_H / 2,
        depId: dep,
        stepId: step.id,
      });
    });
  });

  const selectedStep = rawSteps.find(s => s.id === selected);

  if (rawSteps.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
        No step dependencies defined for this workflow.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(4,8,16,0.9)" }}>
        <svg
          width={svgW}
          height={svgH}
          style={{ minWidth: "100%", display: "block" }}
        >
          <defs>
            <marker id="dag-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L0,8 L8,4 z" fill="rgba(255,255,255,0.15)" />
            </marker>
            <marker id="dag-arrow-active" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L0,8 L8,4 z" fill="#4B8BDB" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const mx = (e.x1 + e.x2) / 2;
            const isActive = hovered === e.stepId || hovered === e.depId || selected === e.stepId || selected === e.depId;
            return (
              <path
                key={i}
                d={`M ${e.x1} ${e.y1} C ${mx} ${e.y1}, ${mx} ${e.y2}, ${e.x2} ${e.y2}`}
                fill="none"
                stroke={isActive ? "#4B8BDB" : "rgba(255,255,255,0.12)"}
                strokeWidth={isActive ? "1.5" : "1"}
                markerEnd={isActive ? "url(#dag-arrow-active)" : "url(#dag-arrow)"}
                style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
              />
            );
          })}

          {rawSteps.map(step => {
            const pos = positions.get(step.id);
            if (!pos) return null;
            const status = step.status ?? "pending";
            const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
            const isHovered = hovered === step.id;
            const isSelected = selected === step.id;

            return (
              <g
                key={step.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(step.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === step.id ? null : step.id)}
              >
                <rect
                  x={0}
                  y={0}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={cfg.fill}
                  stroke={isSelected ? cfg.stroke : isHovered ? cfg.stroke : "rgba(255,255,255,0.1)"}
                  strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                  style={{ transition: "stroke 0.15s" }}
                />
                {isSelected && (
                  <rect
                    x={-1}
                    y={-1}
                    width={NODE_W + 2}
                    height={NODE_H + 2}
                    rx={9}
                    fill="none"
                    stroke={cfg.stroke}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                )}

                <foreignObject x={8} y={8} width={NODE_W - 16} height={NODE_H - 16}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "2px", fontFamily: "system-ui, sans-serif" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: cfg.text }}>
                      <span style={{ width: 14, height: 14, display: "flex", alignItems: "center" }}>
                        {STATUS_ICONS[status]}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: NODE_W - 36 }}>
                        {step.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", paddingLeft: 19 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {status}
                      </span>
                      {step.durationMs && (
                        <span style={{ fontSize: 9, color: cfg.text, opacity: 0.7 }}>
                          · {formatDuration(step.durationMs)}
                        </span>
                      )}
                    </div>
                    {step.deps.length > 0 && (
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", paddingLeft: 19, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        deps: {step.deps.join(", ")}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedStep && (
        <div className="rounded-xl border p-3" style={{
          borderColor: `${STATUS_COLORS[selectedStep.status ?? "pending"].stroke}30`,
          background: STATUS_COLORS[selectedStep.status ?? "pending"].fill,
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: STATUS_COLORS[selectedStep.status ?? "pending"].text }}>
              {STATUS_ICONS[selectedStep.status ?? "pending"]}
            </span>
            <span className="text-sm font-semibold text-white">{selectedStep.label}</span>
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-medium" style={{
              color: STATUS_COLORS[selectedStep.status ?? "pending"].text,
              borderColor: `${STATUS_COLORS[selectedStep.status ?? "pending"].stroke}30`,
            }}>
              {selectedStep.status ?? "pending"}
            </span>
          </div>
          <div className="text-[10px] space-y-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Step ID:</span> <span className="font-mono">{selectedStep.id}</span></div>
            {selectedStep.deps.length > 0 && (
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Dependencies:</span> {selectedStep.deps.join(", ")}</div>
            )}
            {selectedStep.durationMs && (
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Duration:</span> {formatDuration(selectedStep.durationMs)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DAGPage({ workflowId: propWorkflowId }: { workflowId?: number } = {}) {
  const workflowId = propWorkflowId ?? 1;
  const [, navigate] = useLocation();
  const { data, isLoading } = useWorkflow(workflowId);

  const steps = ((data?.steps ?? []) as Step[]).map((s, i) => ({
    ...s,
    status: ["completed", "completed", "completed", "running", "pending"][i % 5] as Step["status"],
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/alloy")}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
        <div>
          <h1 className="text-base font-bold text-white mb-1">
            {isLoading ? "Loading…" : data?.name ?? `Workflow #${workflowId}`}
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {data?.description ?? "Step dependency graph — click nodes to inspect"}
          </p>
        </div>
        {isLoading ? (
          <div className="h-48 rounded-xl border border-white/5 animate-pulse" />
        ) : (
          <DAGView workflowId={workflowId} steps={steps} />
        )}
      </div>
    </div>
  );
}

