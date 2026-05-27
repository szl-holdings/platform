export default function ForCostaDiscovery() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[7vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 11 · For Costa · Discovery</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">28 / 40</div>
      </div>

      <h2 className="mt-[4vh] text-[3.4vw] leading-[1.05] font-light tracking-[-0.025em] max-w-[82vw]">
        A subpoena lands. <span className="text-gold font-medium">One click produces the packet.</span>
      </h2>

      <div className="mt-[4vh] grid grid-cols-[1.3fr_1fr] gap-[2vw] flex-1">
        <div className="border border-rule bg-panel p-[1.8vw]">
          <div className="font-mono text-[0.9vw] tracking-[0.2em] text-primary uppercase mb-[1.5vh]">What the export contains</div>
          <pre className="font-mono text-[0.88vw] leading-[1.5] text-text bg-bg p-[1.2vw] border border-rule overflow-x-auto">
{`discovery-export-2026-05-27/
├── manifest.json            # SHA-256 of every file
├── cosign.bundle            # signed by szl-holdings OIDC
├── receipts/
│   ├── lambda-01J9X3.json   # individual Λ-receipts
│   └── ...
├── merkle/
│   ├── root-2026-05-27.json # hourly anchor proofs
│   └── proof-paths.json     # inclusion proofs
├── lean/
│   ├── check.log            # green ✓ TH1–TH8
│   └── theses.lean.zip      # source for re-check
├── grounding/
│   └── citations/           # cited passages w/ provenance
└── README.discovery.md      # how to verify in one shell session`}
          </pre>
        </div>
        <div className="flex flex-col gap-[1.2vw]">
          <div className="border border-gold bg-panel p-[1.4vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[0.8vh]">Verifiable</div>
            <div className="text-[1.05vw] text-text leading-[1.35]">Opposing counsel can verify the packet on their own laptop — no SZL dependency.</div>
          </div>
          <div className="border border-rule bg-panel p-[1.4vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Privileged</div>
            <div className="text-[1.05vw] text-text leading-[1.35]">Counsel-privilege namespace stays redacted unless explicitly waived.</div>
          </div>
          <div className="border border-rule bg-panel p-[1.4vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Defensible</div>
            <div className="text-[1.05vw] text-text leading-[1.35]">Chain of custody is the data — not a story about the data.</div>
          </div>
          <div className="border border-rule bg-panel p-[1.4vw]">
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mb-[0.8vh]">Sealable</div>
            <div className="text-[1.05vw] text-text leading-[1.35]">Per-matter packet, time-scoped, jurisdiction-tagged.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-rule pt-[2vh] mt-[3vh] flex items-end justify-between">
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted uppercase">Discovery in hours · not weeks of associate time</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">28 / 40</div>
      </div>
    </div>
  );
}
