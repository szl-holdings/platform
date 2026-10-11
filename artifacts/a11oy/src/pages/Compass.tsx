import JSZip from 'jszip';
import { useState } from 'react';
import { Layout } from '../components/layout';
import { Card, KpiCard, PageHeader, SectionTitle } from '../components/ui';
import {
  CONTROL_MAPPINGS,
  type ControlMapping,
  FRAMEWORKS,
  type FrameworkId,
  getFrameworkControls,
  getFrameworkScore,
  getOverallPosture,
} from '../data/complianceFabric';

const GOLD = '#c9b787';

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  fresh: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'MAPPED CURRENT' },
  stale: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'STALE FIXTURE' },
  gap: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'MAPPING GAP' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ScoreGauge({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <title>Fixture mapping completeness: {score}%</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.28}
        fontFamily="ui-monospace"
        fontWeight={700}
      >
        {score}%
      </text>
    </svg>
  );
}

function DrilldownPanel({ control }: { control: ControlMapping }) {
  const style = STATUS_STYLE[control.evidenceStatus];
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--color-a11oy-card)',
        borderColor: 'var(--color-a11oy-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {style.label}
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {control.controlRef}
            </span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
            {control.controlTitle}
          </div>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
        {control.description}
      </p>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            A11oy Primitive:
          </span>{' '}
          <span style={{ color: GOLD }}>{control.a11oyPrimitive}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Evidence Source:
          </span>{' '}
          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{control.evidenceSource}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Last Evidence:
          </span>{' '}
          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {fmt(control.lastEvidenceAt)}
          </span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Freshness Threshold:
          </span>{' '}
          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {control.freshnessThresholdDays} days
          </span>
        </div>
      </div>
      <div
        className="mt-3 p-3 rounded"
        style={{
          backgroundColor: 'var(--color-a11oy-deep)',
          border: '1px solid var(--color-a11oy-border)',
        }}
      >
        <div className="text-xs font-mono mb-1" style={{ color: GOLD }}>
          EVIDENCE DETAIL
        </div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          {control.drilldownDetail}
        </p>
      </div>
    </div>
  );
}

