const REPOS = [
  { name: "szl-holdings-platform", what: "Canonical monorepo: api-server, A11oy, ROSIE, Sentra, Vessels, Amaru, Conduit", proof: "signed commits · CI gates · SBOM" },
  { name: "a11oy-uds", what: "OCI bundle — A11oy governed execution layer", proof: "cosign · MANIFEST · ATTESTATIONS" },
  { name: "rosie-uds", what: "OCI bundle — ROSIE governed decision fabric", proof: "cosign · MANIFEST" },
  { name: "sentra-uds", what: "OCI bundle — Sentra cyber resilience command", proof: "cosign · MANIFEST" },
  { name: "vessels-uds", what: "OCI bundle — Vessels maritime intelligence + AIS dark detection", proof: "cosign · MANIFEST" },
  { name: "amaru-uds", what: "OCI bundle — Amaru convergent data sync (Andean Ouroboros)", proof: "cosign · MANIFEST" },
];

export default function PublicRepos() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 13 · Proof · Public</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">30 / 40</div>
      </div>

      <h2 className="mt-[2.5vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        What you can see <span className="text-gold font-medium">today, without an NDA.</span>
      </h2>
      <p className="mt-[1.2vh] text-[1.05vw] text-muted leading-[1.4]">
        github.com/szl-holdings · cosign-keyless via GitHub Actions OIDC · OCI images at ghcr.io/szl-holdings
      </p>

      <div className="mt-[2.5vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1.4fr_2.4fr_1.4fr] font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1vh]">
          <div>Repo</div><div>Contents</div><div>Proof artifacts</div>
        </div>
        {REPOS.map((r, i) => (
          <div key={r.name} className={`grid grid-cols-[1.4fr_2.4fr_1.4fr] px-[1.5vw] py-[1.3vh] text-[0.98vw] leading-[1.4] ${i < REPOS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-text">szl-holdings/<span className="text-gold">{r.name}</span></div>
            <div className="text-muted">{r.what}</div>
            <div className="font-mono text-[0.82vw] text-muted">{r.proof}</div>
          </div>
        ))}
      </div>

      <div className="mt-[2vh] border border-gold bg-bg p-[1.4vw]">
        <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">Verify any bundle yourself — copy/paste</div>
        <code className="block font-mono text-[0.88vw] text-text leading-[1.5] whitespace-pre">
{`cosign verify ghcr.io/szl-holdings/a11oy-uds:0.2.0 \\
  --certificate-identity-regexp "https://github.com/szl-holdings/.github/workflows/a11oy-uds-publish.yml@.*" \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com`}
        </code>
      </div>

      <div className="border-t border-rule pt-[1.5vh] mt-[1.8vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Proof on the open record · before any conversation</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">30 / 40</div>
      </div>
    </div>
  );
}
