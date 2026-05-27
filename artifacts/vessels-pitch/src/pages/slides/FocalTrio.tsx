const TRIO = [
  { tag: "A11oy", role: "The gate", line: "Every model call is wrapped: license, policy, provenance attached, Λ-receipt produced.", color: "#c9b787" },
  { tag: "Amaru", role: "The memory", line: "Convergent data sync. Your domain knowledge graph, queried under the same governance.", color: "#06607F" },
  { tag: "Sentra", role: "The posture", line: "Continuous NIST CSF / ISO 27001 / CMMC scoring, reading from the same receipt stream.", color: "#8a9b6e" },
];

export default function FocalTrio() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 03 · Trio</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">04 / 26</div>
      </div>

      <h2 className="mt-[4vh] text-[4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Three products. <span className="text-gold font-medium">One substrate.</span>
        <span className="block text-[1.5vw] mt-[1vh] text-muted font-light">Each ships today as a cosign-signed UDS bundle. You can verify them before the meeting ends.</span>
      </h2>

      <div className="mt-[6vh] grid grid-cols-3 gap-[2vw] flex-1">
        {TRIO.map((p) => (
          <div key={p.tag} className="border border-rule bg-panel p-[2vw] flex flex-col">
            <div className="flex items-baseline justify-between mb-[1.5vh]">
              <div className="text-[2.8vw] font-medium" style={{ color: p.color }}>{p.tag}</div>
              <div className="font-mono text-[0.75vw] tracking-[0.2em] text-muted uppercase">cosign · UDS</div>
            </div>
            <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[2vh]">{p.role}</div>
            <div className="text-[1.2vw] leading-[1.45] text-muted">{p.line}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">A11oy gates · Amaru remembers · Sentra grades</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">04 / 26</div>
      </div>
    </div>
  );
}
