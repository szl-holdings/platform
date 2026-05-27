export default function SentraWhat() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 06 · Sentra</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Sentra — <span className="text-gold font-medium">the posture layer.</span>
        <span className="block text-[1.5vw] mt-[1vh] text-muted font-light">Reads the same receipt stream A11oy produces. Tells you where you stand, continuously.</span>
      </h2>

      <div className="mt-[5vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">What it scores</div>
          <ul className="space-y-[1.5vh] text-[1.2vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">NIST CSF</span> · subcategory + tier</li>
            <li>— <span className="text-text">ISO 27001</span> · Annex A control coverage</li>
            <li>— <span className="text-text">CMMC</span> · Level 2 / Level 3 readiness</li>
            <li>— <span className="text-text">Internal frameworks</span> · custom rubric, same engine</li>
            <li>— <span className="text-text">OT / ICS posture</span> · for shipping + critical infra</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">How it differs from a GRC tool</div>
          <ul className="space-y-[1.5vh] text-[1.2vw] leading-[1.4] text-muted">
            <li>— Evidence is <span className="text-text">live receipts</span>, not screenshots</li>
            <li>— Dossier per control is <span className="text-text">auto-assembled</span> from Amaru</li>
            <li>— Scoring updates <span className="text-text">on every receipt</span>, not on quarterly review</li>
            <li>— Auditor view = your view (same URL, same data)</li>
            <li>— Failed controls link to the <span className="text-text">exact Λ-receipt</span> that caused the drift</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2.5vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">GET /readiness/executive-rollup · live API today</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 26</div>
      </div>
    </div>
  );
}
