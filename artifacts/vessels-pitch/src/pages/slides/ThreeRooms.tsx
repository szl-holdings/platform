const ROOMS = [
  { who: "Peter", role: "Operations", q: "How does this make Dorian run safer and faster?", color: "#c9b787" },
  { who: "Marina", role: "Enterprise", q: "How does this scale across the org and into other verticals?", color: "#06607F" },
  { who: "Costa", role: "Counsel · NYC + London", q: "How does this hold up in court, arbitration, and sanctions audit?", color: "#c9b787" },
];

export default function ThreeRooms() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 01 · Audience</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">02 / 26</div>
      </div>

      <h2 className="mt-[5vh] text-[4.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[80vw]">
        Three rooms. <span className="text-gold font-medium">One platform.</span>
        <span className="block text-[1.6vw] mt-[1vh] text-muted font-light">Each room walks out with a different answer to the same evidence chain.</span>
      </h2>

      <div className="mt-[7vh] grid grid-cols-3 gap-[2vw] flex-1">
        {ROOMS.map((r) => (
          <div key={r.who} className="border border-rule bg-panel p-[2vw] flex flex-col">
            <div className="font-mono text-[0.95vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">{r.role}</div>
            <div className="text-[3vw] font-medium leading-[1.05] mb-[3vh]" style={{ color: r.color }}>{r.who}</div>
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-muted uppercase mb-[1vh]">walks out asking</div>
            <div className="text-[1.3vw] leading-[1.4] text-text">{r.q}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[2.5vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Three audiences · one Λ-receipt chain underneath</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">02 / 26</div>
      </div>
    </div>
  );
}
