const ROWS = [
  { domain: "Doctrine",   what: "Ouroboros Thesis v1–v13 · 13 per-version DOIs + 1 concept DOI",   where: "Zenodo · concept DOI 10.5281/zenodo.19944926",                       eval: "all 14 DOIs resolve 200" },
  { domain: "Math",       what: "Lean 4 kernel-verified Λ-gate uniqueness",                         where: "github.com/szl-holdings/lutar-lean/releases/tag/v0.1.0",            eval: "lake build · CI green" },
  { domain: "Runtime",    what: "Ouroboros bounded-loop runtime · 218/218 guardrail tests",         where: "github.com/szl-holdings/ouroboros/releases/tag/v6.3.0",             eval: "tests verified 2026-05-12" },
  { domain: "Bundles",    what: "5 Defense-Unicorns UDS bundles · uds-v0.2.0 · cosign-signed",      where: "a11oy · amaru · rosie · sentra · vessels (4 assets each)",          eval: "71 / 71 assets HTTP 200 + size match" },
  { domain: "Public org", what: "18 public repos · every README HTTP-audited (300 URLs probed)",    where: "github.com/szl-holdings",                                            eval: "285 / 300 live · 8 dead enumerated" },
  { domain: "Measured Λ", what: "v11 paper: 24,800 governed HTTP calls across 8 routes",            where: "Zenodo 10.5281/zenodo.20119582",                                     eval: "median 0.49–0.59 ms · p99 ≤ 1.27 ms · ρ = 1.000" },
  { domain: "Identity",   what: "ORCID · author of record",                                          where: "orcid.org/0009-0001-0110-4173",                                      eval: "200 · public" },
];

export default function VerifiedToday() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 19 · Verified today · No KPIs</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">41 / 44</div>
      </div>

      <h2 className="mt-[2vh] text-[3.2vw] leading-[1.05] font-light tracking-[-0.025em]">
        What is already <span className="text-gold font-medium">on the open record</span> — every row HTTP-probed before this deck shipped.
      </h2>
      <p className="mt-[1.2vh] text-[1.05vw] text-muted leading-[1.4] max-w-[80vw]">
        No revenue chart, no logo wall, no "AI-powered" anything. Just the artifacts that exist, where they live, and how to check them. If any cell is wrong, the link breaks — and you'll see it before I do.
      </p>

      <div className="mt-[2.5vh] flex-1 border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[1fr_2.2fr_2.4fr_1.8fr] font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase border-b border-rule px-[1.5vw] py-[1vh]">
          <div>Domain</div><div>What exists</div><div>Where it lives</div><div>How it's evaluated</div>
        </div>
        {ROWS.map((r, i) => (
          <div key={r.domain} className={`grid grid-cols-[1fr_2.2fr_2.4fr_1.8fr] px-[1.5vw] py-[1.2vh] text-[0.9vw] leading-[1.4] ${i < ROWS.length - 1 ? "border-b border-rule" : ""}`}>
            <div className="font-mono text-gold uppercase tracking-[0.15em] text-[0.78vw] pt-[0.3vh]">{r.domain}</div>
            <div className="text-text">{r.what}</div>
            <div className="font-mono text-[0.8vw] text-muted break-all">{r.where}</div>
            <div className="font-mono text-[0.8vw]" style={{ color: "#8a9b6e" }}>{r.eval}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule pt-[1.4vh] mt-[1.5vh] flex items-end justify-between">
        <div className="font-mono text-[0.86vw] tracking-[0.2em] text-muted uppercase">Receipts before slogans · everything above shipped before this round opened</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">41 / 44</div>
      </div>
    </div>
  );
}
