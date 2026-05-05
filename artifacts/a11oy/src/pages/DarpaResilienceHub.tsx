import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  DARPA_PROGRAMS, ADVERSARIAL_ATTACKS, VERIFICATION_PROOFS,
  SUPPLY_CHAIN, EXPLAINABILITY_RECORDS, CAPABILITY_COMPARTMENTS,
  CYBER_RESILIENCE_CHECKS, SIMULATION_SCENARIOS,
  DARPA_VERSION, DARPA_TAGLINE, fmtPct, fmtScore,
} from '../data/darpaResilience';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const PILLARS = [
  { id: 'gard-robustness', href: '/gard-robustness', label: 'GARD Adversarial Robustness', desc: 'Adversarial attack taxonomy (evasion, poisoning, extraction, inference) with Armory evaluation testbed and certified defense scoring.', program: 'GARD', color: '#ef4444' },
  { id: 'formal-verification', href: '/formal-verification', label: 'Formal Verification Engine', desc: 'Mathematical proofs that agent behavior stays within safety envelopes using reachability analysis, interval-bound propagation, and SMT solving.', program: 'Assured Autonomy', color: '#3b82f6' },
  { id: 'supply-chain', href: '/supply-chain', label: 'Supply Chain Attestation', desc: 'Dependency integrity graph with SBOM compliance and multi-signatory attestation for every model, tool, connector, skill, and constitution.', program: 'SocialCyber', color: '#10b981' },
  { id: 'explainability', href: '/explainability', label: 'Explainability Engine', desc: 'Decision attribution with SHAP, LIME, saliency, attention, counterfactual, and concept-activation explanations for every governed action.', program: 'XAI', color: '#f59e0b' },
  { id: 'compartments', href: '/compartments', label: 'Capability Compartments', desc: 'CHERI-inspired capability-based isolation with memory-safe bounds, zero-trust compartmentalization, and enclave security.', program: 'SSITH/CHERI', color: '#8b5cf6' },
  { id: 'cyber-resilience', href: '/cyber-resilience', label: 'Cyber Resilience Center', desc: 'AI model security posture with automated vulnerability scanning and remediation from the $4M DEF CON 33 winning CRS architecture.', program: 'BORDEAUX + AIxCC', color: '#06b6d4' },
  { id: 'sim-governance', href: '/sim-governance', label: 'Governance Simulation Lab', desc: 'Sim-to-real governance policy transfer — stress-test constitutional amendments, failover policies, and edge cases before production.', program: 'TIAMAT', color: '#a855f7' },
];

export function DarpaResilienceHub() {
  const blockRate = ADVERSARIAL_ATTACKS.reduce((a, c) => a + c.blocked, 0) / ADVERSARIAL_ATTACKS.reduce((a, c) => a + c.testCount, 0);
  const verifiedProofs = VERIFICATION_PROOFS.filter(p => p.status === 'verified').length;
  const attestedComponents = SUPPLY_CHAIN.filter(c => c.attestationStatus === 'attested').length;
  const avgExplainQuality = EXPLAINABILITY_RECORDS.reduce((a, c) => a + c.explanationQualityScore, 0) / EXPLAINABILITY_RECORDS.length;
  const avgIsolation = CAPABILITY_COMPARTMENTS.reduce((a, c) => a + c.isolationScore, 0) / CAPABILITY_COMPARTMENTS.length;
  const avgResilienceScore = CYBER_RESILIENCE_CHECKS.reduce((a, c) => a + c.score, 0) / CYBER_RESILIENCE_CHECKS.length;
  const validatedScenarios = SIMULATION_SCENARIOS.filter(s => s.status === 'validated').length;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Adversarial Resilience Hub"
        subtitle={DARPA_TAGLINE}
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="BLOCK RATE" value={fmtPct(blockRate)} sub="adversarial inputs blocked" accent={T.accent} />
        <KpiCard label="PROOFS VERIFIED" value={`${verifiedProofs}/${VERIFICATION_PROOFS.length}`} sub="agent properties proved" accent={T.accent} />
        <KpiCard label="SUPPLY CHAIN" value={`${attestedComponents}/${SUPPLY_CHAIN.length}`} sub="components attested" accent={T.accent} />
        <KpiCard label="RESILIENCE" value={fmtScore(avgResilienceScore)} sub="mean posture score" accent={T.accent} />
        <KpiCard label="EXPLAINABILITY" value={fmtPct(avgExplainQuality)} sub="explanation quality" accent={T.accent} />
        <KpiCard label="ISOLATION" value={fmtPct(avgIsolation)} sub="compartment isolation" accent={T.accent} />
        <KpiCard label="SIM VALIDATED" value={`${validatedScenarios}/${SIMULATION_SCENARIOS.length}`} sub="scenarios production-ready" accent={T.accent} />
        <KpiCard label="DARPA PROGRAMS" value={DARPA_PROGRAMS.length.toString()} sub="integrated innovations" accent={T.accent} />
      </div>

      <Card className="mb-8 p-5">
        <div className="text-xs font-mono mb-3" style={{ color: T.dim }}>DARPA INTEGRATION THESIS</div>
        <div className="text-sm mb-3" style={{ color: T.text }}>
          A11oy is the first governed AI execution fabric to integrate innovations from <span style={{ color: T.accent }}>eight DARPA programs</span> into
          a unified adversarial resilience layer. Every agent action passes through GARD-grade robustness testing, XAI-grade decision explainability,
          Verisig-inspired formal verification, CHERI-inspired capability isolation, SocialCyber-grade supply chain attestation, AIxCC-winning
          vulnerability detection, BORDEAUX model integrity monitoring, and TIAMAT sim-to-real governance transfer.
        </div>
        <div className="text-xs" style={{ color: T.muted }}>
          No other enterprise AI platform combines these defense-grade capabilities. This is what "one of one" means.
        </div>
      </Card>

      <SectionTitle>Seven Pillars of DARPA-Grade Resilience</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {PILLARS.map(pillar => (
          <Link key={pillar.id} href={b(pillar.href)}>
            <Card className="p-4 cursor-pointer transition-all hover:border-opacity-30" style={{ borderLeft: `3px solid ${pillar.color}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} />
                <span className="text-xs font-mono" style={{ color: pillar.color }}>{pillar.program}</span>
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{pillar.label}</div>
              <div className="text-xs" style={{ color: T.muted }}>{pillar.desc}</div>
            </Card>
          </Link>
        ))}
      </div>

      <SectionTitle>DARPA Program Registry</SectionTitle>
      <div className="space-y-2 mb-8">
        {DARPA_PROGRAMS.map(program => (
          <Card key={program.id} className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: T.text }}>{program.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.dim }}>
                    {program.office}
                  </span>
                </div>
                <div className="text-xs" style={{ color: T.dim }}>{program.fullName}</div>
                <div className="text-xs mt-1" style={{ color: T.muted }}>{program.innovation}</div>
              </div>
              {program.github !== 'N/A (classified performers)' && program.github !== 'N/A (active program)' && (
                <div className="text-xs font-mono" style={{ color: T.accent }}>{program.github}</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
