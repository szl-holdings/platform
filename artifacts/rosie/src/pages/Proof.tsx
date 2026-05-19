import { useEffect, useState } from "react";
import { rosieApi, type AnyReceipt, type ProofReceipt } from "@/lib/api";

// Type guard so the per-kind UI never accesses a field that isn't present.
// The /receipts endpoint defaults to kind=solve, but we still guard at the
// component boundary so the page never crashes on a chain containing
// narration or ingest receipts (which it will, once ?kind=all is fetched).
function isSolve(r: AnyReceipt): r is ProofReceipt {
  return (r as ProofReceipt).kind === "solve" || (r as ProofReceipt).templateName !== undefined;
}

export default function Proof() {
  const [receipts, setReceipts] = useState<AnyReceipt[]>([]);
  const [chainKind, setChainKind] = useState<"solve" | "all">("solve");
  const [verify, setVerify] = useState<Awaited<ReturnType<typeof rosieApi.verifyChain>> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await rosieApi.receipts(chainKind);
      setReceipts(r);
      if (!selected && r.length > 0) setSelected(r[0].receiptId);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
    const h = setInterval(load, 8_000);
    return () => clearInterval(h);
    // re-run when chainKind toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainKind]);

  // Live SSE ticker: bumps the chain on every server-side event so the proof
  // surface reflects the chain without waiting for the 8s poll.
  useEffect(() => {
    const url = "/api/rosie/events";
    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
      es.addEventListener("snapshot", () => {
        load();
      });
      es.onerror = () => {
        es?.close();
      };
    } catch {
      // EventSource unavailable — polling above will keep state fresh.
    }
    return () => es?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainKind]);

  async function runVerify() {
    setError(null);
    try {
      const v = await rosieApi.verifyChain();
      setVerify(v);
    } catch (e) {
      setError(String(e));
    }
  }

  const current = receipts.find((r) => r.receiptId === selected) ?? receipts[0];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
            proof chain · covenant proof standard v1
          </div>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">
            {receipts.length} receipt{receipts.length === 1 ? "" : "s"} sealed.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs font-mono">
            <button
              onClick={() => setChainKind("solve")}
              data-testid="button-kind-solve"
              className={"px-3 py-1.5 " + (chainKind === "solve" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}
            >solve</button>
            <button
              onClick={() => setChainKind("all")}
              data-testid="button-kind-all"
              className={"px-3 py-1.5 " + (chainKind === "all" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}
            >all (incl. ingest · narration)</button>
          </div>
          <button
            onClick={runVerify}
            data-testid="button-verify-chain"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            ◐ Verify chain
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      {verify && (
        <div
          data-testid="verify-result"
          className={
            "rounded-lg border p-4 text-sm " +
            (verify.verified
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive")
          }
        >
          <div className="font-medium">
            {verify.verified ? "✓ Chain verified" : "✗ Chain integrity failure"} — {verify.chainLength} links
          </div>
          <div className="font-mono text-[11px] mt-1 break-all">head: {verify.head}</div>
          {verify.failures.length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {verify.failures.map((f, i) => (
                <li key={i} className="text-xs">
                  {f.receiptId}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[360px_1fr] gap-4">
        <aside className="rounded-lg border border-border bg-card p-2 max-h-[640px] overflow-y-auto">
          {receipts.length === 0 && (
            <div className="text-sm text-muted-foreground p-4">
              No receipts yet. Run a solve in the Optimizer.
            </div>
          )}
          {receipts.map((r) => {
            const kind = (r as AnyReceipt).kind ?? "solve";
            const label = isSolve(r)
              ? r.templateName
              : kind === "ingest"
                ? `ingest · ${(r as { source?: string }).source ?? "?"}`
                : `narration → ${(r as { targetReceiptId?: string }).targetReceiptId?.slice(0, 8) ?? "?"}`;
            const sub = isSolve(r)
              ? `E=${typeof r.energy === "number" ? r.energy.toFixed(3) : "?"}`
              : kind === "ingest"
                ? `items=${(r as { itemCount?: number }).itemCount ?? 0} · errs=${(r as { errorCount?: number }).errorCount ?? 0}`
                : `${(r as { provider?: string }).provider ?? "?"}`;
            return (
              <button
                key={r.receiptId}
                onClick={() => setSelected(r.receiptId)}
                data-testid={`receipt-row-${r.receiptId}`}
                className={
                  "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors " +
                  (selected === r.receiptId
                    ? "bg-primary/15 border border-primary/40"
                    : "border border-transparent hover:bg-secondary")
                }
              >
                <div className="flex items-center gap-2">
                  <span className={"text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-mono " + (
                    kind === "solve" ? "bg-primary/20 text-primary" :
                    kind === "ingest" ? "bg-accent/20 text-accent" :
                    "bg-muted text-muted-foreground"
                  )}>{kind}</span>
                  <div className="font-medium truncate flex-1">{label}</div>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                  {r.receiptHash.slice(0, 16)}… · {sub}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </button>
            );
          })}
        </aside>

        <section className="rounded-lg border border-border bg-card p-5">
          {current ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-mono">
                  {current.governance.standard} · {current.governance.authority}
                </div>
                <div className="font-semibold mt-1 text-lg">
                  {isSolve(current)
                    ? current.templateName
                    : (current as { kind?: string }).kind === "ingest"
                      ? `Ingest · ${(current as { source?: string }).source ?? "?"}`
                      : `Narration receipt`}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5 break-all">
                  {current.receiptId}
                </div>
              </div>
              {isSolve(current) ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <Metric label="Energy" value={current.energy.toFixed(4)} />
                  <Metric label="Iterations" value={current.iterations.toLocaleString()} />
                  <Metric label="Seed" value={String(current.seed)} />
                </div>
              ) : (current as { kind?: string }).kind === "ingest" ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <Metric label="Source" value={(current as { source?: string }).source ?? "?"} />
                  <Metric label="Items" value={String((current as { itemCount?: number }).itemCount ?? 0)} />
                  <Metric label="Errors" value={String((current as { errorCount?: number }).errorCount ?? 0)} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <Metric label="Provider" value={(current as { provider?: string }).provider ?? "?"} />
                  <Metric label="Model" value={(current as { model?: string }).model ?? "?"} />
                  <Metric label="Validated" value={String((current as { schemaValidated?: boolean }).schemaValidated ?? false)} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HashCard label="prev →" value={current.prevHash} />
                <HashCard label="receipt" value={current.receiptHash} accent />
                <HashCard label="input" value={current.inputHash} />
                <HashCard label="output" value={current.outputHash} />
              </div>
              {isSolve(current) && current.narrative && (
                <div className="rounded border border-border bg-background/60 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-accent mb-2 font-mono">
                    ◆ narrator
                  </div>
                  <p className="text-sm leading-relaxed">{current.narrative}</p>
                </div>
              )}
              {!isSolve(current) && (current as { kind?: string }).kind === "narration" && (
                <div className="rounded border border-border bg-background/60 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-accent mb-2 font-mono">
                    ◆ narration text
                  </div>
                  <p className="text-sm leading-relaxed">{(current as { narrative?: string }).narrative ?? ""}</p>
                </div>
              )}
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  ▸ raw envelope
                </summary>
                <pre className="text-[11px] font-mono mt-2 p-3 rounded bg-background border border-border overflow-x-auto">
{JSON.stringify(current, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a receipt to inspect.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-base mt-0.5">{value}</div>
    </div>
  );
}

function HashCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded border p-3 " + (accent ? "border-primary/40 bg-primary/5" : "border-border bg-background/40")}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-[11px] font-mono break-all mt-1" data-testid={`hash-${label.replace(/\W/g, "")}`}>
        {value}
      </div>
    </div>
  );
}
