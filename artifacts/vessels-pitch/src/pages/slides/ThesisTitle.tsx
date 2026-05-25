export default function ThesisTitle() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text">
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <pattern id="thesis-grid" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#c9b787" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#thesis-grid)" />
      </svg>

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex items-start justify-between">
        <div className="font-mono text-[1vw] tracking-[0.28em] text-gold uppercase">SZL Holdings · Doctrine</div>
        <div className="font-mono text-[0.95vw] tracking-[0.2em] text-muted uppercase text-right">
          <div>Author</div>
          <div className="text-text mt-[0.4vh]">Stephen P. Lutar · ORCID 0009-0001-0110-4173</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[34vh]">
        <div className="font-mono text-[1.1vw] tracking-[0.32em] text-gold uppercase mb-[3vh]">Thesis Lineage · TH1 → TH8</div>
        <h1 className="text-[7vw] leading-[0.94] font-light tracking-[-0.03em]" style={{ fontFamily: "'Cormorant Garamond', serif", textWrap: "balance" }}>
          The full proof chain,
          <span className="block italic text-gold">from Lambda-Gate to Graded Receipts.</span>
        </h1>
        <p className="mt-[4vh] max-w-[60vw] text-[1.4vw] leading-[1.55] text-muted" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Eight theorems. Three Zenodo papers. One Lean 4 skeleton. Each theorem underwrites
          a shipped product across the SZL portfolio — Amaru, A11oy, Sentra, Terra, Vessels,
          Counsel, and Carlota Jo.
        </p>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.22em] text-muted uppercase">
          Zenodo community · szl-holdings
        </div>
        <div className="font-mono text-[0.9vw] tracking-[0.22em] text-muted uppercase">
          Investor &amp; Reviewer Walkthrough
        </div>
      </div>
    </div>
  );
}
