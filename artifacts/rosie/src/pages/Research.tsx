import { useEffect, useState } from "react";
import { rosieApi } from "@/lib/api";

export default function Research() {
  const [data, setData] = useState<Awaited<ReturnType<typeof rosieApi.research>> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await rosieApi.research();
      setData(r);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    load();
    const h = setInterval(load, 30_000);
    return () => clearInterval(h);
  }, []);

  async function manualRefresh() {
    setRefreshing(true);
    try {
      await rosieApi.ingestRun();
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
            research library
          </div>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">
            Live signals from arXiv & HuggingFace.
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Auto-refreshed every 15 minutes. Triggers no token spend — both sources are public.
          </p>
        </div>
        <button
          onClick={manualRefresh}
          disabled={refreshing}
          data-testid="button-refresh-ingest"
          className="px-4 py-2 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-50 transition"
        >
          {refreshing ? "refreshing…" : "↻ refresh now"}
        </button>
      </header>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3">
          {error}
        </div>
      )}

      <section>
        <SectionTitle
          left="arXiv · cs.LG · cs.AI · quant-ph · cs.MA"
          right={
            data?.arxiv.lastRun ? `updated ${new Date(data.arxiv.lastRun).toLocaleTimeString()}` : "warming…"
          }
        />
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {data?.arxiv.papers.map((p) => (
            <article
              key={p.id}
              data-testid={`paper-${encodeURIComponent(p.id)}`}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition"
            >
              <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-sm leading-snug hover:text-primary block">
                {p.title}
              </a>
              <div className="text-[11px] text-muted-foreground font-mono mt-1">
                {p.authors.slice(0, 3).join(", ")}{p.authors.length > 3 ? ", et al." : ""} ·{" "}
                {p.published ? new Date(p.published).toLocaleDateString() : ""}
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">{p.summary}</p>
            </article>
          ))}
          {data && data.arxiv.papers.length === 0 && (
            <div className="text-sm text-muted-foreground">no papers yet — first ingest still warming up.</div>
          )}
          {!data && <div className="text-sm text-muted-foreground">loading…</div>}
        </div>
      </section>

      <section>
        <SectionTitle
          left="HuggingFace · trending models"
          right={data?.huggingface.lastRun ? `updated ${new Date(data.huggingface.lastRun).toLocaleTimeString()}` : "warming…"}
        />
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          {data?.huggingface.models.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              data-testid={`model-${m.id.replace(/[^a-zA-Z0-9]/g, "-")}`}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition block"
            >
              <div className="font-mono text-sm font-medium truncate">{m.id}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {m.pipelineTag ?? "model"} · ↓ {m.downloads.toLocaleString()} · ♥ {m.likes.toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.tags.slice(0, 4).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
          {data && data.huggingface.models.length === 0 && (
            <div className="text-sm text-muted-foreground">no models yet — first ingest still warming up.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">{left}</div>
      <div className="text-[10px] text-muted-foreground font-mono">{right}</div>
    </div>
  );
}
