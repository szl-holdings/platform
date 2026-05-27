const PROGRAMS = [
  { name: "NIST CSF 2.0", score: 78, gap: "DETECT.CM-3", color: "#c9b787" },
  { name: "ISO 27001:2022", score: 84, gap: "A.8.16 monitoring", color: "#06607F" },
  { name: "CMMC Level 2", score: 71, gap: "AC.L2-3.1.20", color: "#8a9b6e" },
];

export default function SentraRollup() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 06 · Sentra · Rollup</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[3.6vw] leading-[1.05] font-light tracking-[-0.025em]">
        One page. <span className="text-gold font-medium">Live. Auditor-grade.</span>
      </h2>
      <p className="mt-[1.5vh] text-[1.2vw] text-muted leading-[1.4] max-w-[70vw]">
        Are we ready · what's the gap · who owns the next move. Every cell drills to the Λ-receipts behind it.
      </p>

      <div className="mt-[4vh] grid grid-cols-3 gap-[1.8vw] flex-1">
        {PROGRAMS.map((p) => (
          <div key={p.name} className="border border-rule bg-panel p-[2vw] flex flex-col">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">Program</div>
            <div className="text-[1.8vw] font-medium mb-[2vh]">{p.name}</div>
            <div className="flex items-baseline gap-[1vw] mb-[2vh]">
              <div className="text-[5vw] font-light leading-[1]" style={{ color: p.color }}>{p.score}</div>
              <div className="font-mono text-[1vw] text-muted">/ 100</div>
            </div>
            <div className="w-full h-[6px] bg-bg border border-rule mb-[2vh]">
              <div className="h-full" style={{ width: `${p.score}%`, background: p.color }} />
            </div>
            <div className="font-mono text-[0.85vw] tracking-[0.18em] text-muted uppercase mb-[0.8vh]">Top gap</div>
            <div className="font-mono text-[1.05vw] text-text">{p.gap}</div>
            <div className="mt-auto pt-[2vh] font-mono text-[0.78vw] tracking-[0.15em] text-gold uppercase">→ drill to evidence</div>
          </div>
        ))}
      </div>

      <div className="mt-[3vh] border border-gold bg-panel p-[1.5vw] flex items-center justify-between">
        <div>
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[0.6vh]">For Marina</div>
          <div className="text-[1.2vw] text-text">Auditor receives <span className="text-gold">the same URL</span> you see — no PDF dump, no spreadsheet exchange, no version mismatch.</div>
        </div>
        <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase text-right">
          /readiness/<br />executive-rollup
        </div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Posture as a live API, not a quarterly artifact</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">12 / 26</div>
      </div>
    </div>
  );
}
