export default function A11oyReceipts() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[6vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Receipts</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 26</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        A Λ-receipt for <span className="text-gold font-medium">every single call.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-[1.4fr_1fr] gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Sample Λ-receipt envelope</div>
          <pre className="font-mono text-[0.85vw] leading-[1.5] text-text bg-bg p-[1.2vw] border border-rule overflow-x-auto">
{`{
  "rcpt_id":   "lambda:01J9X3...",
  "parent":    "lambda:01J9X2...",   // chain link
  "ts":        "2026-05-27T18:42:11Z",
  "actor":     { "kind":"agent", "id":"ops.daily-brief" },
  "call":      { "vendor":"anthropic", "model":"claude-4.5-sonnet" },
  "license":   { "card":"anthropic.commercial.v3", "ok":true },
  "policy":    { "constitution":"dorian.v6", "decision":"allow" },
  "grounding": { "amaru_query_id":"amaru:q:7f3...", "citations":3 },
  "io_hash":   "sha256:7c4f...",     // input + output, never raw
  "merkle":    "sha256:9b21..."      // batch root, anchored hourly
}`}
          </pre>
          <div className="mt-auto pt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-muted uppercase">
            GET /api/rosie/receipts · GET /api/rosie/events (SSE)
          </div>
        </div>

        <div className="flex flex-col gap-[1.5vw]">
          <div className="border border-rule bg-panel p-[1.5vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Linked</div>
            <div className="text-[1.15vw] text-text leading-[1.35]">SHA-256 parent pointer — the chain is tamper-evident end to end.</div>
          </div>
          <div className="border border-rule bg-panel p-[1.5vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Rooted</div>
            <div className="text-[1.15vw] text-text leading-[1.35]">Hourly Merkle root → optionally anchored to a public registry of your choosing.</div>
          </div>
          <div className="border border-rule bg-panel p-[1.5vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Replayable</div>
            <div className="text-[1.15vw] text-text leading-[1.35]">Curry-Howard discipline: same inputs, bit-identical reasoning — Lean theses TH1–TH8 discharge the math.</div>
          </div>
          <div className="border border-gold bg-panel p-[1.5vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">Private by construction</div>
            <div className="text-[1.15vw] text-text leading-[1.35]">Raw I/O never leaves the membrane — only hashes. PII window separate from retention.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">For Costa — this is the evidentiary record, not a copy of it</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 26</div>
      </div>
    </div>
  );
}
