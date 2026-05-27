export default function ForPeterOps() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 09 · For Peter · Operations</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">23 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Week one. <span className="text-gold font-medium">Three workflows. Real impact.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Workflow 1</div>
          <div className="text-[1.7vw] font-medium mb-[1.5vh]">Pre-fixture screen</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Drop counterparty into the gate</li>
            <li>— OFAC + OFSI + EU evaluated in &lt;3s</li>
            <li>— 50% rule cascaded automatically</li>
            <li>— Receipt sealed before charter sent</li>
          </ul>
          <div className="mt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-gold uppercase">Saves: hours per fixture · audit weeks per year</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Workflow 2</div>
          <div className="text-[1.7vw] font-medium mb-[1.5vh]">Charter clause brief</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Ingest 3 CPs into Amaru</li>
            <li>— Ask: "what war-risk + sanctions clauses differ?"</li>
            <li>— Cited diff with clause-level evidence</li>
            <li>— Counsel-shareable receipt out the door</li>
          </ul>
          <div className="mt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-gold uppercase">Saves: a day of legal review per CP</div>
        </div>
        <div className="border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Workflow 3</div>
          <div className="text-[1.7vw] font-medium mb-[1.5vh]">Daily fleet brief</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Auto-assembled from AIS + sanctions + ops feed</li>
            <li>— Every claim cites the source bulletin / log</li>
            <li>— Anomalies flagged with constitution rule fired</li>
            <li>— Streams to your inbox + Slack/Teams</li>
          </ul>
          <div className="mt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-gold uppercase">Saves: a full ops analyst FTE per fleet</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">No prod access · no SSO · no IT lift in week one</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">23 / 40</div>
      </div>
    </div>
  );
}
