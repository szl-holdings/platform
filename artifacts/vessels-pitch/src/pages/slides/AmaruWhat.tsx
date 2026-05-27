export default function AmaruWhat() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 05 · Amaru</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">09 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Amaru — <span className="text-gold font-medium">the memory layer.</span>
        <span className="block text-[1.5vw] mt-[1vh] text-muted font-light">Andean ouroboros: data informs decision, decision becomes receipt, receipt becomes new data.</span>
      </h2>

      <div className="mt-[5vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Ingest</div>
          <div className="text-[1.5vw] font-medium mb-[1.5vh]">Domain corpus</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Contracts, charter parties, policy docs</li>
            <li>— Telemetry: AIS, OT, IT logs</li>
            <li>— Counsel matter files, sanctions registers</li>
            <li>— Public research + DOI-indexed citations</li>
          </ul>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Govern</div>
          <div className="text-[1.5vw] font-medium mb-[1.5vh]">Same constitution</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Per-source license + provenance card</li>
            <li>— Tenant scoping at the graph node</li>
            <li>— PII windows + retention policies enforced</li>
            <li>— Counsel privilege preserved by namespace</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Serve</div>
          <div className="text-[1.5vw] font-medium mb-[1.5vh]">Grounded context</div>
          <ul className="space-y-[1vh] text-[1vw] leading-[1.4] text-muted">
            <li>— Cited retrieval, not "trust me" summaries</li>
            <li>— Cosine-scored citations on every answer</li>
            <li>— Read by A11oy at call time, automatically</li>
            <li>— Read by Sentra to assemble evidence dossiers</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2.5vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">No hallucinated charter clauses · no fabricated control evidence</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">09 / 26</div>
      </div>
    </div>
  );
}
