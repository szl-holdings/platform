const ROUTES = [
  { m: "POST", p: "/api/a11oy/gate/call", what: "Wrap a model call. Returns model output + receipt id." },
  { m: "GET", p: "/api/a11oy/lexicon/catalog", what: "Full catalog of registered models + licenses." },
  { m: "GET", p: "/api/a11oy/doctrine/constitutions", what: "Active doctrine version + ruleset." },
  { m: "GET", p: "/api/a11oy/constitution/active", what: "Tenant-bound constitution + risk appetite." },
  { m: "POST", p: "/api/a11oy/review/queue", what: "Submit a dual-use call for human review." },
  { m: "GET", p: "/api/rosie/receipts", what: "Λ-receipt query (filter by actor, model, tenant)." },
  { m: "GET", p: "/api/rosie/receipts/:id", what: "Single receipt + replay artifact." },
  { m: "GET", p: "/api/rosie/events", what: "SSE stream of receipts as they seal." },
  { m: "GET", p: "/api/amaru/query", what: "Grounded retrieval. Returns cited passages + scores." },
  { m: "POST", p: "/api/amaru/ingest", what: "Add a domain source. Per-source license card required." },
  { m: "GET", p: "/readiness/executive-rollup", what: "Sentra scoring across all programs." },
  { m: "GET", p: "/readiness/programs/:id/dimensions", what: "Per-program drilldown to control + evidence." },
  { m: "POST", p: "/api/prism/sanctions/screen", what: "Counterparty screen against OFAC / OFSI / EU." },
  { m: "GET", p: "/api/prism/matters/:id/clock", what: "Matter timeline, every event Λ-bound." },
];

export default function A11oyAPISurface() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · API surface</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        Fourteen routes live <span className="text-gold font-medium">in this environment, right now.</span>
      </h2>
      <p className="mt-[1vh] text-[1.05vw] text-muted leading-[1.4] max-w-[78vw]">
        Every route guarded by authMiddleware({"{required: true}"}), tenant scoping at the row level, and an automatic Λ-receipt on every mutating call.
      </p>

      <div className="mt-[2.5vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[0.6fr_2.2fr_3fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[0.9vh]">
          <div>Method</div><div>Route</div><div>Purpose</div>
        </div>
        {ROUTES.map((r, i) => (
          <div key={r.p} className={`grid grid-cols-[0.6fr_2.2fr_3fr] px-[1.5vw] py-[1.05vh] text-[0.92vw] leading-[1.35] ${i < ROUTES.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-gold">{r.m}</div>
            <div className="font-mono text-text">{r.p}</div>
            <div className="text-muted">{r.what}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">+ Vessels, Conduit, ROSIE, Sentra each contribute their own route table — under the same gate</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 40</div>
      </div>
    </div>
  );
}
