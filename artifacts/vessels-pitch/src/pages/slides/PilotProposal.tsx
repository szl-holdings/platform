export default function PilotProposal() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 07 · Pilot</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">14 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Ninety days. Three vessels.
        <span className="block text-gold font-medium">A live answer, not a slide.</span>
      </h2>

      <div className="mt-[7vh] grid grid-cols-3 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Days 0 – 14</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">Wire-up</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted">
            <li>— SSO into Dorian IDs</li>
            <li>— AIS &amp; sanctions feeds live</li>
            <li>— 3 pilot vessels selected with you</li>
            <li>— Helios pool data ingested</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Days 15 – 60</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">Live operation</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted">
            <li>— Daily fleet brief to your desk</li>
            <li>— Pre-fixture screening on real charters</li>
            <li>— Anomaly alerts piped to your ops</li>
            <li>— Weekly review with your compliance team</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Days 61 – 90</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">Readout</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted">
            <li>— Receipts package for your auditors</li>
            <li>— Quantified hits &amp; near-misses</li>
            <li>— Fleet-wide rollout plan</li>
            <li>— Commercial terms for production</li>
          </ul>
        </div>
      </div>

      <div className="mt-[4vh] grid grid-cols-3 gap-[2vw]">
        <div className="bg-bg border border-gold p-[1.5vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.5vh]">Pilot fee</div>
          <div className="text-[1.6vw] text-text font-medium">Capped · returnable against year-one</div>
        </div>
        <div className="bg-bg border border-rule p-[1.5vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase mb-[0.5vh]">Data residency</div>
          <div className="text-[1.6vw] text-text font-medium">EU + US regions · your choice</div>
        </div>
        <div className="bg-bg border border-rule p-[1.5vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase mb-[0.5vh]">Exit</div>
          <div className="text-[1.6vw] text-text font-medium">Full export · no lock-in</div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Pilot scope · 90 days</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">14 / 16</div>
      </div>
    </div>
  );
}
