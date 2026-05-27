export default function VerticalHealthLife() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Vertical · Healthcare / Life Sci</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">21 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Perception-loop privacy: <span className="text-gold font-medium">features cross the membrane, raw frames never.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Architecturally HIPAA</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Raw PHI never enters the receipt envelope</li>
            <li>— Feature vector summaries cross only</li>
            <li>— Serialization test enforces this in CI</li>
            <li>— BAA-ready, residency-elected</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Research workflows</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Trial protocol ingestion → Amaru</li>
            <li>— Lit-review with DOI-cited evidence</li>
            <li>— IRB-bound A11oy gating per protocol</li>
            <li>— Reviewer-presence as a receipt signal</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Programs covered</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— HIPAA</li>
            <li>— HITRUST CSF v11</li>
            <li>— GxP (GMP/GCP/GLP) readiness rollup</li>
            <li>— FDA 21 CFR Part 11 e-signature evidence</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Privacy is a serialization invariant — proved in `perception-loop` test suite</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">21 / 40</div>
      </div>
    </div>
  );
}
