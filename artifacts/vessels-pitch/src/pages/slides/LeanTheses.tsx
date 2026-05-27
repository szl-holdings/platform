const TH = [
  { id: "TH1", name: "Lambda-Gate Composability", line: "Two gates compose iff their constitutions are compatible — no ad-hoc bypass." },
  { id: "TH2", name: "Replay-DOI Duality", line: "Replay output = DOI-anchored output for any sealed receipt." },
  { id: "TH3", name: "ρ-Closure Completeness", line: "The ρ-closure of governed calls contains every reachable inference." },
  { id: "TH4", name: "Lambda-Category Composability", line: "Categorical composition of gates preserves identity + associativity." },
  { id: "TH5", name: "Chain Confluence", line: "Two receipt chains with the same Merkle root yield identical replay sets." },
  { id: "TH6", name: "Bekenstein via DPI", line: "Information bound on a sealed receipt obeys data-processing inequality." },
  { id: "TH7", name: "Curry-Howard Receipt Calculus", line: "Receipts are proofs; types are policy obligations. Composition is implication." },
  { id: "TH8", name: "Graded Lambda-Receipt Identity", line: "Two receipts of the same graded type are observationally identical." },
];

export default function LeanTheses() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 12 · Lean theses · TH1 → TH8</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">29 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        Eight theses. <span className="text-gold font-medium">Eight green checks.</span> Machine-discharged in Lean 4.
      </h2>

      <div className="mt-[3vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[0.6fr_2fr_4fr_0.5fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.3vw] py-[0.9vh]">
          <div>ID</div><div>Thesis</div><div>What it discharges</div><div>Status</div>
        </div>
        {TH.map((t, i) => (
          <div key={t.id} className={`grid grid-cols-[0.6fr_2fr_4fr_0.5fr] px-[1.3vw] py-[1.4vh] text-[0.95vw] leading-[1.35] ${i < TH.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-gold">{t.id}</div>
            <div className="font-medium text-text">{t.name}</div>
            <div className="text-muted">{t.line}</div>
            <div className="font-mono text-[1vw]" style={{ color: "#8a9b6e" }}>✓</div>
          </div>
        ))}
      </div>

      <div className="mt-[2vh] border border-gold bg-bg p-[1.4vw] grid grid-cols-3 gap-[1.5vw]">
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Source</div><div className="text-[1vw] text-text">packages/lean-formulas</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Validator</div><div className="text-[1vw] text-text">scripts/check-lean-build.sh</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">CI gate</div><div className="text-[1vw] text-text">Required on every push</div></div>
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[1.8vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Math is done · receipts are not a marketing word here</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">29 / 40</div>
      </div>
    </div>
  );
}
