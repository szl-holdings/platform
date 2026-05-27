import { useEffect, useState } from "react";
import { reasoningApi, type PlanDag, type LambdaReceipt, type PlanTemplate, type PlanAction } from "@/lib/api";

export default function Planner() {
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("drone-oversight");
  const [body, setBody] = useState<{ goal: string[]; initialState: string[]; actions: PlanAction[] } | null>(null);
  const [dag, setDag] = useState<PlanDag | null>(null);
  const [receipt, setReceipt] = useState<LambdaReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    reasoningApi.planTemplates().then((d) => setTemplates(d.templates)).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!templateId) return;
    reasoningApi.planTemplate(templateId).then((t) => setBody(t.body ?? null)).catch((e) => setError(String(e)));
  }, [templateId]);

  async function runPlan() {
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const out = await reasoningApi.plan(body);
      setDag(out.dag);
      setReceipt(out.receipt);
    } catch (e) {
      setError(String(e));
      setDag(null);
      setReceipt(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="page-planner">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">graph planner · plan.dag.v1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Backward-chain a goal into a DAG.</h1>
        <p className="text-muted-foreground max-w-3xl">
          The planner picks actions whose effects cover the goal, builds dependency edges, detects cycles, and surfaces the critical path and parallelisable branches. Unreachable preconditions are surfaced as a 422.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">template</span>
            <select
              data-testid="select-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1.5 text-sm"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          <button
            data-testid="button-run-plan"
            onClick={runPlan}
            disabled={!body || busy}
            className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {busy ? "planning…" : "▶ Plan DAG"}
          </button>
        </div>
        {body && (
          <div className="text-xs font-mono text-muted-foreground grid md:grid-cols-3 gap-3">
            <div><span className="text-primary">goal</span>: {body.goal.join(", ")}</div>
            <div><span className="text-primary">initial</span>: {body.initialState.join(", ") || "∅"}</div>
            <div><span className="text-primary">actions</span>: {body.actions.length}</div>
          </div>
        )}
      </section>

      {error && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm" data-testid="plan-error">
          <div className="font-mono text-destructive">{error}</div>
        </section>
      )}

      {dag && (
        <section className="space-y-4" data-testid="plan-result">
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="execution order" value={dag.executionOrder.length} sub="nodes selected" />
            <Stat label="critical path cost" value={dag.totalCost} sub={`${dag.criticalPath.length} hops`} />
            <Stat label="parallel branches" value={dag.parallelBranches.length} sub="topo ranks with >1 node" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-mono mb-2">execution order</div>
              <ol className="space-y-1 text-sm font-mono">
                {dag.executionOrder.map((id, i) => {
                  const node = dag.nodes.find((n) => n.id === id);
                  const onCp = dag.criticalPath.includes(id);
                  return (
                    <li key={id} className="flex gap-3" data-testid={`exec-${id}`}>
                      <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span className={onCp ? "text-primary" : "text-foreground/90"}>{onCp ? "▶" : "·"} {node?.title ?? id}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-mono mb-2">critical path</div>
              <div className="text-sm font-mono leading-relaxed text-primary">
                {dag.criticalPath.map((id) => dag.nodes.find((n) => n.id === id)?.title ?? id).join(" → ")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-mono mt-4 mb-2">parallel branches</div>
              {dag.parallelBranches.length === 0 ? (
                <div className="text-sm text-muted-foreground">DAG is fully sequential.</div>
              ) : (
                <ul className="space-y-1 text-sm font-mono">
                  {dag.parallelBranches.map((rank, i) => (
                    <li key={i}>rank {i}: {rank.map((id) => dag.nodes.find((n) => n.id === id)?.title ?? id).join(" ‖ ")}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {receipt && <ReceiptCard receipt={receipt} />}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{sub}</div>
    </div>
  );
}

export function ReceiptCard({ receipt }: { receipt: LambdaReceipt }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4" data-testid="lambda-receipt">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">Λ-receipt · {receipt.kind}</div>
        <div className="text-[10px] font-mono text-muted-foreground">{new Date(receipt.createdAt).toLocaleTimeString()}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono">
        <div><span className="text-muted-foreground">id</span> {receipt.receiptId.slice(0, 24)}…</div>
        <div><span className="text-muted-foreground">authority</span> {receipt.governance.authority}</div>
        <div><span className="text-muted-foreground">prev</span> {receipt.prevHash.slice(0, 24)}…</div>
        <div><span className="text-muted-foreground">hash</span> {receipt.receiptHash.slice(0, 24)}…</div>
      </div>
    </div>
  );
}
