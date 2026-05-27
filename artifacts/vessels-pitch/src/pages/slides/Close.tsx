export default function Close() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1419] via-[#0f1d24] to-[#06181f]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <circle cx="960" cy="540" r="420" fill="none" stroke="#c9b787" strokeWidth="0.5" />
        <circle cx="960" cy="540" r="320" fill="none" stroke="#c9b787" strokeWidth="0.5" />
        <circle cx="960" cy="540" r="220" fill="none" stroke="#06607F" strokeWidth="1" />
      </svg>

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 18 · The ask</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">40 / 40</div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[22vh]">
        <h1 className="text-[5.4vw] leading-[0.95] font-light tracking-[-0.035em]">
          The ask is simple.
          <span className="block font-bold text-gold mt-[1vh]">Three signatures. Ninety days. One $8M round.</span>
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[58vh] grid grid-cols-3 gap-[2vw]">
        <div className="border border-rule bg-panel/60 p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Peter</div>
          <div className="text-[1.6vw] font-medium mb-[1vh]">Sign the NDA + Pilot SOW</div>
          <div className="text-[1vw] text-muted leading-[1.4]">Two ops workflows live in 14 days. Receipts on your desk.</div>
        </div>
        <div className="border border-rule bg-panel/60 p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Marina</div>
          <div className="text-[1.6vw] font-medium mb-[1vh]">Pick the anchor vertical</div>
          <div className="text-[1vw] text-muted leading-[1.4]">One scope letter. The platform inherits every proof you make there.</div>
        </div>
        <div className="border border-gold bg-panel/60 p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Costa</div>
          <div className="text-[1.6vw] font-medium mb-[1vh]">Drive the paper</div>
          <div className="text-[1vw] text-muted leading-[1.4]">NDA paper + MSA choice-of-law. NY desk, London weight, EU residency.</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[12vh] grid grid-cols-3 gap-[2vw]">
        <div className="border-l-2 border-gold pl-[1.2vw]">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Lead investor</div>
          <div className="text-[1.15vw] text-text leading-[1.35]">$3–5M check · board seat · pro-rata</div>
        </div>
        <div className="border-l-2 border-gold pl-[1.2vw]">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Strategic / design partner</div>
          <div className="text-[1.15vw] text-text leading-[1.35]">$500K–$1M · pilot waiver · co-design rights</div>
        </div>
        <div className="border-l-2 border-gold pl-[1.2vw]">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">First operator partner</div>
          <div className="text-[1.15vw] text-text leading-[1.35]">Dorian · pilot SOW · production at day 90</div>
        </div>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between border-t border-rule pt-[2vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase">We are not asking for trust — we are asking for the gate to verify behind</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">40 / 40</div>
      </div>
    </div>
  );
}
