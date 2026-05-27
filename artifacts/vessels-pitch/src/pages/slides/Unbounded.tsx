const PILLARS = [
  {
    head: "Λ-gate at frontier scale",
    body: "Receipt-bus on dedicated H200/B200 cluster (~10⁴ GPU-hours / month allocated to perception-loop + Lean discharge).  TH9 → TH20 — graded receipts, anchored Merkle root, side-channel bounds, multi-party composition, post-quantum signature track.  Throughput target: 10⁶ governed inferences / day audit-closed at ρ ≥ 0.999.",
  },
  {
    head: "Doctrine as living artefact",
    body: "Real-time corpus governance: every public model release, every academic preprint, every doctrine drift event auto-ingested through Amaru, classified against Doctrine v6, the contradiction probe escalated to human review.  Output: a continuously machine-checked governance ledger for the AI commons.",
  },
  {
    head: "Sovereign AI substrates",
    body: "Air-gapped Defense Unicorns clusters in 3 ally jurisdictions (UK · DE · AU).  Each ships its own UDS mesh node, mirrors the Lean kernel, runs its own KS-18 witness.  Sovereignty without fragmentation.",
  },
  {
    head: "Vertical receipt formats",
    body: "Maritime (IMO-aware), financial (BCBS-239 + EU AI Act Annex IV), pharma (FDA 21 CFR Part 11), legal (FRE 901/902 admissibility).  Each format is its own published JSON-LD context, its own Lean refinement of the base receipt type, its own counterparty test suite.",
  },
  {
    head: "Education & open science",
    body: "Ouroboros Thesis becomes a published monograph (open access).  Lutar Invariant ported to Mathlib upstream.  University-track contracts (3 institutions) for the Λ-receipt curriculum.  AGI-stack synthesis ledger maintained quarterly as the canonical absorption record for the field.",
  },
  {
    head: "Constitutional AI compute",
    body: "What every other governance vendor wants but can't ship: governance as compute primitive, not as wrapper.  Frontier model providers integrate Λ-gate at training time, not inference time — provenance becomes a property of the weights, not a sticker on the response.",
  },
];

export default function Unbounded() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 21 · Unbounded · If capital is not the constraint</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">43 / 44</div>
      </div>

      <h2 className="mt-[2vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        With <span className="text-gold font-medium">compute and patient capital</span> as primitives, not constraints — what becomes possible.
      </h2>
      <p className="mt-[1.2vh] text-[1.05vw] text-muted leading-[1.4] max-w-[80vw]">
        Same doctrine, same kernel, same Λ-receipt envelope — just the runway to let it become infrastructure.  Each pillar is staffable; none requires invention beyond what's already discharged in Lean.
      </p>

      <div className="mt-[2.5vh] grid grid-cols-3 grid-rows-2 gap-[1.2vw] flex-1">
        {PILLARS.map((p) => (
          <div key={p.head} className="border border-rule bg-panel p-[1.3vw] flex flex-col">
            <div className="font-mono text-[0.82vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">{p.head}</div>
            <div className="text-[0.86vw] text-muted leading-[1.45]">{p.body}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[1.3vh] mt-[1.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.86vw] tracking-[0.2em] text-muted uppercase">Ambition stated as engineering work, not as moonshot · every pillar reduces to math already done</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">43 / 44</div>
      </div>
    </div>
  );
}
