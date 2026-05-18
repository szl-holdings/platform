export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1419] via-[#0f1d24] to-[#06181f]" />

      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#c9b787" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#grid)" />
        <path d="M 0 720 Q 480 600, 960 700 T 1920 680" fill="none" stroke="#c9b787" strokeWidth="1.5" opacity="0.4" />
        <path d="M 0 760 Q 480 660, 960 740 T 1920 720" fill="none" stroke="#06607F" strokeWidth="1.5" opacity="0.6" />
        <circle cx="380" cy="710" r="4" fill="#c9b787" />
        <circle cx="920" cy="720" r="4" fill="#c9b787" />
        <circle cx="1460" cy="700" r="4" fill="#c9b787" />
      </svg>

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex items-start justify-between">
        <div className="flex flex-col gap-[1vh]">
          <div className="font-mono text-[1.1vw] tracking-[0.25em] text-gold uppercase">Vessels</div>
          <div className="w-[5vw] h-[2px] bg-gold" />
        </div>
        <div className="font-mono text-[1vw] tracking-[0.2em] text-muted uppercase text-right">
          <div>Prepared for</div>
          <div className="text-text mt-[0.4vh]">Dorian LPG Ltd (NYSE: LPG)</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[36vh]">
        <div className="text-[1.4vw] font-mono tracking-[0.3em] text-primary uppercase mb-[3vh]">Maritime Intelligence</div>
        <h1 className="text-[6.4vw] leading-[0.92] font-light tracking-[-0.035em] text-text" style={{textWrap: "balance"}}>
          Visibility, sanctions cover,
          <span className="block font-bold text-gold">and freight intel for the VLGC fleet.</span>
        </h1>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between">
        <div className="font-mono text-[0.95vw] tracking-[0.2em] text-muted uppercase">
          May 2026 · Confidential · Stamford
        </div>
        <div className="font-mono text-[0.95vw] tracking-[0.2em] text-muted uppercase">
          v 1.0 / Investor Briefing
        </div>
      </div>
    </div>
  );
}
