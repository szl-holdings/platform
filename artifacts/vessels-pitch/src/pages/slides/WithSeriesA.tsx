const TRACKS = [
  {
    head: "Engineering · 50% · $4.0M",
    body: "4 senior hires (Λ-gate kernel · perception-loop · receipt-bus · UDS release).  TH9–TH12 discharged in Lean 4 (graded receipts, anchored Merkle root, side-channel bounds). A11oy SDK matrix: Node · Python · Go · .NET · Rust at GA.  UDS bundle line-up grows to 8 (Conduit, ROSIE-Mobile, Perception added).",
  },
  {
    head: "GTM · 25% · $2.0M",
    body: "Two-person GTM (Marina-class enterprise + defense FSO).  Three lighthouse pilots converted to MSA — Dorian (maritime ops), one Tier-1 bank (model governance), one DoD program of record via Defense Unicorns mesh.  $2-3M ARR target end-month-24.",
  },
  {
    head: "Security & Compliance · 15% · $1.2M",
    body: "FedRAMP Moderate ATO process opened.  SOC 2 Type II, ISO 27001, IL-4 IRAP-equivalent in flight.  Independent red-team retainer on Λ-gate.  KS-18 contextuality witness pen-tested by external cryptanalysis firm.",
  },
  {
    head: "Legal & Ops · 10% · $0.8M",
    body: "GC hire (Costa-tier).  Choice-of-law harmonisation across NY / DE / London / Frankfurt.  PRISM discovery product hardened.  Three published case studies with admissible-receipt language vetted by counsel.",
  },
];

const MILE = [
  { q: "M0–M3",   what: "Term sheet → close.  GC + first 2 engineers in seat.  Dorian pilot SOW signed." },
  { q: "M3–M6",   what: "UDS v0.3.0 line (8 bundles).  TH9 discharged.  First MSA conversion." },
  { q: "M6–M12",  what: "FedRAMP-Moderate ATO process formally accepted.  Three-pilot lighthouse cohort live." },
  { q: "M12–M18", what: "Defense Unicorns mesh integration GA.  Receipt-bus anchored to public timestamp authority." },
  { q: "M18–M24", what: "$2–3M ARR · two new product lines · Series B optionality." },
];

export default function WithSeriesA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 20 · With Series A · $8M / 24 months</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">42 / 44</div>
      </div>

      <h2 className="mt-[2vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        With $8M of disciplined capital — <span className="text-gold font-medium">what gets built, by whom, by when.</span>
      </h2>
      <p className="mt-[1.2vh] text-[1.05vw] text-muted leading-[1.4] max-w-[80vw]">
        Every line below maps to an existing artifact above — this is not new product invention, it's the same governance fabric, hardened, certified, and shipped into three named verticals.
      </p>

      <div className="mt-[2.5vh] grid grid-cols-2 gap-[1.5vw]">
        {TRACKS.map((t) => (
          <div key={t.head} className="border border-rule bg-panel p-[1.4vw]">
            <div className="font-mono text-[0.82vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">{t.head}</div>
            <div className="text-[0.92vw] text-muted leading-[1.45]">{t.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-[2vh] border border-gold bg-bg p-[1.3vw]">
        <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">24-month milestone path</div>
        <div className="grid grid-cols-5 gap-[0.8vw]">
          {MILE.map((m, i) => (
            <div key={m.q} className={`flex flex-col border-l-2 pl-[0.8vw] ${i === MILE.length - 1 ? "border-gold" : "border-rule"}`}>
              <div className="font-mono text-[0.74vw] tracking-[0.18em] uppercase mb-[0.4vh]" style={{ color: i === MILE.length - 1 ? "#c9b787" : "#06607F" }}>{m.q}</div>
              <div className="text-[0.82vw] text-text leading-[1.35]">{m.what}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-rule pt-[1.3vh] mt-[1.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.86vw] tracking-[0.2em] text-muted uppercase">Each track is staffed by named role + measured milestone · no aspirational lines</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">42 / 44</div>
      </div>
    </div>
  );
}
