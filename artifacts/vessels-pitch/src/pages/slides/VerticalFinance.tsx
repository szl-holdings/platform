export default function VerticalFinance() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Vertical · Financial Services</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">20 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Trade finance · model risk · AML — <span className="text-gold font-medium">all governed at the seam.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">Use cases live today</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">Pre-trade screening</span> against OFAC + OFSI + UN consolidated</li>
            <li>— <span className="text-text">SR 11-7 model governance</span> — every model call is a logged decision</li>
            <li>— <span className="text-text">KYV provenance</span> — vendor due diligence as a graph of receipts</li>
            <li>— <span className="text-text">AML pattern scoring</span> with cited typology rather than black-box flag</li>
            <li>— <span className="text-text">Trade-finance memo drafting</span> — A11oy gates, Amaru grounds, Λ-receipt signs</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">Regulators covered</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">FFIEC</span> — AI/ML examination handbook alignment</li>
            <li>— <span className="text-text">NYDFS Part 500</span> — cyber, model risk, third-party</li>
            <li>— <span className="text-text">SEC 17a-4</span> — non-rewriteable receipt retention</li>
            <li>— <span className="text-text">FCA SYSC</span> — operational resilience evidence</li>
            <li>— <span className="text-text">EU AI Act</span> — class-2 disclosure ready out-of-box</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Closest published comp: Credo AI · CalypsoAI · Cranium — all priced Series A on AI governance thesis</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">20 / 40</div>
      </div>
    </div>
  );
}
