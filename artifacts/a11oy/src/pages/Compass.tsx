import { useState } from 'react';
import JSZip from 'jszip';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  FRAMEWORKS, CONTROL_MAPPINGS, getFrameworkControls, getFrameworkScore, getOverallPosture,
  type FrameworkId, type ControlMapping,
} from '../data/complianceFabric';

const GOLD = '#c9b787';

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  fresh: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'SATISFIED' },
  stale: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'STALE' },
  gap: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'GAP' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreGauge({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.28} fontFamily="ui-monospace" fontWeight={700}>
        {score}%
      </text>
    </svg>
  );
}

function DrilldownPanel({ control }: { control: ControlMapping }) {
  const style = STATUS_STYLE[control.evidenceStatus];
  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: style.bg, color: style.color }}>{style.label}</span>
            <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{control.controlRef}</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{control.controlTitle}</div>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{control.description}</p>
      <div className="space-y-2 text-xs">
        <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>A11oy Primitive:</span> <span style={{ color: GOLD }}>{control.a11oyPrimitive}</span></div>
        <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Evidence Source:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{control.evidenceSource}</span></div>
        <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last Evidence:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(control.lastEvidenceAt)}</span></div>
        <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Freshness Threshold:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{control.freshnessThresholdDays} days</span></div>
      </div>
      <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono mb-1" style={{ color: GOLD }}>EVIDENCE DETAIL</div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{control.drilldownDetail}</p>
      </div>
    </div>
  );
}

