const PRIVATE_REPOS = [
  { name: "standardgalactic/a11oy-code", what: "Proprietary A11oy primitive algorithms (orchestration kernels, KS-18 witness)", unlock: "Mutual NDA" },
  { name: "szl-holdings/szl-alloy", what: "Alloy prompt kernels, outreach automation, advisory operations", unlock: "NDA + MSA" },
  { name: "szl-holdings/szl-brand", what: "Brand assets, commit history, IP register, Khipu/Pillpintu lineage", unlock: "Mutual NDA" },
  { name: "szl-holdings/dev4_ops", what: "Internal operations payload, runbooks, on-call topology", unlock: "NDA + MSA" },
  { name: "Doctrine v6 + Constitutions", what: "Internal governance ruleset, scanner-enforced in CI", unlock: "MSA + pilot" },
  { name: "Lean 4 Theses (TH1–TH8)", what: "Full proofs behind the receipt calculus + check script", unlock: "Mutual NDA" },
  { name: "Synthesis ledgers (×5)", what: "AGI · perception-bio · electrodynamics · sparse-attention · Ising — research absorbed into SZL primitives", unlock: "Mutual NDA" },
  { name: "UDS bundle registry", what: "Fleet registry: slug+version+OCI+cosign identity regex per bundle", unlock: "NDA" },
];

export default function PrivateRepos() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 13 · Proof · Under NDA</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">31 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        What unlocks <span className="text-gold font-medium">the moment NDA is signed.</span>
      </h2>
      <p className="mt-[1vh] text-[1.05vw] text-muted leading-[1.4]">
        The platform <span className="text-text">has it all</span>. The public face is the cosign-attested edge. The IP — algorithms, kernels, doctrine, proofs — sits behind the gate by design.
      </p>

      <div className="mt-[2.5vh] flex-1 border border-gold bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.7fr_2.4fr_1.1fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.4vw] py-[0.9vh]">
          <div>Asset</div><div>Contents</div><div>Unlock gate</div>
        </div>
        {PRIVATE_REPOS.map((r, i) => (
          <div key={r.name} className={`grid grid-cols-[1.7fr_2.4fr_1.1fr] px-[1.4vw] py-[1.1vh] text-[0.95vw] leading-[1.35] ${i < PRIVATE_REPOS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-text">{r.name}</div>
            <div className="text-muted">{r.what}</div>
            <div className="font-mono text-[0.82vw] text-gold uppercase tracking-[0.15em]">{r.unlock}</div>
          </div>
        ))}
      </div>

      <div className="mt-[1.8vh] grid grid-cols-3 gap-[1.3vw]">
        <div className="border border-rule bg-bg p-[1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-primary uppercase mb-[0.5vh]">Day 0 · post-NDA</div>
          <div className="text-[1.05vw] text-text leading-[1.3]">Read access to all private repos</div>
        </div>
        <div className="border border-rule bg-bg p-[1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-primary uppercase mb-[0.5vh]">Day 0 · post-MSA</div>
          <div className="text-[1.05vw] text-text leading-[1.3]">Tenant in our cloud + cosign-verified bundle for on-prem</div>
        </div>
        <div className="border border-gold bg-bg p-[1.2vw]">
          <div className="font-mono text-[0.75vw] tracking-[0.2em] text-gold uppercase mb-[0.5vh]">Day 30 · pilot</div>
          <div className="text-[1.05vw] text-text leading-[1.3]">Your data, your receipts, your auditor's report</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[1.8vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Private by design · openable by contract</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">31 / 40</div>
      </div>
    </div>
  );
}
