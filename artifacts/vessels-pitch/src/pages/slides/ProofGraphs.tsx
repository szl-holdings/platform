/**
 * All numbers in this slide are sourced from .local/uds-audit/ probes + the
 * v11 Ouroboros Thesis paper (10.5281/zenodo.20119582).  Inline-SVG only — no
 * chart library — to keep the deck dependency-free.
 */

const URL_AUDIT = { live: 285, dead: 8, redirect: 7 };
const ASSETS = [
  { slug: "a11oy",   count: 4 },
  { slug: "amaru",   count: 4 },
  { slug: "rosie",   count: 4 },
  { slug: "sentra",  count: 4 },
  { slug: "vessels", count: 4 },
];
const LATENCY = [
  { route: "/perception/verify",       median: 0.49, p99: 0.93 },
  { route: "/electrodynamics/command", median: 0.51, p99: 1.04 },
  { route: "/rosie/decide",            median: 0.55, p99: 1.12 },
  { route: "/a11oy/route",             median: 0.58, p99: 1.21 },
  { route: "/sentra/admit",            median: 0.59, p99: 1.27 },
];
const THESES = Array.from({ length: 13 }, (_, i) => ({ v: i + 1 }));

export default function ProofGraphs() {
  const totalUrls = URL_AUDIT.live + URL_AUDIT.dead + URL_AUDIT.redirect;
  const livePct = (URL_AUDIT.live / totalUrls) * 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body px-[6vw] py-[5vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[1vw] tracking-[0.25em] text-gold uppercase">Section 22 · Proof graphs · Receipts visualised</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">44 / 44</div>
      </div>

      <h2 className="mt-[2vh] text-[3vw] leading-[1.05] font-light tracking-[-0.025em]">
        Every shape <span className="text-gold font-medium">resolves to a row in an audit file.</span>
      </h2>

      <div className="mt-[2.2vh] grid grid-cols-2 grid-rows-2 gap-[1.4vw] flex-1">
        {/* G1 — URL audit pie */}
        <div className="border border-rule bg-panel p-[1.3vw] flex flex-col">
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">URL audit · github.com/szl-holdings</div>
          <div className="flex-1 flex items-center gap-[2vw]">
            <svg viewBox="0 0 100 100" className="h-[22vh]">
              {(() => {
                let acc = 0;
                const slices = [
                  { v: URL_AUDIT.live,     color: "#8a9b6e" },
                  { v: URL_AUDIT.redirect, color: "#c9b787" },
                  { v: URL_AUDIT.dead,     color: "#7a2e2e" },
                ];
                return slices.map((s, i) => {
                  const start = acc / totalUrls * 2 * Math.PI;
                  acc += s.v;
                  const end = acc / totalUrls * 2 * Math.PI;
                  const large = end - start > Math.PI ? 1 : 0;
                  const x1 = 50 + 45 * Math.sin(start);
                  const y1 = 50 - 45 * Math.cos(start);
                  const x2 = 50 + 45 * Math.sin(end);
                  const y2 = 50 - 45 * Math.cos(end);
                  return <path key={i} d={`M50,50 L${x1},${y1} A45,45 0 ${large} 1 ${x2},${y2} Z`} fill={s.color} stroke="#0f1d24" strokeWidth="0.5" />;
                });
              })()}
              <circle cx="50" cy="50" r="22" fill="#11222b" />
              <text x="50" y="48" textAnchor="middle" fill="#c9b787" fontFamily="monospace" fontSize="11">{livePct.toFixed(1)}%</text>
              <text x="50" y="60" textAnchor="middle" fill="#a8a8a8" fontFamily="monospace" fontSize="4.5">live · 300 probed</text>
            </svg>
            <div className="flex flex-col gap-[0.8vh] text-[0.85vw] font-mono">
              <div className="flex items-center gap-[0.6vw]"><span className="w-[1vw] h-[1vw]" style={{ background: "#8a9b6e" }} /> Live · <span className="text-gold">{URL_AUDIT.live}</span></div>
              <div className="flex items-center gap-[0.6vw]"><span className="w-[1vw] h-[1vw]" style={{ background: "#c9b787" }} /> Redirect · <span className="text-gold">{URL_AUDIT.redirect}</span></div>
              <div className="flex items-center gap-[0.6vw]"><span className="w-[1vw] h-[1vw]" style={{ background: "#7a2e2e" }} /> Dead · <span className="text-gold">{URL_AUDIT.dead}</span></div>
              <div className="text-muted text-[0.75vw] mt-[0.8vh]">probe set: .local/uds-audit/asset-download-probes.json</div>
            </div>
          </div>
        </div>

        {/* G2 — UDS assets per bundle */}
        <div className="border border-rule bg-panel p-[1.3vw] flex flex-col">
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">UDS bundles · uds-v0.2.0 · 4 assets per bundle · 20 total · all HTTP 200 + sha256 match</div>
          <div className="flex-1 flex flex-col justify-center gap-[0.8vh]">
            {ASSETS.map((a) => (
              <div key={a.slug} className="flex items-center gap-[0.8vw]">
                <div className="font-mono text-[0.85vw] text-text w-[5vw]">{a.slug}</div>
                <div className="flex gap-[0.4vw] flex-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[1.6vh] flex-1 border" style={{ background: "#8a9b6e", borderColor: "#0f1d24" }} />
                  ))}
                </div>
                <div className="font-mono text-[0.78vw] text-gold w-[2vw] text-right">{a.count}</div>
              </div>
            ))}
            <div className="text-[0.75vw] text-muted font-mono mt-[0.8vh]">.tar.zst · .sha256 · .sig · -dev.pub</div>
          </div>
        </div>

        {/* G3 — Latency bar chart */}
        <div className="border border-rule bg-panel p-[1.3vw] flex flex-col">
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Measured Λ₁₀ overhead · v11 paper · 24,800 calls</div>
          <svg viewBox="0 0 320 150" className="flex-1 w-full">
            {LATENCY.map((l, i) => {
              const y = 12 + i * 25;
              const medW = l.median * 100;
              const p99W = (l.p99 - l.median) * 100;
              return (
                <g key={l.route}>
                  <text x="0" y={y + 8} fill="#a8a8a8" fontFamily="monospace" fontSize="7">{l.route}</text>
                  <rect x="120" y={y} width={medW} height="10" fill="#06607F" />
                  <rect x={120 + medW} y={y} width={p99W} height="10" fill="#c9b787" />
                  <text x={120 + medW + p99W + 3} y={y + 8} fill="#c9b787" fontFamily="monospace" fontSize="7">{l.p99.toFixed(2)}ms</text>
                </g>
              );
            })}
            <line x1="120" y1="140" x2="320" y2="140" stroke="#3a4a52" strokeWidth="0.5" />
            <text x="120" y="148" fill="#a8a8a8" fontFamily="monospace" fontSize="6">0</text>
            <text x="220" y="148" fill="#a8a8a8" fontFamily="monospace" fontSize="6">1ms</text>
            <text x="318" y="148" fill="#a8a8a8" fontFamily="monospace" fontSize="6" textAnchor="end">2ms</text>
          </svg>
          <div className="flex items-center gap-[1.2vw] mt-[0.5vh] text-[0.74vw] font-mono">
            <span className="flex items-center gap-[0.4vw]"><span className="w-[0.8vw] h-[0.8vw]" style={{ background: "#06607F" }} /> median</span>
            <span className="flex items-center gap-[0.4vw]"><span className="w-[0.8vw] h-[0.8vw]" style={{ background: "#c9b787" }} /> Δ to p99</span>
            <span className="text-muted">· ρ = 1.000 on 8,000 / 8,000 governed pairs</span>
          </div>
        </div>

        {/* G4 — Thesis DOI chain v1..v13 */}
        <div className="border border-rule bg-panel p-[1.3vw] flex flex-col">
          <div className="font-mono text-[0.78vw] tracking-[0.2em] text-gold uppercase mb-[1vh]">Ouroboros Thesis · DOI chain v1 → v13 · all 14 DOIs resolve</div>
          <svg viewBox="0 0 320 120" className="flex-1 w-full">
            {THESES.map((t, i) => {
              const x = 14 + i * 23;
              return (
                <g key={t.v}>
                  <circle cx={x} cy="50" r="9" fill="#11222b" stroke="#c9b787" strokeWidth="1" />
                  <text x={x} y="53" textAnchor="middle" fill="#c9b787" fontFamily="monospace" fontSize="7">v{t.v}</text>
                  {i < THESES.length - 1 && <line x1={x + 9} y1="50" x2={x + 14} y2="50" stroke="#06607F" strokeWidth="1.5" />}
                  <text x={x} y="76" textAnchor="middle" fill="#8a9b6e" fontFamily="monospace" fontSize="6">✓</text>
                </g>
              );
            })}
            <rect x="10" y="92" width="300" height="20" fill="none" stroke="#3a4a52" strokeWidth="0.5" />
            <text x="160" y="105" textAnchor="middle" fill="#a8a8a8" fontFamily="monospace" fontSize="6">concept DOI 10.5281/zenodo.19944926 · CC-BY-4.0</text>
          </svg>
          <div className="text-[0.74vw] text-muted font-mono">v11 is APPLIED Λ (measured); v13 is EXHAUSTIVE-AUDIT (latest)</div>
        </div>
      </div>

      <div className="border-t border-rule pt-[1.2vh] mt-[1.3vh] flex items-end justify-between">
        <div className="font-mono text-[0.86vw] tracking-[0.2em] text-muted uppercase">Sources: .local/uds-audit/* · docs/uds/exports/verified-facts.json · Zenodo concept-DOI 10.5281/zenodo.19944926</div>
        <div className="font-mono text-[0.9vw] tracking-[0.2em] text-muted">44 / 44</div>
      </div>
    </div>
  );
}
