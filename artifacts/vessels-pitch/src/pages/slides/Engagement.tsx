export default function Engagement() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 17 · Engagement model</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">39 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[4vw] leading-[1.0] font-light tracking-[-0.03em] max-w-[82vw]">
        NDA. MSA. Pilot. Production.
        <span className="block text-gold font-medium mt-[1vh]">Four steps. Ninety days. Three signatures.</span>
      </h2>

      <div className="mt-[5vh] grid grid-cols-4 gap-[1.2vw] flex-1">
        <div className="border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Step 1 · Week 0</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">NDA</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">Mutual, three-day turn. Unlocks all private repos + Lean proofs + UDS bundle source.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Step 2 · Week 1–2</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">MSA + Pilot SOW</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">Choice-of-law set. Pilot fee capped, returnable against year-one production.</div>
        </div>
        <div className="border border-gold bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Step 3 · Day 0–90</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">Pilot · 3 tracks</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">Peter: 2 ops workflows live. Marina: Sentra+A11oy on 1 vertical. Costa: PRISM on 3–5 matters.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Step 4 · Day 90+</div>
          <div className="text-[1.6vw] font-medium mb-[1.5vh]">Production</div>
          <div className="text-[0.95vw] text-muted leading-[1.4]">Fleet-wide rollout · enterprise expansion per vertical · counsel-grade evidence chain in prod.</div>
        </div>
      </div>

      <div className="mt-[4vh] border border-rule bg-bg p-[1.5vw] grid grid-cols-3 gap-[1.5vw]">
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Pilot fee</div>
          <div className="text-[1.1vw] text-text">Capped · returnable against year-one</div>
        </div>
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-primary uppercase mb-[0.4vh]">Data residency</div>
          <div className="text-[1.1vw] text-text">EU · US · UK regions, your election</div>
        </div>
        <div>
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Exit</div>
          <div className="text-[1.1vw] text-text">Full export · receipt bundle · no lock-in</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">We have built it · it works · NDA unlocks it</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">39 / 40</div>
      </div>
    </div>
  );
}
