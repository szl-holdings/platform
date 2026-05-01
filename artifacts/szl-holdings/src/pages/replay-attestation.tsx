// Public, unauthenticated replay-attestation UI — Track C-01

import { useEffect, useState, type FormEvent } from "react";

type AttestationResponse =
  | {
      status: "match";
      run_id: string;
      agent_id: string;
      agent_version: string;
      tenant: "public";
      original_hash: string;
      replay_hash: string;
      signing_key_fingerprint: string;
      signature: string;
      ledger_anchor: string;
      ledger_height_at_run: number;
      ledger_height_at_replay: number;
      replayed_at: string;
      kernel_version: string;
      evidence_url: string;
    }
  | {
      status: "mismatch";
      run_id: string;
      original_hash: string;
      replay_hash: string;
      diff_summary: string;
      signing_key_fingerprint: string;
      signature: string;
      incident_record_url: string;
    }
  | {
      status: "not_replayable_public";
      reason: string;
      tenant_console_help: string;
    }
  | { status: "unknown_run"; run_id_received: string; note?: string };

export default function ReplayAttestationPage() {
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AttestationResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [exampleId, setExampleId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/replay-attestation/example")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d?.run_id && setExampleId(d.run_id))
      .catch(() => { /* example is optional */ });
    return () => { alive = false; };
  }, []);

  async function onReplay(e: FormEvent) {
    e.preventDefault();
    if (!runId.trim()) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/replay-attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId.trim() }),
      });
      if (res.status === 429) {
        setErr("You're being rate-limited. Try again in a minute.");
        return;
      }
      if (!res.ok) {
        setErr(`HTTP ${res.status}`);
        return;
      }
      const data: AttestationResponse = await res.json();
      setResult(data);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  // Defensively gate any URL coming from the API response — only http(s) and
  // same-origin paths may render as anchor href. Anything else (javascript:,
  // data:, file:, etc.) is replaced with "#" and the underlying string is
  // shown as plain text, preventing XSS via a compromised/misbehaving server.
  function safeHref(url: string | undefined | null): string {
    if (!url || typeof url !== "string") return "#";
    if (url.startsWith("/")) return url;
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:") return url;
      return "#";
    } catch {
      return "#";
    }
  }

  function downloadJson() {
    if (!result || (result.status !== "match" && result.status !== "mismatch")) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attestation-${("run_id" in result ? result.run_id : "unknown")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-slate-100">
      <h1 className="text-4xl font-semibold tracking-tight">Replay attestation</h1>
      <p className="mt-4 text-slate-300">
        Paste any SZL Holdings public run ID. We will re-execute the run against the original inputs
        and return a hash you can verify with our published key.
      </p>

      <form onSubmit={onReplay} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
          placeholder="run_2026-04-30T14:08:12Z_a31f3c..."
          className="flex-1 rounded border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          aria-label="Run ID"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-emerald-500 px-5 py-3 font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Replaying..." : "Replay"}
        </button>
      </form>

      {exampleId && !runId && (
        <p className="mt-3 text-sm text-slate-400">
          New here? Try a real anchored run:{" "}
          <button
            type="button"
            onClick={() => setRunId(exampleId)}
            className="font-mono text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            {exampleId}
          </button>
        </p>
      )}

      {err && <p className="mt-4 text-amber-400">{err}</p>}

      {result?.status === "match" && (
        <section className="mt-10 rounded border border-emerald-700 bg-emerald-950/40 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-emerald-300">Match</div>
          <Row label="Agent" value={`${result.agent_id} @ ${result.agent_version}`} />
          <Row label="Original hash" value={result.original_hash} mono />
          <Row label="Replay hash" value={result.replay_hash} mono />
          <Row label="Signing key" value={result.signing_key_fingerprint} mono />
          <Row label="Ledger anchor" value={result.ledger_anchor} mono />
          <Row label="Ledger heights" value={`run ${result.ledger_height_at_run} → replay ${result.ledger_height_at_replay}`} />
          <Row label="Kernel" value={result.kernel_version} />
          <Row label="Replayed at" value={result.replayed_at} />
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={downloadJson} className="rounded border border-emerald-600 px-4 py-2 hover:bg-emerald-900/40">
              Download attestation (JSON)
            </button>
            <a href={safeHref(result.evidence_url)} rel="noreferrer noopener" className="rounded border border-slate-700 px-4 py-2 hover:border-slate-500">
              View ledger anchor
            </a>
            <a href="/.well-known/szl-attestation-keys.json" className="rounded border border-slate-700 px-4 py-2 hover:border-slate-500">
              Verify with our public key (CLI)
            </a>
          </div>
        </section>
      )}

      {result?.status === "mismatch" && (
        <section className="mt-10 rounded border border-rose-700 bg-rose-950/40 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-rose-300">Mismatch — public incident opened</div>
          <p className="text-slate-200">
            A replay mismatch on a public run is a high-severity event. We have automatically
            opened a public incident record so this discrepancy is investigated and disclosed.
          </p>
          <Row label="Original hash" value={result.original_hash} mono />
          <Row label="Replay hash" value={result.replay_hash} mono />
          <Row label="Diff summary" value={result.diff_summary} />
          <a href={safeHref(result.incident_record_url)} rel="noreferrer noopener" className="mt-4 inline-block rounded border border-rose-600 px-4 py-2 hover:bg-rose-900/40">
            View incident record
          </a>
        </section>
      )}

      {result?.status === "not_replayable_public" && (
        <section className="mt-10 rounded border border-slate-700 bg-slate-900 p-6">
          <p>{result.reason}</p>
          <a className="mt-4 inline-block underline" rel="noreferrer noopener" href={safeHref(result.tenant_console_help)}>How tenant replay works →</a>
        </section>
      )}

      {result?.status === "unknown_run" && (
        <section className="mt-10 rounded border border-slate-700 bg-slate-900 p-6">
          <p>That run ID is not in our public ledger.</p>
          {result.note && <p className="mt-2 text-sm text-slate-400">{result.note}</p>}
          <p className="mt-2 text-slate-400">If it should be, contact us at security@szlholdings.com.</p>
        </section>
      )}

      <section className="mt-12 border-t border-slate-800 pt-12 text-sm text-slate-400">
        <h2 className="text-base text-slate-200">How does this work?</h2>
        <p className="mt-3">
          Every public agent run is recorded as a row in our append-only evidence ledger. The row
          captures the agent, its pinned version, its inputs, and a BLAKE3 hash of its outputs.
          When you submit a run ID, our deterministic kernel re-executes the run against those
          original inputs and returns the resulting hash, signed by our published Ed25519 key.
          A match means the run is reproducible on the current code; a mismatch is treated as
          a public security incident.
        </p>
        <h2 className="mt-8 text-base text-slate-200">What can be replayed?</h2>
        <p className="mt-3">
          Public runs only. Tenant runs replay through the customer&apos;s authenticated console.
          Public agents are listed at <a className="underline" href="/governance#public-agents">governance &gt; public agents</a>.
        </p>
      </section>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mt-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <div className="w-40 shrink-0 text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className={mono ? "break-all font-mono text-xs text-slate-200" : "text-slate-200"}>{value}</div>
    </div>
  );
}
