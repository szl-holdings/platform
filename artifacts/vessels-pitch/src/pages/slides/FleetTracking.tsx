export default function FleetTracking() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 01 · Fleet Tracking</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 16</div>
      </div>

      <div className="mt-[5vh] grid grid-cols-12 gap-[2vw] flex-1">
        <div className="col-span-5 flex flex-col justify-between">
          <div>
            <h2 className="text-[3.4vw] leading-[1.05] font-light tracking-[-0.02em] mb-[3vh]">
              Every Dorian hull, every counterparty vessel,
              <span className="text-gold font-medium"> on one chart.</span>
            </h2>
            <p className="text-[1.3vw] leading-[1.55] text-muted" style={{textWrap: "pretty"}}>
              Terrestrial AIS, satellite AIS, and port-call data fused into a single time-aware view.
              Filter by class, charterer, flag, or cargo. Replay a voyage. Diff a track against the filed plan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[1.5vw] mt-[4vh]">
            <div className="bg-panel border border-rule p-[1.5vw]">
              <div className="text-[2.6vw] font-bold text-gold leading-[1]">1,200+</div>
              <div className="font-mono text-[0.9vw] tracking-[0.18em] text-muted uppercase mt-[1vh]">Gas carriers tracked</div>
            </div>
            <div className="bg-panel border border-rule p-[1.5vw]">
              <div className="text-[2.6vw] font-bold text-gold leading-[1]">15s</div>
              <div className="font-mono text-[0.9vw] tracking-[0.18em] text-muted uppercase mt-[1vh]">Median position refresh</div>
            </div>
          </div>
        </div>

        <div className="col-span-7 bg-panel border border-rule relative overflow-hidden">
          <svg viewBox="0 0 700 480" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a1419" />
                <stop offset="100%" stopColor="#06181f" />
              </linearGradient>
              <pattern id="latlon" width="70" height="48" patternUnits="userSpaceOnUse">
                <path d="M 70 0 L 0 0 0 48" fill="none" stroke="#1c2d35" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="700" height="480" fill="url(#oceanGrad)" />
            <rect width="700" height="480" fill="url(#latlon)" />

            {/* Continents (very stylized) */}
            <path d="M 50 180 L 180 150 L 220 200 L 200 280 L 110 290 Z" fill="#1c2d35" opacity="0.6" />
            <path d="M 290 100 L 420 90 L 470 200 L 380 240 L 310 180 Z" fill="#1c2d35" opacity="0.6" />
            <path d="M 520 180 L 660 170 L 670 290 L 580 320 L 530 260 Z" fill="#1c2d35" opacity="0.6" />

            {/* Routes */}
            <path d="M 130 240 Q 280 200, 420 220 T 620 240" stroke="#c9b787" strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="4 4" />
            <path d="M 150 270 Q 320 320, 500 280 T 640 260" stroke="#06607F" strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="4 4" />

            {/* Vessels */}
            <g>
              <circle cx="190" cy="245" r="5" fill="#c9b787" />
              <text x="200" y="240" fill="#c9b787" fontSize="9" fontFamily="DM Mono">DORIAN HAVEN · USG</text>
            </g>
            <g>
              <circle cx="360" cy="215" r="5" fill="#c9b787" />
              <text x="370" y="210" fill="#c9b787" fontSize="9" fontFamily="DM Mono">CHELOMA · 12.4 kn</text>
            </g>
            <g>
              <circle cx="530" cy="245" r="5" fill="#c9b787" />
              <text x="540" y="240" fill="#c9b787" fontSize="9" fontFamily="DM Mono">CONCORDE GAS · LADEN</text>
            </g>
            <g>
              <circle cx="610" cy="260" r="5" fill="#c9b787" />
              <text x="540" y="278" fill="#c9b787" fontSize="9" fontFamily="DM Mono">CHIBA POOL · DISCHG</text>
            </g>
            <g>
              <circle cx="430" cy="270" r="5" fill="#EE3524" />
              <text x="440" y="265" fill="#EE3524" fontSize="9" fontFamily="DM Mono">AIS GAP · 4h 12m</text>
            </g>
          </svg>

          <div className="absolute top-[2vh] left-[2vh] flex gap-[2vh] font-mono text-[0.85vw] tracking-[0.18em] uppercase">
            <span className="text-gold">● Dorian hull</span>
            <span className="text-primary">● Counterparty</span>
            <span className="text-alert">● Anomaly</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Capability 01 of 06</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 16</div>
      </div>
    </div>
  );
}
