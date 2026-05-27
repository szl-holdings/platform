const SURFACES = [
  { name: "A11oy", url: "/a11oy/", desc: "Brand orchestration layer · web UI" },
  { name: "ROSIE", url: "/rosie/", desc: "Governed decision fabric · web UI + SSE" },
  { name: "ROSIE Mobile", url: "rosie-mobile (Expo)", desc: "Native command surface, same receipts" },
  { name: "Sentra", url: "/sentra/", desc: "Cyber resilience command · readiness rollup" },
  { name: "Vessels", url: "/vessels/", desc: "Maritime intelligence · AIS + sanctions" },
  { name: "Conduit (Amaru)", url: "/conduit/", desc: "Andean Ouroboros · convergent sync UI" },
  { name: "API server", url: "/api/*", desc: "All gates, all routes, single OIDC seam" },
];

export default function LiveNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[6vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 13 · Live in this environment</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">32 / 40</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em]">
        Seven surfaces running <span className="text-gold font-medium">right now.</span>
      </h2>
      <p className="mt-[1.2vh] text-[1.1vw] text-muted leading-[1.4] max-w-[78vw]">
        Not a roadmap. Not "coming soon." Hit them from your laptop after NDA — same URL we are showing you here.
      </p>

      <div className="mt-[3vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1.8fr_3fr] font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1vh]">
          <div>Surface</div><div>Route</div><div>What it serves</div>
        </div>
        {SURFACES.map((s, i) => (
          <div key={s.name} className={`grid grid-cols-[1.2fr_1.8fr_3fr] px-[1.5vw] py-[1.4vh] text-[1vw] leading-[1.4] ${i < SURFACES.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-medium text-text">{s.name}</div>
            <div className="font-mono text-gold">{s.url}</div>
            <div className="text-muted">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Every surface behind authMiddleware({"{required:true}"}) · tenant-scoped at the row</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">32 / 40</div>
      </div>
    </div>
  );
}