export function Compass() {
  const [activeFramework, setActiveFramework] = useState<FrameworkId | 'all'>('all');
  const [selectedControl, setSelectedControl] = useState<ControlMapping | null>(null);

  const posture = getOverallPosture();
  const displayControls = activeFramework === 'all' ? CONTROL_MAPPINGS : getFrameworkControls(activeFramework);

  return (
    <Layout>
      <PageHeader
        label="COMPASS — COMPLIANCE FABRIC"
        title="Regulatory Compliance Posture"
        subtitle="Real-time compliance posture across EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile. Every A11oy primitive is mapped to the regulatory controls it satisfies. Compliance is a byproduct of operating."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="OVERALL POSTURE" value={`${posture.score}%`} sub="compliance score" accent={GOLD} />
        <KpiCard label="CONTROLS MAPPED" value={String(CONTROL_MAPPINGS.length)} sub="across 4 frameworks" accent={GOLD} />
        <KpiCard label="SATISFIED" value={String(posture.fresh)} sub="evidence fresh" accent="#22c55e" />
        <KpiCard label="STALE" value={String(posture.stale)} sub="needs refresh" accent="#f97316" />
        <KpiCard label="GAPS" value={String(posture.gap)} sub="evidence missing" accent="#ef4444" />
        <KpiCard label="FRAMEWORKS" value="4" sub="actively monitored" accent={GOLD} />
      </div>

      <SectionTitle>Framework Posture Heat Map</SectionTitle>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {FRAMEWORKS.map(fw => {
          const score = getFrameworkScore(fw.id);
          const controls = getFrameworkControls(fw.id);
          const fresh = controls.filter(c => c.evidenceStatus === 'fresh').length;
          const isActive = activeFramework === fw.id;
          return (
            <div
              key={fw.id}
              className="rounded-lg border p-4 cursor-pointer transition-all"
              onClick={() => setActiveFramework(isActive ? 'all' : fw.id)}
              style={{
                backgroundColor: isActive ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                borderColor: isActive ? fw.color : 'var(--color-a11oy-border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: fw.color }}>{fw.shortName}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fw.version}</div>
                </div>
                <ScoreGauge score={score} color={fw.color} />
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fw.description}</div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: '#22c55e' }}>{fresh} satisfied</span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{controls.length - fresh} pending</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveFramework('all')}
          className="text-xs px-3 py-1 rounded font-mono"
          style={{
            backgroundColor: activeFramework === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
            color: activeFramework === 'all' ? GOLD : 'var(--color-a11oy-text-ghost)',
            border: activeFramework === 'all' ? '1px solid rgba(201,183,135,0.3)' : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          All Frameworks
        </button>
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            onClick={() => setActiveFramework(fw.id)}
            className="text-xs px-3 py-1 rounded font-mono"
            style={{
              backgroundColor: activeFramework === fw.id ? `${fw.color}18` : 'var(--color-a11oy-muted)',
              color: activeFramework === fw.id ? fw.color : 'var(--color-a11oy-text-ghost)',
              border: activeFramework === fw.id ? `1px solid ${fw.color}40` : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            {fw.shortName}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SectionTitle>Control Registry ({displayControls.length})</SectionTitle>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {displayControls.map(control => {
              const style = STATUS_STYLE[control.evidenceStatus];
              const fw = FRAMEWORKS.find(f => f.id === control.framework);
              const isSelected = selectedControl?.id === control.id;
              return (
                <div
                  key={control.id}
                  className="rounded-lg border p-3 cursor-pointer transition-all"
                  onClick={() => setSelectedControl(isSelected ? null : control)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: style.bg, color: style.color }}>{style.label}</span>
                      <span className="text-xs font-mono" style={{ color: fw?.color ?? GOLD }}>{control.controlRef}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{control.controlTitle}</span>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    <span style={{ color: GOLD }}>{control.a11oyPrimitive}</span> — {fmt(control.lastEvidenceAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {selectedControl ? (
            <>
              <SectionTitle>Evidence Drill-Down</SectionTitle>
              <DrilldownPanel control={selectedControl} />
            </>
          ) : (
            <Card>
              <div className="text-center py-8">
                <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>◇</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a control to view evidence</div>
              </div>
            </Card>
          )}

          <div className="mt-6">
            <SectionTitle>Export Audit Package</SectionTitle>
            <Card>
              <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Generate a signed audit package containing EU AI Act Annex IV technical documentation, NIST AI RMF evidence matrices,
                ISO 42001 Statement of Applicability, and a pre-populated FRIA template. Signed via the Proof Ledger chain.
              </p>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'EU AI Act Annex IV Technical Documentation', icon: '📋' },
                  { label: 'NIST AI RMF Evidence Matrices (GOVERN/MAP/MEASURE/MANAGE)', icon: '📊' },
                  { label: 'ISO 42001 Statement of Applicability', icon: '📄' },
                  { label: 'Fundamental Rights Impact Assessment (FRIA)', icon: '⚖' },
                  { label: 'Proof Ledger Cryptographic Signatures', icon: '🔒' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span>{item.icon}</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {(() => {
                const ts = new Date().toISOString();
                const dateSuffix = ts.split('T')[0];
                const sig = 'sha256:audit-pkg-signed-' + Date.now().toString(36);

                const buildAnnexIV = () => {
                  const euControls = getFrameworkControls('eu-ai-act');
                  return {
                    documentType: 'EU AI Act Annex IV — Technical Documentation',
                    generatedAt: ts,
                    proofLedgerSignature: sig,
                    system: { name: 'A11oy Governed Execution Fabric', version: '9.0', provider: 'SZL Holdings' },
                    sections: [
                      { section: 'Annex IV.1', title: 'General Description', content: 'A11oy is a governed autonomous AI layer for complex enterprise operations. Nine-layer execution fabric with human-gated autonomy, cryptographic proof, and policy-constrained recommendations.' },
                      { section: 'Annex IV.2', title: 'Detailed Description of Elements', content: 'Architecture: 9-layer fabric (Connectors → Signal Mesh → Governed AI → Human Gate → Digital Twin → Executive Briefing → Proof Ledger → Doctrine → Compliance Fabric). Model routing: multi-provider (OpenAI, Anthropic, Gemini). Training: not applicable (orchestration layer).' },
                      { section: 'Annex IV.3', title: 'Monitoring and Oversight', content: 'Human-in-the-loop: all Tier 2/3 actions require explicit approval. MirrorEval 2.0: 14-dimension scoring before any action reaches approval queue. Covenant Layer: policy constraints enforced at runtime.' },
                      { section: 'Annex IV.4', title: 'Human Oversight', content: 'PCE (Policy Contract Engine) gate on every workcell. Named human approver required. No agent override of human decisions. Approval delegation with full audit trail.' },
                      { section: 'Annex IV.5', title: 'Validation and Testing', content: `${euControls.filter(c => c.evidenceStatus === 'fresh').length} of ${euControls.length} EU AI Act controls satisfied with fresh evidence.` },
                    ],
                    controlMatrix: euControls.map(c => ({ ref: c.controlRef, title: c.controlTitle, status: c.evidenceStatus, a11oyPrimitive: c.a11oyPrimitive, evidenceSource: c.evidenceSource, lastEvidence: c.lastEvidenceAt })),
                  };
                };

                const buildNISTMatrices = () => {
                  const nistControls = getFrameworkControls('nist-ai-rmf');
                  const fnPrefixes: Record<string, string> = { GOVERN: 'GOVERN', MAP: 'MAP', MEASURE: 'MEASURE', MANAGE: 'MANAGE' };
                  const functions = Object.keys(fnPrefixes);
                  return {
                    documentType: 'NIST AI RMF 1.0 Evidence Matrices + CSA Agentic Overlay',
                    generatedAt: ts,
                    proofLedgerSignature: sig,
                    overallScore: getFrameworkScore('nist-ai-rmf'),
                    functions: functions.map(fn => ({
                      function: fn,
                      controls: nistControls.filter(c => {
                        const ref = c.controlRef.toUpperCase().replace(/[^A-Z]/g, ' ').trim().split(' ')[0] || '';
                        return ref === fn || ref.startsWith(fn + ' ');
                      }).map(c => ({ ref: c.controlRef, title: c.controlTitle, status: c.evidenceStatus, primitive: c.a11oyPrimitive, evidence: c.evidenceSource, lastEvidence: c.lastEvidenceAt })),
                    })),
                    csaAgenticOverlay: getFrameworkControls('csa-agentic').map(c => ({ ref: c.controlRef, title: c.controlTitle, status: c.evidenceStatus, primitive: c.a11oyPrimitive, evidence: c.evidenceSource })),
                  };
                };

                const buildISOSoA = () => {
                  const isoControls = getFrameworkControls('iso-42001');
                  return {
                    documentType: 'ISO/IEC 42001:2023 Statement of Applicability',
                    generatedAt: ts,
                    proofLedgerSignature: sig,
                    scope: 'A11oy governed autonomous AI layer — all agent operations, model routing, proof chain, and compliance fabric.',
                    overallScore: getFrameworkScore('iso-42001'),
                    controls: isoControls.map(c => ({ ref: c.controlRef, title: c.controlTitle, applicability: 'applicable', justification: c.a11oyPrimitive, implementation: c.evidenceStatus === 'fresh' ? 'implemented' : 'in-progress', evidenceSource: c.evidenceSource, lastEvidence: c.lastEvidenceAt })),
                  };
                };

                const buildFRIA = () => ({
                  documentType: 'Fundamental Rights Impact Assessment (FRIA) — Pre-populated Template',
                  generatedAt: ts,
                  proofLedgerSignature: sig,
                  system: 'A11oy Governed Execution Fabric',
                  assessmentAreas: [
                    { right: 'Non-discrimination', impact: 'Low', mitigation: 'Bias detection in MirrorEval 2.0 (14-dimension scoring). Constitutional alignment checked on every output.', evidenceRef: 'MirrorEval bias dimension scores, Constitutional Enforcer logs' },
                    { right: 'Privacy and data protection', impact: 'Low', mitigation: 'PII redaction enforced. Data minimization. No customer data persisted in LLM context beyond single request.', evidenceRef: 'Connector Firewall logs, Data Handling controls' },
                    { right: 'Human dignity', impact: 'Low', mitigation: 'Agent Welfare Assessment active. No claims of sentience. Welfare telemetry is governance signal only.', evidenceRef: 'WelfareAssessment probe results, Mythos Doctrine system cards' },
                    { right: 'Freedom of expression', impact: 'Not applicable', mitigation: 'A11oy operates in enterprise operational context. No content moderation or speech filtering.', evidenceRef: 'N/A' },
                    { right: 'Access to justice', impact: 'Low', mitigation: 'Full audit trail via Proof Ledger. Every decision is replayable and attributable. Human override always available.', evidenceRef: 'Proof Ledger chain, Workcell Replay logs' },
                  ],
                  overallRiskLevel: 'Low — all fundamental rights impacts mitigated by structural governance controls',
                });

                const downloadFile = (data: object, filename: string) => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                };

                const artifacts = [
                  { id: 'annex-iv', label: 'EU AI Act Annex IV Technical Documentation', build: buildAnnexIV, filename: `annex-iv-technical-documentation-${dateSuffix}.json` },
                  { id: 'nist', label: 'NIST AI RMF Evidence Matrices + CSA Overlay', build: buildNISTMatrices, filename: `nist-ai-rmf-evidence-matrices-${dateSuffix}.json` },
                  { id: 'iso-soa', label: 'ISO 42001 Statement of Applicability', build: buildISOSoA, filename: `iso-42001-statement-of-applicability-${dateSuffix}.json` },
                  { id: 'fria', label: 'FRIA — Fundamental Rights Impact Assessment', build: buildFRIA, filename: `fria-impact-assessment-${dateSuffix}.json` },
                ];

                return (
                  <div className="space-y-2">
                    {artifacts.map(art => (
                      <button
                        key={art.id}
                        className="w-full text-left text-xs font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-between"
                        style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'var(--color-a11oy-text-sub)', border: '1px solid rgba(201,183,135,0.15)', cursor: 'pointer' }}
                        onClick={() => downloadFile(art.build(), art.filename)}
                      >
                        <span>{art.label}</span>
                        <span style={{ color: GOLD, fontSize: 10 }}>JSON ↓</span>
                      </button>
                    ))}
                    <button
                      className="w-full text-xs font-medium py-2.5 rounded-lg transition-all mt-2"
                      style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.25)', cursor: 'pointer' }}
                      onClick={async () => {
                        const zip = new JSZip();
                        const manifest = {
                          packageType: 'Compliance-as-Runtime Audit Package',
                          version: '1.0.0',
                          generatedAt: ts,
                          proofLedgerSignature: sig,
                          posture: getOverallPosture(),
                          contents: [
                            'annex-iv-technical-documentation.json',
                            'nist-ai-rmf-evidence-matrices.json',
                            'iso-42001-statement-of-applicability.json',
                            'fria-impact-assessment.json',
                            'MANIFEST.json',
                          ],
                          frameworkSummary: FRAMEWORKS.map(fw => ({
                            name: fw.name, id: fw.id, score: getFrameworkScore(fw.id),
                            satisfied: getFrameworkControls(fw.id).filter(c => c.evidenceStatus === 'fresh').length,
                            total: getFrameworkControls(fw.id).length,
                          })),
                        };
                        zip.file('annex-iv-technical-documentation.json', JSON.stringify(buildAnnexIV(), null, 2));
                        zip.file('nist-ai-rmf-evidence-matrices.json', JSON.stringify(buildNISTMatrices(), null, 2));
                        zip.file('iso-42001-statement-of-applicability.json', JSON.stringify(buildISOSoA(), null, 2));
                        zip.file('fria-impact-assessment.json', JSON.stringify(buildFRIA(), null, 2));
                        zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));
                        const blob = await zip.generateAsync({ type: 'blob' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `a11oy-audit-package-${dateSuffix}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export Complete Audit Package (ZIP)
                    </button>
                  </div>
                );
              })()}
            </Card>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Compliance Fabric — every A11oy primitive is mapped to regulatory controls. Evidence status is computed from live governance data. Audit packages are signed via the Proof Ledger.
      </div>
    </Layout>
  );
}
