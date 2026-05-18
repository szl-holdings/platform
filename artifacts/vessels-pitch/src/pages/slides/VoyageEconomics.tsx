export default function VoyageEconomics() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 04 · Voyage Economics</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">10 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[78vw]">
        Baltic LPG indices, Mt Belvieu, Argus FE, bunker spreads —
        <span className="block text-gold font-medium">priced into every fixture before the broker hits send.</span>
      </h2>

      <div className="mt-[6vh] grid grid-cols-12 gap-[2vw] flex-1">
        <div className="col-span-7 bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">USG → FE TCE · indicative 30-day curve</div>
          <svg viewBox="0 0 600 240" className="w-full h-[28vh]">
            <defs>
              <linearGradient id="tceArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#c9b787" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#c9b787" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="600" height="240" fill="#0a1419" />
            <g stroke="#1c2d35" strokeWidth="0.5">
              <line x1="0" y1="60" x2="600" y2="60" />
              <line x1="0" y1="120" x2="600" y2="120" />
              <line x1="0" y1="180" x2="600" y2="180" />
            </g>
            <path d="M 0 170 L 50 160 L 100 155 L 150 140 L 200 130 L 250 110 L 300 95 L 350 105 L 400 88 L 450 70 L 500 60 L 550 55 L 600 50 L 600 240 L 0 240 Z" fill="url(#tceArea)" />
            <path d="M 0 170 L 50 160 L 100 155 L 150 140 L 200 130 L 250 110 L 300 95 L 350 105 L 400 88 L 450 70 L 500 60 L 550 55 L 600 50" stroke="#c9b787" strokeWidth="2" fill="none" />
            <text x="10" y="55" fill="#c9b787" fontSize="11" fontFamily="DM Mono">$82,400/d</text>
            <text x="10" y="115" fill="#8a9499" fontSize="10" fontFamily="DM Mono">$55,000/d</text>
            <text x="10" y="175" fill="#8a9499" fontSize="10" fontFamily="DM Mono">$32,500/d</text>
            <text x="540" y="42" fill="#c9b787" fontSize="11" fontFamily="DM Mono" textAnchor="end">today</text>
          </svg>
          <div className="mt-[2vh] grid grid-cols-3 gap-[1vw]">
            <div className="bg-bg border border-rule p-[1vw]">
              <div className="text-muted tracking-[0.15em] text-[0.8vw] uppercase font-mono">Baltic VLGC</div>
              <div className="text-[1.6vw] text-gold font-bold leading-[1.1]">$82.4k/d</div>
            </div>
            <div className="bg-bg border border-rule p-[1vw]">
              <div className="text-muted tracking-[0.15em] text-[0.8vw] uppercase font-mono">Houston-Chiba arb</div>
              <div className="text-[1.6vw] text-gold font-bold leading-[1.1]">+$118/t</div>
            </div>
            <div className="bg-bg border border-rule p-[1vw]">
              <div className="text-muted tracking-[0.15em] text-[0.8vw] uppercase font-mono">VLSFO Singapore</div>
              <div className="text-[1.6vw] text-text font-bold leading-[1.1]">$578/t</div>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-[2vh]">
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">What we wire</div>
            <ul className="space-y-[1vh] text-[1.2vw] leading-[1.4] text-text">
              <li>— Baltic Exchange LPG (BLPG1, BLPG2, BLPG3)</li>
              <li>— Argus &amp; Platts FE / NWE LPG</li>
              <li>— Mt Belvieu propane &amp; butane settlements</li>
              <li>— Bunker (VLSFO / LPG dual-fuel) port grid</li>
              <li>— Panama &amp; Suez transit / queue data</li>
            </ul>
          </div>
          <div className="bg-panel border border-rule p-[2vw] flex-1">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">What it does</div>
            <p className="text-[1.2vw] leading-[1.5] text-muted" style={{textWrap: "pretty"}}>
              Pre-fixture TCE per voyage option, sensitivity to bunker spread, and a real-time
              arbitrage panel for the lanes Dorian actually runs. The chartering desk stops
              spreadsheet-chasing and starts decision-making.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Curve values shown are illustrative of feed structure, not today&apos;s print</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">10 / 16</div>
      </div>
    </div>
  );
}
