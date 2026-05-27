const STATS = [
  { n: "18",          l: "Public repos on szl-holdings",    s: "every README HTTP-audited · 285/300 URLs verified live" },
  { n: "5",           l: "UDS bundles · uds-v0.2.0",        s: "a11oy · amaru · rosie · sentra · vessels · 4 assets each · all cosign-verified" },
  { n: "13 + 1",      l: "Ouroboros Thesis DOIs",           s: "v1–v13 on Zenodo · concept DOI 10.5281/zenodo.19944926" },
  { n: "218 / 218",   l: "Ouroboros guardrail tests",       s: "release v6.3.0 · verified 2026-05-12" },
  { n: "0.59 ms",     l: "Measured median Λ₁₀ overhead",    s: "p99 ≤ 1.27 ms · 24,800 HTTP calls · v11 paper" },
  { n: "ρ = 1.000",   l: "Audit-closure ratio",             s: "8,000 / 8,000 governed pairs · Λ₁₀ EXHAUSTIVE-AUDIT" },
];

const TIMELINE = [
  { q: "2024 Q4", what: "Doctrine v6 first issue · Lean TH1–TH3 discharged" },
  { q: "2025 Q1", what: "A11oy core + Λ-receipt envelope GA" },
  { q: "2025 Q2", what: "Sentra readiness rollup live · NIST CSF + ISO 27001" },
  { q: "2025 Q3", what: "Vessels + AIS dark detection in production" },
  { q: "2025 Q4", what: "UDS bundle release flow · cosign-keyless OIDC" },
  { q: "2026 Q1", what: "TH4–TH8 discharged · ROSIE mobile · Conduit (Amaru) live" },
  { q: "2026 Q2", what: "Series A round opens · this room" },
];

export default function Traction() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 14 · Traction</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">33 / 40</div>
      </div>

      <h2 className="mt-[2vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        Numbers, <span className="text-gold font-medium">not slogans.</span>
      </h2>

      <div className="mt-[2.5vh] grid grid-cols-3 grid-rows-2 gap-[1.2vw]">
        {STATS.map((s) => (
          <div key={s.l} className="border border-rule bg-panel p-[1.4vw]">
            <div className="text-[3vw] font-light text-gold leading-[1]">{s.n}</div>
            <div className="font-mono text-[0.8vw] tracking-[0.2em] text-primary uppercase mt-[0.6vh] mb-[0.6vh]">{s.l}</div>
            <div className="text-[0.9vw] text-muted leading-[1.35]">{s.s}</div>
          </div>
        ))}
      </div>

      <div className="mt-[2.5vh] flex-1 border border-gold bg-panel p-[1.5vw]">
        <div className="font-mono text-[0.8vw] tracking-[0.2em] text-gold uppercase mb-[1.2vh]">Build timeline · founder-led · no prior outside capital</div>
        <div className="grid grid-cols-7 gap-[0.6vw] h-full pb-[1vh]">
          {TIMELINE.map((t, i) => (
            <div key={t.q} className={`flex flex-col border-l-2 pl-[0.8vw] ${i === TIMELINE.length - 1 ? "border-gold" : "border-rule"}`}>
              <div className="font-mono text-[0.78vw] tracking-[0.18em] uppercase mb-[0.5vh]" style={{ color: i === TIMELINE.length - 1 ? "#c9b787" : "#06607F" }}>{t.q}</div>
              <div className="text-[0.85vw] text-text leading-[1.35]">{t.what}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-rule pt-[1.3vh] mt-[1.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.88vw] tracking-[0.2em] text-muted uppercase">Built first · raising second · ready for institutional scale</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">33 / 40</div>
      </div>
    </div>
  );
}
