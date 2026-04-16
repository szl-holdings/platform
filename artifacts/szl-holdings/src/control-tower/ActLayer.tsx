import { useState, useRef, useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Workflow, PlusCircle, Layers, Play, ChevronRight, Trash2, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

import { API_BASE, DOMAIN_COLORS, STAGE_LIBRARY, STAGE_COLOR_MAP, ComposerStage } from "./constants";

import { SectionCard } from "./components";

export function ActLayer() {
  const [mode, setMode] = useState<"templates" | "compose">("templates");
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [pipelineInput, setPipelineInput] = useState("");
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);

  const [composedStages, setComposedStages] = useState<ComposerStage[]>([]);
  const [composerInput, setComposerInput] = useState("");
  const [composerResult, setComposerResult] = useState<Record<string, unknown> | null>(null);
  const dragSrcIdx = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const { data: pipelinesData, isLoading: pipelinesLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-pipelines"],
    queryFn: () => fetch(`${API_BASE}/control-tower/act/pipelines`).then(r => r.json()),
    staleTime: 300000,
  });

  const runMutation = useMutation({
    mutationFn: (body: { pipelineId: string; input: string }) =>
      fetch(`${API_BASE}/control-tower/act/pipelines/${body.pipelineId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: body.input }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setPipelineResult((data as Record<string, unknown>)?.data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const composerRunMutation = useMutation({
    mutationFn: (body: { stages: ComposerStage[]; input: string }) =>
      fetch(`${API_BASE}/control-tower/act/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setComposerResult((data as Record<string, unknown>)?.data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const pipelines = ((pipelinesData?.data as Record<string, unknown>)?.pipelines as unknown[]) ?? [];
  const selected = pipelines.find((p: unknown) => (p as Record<string, unknown>).id === selectedPipeline) as Record<string, unknown> | undefined;

  const onLibraryDragStart = useCallback((e: React.DragEvent, stageType: string) => {
    e.dataTransfer.setData("library-stage-type", stageType);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const onCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("library-stage-type");
    if (type) {
      const def = STAGE_LIBRARY.find(s => s.type === type);
      if (def) {
        setComposedStages(prev => [...prev, { id: `${type}-${Date.now()}`, type, name: def.label }]);
      }
    }
  }, []);

  const onCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  const onStageDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onStageDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const srcIdx = dragSrcIdx.current;
    if (srcIdx === null || srcIdx === dropIdx) return;
    setComposedStages(prev => {
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
    dragSrcIdx.current = null;
  }, []);

  const removeStage = useCallback((id: string) => setComposedStages(prev => prev.filter(s => s.id !== id)), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("templates")}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            mode === "templates"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/20"
          )}
        >
          <Workflow className="inline w-3 h-3 mr-1.5" />
          Pipeline Templates
        </button>
        <button
          onClick={() => setMode("compose")}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            mode === "compose"
              ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:bg-muted/20"
          )}
        >
          <PlusCircle className="inline w-3 h-3 mr-1.5" />
          Compose Pipeline
        </button>
      </div>

      {mode === "templates" && (
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Pipeline Templates" icon={Workflow} color="text-amber-400">
            <div className="space-y-2">
              {pipelinesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)
              ) : (
                pipelines.map((p: unknown) => {
                  const pl = p as Record<string, unknown>;
                  const stages = (pl.stages as unknown[]) ?? [];
                  const isSelected = selectedPipeline === String(pl.id);
                  return (
                    <button
                      key={String(pl.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isSelected ? "border-primary/40 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20"
                      )}
                      onClick={() => setSelectedPipeline(isSelected ? null : String(pl.id))}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", DOMAIN_COLORS[String(pl.domain)] ?? "text-muted-foreground")}>
                          {String(pl.domain)}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{String(pl.name)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">{String(pl.description)}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {stages.map((stage: unknown) => {
                          const s = stage as Record<string, unknown>;
                          return (
                            <span key={String(s.name)} className={cn("text-[9px] px-1.5 py-0.5 rounded border", STAGE_COLOR_MAP[String(s.type)] ?? "")}>
                              {String(s.type)}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>

          <div className="space-y-4">
            {selected && (
              <SectionCard title="Visual Pipeline" icon={Layers} color="text-violet-400">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(selected.stages as unknown[]).map((stage: unknown, i) => {
                    const s = stage as Record<string, unknown>;
                    const isLast = i === (selected.stages as unknown[]).length - 1;
                    const resultStage = pipelineResult
                      ? ((pipelineResult?.result as Record<string, unknown>)?.stages as unknown[] ?? []).find(
                          (rs: unknown) => (rs as Record<string, unknown>).stageName === String(s.name)
                        ) as Record<string, unknown> | undefined
                      : undefined;
                    const stageStatus = resultStage?.status as string | undefined;
                    return (
                      <div key={String(s.name)} className="flex items-center gap-1.5 shrink-0">
                        <div className={cn("text-center px-2 py-1.5 rounded-lg border min-w-16", STAGE_COLOR_MAP[String(s.type)] ?? "")}>
                          <p className="text-[9px] font-semibold uppercase">{String(s.type)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 max-w-16 truncate">{String(s.name)}</p>
                          {stageStatus && (
                            <span className={cn("text-[8px]",
                              stageStatus === "completed" ? "text-emerald-400" :
                              stageStatus === "failed" ? "text-red-400" : "text-amber-400"
                            )}>
                              {stageStatus === "completed" ? "✓" : stageStatus === "failed" ? "✗" : "○"}
                            </span>
                          )}
                        </div>
                        {!isLast && <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Execute Pipeline" icon={Play} color="text-amber-400">
              {!selected ? (
                <p className="text-xs text-muted-foreground text-center py-4">Select a pipeline template to execute</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium">{String(selected.name)}</p>
                  <textarea
                    className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                    rows={4}
                    placeholder="Paste input data for the pipeline…"
                    value={pipelineInput}
                    onChange={e => setPipelineInput(e.target.value)}
                  />
                  <button
                    onClick={() => selectedPipeline && pipelineInput && runMutation.mutate({ pipelineId: selectedPipeline, input: pipelineInput })}
                    disabled={!pipelineInput || runMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {runMutation.isPending ? "Running pipeline…" : "Execute Pipeline"}
                  </button>
                </div>
              )}
              {pipelineResult && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                      (pipelineResult?.result as Record<string, unknown>)?.status === "completed"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    )}>
                      {String((pipelineResult?.result as Record<string, unknown>)?.status ?? "unknown")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {String((pipelineResult?.result as Record<string, unknown>)?.totalDurationMs ?? 0)}ms
                    </span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {String((pipelineResult?.result as Record<string, unknown>)?.finalOutput ?? "").slice(0, 600)}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {mode === "compose" && (
        <div className="grid grid-cols-[180px_1fr] gap-4">
          <SectionCard title="Stage Library" icon={Layers} color="text-violet-400">
            <p className="text-[9px] text-muted-foreground mb-2">Drag stages onto the canvas</p>
            <div className="space-y-1.5">
              {STAGE_LIBRARY.map(s => (
                <div
                  key={s.type}
                  draggable
                  onDragStart={e => onLibraryDragStart(e, s.type)}
                  className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none", s.color)}
                  title={s.description}
                >
                  <GripVertical className="w-2.5 h-2.5 opacity-50" />
                  <span className="text-[10px] font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="Pipeline Canvas" icon={Workflow} color="text-amber-400">
              <div
                onDrop={onCanvasDrop}
                onDragOver={onCanvasDragOver}
                className={cn(
                  "min-h-20 rounded-lg border-2 border-dashed transition-colors p-3",
                  composedStages.length === 0 ? "border-border/30 flex items-center justify-center" : "border-border/20"
                )}
              >
                {composedStages.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60 text-center select-none">Drop stages here to build a pipeline</p>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {composedStages.map((stage, i) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-1"
                        draggable
                        onDragStart={e => onStageDragStart(e, i)}
                        onDrop={e => onStageDrop(e, i)}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <div className={cn("group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none", STAGE_COLOR_MAP[stage.type] ?? "")}>
                          <GripVertical className="w-2.5 h-2.5 opacity-50" />
                          <span className="text-[10px] font-semibold">{stage.name}</span>
                          <button
                            onPointerDown={e => { e.stopPropagation(); removeStage(stage.id); }}
                            className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-red-400"
                            title="Remove stage"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {i < composedStages.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {composedStages.length > 0 && (
                <button onClick={() => setComposedStages([])} className="mt-1.5 text-[9px] text-muted-foreground hover:text-rose-400 transition-colors">
                  Clear canvas
                </button>
              )}
            </SectionCard>

            <SectionCard title="Execute Composed Pipeline" icon={Play} color="text-amber-400">
              {composedStages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Build a pipeline on the canvas first</p>
              ) : (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                    rows={3}
                    placeholder="Paste input data to run through the composed pipeline…"
                    value={composerInput}
                    onChange={e => setComposerInput(e.target.value)}
                  />
                  <button
                    onClick={() => composerInput && composerRunMutation.mutate({ stages: composedStages, input: composerInput })}
                    disabled={!composerInput || composerRunMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {composerRunMutation.isPending ? "Running composed pipeline…" : `Run ${composedStages.length}-Stage Pipeline`}
                  </button>
                </div>
              )}
              {composerResult && (
                <div className="mt-3 space-y-2">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                    (composerResult as Record<string, unknown>)?.status === "completed"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                  )}>
                    {String((composerResult as Record<string, unknown>)?.status ?? "unknown")}
                  </span>
                  <div className="p-2.5 bg-muted/10 border border-border/50 rounded-lg max-h-32 overflow-y-auto mt-1">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {String((composerResult as Record<string, unknown>)?.finalOutput ?? JSON.stringify(composerResult)).slice(0, 600)}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
