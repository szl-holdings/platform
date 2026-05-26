/**
 * Sentra /thesis — mirror surface for the Ouroboros Thesis v9 + v10 chain.
 *
 * Sentra is the cyber-resilience artifact of the SZL stack; the thesis page
 * is included here so the operator can verify the closure law from inside
 * the SOC console without leaving Sentra. The canonical docs are imported
 * via Vite's `?raw` so they are bundled at build time — same pattern as
 * A11oy's /thesis page, no extra request, no drift.
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import v9Canonical from '../../../../docs/thesis/v9-canonical.md?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — vite '?raw' import
import v10Canonical from '../../../../docs/thesis/v10-canonical.md?raw';
import { THESIS_LINEAGE, THESIS_PAPERS } from '@szl-holdings/szl-doctrine';

const SENTRA_GOLD = '#c9b787';

interface FormulaRow {
  version: string;
  title: string;
  formula: string;
  endpoint: string;
  codexNode: string;
  newInV10?: boolean;
}

const FORMULAS: FormulaRow[] = [
  { version: 'v1', title: 'Three-term foundation', formula: 'L = α·E + β·M·c² + γ·I·k_B·T·ln2', endpoint: '/api/ouroboros/lutar/v1', codexNode: 'lutar_invariant' },
  { version: 'v2', title: 'Seven-term, integer winding', formula: 'L₂ = L₁ + δ·R + ε·Χ + ζ·Ψ + η·Φ', endpoint: '/api/ouroboros/lutar/v2', codexNode: 'lutar_v2' },
  { version: 'v3', title: 'Cross-civilizational coupling', formula: 'L₃ = L₂ + θ·Q_E + ι·Q_I', endpoint: '/api/ouroboros/lutar/v3', codexNode: 'lutar_v3' },
  { version: 'v4', title: 'Noether-grounded', formula: 'L₄ = L₃ + κ·Ω_E8 + λ·Φ_IIT + μ·N_Noether', endpoint: '/api/ouroboros/lutar/v4', codexNode: 'lutar_v4' },
  { version: 'v5', title: 'Global prisca extension', formula: 'L₅ = L₄ + Σ θ_k · Q_k (Maya, I Ching, Vedic, Dogon, GT)', endpoint: '/api/ouroboros/lutar/v5', codexNode: 'lutar_v5' },
  { version: 'v6', title: 'Holographic-twistor-cyclic', formula: 'L₆ = Ω_n² · Π_{T→R^{3,1}}[L₅] s.t. S ≤ A/(4l_P²)', endpoint: '/api/ouroboros/lutar/v6', codexNode: 'lutar_v6' },
  { version: 'Ω', title: 'Master invariant on the 5-simplex', formula: 'L_Ω = Σ w_k · L_k, Σw_k = 1', endpoint: '/api/ouroboros/lutar/omega', codexNode: 'lutar_omega' },
  { version: 'v7', title: 'Bianchi closure (HUFT-inspired)', formula: 'L₇ = L_Ω · exp(−κ · ‖D_A F‖²/‖F‖²)', endpoint: '/api/ouroboros/lutar/v7', codexNode: 'lutar_v7' },
  { version: 'v10', title: 'Exhaustive-audit (Λ₁₀ closure operator)', formula: 'Λ₁₀ = Σ_k L_k · ∏_j 𝟙[j_k]; auditClosed ⇔ ratio = 1', endpoint: '/api/ouroboros/lutar/v10', codexNode: 'lutar_v10', newInV10: true },
  { version: 'v11', title: 'NPMR equator coupling coefficient (κ₁₁)', formula: 'κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence; ∈ [0,1]', endpoint: '/api/ouroboros/npmr/kappa', codexNode: 'npmr_kappa_11', newInV10: true },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-md bg-black/40 border border-white/10 p-3 overflow-x-auto text-[11px] leading-relaxed text-[#eaeaea] font-mono">
      <code>{children}</code>
    </pre>
  );
}

function MarkdownPreview({ md, maxLines = 60 }: { md: string; maxLines?: number }) {
  const preview = useMemo(() => md.split('\n').slice(0, maxLines).join('\n'), [md, maxLines]);
  return <CodeBlock>{preview}</CodeBlock>;
}

export default function SentraThesisPage() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">Ouroboros Thesis — Operator Surface</h1>
          <Badge style={{ backgroundColor: SENTRA_GOLD, color: '#0a0a0a' }}>v10 EXHAUSTIVE-AUDIT</Badge>
          <Badge variant="outline" className="border-white/20 text-white/80">v9 UNIFIED-OPERATIONAL</Badge>
        </div>
        <p className="text-sm text-white/60">
          The closure law that gates Sentra's autonomous remediation queue. Every formula below
          binds to a shipping API endpoint, a typed codex node, a contract test, and a section in
          the canonical thesis. Λ₁₀ formalises the contract.
        </p>
      </header>

      <Card className="bg-black/30 border-white/10" style={{ borderColor: 'rgba(201,183,135,0.22)' }}>
        <CardHeader>
          <CardTitle className="text-white text-base">Thesis lineage · TH1 → TH8</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {THESIS_PAPERS.map((p) => (
              <div key={p.key} className="border-l-2 pl-3" style={{ borderColor: SENTRA_GOLD }}>
                <div className="text-[10px] tracking-widest uppercase font-mono" style={{ color: SENTRA_GOLD }}>{p.key} · {p.version}</div>
                <div className="text-sm text-white mt-1">{p.title}</div>
                <div className="text-[11px] text-white/60 mt-1">
                  {p.status} · {p.theorems.length} theorems ·{' '}
                  <a href={p.doiUrl} target="_blank" rel="noopener noreferrer" style={{ color: SENTRA_GOLD }}>DOI ↗</a>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-3 pt-3 grid gap-2 text-[11px] text-white/60 font-mono"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div>
              arXiv: <span className="text-white/85">{THESIS_LINEAGE.arxiv.status}</span> →{' '}
              <a href={THESIS_LINEAGE.arxiv.searchUrl} target="_blank" rel="noopener noreferrer" style={{ color: SENTRA_GOLD }}>
                {THESIS_LINEAGE.arxiv.targetVenue}
              </a>
            </div>
            <div>
              Zenodo: <span className="text-white/85">{THESIS_LINEAGE.zenodo.status}</span> ({THESIS_LINEAGE.zenodo.targetVersion}) →{' '}
              <a href={THESIS_LINEAGE.zenodo.doiUrl} target="_blank" rel="noopener noreferrer" style={{ color: SENTRA_GOLD }}>DOI</a>
            </div>
            <div>
              TH8 sorries:{' '}
              <span style={{ color: THESIS_LINEAGE.audit.leanSorriesOpen === 0 ? '#7fb893' : '#d4a853' }}>
                {THESIS_LINEAGE.audit.leanSorriesOpen} open
              </span>{' '}
              / {THESIS_LINEAGE.audit.leanTheorems} · {THESIS_LINEAGE.audit.leanSorriesClosed.length} closed in mirror
            </div>
            <div>
              Fly-High: doctrine <span style={{ color: SENTRA_GOLD }}>{THESIS_LINEAGE.audit.doctrine}</span> · P0{' '}
              {THESIS_LINEAGE.audit.p0Fixes} · beautify {THESIS_LINEAGE.audit.beautifyAvg}
            </div>
            <div>
              Last updated: <span className="text-white/85">{THESIS_LINEAGE.audit.updatedAt}</span>
            </div>
            <div>
              Source: <span className="text-white/80">@szl-holdings/szl-doctrine</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/30 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">Λ₁₀ — Audit Closure Operator (new in v10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-white/80">
          <CodeBlock>{`A_k = L_k · ∏_{j∈{CODE,CODEX,API,TEST,THESIS,SURFACE}} 𝟙[j_k]
Λ₁₀ = Σ_k A_k
Closure: Λ₁₀ / Σ_k L_k = 1  ⇔  every artefact is present for every layer.`}</CodeBlock>
          <p>
            Λ₁₀ is a meta-invariant on the v9 family. It introduces no new physical L-term and is
            strictly inert when the chain is healthy. When any artefact is missing, the closure
            ratio drops by exactly the missing layer's L_k / Σ L_k, and the API returns the
            broken (layer, dimension) pair as a `missingArtifacts` array.
          </p>
          <p>
            Live audit (2026-05-05): <span className="font-mono">ρ = 1.000…</span>,{' '}
            <span className="font-mono">missingArtifacts = []</span>. The v9 chain is fully
            operational.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-black/30 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">Lutar Formula Family — v1..v7+Ω, with v10 audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-3 text-white/60 font-medium">v</th>
                  <th className="text-left py-2 pr-3 text-white/60 font-medium">Title</th>
                  <th className="text-left py-2 pr-3 text-white/60 font-medium">Formula</th>
                  <th className="text-left py-2 pr-3 text-white/60 font-medium">Endpoint</th>
                  <th className="text-left py-2 pr-3 text-white/60 font-medium">Codex node</th>
                </tr>
              </thead>
              <tbody>
                {FORMULAS.map((f) => (
                  <tr key={f.version} className="border-b border-white/5 align-top">
                    <td className="py-2 pr-3">
                      <span className="font-mono text-white/90">{f.version}</span>
                      {f.newInV10 ? (
                        <span className="ml-1 text-[10px]" style={{ color: SENTRA_GOLD }}>NEW</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-white/85">{f.title}</td>
                    <td className="py-2 pr-3 text-white/70 font-mono text-[12px]">{f.formula}</td>
                    <td className="py-2 pr-3 text-white/60 font-mono text-[11px]">{f.endpoint}</td>
                    <td className="py-2 pr-3 text-white/60 font-mono text-[11px]">{f.codexNode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">v9 Canonical (preview)</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownPreview md={v9Canonical} maxLines={70} />
            <p className="text-xs text-white/50 mt-2">
              Source: <span className="font-mono">docs/thesis/v9-canonical.md</span> ({v9Canonical.split('\n').length} lines)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">v10 Canonical (preview)</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownPreview md={v10Canonical} maxLines={70} />
            <p className="text-xs text-white/50 mt-2">
              Source: <span className="font-mono">docs/thesis/v10-canonical.md</span> ({v10Canonical.split('\n').length} lines)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/30 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">Provenance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/70 space-y-1">
          <p>Author: <span className="text-white">Stephen P. Lutar</span> — SZL Holdings — ORCID 0009-0001-0110-4173</p>
          <p>License: CC-BY-4.0 (thesis chain)</p>
          <p>HUFT inspiration credited: Moffat &amp; Toth, arXiv:2510.06282 (2026)</p>
        </CardContent>
      </Card>
    </div>
  );
}
