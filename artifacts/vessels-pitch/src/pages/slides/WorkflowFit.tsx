export default function WorkflowFit() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 06 · The Fit</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">13 / 16</div>
      </div>

      <h2 className="mt-[5vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.02em] max-w-[80vw]">
        Three desks at Dorian.
        <span className="text-gold font-medium"> One operating layer.</span>
      </h2>

      <div className="mt-[7vh] grid grid-cols-3 gap-[2vw] flex-1">
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">Chartering</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">Fix faster, with the math.</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted flex-1">
            <li>— Pre-fixture TCE per option</li>
            <li>— Bunker-adjusted lane comparison</li>
            <li>— Counterparty risk on the fixture screen</li>
            <li>— Auto-screen broker chain</li>
          </ul>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">Operations</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">See the gap before the email.</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted flex-1">
            <li>— Fleet-wide AIS &amp; ETA monitor</li>
            <li>— Anomaly alerts in Slack / Teams</li>
            <li>— STS &amp; transit hot-zone overlays</li>
            <li>— Port-call deviation diffs</li>
          </ul>
        </div>
        <div className="bg-panel border border-rule p-[2vw] flex flex-col">
          <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">Compliance &amp; Legal</div>
          <div className="text-[2vw] font-medium leading-[1.15] mb-[2vh]">Defensible by default.</div>
          <ul className="space-y-[1vh] text-[1.15vw] leading-[1.4] text-muted flex-1">
            <li>— Continuous OFAC / EU / UK / UN screening</li>
            <li>— Cryptographic decision receipts</li>
            <li>— Counterparty UBO walks</li>
            <li>— Audit-export package on demand</li>
          </ul>
        </div>
      </div>

      <div className="mt-[4vh] flex items-center gap-[3vw] bg-bg border-t border-gold pt-[2.5vh]">
        <div className="font-mono text-[1vw] tracking-[0.2em] text-gold uppercase">Delivery</div>
        <div className="text-[1.3vw] text-text">SSO into existing IDs · API into TMS · Slack / Teams / email alert paths · CSV / PDF audit exports</div>
      </div>

      <div className="flex items-end justify-between border-t border-rule pt-[3vh] mt-[3vh]">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Workflow fit</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">13 / 16</div>
      </div>
    </div>
  );
}
