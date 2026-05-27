export default function ForMarina() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 10 · For Marina · Enterprise</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">25 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        One control plane. <span className="text-gold font-medium">Every AI call. Every vertical. Every region.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Visibility</div>
          <div className="text-[1.7vw] font-medium mb-[2vh]">What's happening</div>
          <ul className="space-y-[1.2vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Every model call, tagged + costed</li>
            <li>— Shadow AI surfaces (fail-closed at the gate)</li>
            <li>— License-violation events in real time</li>
            <li>— Tenant scoping at the row</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Control</div>
          <div className="text-[1.7vw] font-medium mb-[2vh]">What's allowed</div>
          <ul className="space-y-[1.2vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Doctrine v6 ruleset, versioned</li>
            <li>— Per-tenant constitution binding</li>
            <li>— Vendor allow-list per workload</li>
            <li>— Per-jurisdiction routing</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Evidence</div>
          <div className="text-[1.7vw] font-medium mb-[2vh]">What you can prove</div>
          <ul className="space-y-[1.2vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Sentra rollup per program</li>
            <li>— Dossier per control, auto-assembled</li>
            <li>— Λ-receipt chain per workflow</li>
            <li>— Auditor reads the same URL you do</li>
          </ul>
        </div>
      </div>

      <div className="mt-[3vh] border border-rule bg-bg p-[1.5vw] grid grid-cols-3 gap-[2vw]">
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Time to first dashboard</div><div className="text-[1.1vw] text-text">14 days post-NDA</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Time to first audit-ready packet</div><div className="text-[1.1vw] text-text">45 days</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Vertical expansion</div><div className="text-[1.1vw] text-text">Same chain · re-priced · not re-built</div></div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Pick one vertical to anchor — the platform inherits the proof you make there</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">25 / 40</div>
      </div>
    </div>
  );
}
