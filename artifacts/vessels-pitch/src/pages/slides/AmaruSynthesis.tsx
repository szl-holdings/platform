export default function AmaruSynthesis() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 05 · Amaru · Synthesis</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">10 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        One graph, <span className="text-gold font-medium">three readers.</span>
      </h2>

      <div className="mt-[5vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Reader · Peter</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">Operations</div>
          <div className="text-[1.05vw] text-muted leading-[1.45]">Ingest charter parties, P&amp;I bulletins, ops runbooks. Daily ops briefs cite the actual clause, the actual bulletin, the actual runbook line.</div>
          <div className="mt-auto pt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-muted uppercase">Citations · grounded · auditable</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Reader · Marina</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">Enterprise</div>
          <div className="text-[1.05vw] text-muted leading-[1.45]">Ingest policies, control evidence, SOC 2 letters, vendor docs. Sentra reads the same graph to assemble evidence dossiers per NIST control.</div>
          <div className="mt-auto pt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-muted uppercase">Evidence assembly · per control</div>
        </div>
        <div className="border border-gold bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Reader · Costa</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">Counsel</div>
          <div className="text-[1.05vw] text-muted leading-[1.45]">Ingest matter files, sanctions registers, prior memos. PRISM queries them under privilege — citations preserved, originals never copied.</div>
          <div className="mt-auto pt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-gold uppercase">Privilege · preserved · cited</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2.5vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">The loop closes — each receipt is feedstock for the next</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">10 / 26</div>
      </div>
    </div>
  );
}
