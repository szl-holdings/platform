const COMPS = [
  { name: "Credo AI", raised: "$12.8M", post: "AI governance · 2023" },
  { name: "CalypsoAI", raised: "$23M", post: "AI security · 2023" },
  { name: "Cranium AI", raised: "$25M", post: "AI supply-chain · 2023" },
  { name: "Lakera", raised: "$20M", post: "AI security · 2024" },
  { name: "Robust Intelligence", raised: "$30M", post: "AI risk · 2024 (acq. Cisco)" },
  { name: "Vanta", raised: "$50M (B)", post: "Compliance automation · ref. only" },
];

export default function SeriesA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 16 · Series A · The round</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">37 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        Raising <span className="text-gold font-medium">$8M Series A</span> on <span className="text-gold font-medium">$32M pre · $40M post.</span>
      </h2>
      <p className="mt-[1.2vh] text-[1.1vw] text-muted leading-[1.4] max-w-[78vw]">
        Disciplined founder-led round. Built first, raising second. Anchored at the lower end of the AI-governance Series A band — because we shipped the platform before we asked.
      </p>

      <div className="mt-[3vh] grid grid-cols-[1.4fr_1fr] gap-[1.8vw] flex-1">
        <div className="border border-gold bg-panel p-[1.8vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">Round terms</div>
          <div className="grid grid-cols-2 gap-y-[1.8vh] text-[1.1vw]">
            <div className="text-muted">Round size</div><div className="text-text font-medium">$8M</div>
            <div className="text-muted">Pre-money</div><div className="text-text font-medium">$32M</div>
            <div className="text-muted">Post-money</div><div className="text-text font-medium">$40M</div>
            <div className="text-muted">Dilution</div><div className="text-text font-medium">20%</div>
            <div className="text-muted">Instrument</div><div className="text-text font-medium">Priced equity, standard preferred</div>
            <div className="text-muted">Lead check target</div><div className="text-text font-medium">$3–5M</div>
            <div className="text-muted">Board</div><div className="text-text font-medium">1 investor seat + 1 independent</div>
            <div className="text-muted">Pro-rata</div><div className="text-text font-medium">Standard for lead + major</div>
            <div className="text-muted">Closing</div><div className="text-gold font-medium">90 days from term sheet</div>
          </div>
        </div>
        <div className="border border-rule bg-panel p-[1.5vw] flex flex-col">
          <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1.2vh]">Comparable Series A · AI governance</div>
          <div className="flex-1 flex flex-col gap-[0.7vh]">
            {COMPS.map((c) => (
              <div key={c.name} className="grid grid-cols-[1.4fr_0.6fr] text-[0.9vw] border-b border-rule pb-[0.6vh]">
                <div className="text-text">{c.name} <span className="text-muted text-[0.78vw]">· {c.post}</span></div>
                <div className="font-mono text-gold text-right">{c.raised}</div>
              </div>
            ))}
          </div>
          <div className="mt-[1vh] font-mono text-[0.75vw] tracking-[0.18em] text-muted uppercase">Our ask sits at the disciplined end of the band</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Comps cited from public reporting · do not represent endorsements</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">37 / 40</div>
      </div>
    </div>
  );
}
