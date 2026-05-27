export default function ForCostaJurisdictions() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 11 · For Costa · Jurisdictions</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">27 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        NYC desk. <span className="text-gold font-medium">London weight.</span> EU residency.
      </h2>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.5vw] flex-1">
        <div className="border border-rule bg-panel p-[1.7vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">United States · NYC</div>
          <div className="text-[1.6vw] font-medium leading-[1.1] mb-[2vh]">OFAC + SDNY discipline</div>
          <ul className="space-y-[0.9vh] text-[0.95vw] leading-[1.4] text-muted">
            <li>— OFAC SDN + Non-SDN, cascaded 50% rule</li>
            <li>— FinCEN reporting templates wired</li>
            <li>— EAR + ITAR export-control flags</li>
            <li>— Discovery export: receipt bundle + hash manifest</li>
            <li>— FRCP 26(f) e-discovery production format</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[1.7vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">United Kingdom · London</div>
          <div className="text-[1.6vw] font-medium leading-[1.1] mb-[2vh]">OFSI + LMAA arbitration</div>
          <ul className="space-y-[0.9vh] text-[0.95vw] leading-[1.4] text-muted">
            <li>— UK OFSI consolidated list (post-Brexit)</li>
            <li>— Maritime sanctions: G7 price cap, attestations</li>
            <li>— P&amp;I club evidence templates</li>
            <li>— LMAA / LCIA-aligned matter timelines</li>
            <li>— Disclosure pilot scheme aware</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[1.7vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">European Union</div>
          <div className="text-[1.6vw] font-medium leading-[1.1] mb-[2vh]">Consolidated + GDPR + AI Act</div>
          <ul className="space-y-[0.9vh] text-[0.95vw] leading-[1.4] text-muted">
            <li>— EU consolidated sanctions list, autoupdate</li>
            <li>— GDPR: hashes-only past PII window</li>
            <li>— EU data residency election at tenant level</li>
            <li>— EU AI Act class-2 disclosure packet ready</li>
            <li>— DORA operational resilience evidence</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">One platform · three regimes · same Λ-chain underneath</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">27 / 40</div>
      </div>
    </div>
  );
}
