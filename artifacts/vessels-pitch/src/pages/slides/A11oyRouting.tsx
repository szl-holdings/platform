export default function A11oyRouting() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Routing</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">08 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[3.8vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Multi-vendor. <span className="text-gold font-medium">Your policy.</span>
        <span className="block text-[1.4vw] mt-[1vh] text-muted font-light">Lock-in dies at the gate.</span>
      </h2>

      <div className="mt-[5vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">What you get</div>
          <ul className="space-y-[1.5vh] text-[1.2vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">Promoted model picker</span> — your team only sees what's been governance-approved</li>
            <li>— <span className="text-text">Policy-driven failover</span> — if vendor A breaches your terms, route to B in the same call</li>
            <li>— <span className="text-text">Cost + latency telemetry</span> per call, per vendor, per workload</li>
            <li>— <span className="text-text">Tenant-scoped budgets</span> — hard caps per team, per project</li>
            <li>— <span className="text-text">Per-jurisdiction routing</span> — EU traffic stays in EU vendors automatically</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">What it kills</div>
          <ul className="space-y-[1.5vh] text-[1.2vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">Vendor lock-in</span> — your policy is portable, the vendor is not</li>
            <li>— <span className="text-text">Shadow AI</span> — calls outside the gate fail closed</li>
            <li>— <span className="text-text">Surprise license violations</span> — caught at the call, not at audit</li>
            <li>— <span className="text-text">Receipt forgery</span> — Merkle-rooted, identity-pinned, tamper-evident</li>
            <li>— <span className="text-text">"We will get to governance later"</span> — already done</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">One gate · many models · one chain of custody</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">08 / 26</div>
      </div>
    </div>
  );
}
