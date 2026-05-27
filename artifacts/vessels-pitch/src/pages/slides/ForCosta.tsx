export default function ForCosta() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 11 · For Costa · Counsel</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">26 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Arbitration-grade <span className="text-gold font-medium">by construction.</span>
        <span className="block text-[1.4vw] mt-[1vh] text-muted font-light">Not "trust the audit log" — math-discharged, Lean-checked, supply-chain attested.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">Why a Λ-receipt holds</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">SHA-256 parent link</span> — tamper-evident at the chain level</li>
            <li>— <span className="text-text">Hourly Merkle root</span>, optionally anchored to Rekor or OpenTimestamps</li>
            <li>— <span className="text-text">Bit-identical replay</span> from inputs → outputs</li>
            <li>— <span className="text-text">Cosign identity</span> on the binary that produced it</li>
            <li>— <span className="text-text">KS-18 contextuality witness</span> rejects forged compositions in O(1)</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">What's been discharged</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">TH1</span> Lambda-Gate Composability</li>
            <li>— <span className="text-text">TH2</span> Replay-DOI Duality</li>
            <li>— <span className="text-text">TH3</span> ρ-Closure Completeness</li>
            <li>— <span className="text-text">TH4</span> Lambda-Category Composability</li>
            <li>— <span className="text-text">TH5–TH8</span> Confluence · Bekenstein · Curry-Howard · Graded Identity</li>
            <li className="text-gold pt-[0.5vh]">→ All in Lean 4, machine-checked in CI on every push</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">scripts/check-lean-build.sh · packages/lean-formulas · green today</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">26 / 40</div>
      </div>
    </div>
  );
}
