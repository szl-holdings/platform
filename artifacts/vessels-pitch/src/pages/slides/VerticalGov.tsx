export default function VerticalGov() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 08 · Vertical · Public Sector / Defense</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">22 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        Air-gapped. <span className="text-gold font-medium">Cosign-attested.</span> Identity-pinned. Jurisdiction-locked.
      </h2>

      <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">Deployment story</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— Each artifact ships as a <span className="text-text">UDS (Unicorn Delivery Service)</span> bundle</li>
            <li>— Bundle = OCI image + cosign signature + MANIFEST + ATTESTATIONS</li>
            <li>— Verify with public sigstore identity — even on an island network</li>
            <li>— BigBang / Iron Bank compatibility — same packaging shape</li>
            <li>— Tenant-pinned to mission identity at boot</li>
          </ul>
        </div>
        <div className="border border-gold bg-panel p-[2vw] flex flex-col">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-gold uppercase mb-[1.5vh]">Programs ready</div>
          <ul className="space-y-[1.3vh] text-[1.1vw] leading-[1.4] text-muted">
            <li>— <span className="text-text">CMMC Level 2 / Level 3</span> — Sentra scores both</li>
            <li>— <span className="text-text">FedRAMP Moderate</span> — control evidence auto-assembled</li>
            <li>— <span className="text-text">IL4 / IL5</span> deployment posture</li>
            <li>— <span className="text-text">EO 14028</span> SBOM + signed artifacts everywhere</li>
            <li>— <span className="text-text">DoD AI Ethical Principles</span> mapped to constitution rules</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">UDS bundle registry: github.com/szl-holdings · ghcr.io/szl-holdings</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">22 / 40</div>
      </div>
    </div>
  );
}
