export default function Thesis() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 02 · Thesis</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">03 / 26</div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[82vw]">
        <div className="font-mono text-[1.1vw] tracking-[0.3em] text-primary uppercase mb-[3vh]">In one sentence</div>
        <h2 className="text-[5.4vw] leading-[1.0] font-light tracking-[-0.03em]">
          AI is shipping faster than governance.
          <span className="block font-bold text-gold mt-[2vh]">We built the gate that holds.</span>
        </h2>
        <div className="mt-[6vh] grid grid-cols-3 gap-[2vw]">
          <div className="border-l-2 border-gold pl-[1.5vw]">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">We did not build</div>
            <div className="text-[1.3vw] text-muted leading-[1.4]">another model, another chatbot, another vendor marketplace.</div>
          </div>
          <div className="border-l-2 border-gold pl-[1.5vw]">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">We built</div>
            <div className="text-[1.3vw] text-text leading-[1.4]">the seam that every call passes through, governed and sealed.</div>
          </div>
          <div className="border-l-2 border-gold pl-[1.5vw]">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">The output</div>
            <div className="text-[1.3vw] text-text leading-[1.4]">is a Λ-receipt — your evidence layer for every AI action your org takes.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">That is the whole company. Everything after is mechanics.</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">03 / 26</div>
      </div>
    </div>
  );
}
