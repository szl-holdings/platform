export default function SanctionsScreening() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Capability 02 · Sanctions</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">08 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[80vw]">
        Screen every charterer, receiver, broker, and vessel
        <span className="block text-gold font-medium">against every list that matters — continuously.</span>
      </h2>

      <div className="mt-[6vh] grid grid-cols-2 gap-[3vw] flex-1">
        <div className="flex flex-col gap-[2vh]">
          <div className="font-mono text-[1vw] tracking-[0.2em] text-primary uppercase">Watchlists wired in</div>
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">OFAC SDN</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">US Treasury · refreshed daily</div>
            </div>
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">EU Consolidated</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">Council of the EU · live feed</div>
            </div>
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">UK OFSI</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">HM Treasury · live feed</div>
            </div>
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">UN Consolidated</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">Security Council · live feed</div>
            </div>
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">Equasis / Port-state</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">Detention &amp; PSC history</div>
            </div>
            <div className="bg-panel border border-rule px-[1.5vw] py-[2vh]">
              <div className="font-mono text-[0.95vw] text-gold tracking-[0.15em]">Open beneficial-owner</div>
              <div className="text-[1.05vw] text-muted mt-[0.5vh]">UBO registries · corporate veil</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div className="bg-panel border border-rule p-[2vw]">
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-alert uppercase mb-[2vh]">Sample screen · live record</div>
            <div className="font-mono text-[1.1vw] leading-[1.7] text-text">
              <div className="flex justify-between"><span className="text-muted">vessel</span><span>MT MIRA · IMO 9412987</span></div>
              <div className="flex justify-between"><span className="text-muted">charterer</span><span>Sigma Trading FZE</span></div>
              <div className="flex justify-between"><span className="text-muted">UBO match</span><span className="text-alert">3 hops → SDN entity</span></div>
              <div className="flex justify-between"><span className="text-muted">risk score</span><span className="text-alert">87 / 100 · HIGH</span></div>
              <div className="flex justify-between"><span className="text-muted">action</span><span className="text-gold">block fixture · escalate</span></div>
            </div>
          </div>
          <p className="text-[1.25vw] leading-[1.5] text-muted mt-[3vh]" style={{textWrap: "pretty"}}>
            Every screen is timestamped, list-versioned, and produces a signed receipt your compliance team
            can hand to an examiner without a screenshot war.
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Capability 02 of 06</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">08 / 16</div>
      </div>
    </div>
  );
}
