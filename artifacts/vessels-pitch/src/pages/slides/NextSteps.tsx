export default function NextSteps() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1419] via-[#0f1d24] to-[#06181f]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <pattern id="grid2" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#c9b787" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#grid2)" />
      </svg>

      <div className="relative h-full px-[6vw] py-[7vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Closing · Next Steps</div>
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">16 / 16</div>
        </div>

        <div className="mt-[14vh] max-w-[80vw]">
          <div className="text-[1.3vw] font-mono tracking-[0.25em] text-primary uppercase mb-[3vh]">From this meeting</div>
          <h2 className="text-[5.8vw] leading-[0.95] font-light tracking-[-0.035em]" style={{textWrap: "balance"}}>
            Pick three vessels.
            <span className="block font-bold text-gold">We&apos;ll be live in two weeks.</span>
          </h2>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-[2vw] pt-[6vh]">
          <div className="border-t border-gold pt-[2vh]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Decision today</div>
            <div className="text-[1.3vw] leading-[1.35]">Pilot scope &amp; vessel selection</div>
          </div>
          <div className="border-t border-gold pt-[2vh]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Decision next week</div>
            <div className="text-[1.3vw] leading-[1.35]">Compliance and IT sign-off · MSA short-form</div>
          </div>
          <div className="border-t border-gold pt-[2vh]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Decision in 90 days</div>
            <div className="text-[1.3vw] leading-[1.35]">Fleet-wide rollout under the Helios pool</div>
          </div>
        </div>

        <div className="mt-[6vh] flex items-end justify-between border-t border-rule pt-[3vh]">
          <div>
            <div className="font-mono text-[0.95vw] tracking-[0.25em] text-gold uppercase">Vessels</div>
            <div className="text-[1.1vw] text-muted mt-[0.5vh]">Maritime intelligence · Stamford · Athens · London</div>
          </div>
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted text-right">
            <div>Prepared for Dorian LPG Ltd</div>
            <div className="mt-[0.4vh]">Confidential · May 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
