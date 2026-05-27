import { RankedSignalMesh, type SignalSeriesInput } from "@workspace/vessels-perception-viz";

// Fixture-locked signal-mesh inputs — order produced by peak-detector,
// not by hand. Matches the @workspace/vessels-perception-viz fixture
// test so the deck and the product cannot diverge.
function bump(center: number, height: number, n = 21) {
  const pts: { x: number; intensity: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = i - n / 2;
    const noise = 0.05 * Math.sin(i * 1.7);
    pts.push({ x: center + x, intensity: 1 + height * Math.exp(-(x * x) / 4) + noise });
  }
  return pts;
}

const DARK_VESSEL_SIGNALS: readonly SignalSeriesInput[] = [
  { streamId: "sanctions-hits",  label: "Sanctions hits",     category: "comp",    series: bump(0, 6.1) },
  { streamId: "ais-density",     label: "AIS density",        category: "traffic", series: bump(0, 4.5) },
  { streamId: "port-congestion", label: "Port congestion",    category: "port",    series: bump(0, 2.2) },
  { streamId: "sts-rendezvous",  label: "STS rendezvous",     category: "risk",    series: bump(0, 1.4) },
];

export default function DarkVesselDetection() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 03 · Dark Vessel</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">09 / 16</div>
      </div>

      <div className="mt-[5vh] grid grid-cols-12 gap-[3vw] flex-1">
        <div className="col-span-5">
          <h2 className="text-[3.4vw] leading-[1.05] font-light tracking-[-0.02em] mb-[3vh]">
            When a vessel goes dark,
            <span className="block text-alert font-medium">we already know why.</span>
          </h2>
          <p className="text-[1.3vw] leading-[1.55] text-muted mb-[3vh]" style={{textWrap: "pretty"}}>
            AIS gap detection, identity-swap signatures, STS rendezvous inference, and dark-fleet
            counterparty graphs — the same forensic toolkit OFAC and OFSI use, turned on every
            voyage adjacent to your fleet.
          </p>
          <div className="grid grid-cols-3 gap-[1vw]">
            <div className="bg-panel border border-rule p-[1.2vw]">
              <div className="text-[2vw] font-bold text-gold leading-[1]">4</div>
              <div className="font-mono text-[0.8vw] tracking-[0.15em] text-muted uppercase mt-[0.6vh]">Gap classes</div>
            </div>
            <div className="bg-panel border border-rule p-[1.2vw]">
              <div className="text-[2vw] font-bold text-gold leading-[1]">12</div>
              <div className="font-mono text-[0.8vw] tracking-[0.15em] text-muted uppercase mt-[0.6vh]">STS hot zones</div>
            </div>
            <div className="bg-panel border border-rule p-[1.2vw]">
              <div className="text-[2vw] font-bold text-gold leading-[1]">SAT</div>
              <div className="font-mono text-[0.8vw] tracking-[0.15em] text-muted uppercase mt-[0.6vh]">SAR &amp; optical cross-check</div>
            </div>
          </div>
        </div>

        <div className="col-span-7 bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-alert uppercase mb-[2vh]">Anomaly · IMO 9412987 · Strait of Hormuz</div>

          <svg viewBox="0 0 600 260" className="w-full h-[26vh]">
            <defs>
              <linearGradient id="gapShade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#EE3524" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#EE3524" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="600" height="260" fill="#0a1419" />
            <g stroke="#1c2d35" strokeWidth="0.5">
              <line x1="0" y1="60" x2="600" y2="60" />
              <line x1="0" y1="130" x2="600" y2="130" />
              <line x1="0" y1="200" x2="600" y2="200" />
            </g>
            <rect x="240" y="20" width="140" height="240" fill="url(#gapShade)" />
            <path d="M 0 150 L 80 145 L 160 140 L 240 135" stroke="#c9b787" strokeWidth="2" fill="none" />
            <path d="M 380 130 L 460 125 L 540 130 L 600 132" stroke="#c9b787" strokeWidth="2" fill="none" />
            <path d="M 240 135 L 380 130" stroke="#EE3524" strokeWidth="2" strokeDasharray="4 4" fill="none" />

            <circle cx="240" cy="135" r="4" fill="#EE3524" />
            <circle cx="380" cy="130" r="4" fill="#EE3524" />

            <text x="246" y="125" fill="#EE3524" fontSize="10" fontFamily="DM Mono">AIS OFF · 14:02 UTC</text>
            <text x="290" y="240" fill="#EE3524" fontSize="10" fontFamily="DM Mono">4h 12m dark · STS likely</text>
            <text x="320" y="125" fill="#EE3524" fontSize="10" fontFamily="DM Mono" textAnchor="end">AIS ON · 18:14 UTC</text>
          </svg>

          <div className="mt-[2vh] grid grid-cols-2 gap-[1vw] font-mono text-[1.05vw]">
            <div className="bg-bg border border-rule p-[1vw]">
              <div className="text-muted tracking-[0.15em] text-[0.85vw] uppercase mb-[0.5vh]">SAR cross-check</div>
              <div className="text-text">2 hulls within 180m at 16:21 UTC</div>
            </div>
            <div className="bg-bg border border-rule p-[1vw]">
              <div className="text-muted tracking-[0.15em] text-[0.85vw] uppercase mb-[0.5vh]">Counterparty hull</div>
              <div className="text-alert">IMO 9650441 · sanctioned ownership</div>
            </div>
          </div>

          {/* Signal-mesh ranked by peak-detector — same component the live Vessels surface
              renders. Order is fixture-locked in the @workspace/vessels-perception-viz tests. */}
          <div className="mt-[2vh]">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase mb-[1vh]">
              Signal-mesh · peak-detector ranking
            </div>
            <RankedSignalMesh streams={DARK_VESSEL_SIGNALS} limit={4} />
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Capability 03 of 06</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">09 / 16</div>
      </div>
    </div>
  );
}
