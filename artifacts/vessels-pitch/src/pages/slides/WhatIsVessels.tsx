export default function WhatIsVessels() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 05 · The Platform</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 16</div>
      </div>

      <div className="mt-[12vh] max-w-[78vw]">
        <div className="text-[1.3vw] font-mono tracking-[0.25em] text-primary uppercase mb-[4vh]">What Vessels is</div>
        <h2 className="text-[5.4vw] leading-[1.0] font-light tracking-[-0.03em]" style={{textWrap: "balance"}}>
          One operating layer for
          <span className="text-gold font-bold"> fleet visibility,</span>
          <span className="font-light"> sanctions screening, and voyage-level provenance —</span>
          <span className="block font-medium mt-[2vh]">wired into the same workflow your operators already run.</span>
        </h2>
      </div>

      <div className="mt-auto grid grid-cols-4 gap-[2vw] pt-[6vh]">
        <div className="border-t border-gold pt-[2vh]">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Live</div>
          <div className="text-[1.3vw] leading-[1.3]">AIS &amp; satellite fleet tracking</div>
        </div>
        <div className="border-t border-gold pt-[2vh]">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Continuous</div>
          <div className="text-[1.3vw] leading-[1.3]">OFAC, EU, UK, UN sanctions screening</div>
        </div>
        <div className="border-t border-gold pt-[2vh]">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Forensic</div>
          <div className="text-[1.3vw] leading-[1.3]">Dark-vessel &amp; STS detection</div>
        </div>
        <div className="border-t border-gold pt-[2vh]">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Cryptographic</div>
          <div className="text-[1.3vw] leading-[1.3]">SZL trust receipts for every decision</div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[4vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Vessels · Platform overview</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 16</div>
      </div>
    </div>
  );
}
