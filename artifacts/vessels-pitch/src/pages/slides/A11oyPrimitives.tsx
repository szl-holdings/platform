const PRIMS = [
  { tag: "Lexicon", role: "The vocabulary", what: "Every model, dataset, vendor, and license card in one catalog. Versioned, signed, queryable.", api: "/api/a11oy/lexicon/catalog" },
  { tag: "Doctrine", role: "The rules", what: "Versioned policy DSL (v6). Constitution-style rules with dual-use review queue. Scanner-enforced in CI.", api: "/api/a11oy/doctrine/constitutions" },
  { tag: "Constitution", role: "The org instance", what: "Per-tenant binding of Doctrine to local realities — risk appetite, jurisdiction, vendor allow-list.", api: "/api/a11oy/constitution/active" },
  { tag: "Λ-receipt", role: "The output", what: "Sealed envelope: call + license + policy + grounding + I/O hash + Merkle root. Replayable.", api: "/api/rosie/receipts" },
];

export default function A11oyPrimitives() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Primitives</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 40</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Four primitives. <span className="text-gold font-medium">The entire platform composes from these.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[1.8vw] flex-1">
        {PRIMS.map((p) => (
          <div key={p.tag} className="border border-rule bg-panel p-[1.8vw] flex flex-col">
            <div className="flex items-baseline justify-between mb-[1vh]">
              <div className="text-[2.2vw] font-medium text-gold">{p.tag}</div>
              <div className="font-mono text-[0.8vw] tracking-[0.2em] text-muted uppercase">{p.role}</div>
            </div>
            <div className="text-[1.1vw] leading-[1.45] text-muted mb-[1.5vh]">{p.what}</div>
            <div className="mt-auto pt-[1.5vh] border-t border-rule font-mono text-[0.85vw] text-text">{p.api}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">@a11oy/core — KS-18 contextuality witness enforces non-forgeable composition</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">07 / 40</div>
      </div>
    </div>
  );
}
