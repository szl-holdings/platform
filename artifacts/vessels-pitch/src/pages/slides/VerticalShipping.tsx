export default function VerticalShipping() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Vertical · Shipping & Energy</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">19 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        The <span className="text-gold font-medium">Dorian-native vertical.</span>
        <span className="block text-[1.4vw] mt-[1vh] text-muted font-light">Already running. Already producing receipts. Live for the 25+ VLGC fleet pattern.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Pre-fixture</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Counterparty sanctions screen (OFAC + OFSI + EU)</li>
            <li>— Beneficial ownership cascade (50% rule)</li>
            <li>— Charter clause risk: war risk, sanctions, port-state</li>
            <li>— Λ-receipt sealed before charter party signed</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">In voyage</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— AIS dark-vessel detection (gap analysis + spoofing)</li>
            <li>— STS meeting flag + sanctions-adjacent geofence</li>
            <li>— Port-state inspection prep with prior deficiency context</li>
            <li>— Daily fleet brief, every claim cited from Amaru</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[1.6vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Post-voyage</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— P&amp;I evidence packet (receipts + Merkle proofs)</li>
            <li>— Voyage economics reconciliation, governed</li>
            <li>— Helios pool data ingested under license card</li>
            <li>— Sentra ICS posture rolled up for IMO 2025</li>
          </ul>
        </div>
      </div>

      <div className="mt-[3vh] border border-rule bg-bg p-[1.5vw] grid grid-cols-4 gap-[1.5vw]">
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">VLGC fleet</div><div className="text-[1.1vw] text-text">25+ vessels modelled</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Sanctions lists</div><div className="text-[1.1vw] text-text">OFAC · OFSI · EU live</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">AIS coverage</div><div className="text-[1.1vw] text-text">Global · multi-provider</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">P&I evidence</div><div className="text-[1.1vw] text-text">Receipt bundle ready</div></div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Vessels artifact (artifacts/vessels) — live demo url on request</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">19 / 40</div>
      </div>
    </div>
  );
}
