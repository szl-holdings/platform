export default function AccessMarina() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 15 · Access · Marina</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">35 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Pilot stays narrow. <span className="text-gold font-medium">Contract scales wide.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">1 · Frameworks in scope</div>
          <div className="text-[1.3vw] mb-[0.5vh]">NIST CSF · ISO 27001 · CMMC · or internal</div>
          <div className="text-[1vw] text-muted">Pick any two. Sentra scores both inside 30 days.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">2 · Identity + SSO read-only</div>
          <div className="text-[1.3vw] mb-[0.5vh]">OIDC or SAML to Okta / Azure / Google</div>
          <div className="text-[1vw] text-muted">Group-mapped to Sentra roles. No write-back at pilot.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">3 · Existing control evidence</div>
          <div className="text-[1.3vw] mb-[0.5vh]">SOC 2 letter · policy library · prior audit findings</div>
          <div className="text-[1vw] text-muted">Sentra ingests, scores, surfaces gaps. Originals stay yours — we hold hashes.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">4 · Model + AI usage list</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Where the org calls LLMs today</div>
          <div className="text-[1vw] text-muted">A11oy wraps those calls; Marina sees license + policy + cost on one dashboard.</div>
        </div>
        <div className="col-span-2 border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">5 · One sponsoring vertical to anchor</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Shipping · finance · ICS · public sector · healthcare · legal</div>
          <div className="text-[1vw] text-muted">Pilot proves it there. Production cutover re-prices per additional vertical — same chain, no rebuild.</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Marina — pick the door · the rest of the house comes with it</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">35 / 40</div>
      </div>
    </div>
  );
}