export function Compass() {
  const [activeFramework, setActiveFramework] = useState<FrameworkId | 'all'>('all');
  const [selectedControl, setSelectedControl] = useState<ControlMapping | null>(null);

  const posture = getOverallPosture();
  const displayControls =
    activeFramework === 'all' ? CONTROL_MAPPINGS : getFrameworkControls(activeFramework);

  return (
    <Layout>
      <PageHeader
        label="COMPASS — COMPLIANCE FABRIC"
        title="Regulatory Compliance Posture"
        subtitle="Deterministic control-mapping fixtures for EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile. Mappings and scores are not certification, legal advice, or evidence of compliance."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard
          label="FIXTURE POSTURE"
          value={`${posture.score}%`}
          sub="mapping completeness"
          accent={GOLD}
        />
        <KpiCard
          label="CONTROLS MAPPED"
          value={String(CONTROL_MAPPINGS.length)}
          sub="fixture set · 4 frameworks"
          accent={GOLD}
        />
        <KpiCard
          label="MAPPED CURRENT"
          value={String(posture.fresh)}
          sub="seeded evidence dates"
          accent="#22c55e"
        />
        <KpiCard
          label="STALE FIXTURES"
          value={String(posture.stale)}
          sub="seeded dates"
          accent="#f97316"
        />
        <KpiCard
          label="MAPPING GAPS"
          value={String(posture.gap)}
          sub="fixture evidence absent"
          accent="#ef4444"
        />
        <KpiCard label="FRAMEWORKS" value="4" sub="mapped fixtures" accent={GOLD} />
      </div>

      <SectionTitle>Framework Posture Heat Map</SectionTitle>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {FRAMEWORKS.map((fw) => {
          const score = getFrameworkScore(fw.id);
          const controls = getFrameworkControls(fw.id);
          const fresh = controls.filter((c) => c.evidenceStatus === 'fresh').length;
          const isActive = activeFramework === fw.id;
          return (
            <button
              type="button"
              key={fw.id}
              className="w-full rounded-lg border p-4 cursor-pointer text-left transition-all"
              onClick={() => setActiveFramework(isActive ? 'all' : fw.id)}
              style={{
                backgroundColor: isActive ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                borderColor: isActive ? fw.color : 'var(--color-a11oy-border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: fw.color }}>
                    {fw.shortName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {fw.version}
                  </div>
                </div>
                <ScoreGauge score={score} color={fw.color} />
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                {fw.description}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: '#22c55e' }}>{fresh} mapped current</span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {controls.length - fresh} pending
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveFramework('all')}
          className="text-xs px-3 py-1 rounded font-mono"
          style={{
            backgroundColor:
              activeFramework === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
            color: activeFramework === 'all' ? GOLD : 'var(--color-a11oy-text-ghost)',
            border:
              activeFramework === 'all'
                ? '1px solid rgba(201,183,135,0.3)'
                : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          All Frameworks
        </button>
        {FRAMEWORKS.map((fw) => (
          <button
            type="button"
            key={fw.id}
            onClick={() => setActiveFramework(fw.id)}
            className="text-xs px-3 py-1 rounded font-mono"
            style={{
              backgroundColor:
                activeFramework === fw.id ? `${fw.color}18` : 'var(--color-a11oy-muted)',
              color: activeFramework === fw.id ? fw.color : 'var(--color-a11oy-text-ghost)',
              border:
                activeFramework === fw.id ? `1px solid ${fw.color}40` : '1px solid transparent',
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
            {displayControls.map((control) => {
              const style = STATUS_STYLE[control.evidenceStatus];
              const fw = FRAMEWORKS.find((f) => f.id === control.framework);
              const isSelected = selectedControl?.id === control.id;
              return (
                <button
                  type="button"
                  key={control.id}
                  className="w-full rounded-lg border p-3 cursor-pointer text-left transition-all"
                  onClick={() => setSelectedControl(isSelected ? null : control)}
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(201,183,135,0.03)'
                      : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                      <span className="text-xs font-mono" style={{ color: fw?.color ?? GOLD }}>
                        {control.controlRef}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-a11oy-text)' }}
                      >
                        {control.controlTitle}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    <span style={{ color: GOLD }}>{control.a11oyPrimitive}</span> —{' '}
                    {fmt(control.lastEvidenceAt)}
                  </div>
                </button>
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
                <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>
                  ◇
                </div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Select a control to view evidence
                </div>
              </div>
            </Card>
          )}

          <div className="mt-6">
            <SectionTitle>Export Draft Mapping Package</SectionTitle>
            <Card>
              <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Generate an unsigned demonstration bundle containing draft mappings and templates.
                It is not an audit opinion, certification package, legal assessment, or Proof Ledger
                receipt.
              </p>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Draft EU AI Act Annex IV template', icon: '📋' },
                  { label: 'Fixture NIST AI RMF mappings', icon: '📊' },
                  { label: 'Draft ISO 42001 applicability template', icon: '📄' },
                  { label: 'Unreviewed FRIA template', icon: '⚖' },
                  { label: 'Unsigned manifest — no cryptographic receipt', icon: '◇' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span>{item.icon}</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {(() => {
                const ts = new Date().toISOString();
                const dateSuffix = ts.split('T')[0];
                const artifactBoundary = 'DEMO_FIXTURE_UNSIGNED_NOT_A_COMPLIANCE_DETERMINATION';

                const buildAnnexIV = () => {
                  const euControls = getFrameworkControls('eu-ai-act');
                  return {
                    documentType: 'DRAFT EU AI Act Annex IV mapping template',
                    generatedAt: ts,
                    artifactBoundary,
                    proofLedgerSignature: null,
                    system: {
                      name: 'A11oy candidate demonstration',
                      version: 'unreleased',
                      provider: 'SZL Holdings',
                    },
                    sections: [
                      {
                        section: 'Annex IV.1',
                        title: 'General Description',
                        content:
                          'Candidate design for governed AI orchestration; deployment-specific scope and evidence are not supplied by this fixture.',
                      },
                      {
                        section: 'Annex IV.2',
                        title: 'Detailed Description of Elements',
                        content:
                          'Target architecture mapping: connectors, signals, policy gates, human approval, evaluation, and evidence. Provider and deployment admission must be verified separately.',
                      },
                      {
                        section: 'Annex IV.3',
                        title: 'Monitoring and Oversight',
                        content:
                          'Target controls include human approval and evaluation. This template does not demonstrate their operation in a production deployment.',
                      },
                      {
                        section: 'Annex IV.4',
                        title: 'Human Oversight',
                        content:
                          'Target design requires named approvers and fail-closed policy gates. Exact deployment evidence remains required.',
                      },
                      {
                        section: 'Annex IV.5',
                        title: 'Validation and Testing',
                        content: `${euControls.filter((c) => c.evidenceStatus === 'fresh').length} of ${euControls.length} fixture mappings have seeded current dates; this is not a compliance result.`,
                      },
                    ],
                    controlMatrix: euControls.map((c) => ({
                      ref: c.controlRef,
                      title: c.controlTitle,
                      status: c.evidenceStatus,
                      a11oyPrimitive: c.a11oyPrimitive,
                      evidenceSource: c.evidenceSource,
                      lastEvidence: c.lastEvidenceAt,
                    })),
                  };
                };

                const buildNISTMatrices = () => {
                  const nistControls = getFrameworkControls('nist-ai-rmf');
                  const fnPrefixes: Record<string, string> = {
                    GOVERN: 'GOVERN',
                    MAP: 'MAP',
                    MEASURE: 'MEASURE',
                    MANAGE: 'MANAGE',
                  };
                  const functions = Object.keys(fnPrefixes);
                  return {
                    documentType: 'DEMO NIST AI RMF 1.0 mapping matrix + CSA Agentic overlay',
                    generatedAt: ts,
                    artifactBoundary,
                    proofLedgerSignature: null,
                    fixtureMappingScore: getFrameworkScore('nist-ai-rmf'),
                    functions: functions.map((fn) => ({
                      function: fn,
                      controls: nistControls
                        .filter((c) => {
                          const ref =
                            c.controlRef
                              .toUpperCase()
                              .replace(/[^A-Z]/g, ' ')
                              .trim()
                              .split(' ')[0] || '';
                          return ref === fn || ref.startsWith(`${fn} `);
                        })
                        .map((c) => ({
                          ref: c.controlRef,
                          title: c.controlTitle,
                          status: c.evidenceStatus,
                          primitive: c.a11oyPrimitive,
                          evidence: c.evidenceSource,
                          lastEvidence: c.lastEvidenceAt,
                        })),
                    })),
                    csaAgenticOverlay: getFrameworkControls('csa-agentic').map((c) => ({
                      ref: c.controlRef,
                      title: c.controlTitle,
                      status: c.evidenceStatus,
                      primitive: c.a11oyPrimitive,
                      evidence: c.evidenceSource,
                    })),
                  };
                };

                const buildISOSoA = () => {
                  const isoControls = getFrameworkControls('iso-42001');
                  return {
                    documentType: 'DRAFT ISO/IEC 42001:2023 applicability template',
                    generatedAt: ts,
                    artifactBoundary,
                    proofLedgerSignature: null,
                    scope: 'Unapproved candidate scope; deployment owner review required.',
                    fixtureMappingScore: getFrameworkScore('iso-42001'),
                    controls: isoControls.map((c) => ({
                      ref: c.controlRef,
                      title: c.controlTitle,
                      applicability: 'candidate-mapping',
                      justification: c.a11oyPrimitive,
                      implementation:
                        c.evidenceStatus === 'fresh' ? 'fixture-current' : 'fixture-incomplete',
                      evidenceSource: c.evidenceSource,
                      lastEvidence: c.lastEvidenceAt,
                    })),
                  };
                };

                const buildFRIA = () => ({
                  documentType: 'UNREVIEWED FRIA demonstration template',
                  generatedAt: ts,
                  artifactBoundary,
                  proofLedgerSignature: null,
                  system: 'A11oy candidate demonstration',
                  assessmentAreas: [
                    {
                      right: 'Non-discrimination',
                      impact: 'UNASSESSED',
                      mitigation:
                        'Candidate evaluation and approval controls require deployment evidence.',
                      evidenceRef: 'NOT PROVIDED — fixture only',
                    },
                    {
                      right: 'Privacy and data protection',
                      impact: 'UNASSESSED',
                      mitigation:
                        'Candidate data minimization and redaction controls require deployment evidence.',
                      evidenceRef: 'NOT PROVIDED — fixture only',
                    },
                    {
                      right: 'Human dignity',
                      impact: 'UNASSESSED',
                      mitigation:
                        'Human oversight and operator review require deployment evidence.',
                      evidenceRef: 'NOT PROVIDED — fixture only',
                    },
                    {
                      right: 'Freedom of expression',
                      impact: 'UNASSESSED',
                      mitigation: 'Deployment purpose and affected persons must be assessed.',
                      evidenceRef: 'NOT PROVIDED — fixture only',
                    },
                    {
                      right: 'Access to justice',
                      impact: 'UNASSESSED',
                      mitigation:
                        'Appeal, traceability, and human override controls require deployment evidence.',
                      evidenceRef: 'NOT PROVIDED — fixture only',
                    },
                  ],
                  overallRiskLevel:
                    'UNASSESSED — qualified legal and deployment-owner review required',
                });

                const downloadFile = (data: object, filename: string) => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                };

                const artifacts = [
                  {
                    id: 'annex-iv',
                    label: 'Draft Annex IV mapping template',
                    build: buildAnnexIV,
                    filename: `DEMO-UNSIGNED-annex-iv-${dateSuffix}.json`,
                  },
                  {
                    id: 'nist',
                    label: 'Fixture NIST + CSA mapping matrix',
                    build: buildNISTMatrices,
                    filename: `DEMO-UNSIGNED-nist-mappings-${dateSuffix}.json`,
                  },
                  {
                    id: 'iso-soa',
                    label: 'Draft ISO 42001 applicability template',
                    build: buildISOSoA,
                    filename: `DEMO-UNSIGNED-iso-42001-${dateSuffix}.json`,
                  },
                  {
                    id: 'fria',
                    label: 'Unreviewed FRIA template',
                    build: buildFRIA,
                    filename: `DEMO-UNSIGNED-fria-${dateSuffix}.json`,
                  },
                ];

                return (
                  <div className="space-y-2">
                    {artifacts.map((art) => (
                      <button
                        type="button"
                        key={art.id}
                        className="w-full text-left text-xs font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: 'rgba(201,183,135,0.06)',
                          color: 'var(--color-a11oy-text-sub)',
                          border: '1px solid rgba(201,183,135,0.15)',
                          cursor: 'pointer',
                        }}
                        onClick={() => downloadFile(art.build(), art.filename)}
                      >
                        <span>{art.label}</span>
                        <span style={{ color: GOLD, fontSize: 10 }}>JSON ↓</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="w-full text-xs font-medium py-2.5 rounded-lg transition-all mt-2"
                      style={{
                        backgroundColor: 'rgba(201,183,135,0.12)',
                        color: GOLD,
                        border: '1px solid rgba(201,183,135,0.25)',
                        cursor: 'pointer',
                      }}
                      onClick={async () => {
                        const zip = new JSZip();
                        const manifest = {
                          packageType: 'DEMO UNSIGNED mapping and template bundle',
                          version: '1.0.0',
                          generatedAt: ts,
                          artifactBoundary,
                          proofLedgerSignature: null,
                          fixturePosture: getOverallPosture(),
                          contents: [
                            'annex-iv-technical-documentation.json',
                            'nist-ai-rmf-evidence-matrices.json',
                            'iso-42001-statement-of-applicability.json',
                            'fria-impact-assessment.json',
                            'MANIFEST.json',
                          ],
                          frameworkSummary: FRAMEWORKS.map((fw) => ({
                            name: fw.name,
                            id: fw.id,
                            score: getFrameworkScore(fw.id),
                            fixtureCurrent: getFrameworkControls(fw.id).filter(
                              (c) => c.evidenceStatus === 'fresh',
                            ).length,
                            total: getFrameworkControls(fw.id).length,
                          })),
                        };
                        zip.file(
                          'annex-iv-technical-documentation.json',
                          JSON.stringify(buildAnnexIV(), null, 2),
                        );
                        zip.file(
                          'nist-ai-rmf-evidence-matrices.json',
                          JSON.stringify(buildNISTMatrices(), null, 2),
                        );
                        zip.file(
                          'iso-42001-statement-of-applicability.json',
                          JSON.stringify(buildISOSoA(), null, 2),
                        );
                        zip.file(
                          'fria-impact-assessment.json',
                          JSON.stringify(buildFRIA(), null, 2),
                        );
                        zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));
                        const blob = await zip.generateAsync({ type: 'blob' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `DEMO-UNSIGNED-a11oy-mapping-package-${dateSuffix}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export Demo Unsigned Bundle (ZIP)
                    </button>
                  </div>
                );
              })()}
            </Card>
          </div>
        </div>
      </div>

      <div
        className="p-3 rounded-lg text-xs flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.15)',
          color: 'var(--color-a11oy-text-ghost)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" />{' '}
        Demo boundary — mappings, dates, scores, and downloads are deterministic fixtures. No
        certification, compliance determination, legal opinion, external attestation, or signed
        ledger receipt is claimed.
      </div>
    </Layout>
  );
}
