const ALLOC = [
  { pct: 50, label: "Engineering", detail: "4 senior hires (platform, security, ML, devrel) · Lean proof maintenance · open-core release cadence" },
  { pct: 25, label: "Go-to-market", detail: "2 hires (enterprise AE, technical PMM) · first 3 design partners (Dorian + 2 verticals)" },
  { pct: 15, label: "Security & compliance", detail: "SOC 2 Type II · ISO 27001 · CMMC L2 prep · external pen-tests · bug bounty" },
  { pct: 10, label: "Legal & operations", detail: "MSA + DPA templates, jurisdiction coverage NY/UK/EU, accounting, board operations" },
];

const MILESTONES = [
  { m: "Month 3", w: "First 3 paying design partners live · SOC 2 Type I awarded" },
  { m: "Month 6", w: "Sentra + A11oy on 2 verticals beyond shipping · ARR run-rate floor" },
  { m: "Month 12", w: "SOC 2 Type II · ISO 27001 · 8–10 enterprise logos" },
  { m: "Month 18", w: "Federal pilot via UDS air-gap · CMMC L2 conformant" },
  { m: "Month 24", w: "Series B optionality · open-core community traction" },
];

export default function UseOfProceeds() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 16 · Use of proceeds + 24-month plan</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">38 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        Every dollar <span className="text-gold font-medium">spent against a milestone.</span>
      </h2>

      <div className="mt-[3vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="flex flex-col gap-[1vh]">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[0.5vh]">Allocation · $8M</div>
          {ALLOC.map((a) => (
            <div key={a.label} className="border border-rule bg-panel p-[1.3vw]">
              <div className="flex items-baseline justify-between mb-[0.8vh]">
                <div className="text-[1.4vw] font-medium text-text">{a.label}</div>
                <div className="text-[1.8vw] font-light text-gold">{a.pct}%</div>
              </div>
              <div className="w-full h-[5px] bg-bg border border-rule mb-[1vh]">
                <div className="h-full bg-gold" style={{ width: `${a.pct}%` }} />
              </div>
              <div className="text-[0.9vw] text-muted leading-[1.35]">{a.detail}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">24-month milestone ladder</div>
          <div className="border border-gold bg-panel p-[1.5vw] flex-1 flex flex-col gap-[1vh]">
            {MILESTONES.map((m, i) => (
              <div key={m.m} className={`flex gap-[1vw] ${i < MILESTONES.length - 1 ? "border-b border-rule pb-[1vh]" : ""}`}>
                <div className="font-mono text-[0.95vw] tracking-[0.15em] text-gold uppercase w-[5.5vw] shrink-0">{m.m}</div>
                <div className="text-[1vw] text-text leading-[1.4]">{m.w}</div>
              </div>
            ))}
          </div>
          <div className="mt-[1.2vh] border border-rule bg-bg p-[1.2vw] grid grid-cols-3 gap-[1vw]">
            <div><div className="font-mono text-[0.72vw] tracking-[0.2em] text-primary uppercase mb-[0.3vh]">Runway</div><div className="text-[1vw] text-text">24 months</div></div>
            <div><div className="font-mono text-[0.72vw] tracking-[0.2em] text-primary uppercase mb-[0.3vh]">Team end-of-period</div><div className="text-[1vw] text-text">10 FTE</div></div>
            <div><div className="font-mono text-[0.72vw] tracking-[0.2em] text-gold uppercase mb-[0.3vh]">Default-alive at</div><div className="text-[1vw] text-text">Month 18</div></div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[1.8vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Capital efficient by construction · we shipped six products before raising</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">38 / 40</div>
      </div>
    </div>
  );
}
