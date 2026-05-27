export default function AccessCosta() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 15 · Access · Costa</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">36 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Counsel-led. <span className="text-gold font-medium">Evidence-graded.</span> Jurisdiction-correct.
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[1.8vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">1 · NDA template</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Dorian-paper, mutual, NY-law preferred</div>
          <div className="text-[1vw] text-muted">English-law + LMAA seat acceptable. Three-day turn either way.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">2 · Choice-of-law + venue</div>
          <div className="text-[1.3vw] mb-[0.5vh]">For the MSA — SDNY or LCIA/LMAA</div>
          <div className="text-[1vw] text-muted">Splittable: NDA on NY, MSA dual-stack with venue election by counterparty.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">3 · Retention + residency</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Where receipts live, for how long</div>
          <div className="text-[1vw] text-muted">EU/US/UK regions elective. Default 7 years for receipts; hashes-only past PII window.</div>
        </div>
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">4 · 3–5 matters for PRISM pilot</div>
          <div className="text-[1.3vw] mb-[0.5vh]">Live matters Costa wants to run on the platform</div>
          <div className="text-[1vw] text-muted">Sanctions screen, contract surface, matter clock. Privilege preserved by namespace.</div>
        </div>
        <div className="col-span-2 border border-gold bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">5 · London-side contact</div>
          <div className="text-[1.3vw] mb-[0.5vh]">One named partner / solicitor at the London office</div>
          <div className="text-[1vw] text-muted">Same Λ-chain serves NY desk + London matter. One platform, two regimes, one signature path.</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Costa drives — legal owns the gate, we live inside it</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">36 / 40</div>
      </div>
    </div>
  );
}
