const PILLARS = [
  { name: "Supply chain", how: "Cosign-keyless via GitHub Actions OIDC. SBOM per bundle. Image identity regex pinned per workflow.", verify: "cosign verify ghcr.io/szl-holdings/a11oy-uds:0.2.0" },
  { name: "Identity", how: "OIDC issuer pinning. Tenant-scoped JWTs. mTLS at the gateway. Loopback bypass only for cosigned sidecars.", verify: "Bound to your Okta / Azure / Google IdP" },
  { name: "Policy", how: "OPA-compatible policy bundles. Doctrine v6 scanner runs in CI. Constitution drift flagged before merge.", verify: "doctrine-scanner exit code = 0" },
  { name: "Composition", how: "KS-18 contextuality witness — receipts that compose without the gate are detectable in O(1).", verify: "@a11oy/core ks18 test suite" },
  { name: "Privacy", how: "I/O hashes in receipts — never raw bytes. PII window separate from receipt retention. Right-of-erasure scoped to PII tier.", verify: "Perception-loop serialization test" },
  { name: "Replay", how: "Curry-Howard discipline. Same inputs → bit-identical outputs. Lean theses TH1–TH8 discharge the math.", verify: "scripts/check-lean-build.sh · green" },
];

export default function A11oySecurity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[6vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 04 · A11oy · Security model</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 40</div>
      </div>

      <h2 className="mt-[3vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em]">
        Six pillars. <span className="text-gold font-medium">All independently verifiable.</span>
      </h2>

      <div className="mt-[3vh] grid grid-cols-3 grid-rows-2 gap-[1.5vw] flex-1">
        {PILLARS.map((p) => (
          <div key={p.name} className="border border-rule bg-panel p-[1.5vw] flex flex-col">
            <div className="font-mono text-[0.85vw] tracking-[0.2em] text-primary uppercase mb-[1vh]">{p.name}</div>
            <div className="text-[1vw] text-muted leading-[1.4] mb-[1.5vh]">{p.how}</div>
            <div className="mt-auto pt-[1.2vh] border-t border-rule font-mono text-[0.8vw] text-gold leading-[1.3] break-all">{p.verify}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[2.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Nothing here is "trust us" — every line resolves to a public verification command</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">11 / 40</div>
      </div>
    </div>
  );
}
