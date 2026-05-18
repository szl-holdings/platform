export default function DorianToday() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 03 · Dorian Today</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">04 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.8vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[70vw]">
        What we already know about
        <span className="text-gold font-medium"> the Dorian footprint.</span>
      </h2>

      <div className="mt-[6vh] grid grid-cols-4 gap-[2vw] flex-1">
        <div className="flex flex-col justify-between bg-panel border border-rule p-[2vw]">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase">Listing</div>
          <div className="text-[3.2vw] font-bold leading-[1] text-gold">NYSE: LPG</div>
          <div className="text-[1vw] text-muted leading-[1.4]">IPO 2014 · Stamford, CT &amp; Athens</div>
        </div>
        <div className="flex flex-col justify-between bg-panel border border-rule p-[2vw]">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase">Fleet</div>
          <div className="text-[3.2vw] font-bold leading-[1] text-gold">25+</div>
          <div className="text-[1vw] text-muted leading-[1.4]">Modern VLGCs · ECO &amp; LPG dual-fuel</div>
        </div>
        <div className="flex flex-col justify-between bg-panel border border-rule p-[2vw]">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase">Commercial</div>
          <div className="text-[3.2vw] font-bold leading-[1] text-gold">Helios</div>
          <div className="text-[1vw] text-muted leading-[1.4]">LPG Pool · combined VLGC tonnage management</div>
        </div>
        <div className="flex flex-col justify-between bg-panel border border-rule p-[2vw]">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase">Trade lane</div>
          <div className="text-[3.2vw] font-bold leading-[1] text-gold">USG → FE</div>
          <div className="text-[1vw] text-muted leading-[1.4]">US Gulf export arbitrage · Houston, Nederland, Marcus Hook</div>
        </div>
      </div>

      <div className="mt-[5vh] grid grid-cols-2 gap-[3vw]">
        <p className="text-[1.4vw] leading-[1.5] text-muted" style={{textWrap: "pretty"}}>
          Dorian has built the fleet competitive on cost-per-tonne. The next leg of competitive advantage is
          <span className="text-text"> operational intelligence on the cargo, the counterparty, and the chain of custody.</span>
        </p>
        <p className="text-[1.4vw] leading-[1.5] text-muted" style={{textWrap: "pretty"}}>
          That is the surface we built Vessels for.
        </p>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Sources: public filings, NYSE listing data</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">04 / 16</div>
      </div>
    </div>
  );
}
