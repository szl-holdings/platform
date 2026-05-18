export default function TheMeeting() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 01 · Context</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">02 / 16</div>
      </div>

      <div className="mt-[10vh] flex-1 flex flex-col justify-center max-w-[80vw]">
        <div className="text-[1.3vw] font-mono tracking-[0.2em] text-primary uppercase mb-[3vh]">Why we are in the room</div>
        <h2 className="text-[4.5vw] leading-[1.0] font-light tracking-[-0.025em] mb-[5vh]" style={{textWrap: "balance"}}>
          The Hadjipateras family built one of the most
          <span className="text-gold font-medium"> modern VLGC fleets in the world.</span>
        </h2>
        <p className="text-[1.7vw] leading-[1.5] text-muted max-w-[60vw]" style={{textWrap: "pretty"}}>
          25+ very large gas carriers. Dual-fuel LPG propulsion. Helios Pool commercial management.
          A US Gulf to Far East arbitrage flow that increasingly moves through
          <span className="text-text"> sanctioned-adjacent waters, gray-fleet counterparties, and STS transfer zones.</span>
        </p>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Vessels · Dorian Briefing</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">May 2026</div>
      </div>
    </div>
  );
}
