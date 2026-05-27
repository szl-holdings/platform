export default function ForPeterICS() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 09 · For Peter · Fleet & Shore Posture</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">24 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        IMO 2025 cyber risk. <span className="text-gold font-medium">Scored continuously. Evidenced automatically.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">What Sentra scores for the fleet</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">OT segregation</span> per vessel class</li>
            <li>— <span className="text-text">ECDIS + bridge system</span> patch posture</li>
            <li>— <span className="text-text">Crew-touched endpoints</span> hygiene</li>
            <li>— <span className="text-text">Remote vendor access</span> windows + receipt of each session</li>
            <li>— <span className="text-text">SMS integration</span> evidence for Safety Management System</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">Standards mapped</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">IMO Resolution MSC.428(98)</span> — cyber risk management in SMS</li>
            <li>— <span className="text-text">BIMCO cyber clause</span> readiness</li>
            <li>— <span className="text-text">IACS UR E26 / E27</span> ship cyber resilience</li>
            <li>— <span className="text-text">NIST 800-82 r3</span> — OT/ICS guide</li>
            <li>— <span className="text-text">IEC 62443</span> components + system</li>
          </ul>
        </div>
      </div>

      <div className="mt-[3vh] border border-rule bg-bg p-[1.5vw] grid grid-cols-3 gap-[2vw]">
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Audit benefit</div><div className="text-[1.1vw] text-text">P&I + class society evidence packet, on demand</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Ops benefit</div><div className="text-[1.1vw] text-text">Drift caught at the receipt, not at the inspection</div></div>
        <div><div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Board benefit</div><div className="text-[1.1vw] text-text">One score per vessel · one rollup per fleet</div></div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Same Sentra that scores the office estate scores the fleet</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">24 / 40</div>
      </div>
    </div>
  );
}
