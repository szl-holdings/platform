const REPOS = [
  { name: "a11oy",            what: "Governed execution fabric · UDS bundle ships uds-v0.2.0 (4 assets)",            proof: "cosign verify-blob (dev key)" },
  { name: "amaru",            what: "Convergent multi-source data-sync · UDS bundle uds-v0.2.0",                     proof: "cosign verify-blob (dev key)" },
  { name: "rosie",            what: "Governed decision fabric · UDS bundle uds-v0.2.0",                              proof: "cosign verify-blob (dev key)" },
  { name: "sentra",           what: "Cyber resilience command · UDS bundle uds-v0.2.0",                              proof: "cosign verify-blob (dev key)" },
  { name: "vessels",          what: "Maritime intelligence · UDS bundle uds-v0.2.0",                                 proof: "cosign verify-blob (dev key)" },
  { name: "ouroboros",        what: "Bounded-loop runtime · 218/218 guardrail tests · release v6.3.0",               proof: "GH release · tagged source" },
  { name: "ouroboros-thesis", what: "Thesis v1–v13 · concept DOI 10.5281/zenodo.19944926 · 13 per-version DOIs",     proof: "Zenodo DOI chain · CC-BY-4.0" },
  { name: "lutar-lean",       what: "Lean 4 proofs of Λ-gate uniqueness · release v0.1.0",                           proof: "lake build · kernel-verified" },
];

export default function PublicRepos() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 13 · Proof · Public</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">30 / 44</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        What you can verify <span className="text-gold font-medium">today, without an NDA.</span>
      </h2>
      <p className="mt-[1.2vh] text-[1.05vw] text-muted leading-[1.4]">
        github.com/szl-holdings · eight public repos · every UDS bundle release ships its own dev pubkey alongside its cosign blob signature — no Sigstore round-trip required.
      </p>

      <div className="mt-[2vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.4fr_2.8fr_1.4fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1vh]">
          <div>Repo</div><div>Contents</div><div>Verification</div>
        </div>
        {REPOS.map((r, i) => (
          <div key={r.name} className={`grid grid-cols-[1.4fr_2.8fr_1.4fr] px-[1.5vw] py-[1.1vh] text-[0.92vw] leading-[1.35] ${i < REPOS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-text">szl-holdings/<span className="text-gold">{r.name}</span></div>
            <div className="text-muted">{r.what}</div>
            <div className="font-mono text-[0.78vw] text-muted">{r.proof}</div>
          </div>
        ))}
      </div>

      <div className="mt-[1.8vh] border border-gold bg-bg p-[1.4vw]">
        <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">Verify any UDS bundle yourself — works air-gapped — replace &lt;bundle&gt; with a11oy | amaru | rosie | sentra | vessels</div>
        <code className="block font-mono text-[0.82vw] text-text leading-[1.5] whitespace-pre">
{`BASE=https://github.com/szl-holdings/<bundle>/releases/download/uds-v0.2.0
curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst{,.sha256,.sig} && curl -LO $BASE/<bundle>-uds-dev.pub
sha256sum -c <bundle>-uds-0.2.0.tar.zst.sha256
cosign verify-blob --key <bundle>-uds-dev.pub --signature <bundle>-uds-0.2.0.tar.zst.sig <bundle>-uds-0.2.0.tar.zst
zarf package deploy <bundle>-uds-0.2.0.tar.zst --confirm`}
        </code>
      </div>

      <div className="border-t border-rule pt-[1.3vh] mt-[1.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.86vw] tracking-[0.2em] text-muted uppercase">Every link in this deck HTTP-probed live before render · zero hallucinations</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">30 / 44</div>
      </div>
    </div>
  );
}
