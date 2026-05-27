export default function Composition() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 07 · Composition</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">13 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[3.8vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        How the trio composes — <span className="text-gold font-medium">in one call.</span>
      </h2>

      <div className="mt-[5vh] flex-1 flex items-stretch gap-[1vw]">
        <div className="flex-1 border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">t = 0ms</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">User / agent</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">makes a call — "summarize these three contracts for sanctions risk"</div>
        </div>
        <div className="self-center font-mono text-[2vw] text-gold">→</div>
        <div className="flex-1 border border-gold bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">t = 1ms · A11oy</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">Gate</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">license card checked, constitution evaluated, dual-use rule cleared</div>
        </div>
        <div className="self-center font-mono text-[2vw] text-gold">→</div>
        <div className="flex-1 border border-gold bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">t = 5ms · Amaru</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">Ground</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">retrieves the three contracts + current sanctions register, scored citations</div>
        </div>
        <div className="self-center font-mono text-[2vw] text-gold">→</div>
        <div className="flex-1 border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">t = 90ms</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">Model</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">vendor of your choice — Anthropic / OpenAI / self-hosted — under your routing policy</div>
        </div>
        <div className="self-center font-mono text-[2vw] text-gold">→</div>
        <div className="flex-1 border border-gold bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">t = 1.2s · seal</div>
          <div className="text-[1.3vw] font-medium mb-[1vh]">Λ-receipt</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">SHA-256 linked, Merkle-rooted, streamed to Sentra over SSE</div>
        </div>
      </div>

      <div className="mt-[3vh] border border-rule bg-bg p-[1.5vw] grid grid-cols-3 gap-[2vw]">
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.5vh]">Peter sees</div>
          <div className="text-[1.05vw] text-text leading-[1.35]">the answer with cited clauses + risk flags</div>
        </div>
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.5vh]">Marina sees</div>
          <div className="text-[1.05vw] text-text leading-[1.35]">the policy decision logged on the audit board within seconds</div>
        </div>
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.5vh]">Costa sees</div>
          <div className="text-[1.05vw] text-text leading-[1.35]">the Λ-receipt — replayable, citable, jurisdiction-tagged</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">One call. Three surfaces. One chain of custody.</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">13 / 26</div>
      </div>
    </div>
  );
}
