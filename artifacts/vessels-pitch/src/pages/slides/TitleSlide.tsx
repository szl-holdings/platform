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
        <circle cx="960" cy="540" r="320" fill="none" stroke="#c9b787" strokeWidth="1" opacity="0.35" />
        <circle cx="960" cy="540" r="220" fill="none" stroke="#06607F" strokeWidth="1" opacity="0.5" />
        <circle cx="960" cy="540" r="120" fill="none" stroke="#c9b787" strokeWidth="1" opacity="0.7" />
      </svg>

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex items-start justify-between">
        <div className="flex flex-col gap-[1vh]">
          <div className="font-mono text-[1.1vw] tracking-[0.25em] text-gold uppercase">A11oy</div>
          <div className="w-[5vw] h-[2px] bg-gold" />
        </div>
        <div className="font-mono text-[1vw] tracking-[0.2em] text-muted uppercase text-right">
          <div>Prepared for</div>
          <div className="text-text mt-[0.4vh]">Peter · Marina · Costa</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[34vh]">
        <div className="text-[1.4vw] font-mono tracking-[0.3em] text-primary uppercase mb-[3vh]">Governed AI for the Enterprise</div>
        <h1 className="text-[6.2vw] leading-[0.92] font-light tracking-[-0.035em] text-text" style={{ textWrap: "balance" } as React.CSSProperties}>
          A11oy × Dorian.
          <span className="block font-bold text-gold">The gate every model passes through.</span>
        </h1>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between">
        <div className="font-mono text-[0.95vw] tracking-[0.2em] text-muted uppercase">
          May 2026 · Confidential · Stamford / NYC / London
        </div>
        <div className="font-mono text-[0.95vw] tracking-[0.2em] text-muted uppercase">
          v 1.0 / Working Session
        </div>
      </div>
    </div>
  );
}
