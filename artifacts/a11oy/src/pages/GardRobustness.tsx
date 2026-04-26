import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import {
  ADVERSARIAL_ATTACKS, DEFENSE_EVALUATIONS, DARPA_PROGRAMS,
  fmtPct, fmtMs, fmtScore, DARPA_VERSION,
} from '../data/darpaResilience';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const CLASS_COLORS: Record<string, string> = {
  evasion: '#ef4444', poisoning: '#f59e0b', extraction: '#3b82f6', inference: '#8b5cf6',
};

export function GardRobustness() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const filtered = selectedClass ? ADVERSARIAL_ATTACKS.filter(a => a.class === selectedClass) : ADVERSARIAL_ATTACKS;

  const totalTests = ADVERSARIAL_ATTACKS.reduce((a, c) => a + c.testCount, 0);
  const totalBlocked = ADVERSARIAL_ATTACKS.reduce((a, c) => a + c.blocked, 0);
  const overallRate = totalTests > 0 ? totalBlocked / totalTests : 0;
  const avgDefenseScore = DEFENSE_EVALUATIONS.reduce((a, c) => a + c.armoryScore, 0) / DEFENSE_EVALUATIONS.length;
  const gard = DARPA_PROGRAMS.find(p => p.id === 'gard')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="GARD Adversarial Robustness"
        subtitle="Guaranteeing AI Robustness Against Deception — adversarial attack taxonomy, Armory evaluation testbed, and certified defense scoring."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL TESTS" value={totalTests.toLocaleString()} sub="across all attack classes" accent={T.accent} />
        <KpiCard label="BLOCK RATE" value={fmtPct(overallRate)} sub="adversarial inputs blocked" accent={T.accent} />
        <KpiCard label="ATTACK CLASSES" value="4" sub="evasion · poisoning · extraction · inference" accent={T.accent} />
        <KpiCard label="ARMORY SCORE" value={fmtScore(avgDefenseScore)} sub="mean defense evaluation" accent={T.accent} />
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
          <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
        </div>
        <div className="text-sm mb-1" style={{ color: T.text }}>{gard.fullName}</div>
        <div className="text-xs" style={{ color: T.dim }}>Office: {gard.office} · GitHub: <span style={{ color: T.accent }}>{gard.github}</span></div>
        <div className="text-xs mt-2" style={{ color: T.muted }}>{gard.innovation}</div>
      </Card>

      <SectionTitle>Attack Taxonomy</SectionTitle>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['evasion', 'poisoning', 'extraction', 'inference'].map(cls => (
          <button
            key={cls}
            onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
            className="px-3 py-1.5 rounded text-xs font-mono uppercase transition-all"
            style={{
              backgroundColor: selectedClass === cls ? CLASS_COLORS[cls] + '22' : T.surface,
              border: `1px solid ${selectedClass === cls ? CLASS_COLORS[cls] : T.border}`,
              color: selectedClass === cls ? CLASS_COLORS[cls] : T.dim,
            }}
          >
            {cls}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-8">
        {filtered.map(attack => (
          <Card key={attack.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono" style={{ color: CLASS_COLORS[attack.class] }}>{attack.id}</span>
                  <StatusBadge status={attack.severity === 'critical' ? 'error' : attack.severity === 'high' ? 'warn' : 'info'} label={attack.severity.toUpperCase()} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: CLASS_COLORS[attack.class] + '15', color: CLASS_COLORS[attack.class] }}>
                    {attack.class}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{attack.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold" style={{ color: attack.mitigationScore >= 0.95 ? T.accent : '#ef4444' }}>
                  {fmtPct(attack.mitigationScore)}
                </div>
                <div className="text-xs" style={{ color: T.dim }}>mitigation</div>
              </div>
            </div>
            <div className="text-xs mb-3" style={{ color: T.muted }}>{attack.description}</div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Tests</div>
                <div className="text-sm font-mono" style={{ color: T.text }}>{attack.testCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Blocked</div>
                <div className="text-sm font-mono" style={{ color: T.accent }}>{attack.blocked.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Bypassed</div>
                <div className="text-sm font-mono" style={{ color: attack.bypassed > 100 ? '#ef4444' : T.text }}>{attack.bypassed}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: T.dim }}>Defense Layer</div>
                <div className="text-xs font-mono" style={{ color: T.text }}>{attack.defenseLayer}</div>
              </div>
            </div>
            <div className="mt-2 text-xs font-mono" style={{ color: T.muted }}>ART Ref: {attack.artReference}</div>
          </Card>
        ))}
      </div>

      <SectionTitle>Defense Evaluations — Armory Testbed</SectionTitle>
      <div className="space-y-2 mb-8">
        {DEFENSE_EVALUATIONS.map(def => (
          <Card key={def.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono" style={{ color: T.dim }}>{def.id}</span>
                <span className="text-sm" style={{ color: T.text }}>{def.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.dim }}>
                  {def.category}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs" style={{ color: T.dim }}>Coverage</div>
                  <div className="text-sm font-mono" style={{ color: T.accent }}>{fmtPct(def.coverage)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: T.dim }}>FP Rate</div>
                  <div className="text-sm font-mono" style={{ color: T.text }}>{fmtPct(def.falsePositiveRate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: T.dim }}>Latency</div>
                  <div className="text-sm font-mono" style={{ color: T.text }}>{fmtMs(def.latencyMs)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: T.dim }}>Armory</div>
                  <div className="text-sm font-mono font-bold" style={{ color: def.armoryScore >= 95 ? T.accent : def.armoryScore >= 90 ? T.text : '#ef4444' }}>
                    {fmtScore(def.armoryScore)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
