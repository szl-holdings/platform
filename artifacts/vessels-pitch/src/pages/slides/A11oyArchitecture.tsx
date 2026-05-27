const LAYERS = [
  { n: "L1", name: "SDK / Sidecar", what: "Node, Python, Go, .NET, Rust adapters. Wraps existing model SDKs. <100 LOC integration.", artifact: "@a11oy/sdk · @a11oy/sidecar" },
  { n: "L2", name: "Gateway", what: "mTLS-terminated edge. CSRF + tenant scoping + rate caps. Bypass for loopback sidecars only.", artifact: "api-server: /api/a11oy/*" },
  { n: "L3", name: "Governor", what: "Constitution evaluator (Doctrine v6). License card matcher (Lexicon). Dual-use review queue.", artifact: "@a11oy/governor + @a11oy/core" },
  { n: "L4", name: "Receipt bus", what: "Λ-receipt assembler. SHA-256 link. Hourly Merkle root. SSE + webhook fan-out.", artifact: "@szl/receipts + rosie-uds" },
  { n: "L5", name: "Anchor (optional)", what: "Anchors Merkle root to public registry (sigstore Rekor, OpenTimestamps, or your own).", artifact: "@szl/anchor" },
];

export default function A11oyArchitecture() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[6vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Architecture</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 40</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em]">
        Five layers. <span className="text-gold font-medium">One seam.</span>
      </h2>
      <p className="mt-[1.5vh] text-[1.1vw] text-muted leading-[1.4] max-w-[78vw]">
        Each layer is independently swappable, independently cosign-attested, and addressable through a single OIDC identity.
      </p>

      <div className="mt-[3vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[0.5fr_1.2fr_2.8fr_1.6fr] font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1vh]">
          <div>Layer</div><div>Name</div><div>Responsibility</div><div>Shipping artifact</div>
        </div>
        {LAYERS.map((l, i) => (
          <div key={l.n} className={`grid grid-cols-[0.5fr_1.2fr_2.8fr_1.6fr] px-[1.5vw] py-[1.4vh] text-[1vw] leading-[1.4] ${i < LAYERS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-gold">{l.n}</div>
            <div className="text-text font-medium">{l.name}</div>
            <div className="text-muted">{l.what}</div>
            <div className="font-mono text-[0.85vw] text-muted">{l.artifact}</div>
          </div>
        ))}
      </div>

      <div className="mt-[2vh] border border-gold bg-bg p-[1.4vw] grid grid-cols-4 gap-[1.5vw]">
        <div><div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Latency budget</div><div className="text-[1.1vw] text-text">&lt;15ms gate overhead p95</div></div>
        <div><div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Throughput</div><div className="text-[1.1vw] text-text">10k receipts/s/node</div></div>
        <div><div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Failure mode</div><div className="text-[1.1vw] text-text">Fail closed · audit logged</div></div>
        <div><div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.4vh]">Deploy targets</div><div className="text-[1.1vw] text-text">SaaS · VPC · air-gap</div></div>
      </div>

      <div className="border-t border-rule pt-[1.8vh] mt-[2vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Architecture in @szl-holdings/szl-holdings-platform · packages/a11oy-*</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">06 / 40</div>
      </div>
    </div>
  );
}
