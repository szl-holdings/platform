import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const link = (path: string) => `${BASE}${path}`;

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

type Article = {
  num: string;
  title: string;
  preamble: string;
  obligations: { id: string; text: string; enforcedBy: string; surface: { label: string; href: string } }[];
};

const ARTICLES: Article[] = [
  {
    num: 'I',
    title: 'Attribution is Non-Optional',
    preamble:
      'Every consequential action recorded by the system must carry an unbroken chain of attribution: who proposed it, which model recommended it, what evidence supported it, who approved it, and what real-world outcome followed.',
    obligations: [
      { id: 'I.1', text: 'No agent action may be merged into the proof ledger without a signed attribution record.', enforcedBy: 'Proof Chain · Covenant Policy', surface: { label: 'Proof Ledger', href: '/proof' } },
      { id: 'I.2', text: 'Attribution chains must remain queryable for the full retention window. Loss of a chain segment quarantines all downstream actions.', enforcedBy: 'Proof Chain', surface: { label: 'Proof Ledger', href: '/proof' } },
      { id: 'I.3', text: 'Anonymization of attribution is permitted only for the public-facing transparency report; internal records remain identified.', enforcedBy: 'Glasswing Layer', surface: { label: 'Public Trust Portal', href: '/trust-portal' } },
    ],
  },
  {
    num: 'II',
    title: 'Human Authority on Material Decisions',
    preamble:
      'No agent shall execute a material decision without an authenticated human approver. Materiality is defined by Covenant Policy and is non-bypassable, including for the system itself.',
    obligations: [
      { id: 'II.1', text: 'Material decisions require typed human approval recorded in the proof ledger before execution.', enforcedBy: 'Approval Queue · Covenant Policy', surface: { label: 'Approval Queue', href: '/approval-queue' } },
      { id: 'II.2', text: 'Auto-approval thresholds must be authored as Covenant Policy and signed off by a quorum recorded in the Delegation Chain.', enforcedBy: 'Covenant Policy · Delegation Chain', surface: { label: 'Governance', href: '/governance' } },
      { id: 'II.3', text: 'Emergency-stop authority belongs to a designated human role and overrides any agent in flight, with the stop event itself recorded.', enforcedBy: 'Action Rail · Proof Chain', surface: { label: 'Action Rail', href: '/actions' } },
    ],
  },
  {
    num: 'III',
    title: 'Bounded Capability',
    preamble:
      'Every agent operates inside a Capability Compartment with hardware-enforced bounds where available. Privilege escalation is impossible without an explicit, recorded covenant amendment.',
    obligations: [
      { id: 'III.1', text: 'Agents inherit the strictest intersection of their compartment policy and the active operational covenant.', enforcedBy: 'Capability Compartments', surface: { label: 'Compartments', href: '/compartments' } },
      { id: 'III.2', text: 'Tool access is gated through the Connector Firewall; no agent reaches an external system without a logged authorization.', enforcedBy: 'Connector Firewall', surface: { label: 'Connector Firewall', href: '/connectors' } },
      { id: 'III.3', text: 'Cross-compartment data movement requires an explicit transfer policy and is recorded as a discrete proof entry.', enforcedBy: 'Covenant Policy · Proof Chain', surface: { label: 'Governance', href: '/governance' } },
    ],
  },
  {
    num: 'IV',
    title: 'Truthful Self-Report',
    preamble:
      'Agents must report their state, confidence, and provenance truthfully. Reasoning that fails the Verifier or that masks uncertainty is grounds for compartment quarantine.',
    obligations: [
      { id: 'IV.1', text: 'All recommendations must include a calibrated confidence band and the evidence set that produced it.', enforcedBy: 'Reasoning Proof Engine', surface: { label: 'Proof Ledger', href: '/proof' } },
      { id: 'IV.2', text: 'Detected reward-hacking, deceptive reasoning, or undisclosed shortcut behavior triggers the Behavioral Audit and review gate.', enforcedBy: 'Behavioral Audit · Reward Hacking Watchdog', surface: { label: 'Behavioral Audit', href: '/behavioral-audit' } },
      { id: 'IV.3', text: 'A failed self-report disqualifies the agent from the next decision loop until a covenant-authored remediation has been recorded.', enforcedBy: 'Alignment Review', surface: { label: 'Alignment Review', href: '/alignment-review' } },
    ],
  },
  {
    num: 'V',
    title: 'Right to Audit',
    preamble:
      'Every customer, regulator, and contractually authorized auditor holds a standing right to inspect the proof ledger, covenant configuration, and evaluation history relevant to their tenancy.',
    obligations: [
      { id: 'V.1', text: 'Customer audit requests are honored within the published response window without negotiation.', enforcedBy: 'Trust Center', surface: { label: 'Right to Audit', href: '/right-to-audit' } },
      { id: 'V.2', text: 'Sub-processor audit findings are passed through to the customer where the customer is contractually entitled to them.', enforcedBy: 'Compliance Fabric', surface: { label: 'Trust Exchange', href: '/trust-exchange' } },
      { id: 'V.3', text: 'Audit access is scoped to the requesting tenant; cross-tenant inspection is prohibited absent a recorded judicial order.', enforcedBy: 'Connector Firewall · Covenant Policy', surface: { label: 'Trust Center', href: '/trust' } },
    ],
  },
  {
    num: 'VI',
    title: 'Pre-Deployment Alignment Review',
    preamble:
      'No new agent class, capability, or model substitution is promoted to production without passing the Alignment Review Gate. The gate is non-bypassable, including by senior operators.',
    obligations: [
      { id: 'VI.1', text: 'Promotion requires passing MirrorEval, Robustness Wall, and the active Constitution test suite at minimum.', enforcedBy: 'MirrorEval · Robustness Wall', surface: { label: 'MirrorEval', href: '/evals' } },
      { id: 'VI.2', text: 'A failed gate generates a recorded finding; re-promotion requires remediation evidence and a fresh gate pass.', enforcedBy: 'Alignment Review', surface: { label: 'Alignment Review', href: '/alignment-review' } },
      { id: 'VI.3', text: 'Model substitutions, including same-family upgrades, are treated as new agent classes for review purposes.', enforcedBy: 'Model Router · Snapshot Provenance', surface: { label: 'Model Router', href: '/model-router' } },
    ],
  },
  {
    num: 'VII',
    title: 'Coordinated Disclosure',
    preamble:
      'Vulnerabilities, model failures, and policy circumventions are disclosed to affected parties through the Coordinated Agent Vulnerability Disclosure (CAVD) process before public release.',
    obligations: [
      { id: 'VII.1', text: 'Submitted findings receive an anchored intake record within 24 hours and a stage update within the published triage window.', enforcedBy: 'CAVD', surface: { label: 'CAVD', href: '/cavd' } },
      { id: 'VII.2', text: 'Defenders receive credit and, where applicable, a payout from the Defender Credit Pool.', enforcedBy: 'Glasswing Layer', surface: { label: 'Defender Credits', href: '/defender-credits' } },
      { id: 'VII.3', text: 'Embargo periods are honored unless overridden by an active in-the-wild exploit confirmed by two independent sources.', enforcedBy: 'CAVD', surface: { label: 'CAVD', href: '/cavd' } },
    ],
  },
  {
    num: 'VIII',
    title: 'Mutability with a Public Trail',
    preamble:
      'This Constitution is versioned and amendable. Every amendment, including its proposer, rationale, and gate result, is recorded in the proof ledger and published in the 90-day Transparency Report.',
    obligations: [
      { id: 'VIII.1', text: 'Amendments require a covenant-quorum approval recorded in the Delegation Chain.', enforcedBy: 'Delegation Chain · Covenant Policy', surface: { label: 'Governance', href: '/governance' } },
      { id: 'VIII.2', text: 'A rolled-back amendment retains its proof entry; no constitutional history is silently rewritten.', enforcedBy: 'Snapshot Provenance', surface: { label: 'Snapshot Provenance', href: '/snapshot-provenance' } },
      { id: 'VIII.3', text: 'A diff of every amendment is published in the next public transparency report cycle.', enforcedBy: 'Glasswing Layer', surface: { label: '90-Day Report', href: '/transparency-report' } },
    ],
  },
];

export function Constitution() {
  const [openArticle, setOpenArticle] = useState<string | null>('I');

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · CONSTITUTION"
        title="The A11oy Constitution"
        subtitle="The founding obligations every agent, operator, and decision loop must honor. Versioned, amendable, audit-ready."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="VERSION" value="v4.2.0" sub="ratified 2026-04-20" accent={T.accent} />
        <KpiCard label="ARTICLES" value={ARTICLES.length} accent={T.accent} />
        <KpiCard label="OBLIGATIONS" value={ARTICLES.reduce((n, a) => n + a.obligations.length, 0)} accent={T.accent} />
        <KpiCard label="REVIEW GATE" value="REQUIRED" sub="non-bypassable" accent={T.accent} />
      </div>

      <Card className="mb-6">
        <div style={{ padding: '1.75rem' }}>
          <p style={{ fontFamily: T.serif, fontSize: '1.0625rem', lineHeight: 1.7, color: T.text, margin: 0, marginBottom: '0.875rem' }}>
            We hold that a system entrusted with material decisions must accept obligations stronger than those it imposes on its operators. The eight articles below are the obligations the A11oy platform holds to itself.
          </p>
          <p style={{ fontFamily: T.serif, fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            Each article is an enforceable contract: every obligation maps to a runtime surface, a covenant policy, or a proof-ledger guarantee. Violations are recorded, not concealed. The Constitution is mutable only through a covenant-quorum amendment with a public diff.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <StatusBadge status="ok" label="ENFORCED AT RUNTIME" />
            <StatusBadge status="ok" label="VERSIONED · CC-BY-4.0 OPEN SPEC" />
            <StatusBadge status="info" label="AMENDABLE · QUORUM REQUIRED" />
          </div>
        </div>
      </Card>

      <SectionTitle>Articles</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {ARTICLES.map((a) => {
          const isOpen = openArticle === a.num;
          return (
            <Card key={a.num} className="">
              <button
                type="button"
                onClick={() => setOpenArticle(isOpen ? null : a.num)}
                aria-expanded={isOpen}
                aria-controls={`article-${a.num}-body`}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  padding: '1.25rem 1.5rem', cursor: 'pointer', color: T.text,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.375rem' }}>
                    <span style={{
                      fontFamily: T.mono, fontSize: '0.6875rem', letterSpacing: '0.18em',
                      color: T.accent, textTransform: 'uppercase',
                    }}>Article {a.num}</span>
                    <span style={{
                      fontFamily: T.mono, fontSize: '0.625rem', color: T.textMuted,
                    }}>{a.obligations.length} obligation{a.obligations.length === 1 ? '' : 's'}</span>
                  </div>
                  <h3 style={{
                    fontFamily: T.serif, fontSize: '1.375rem', fontWeight: 400,
                    color: T.text, margin: 0, letterSpacing: '-0.01em',
                  }}>{a.title}</h3>
                </div>
                <span aria-hidden="true" style={{
                  fontFamily: T.mono, fontSize: '0.875rem', color: T.textDim,
                  paddingTop: '0.25rem',
                }}>{isOpen ? '–' : '+'}</span>
              </button>
              {isOpen && (
                <div id={`article-${a.num}-body`} style={{ padding: '0 1.5rem 1.5rem', borderTop: `1px solid ${T.border}` }}>
                  <p style={{
                    fontFamily: T.serif, fontSize: '0.9375rem', lineHeight: 1.75,
                    color: T.textDim, margin: '1.25rem 0 1.5rem',
                  }}>{a.preamble}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {a.obligations.map((o) => (
                      <div key={o.id} style={{
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                        padding: '1rem 1.125rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                          <span style={{
                            fontFamily: T.mono, fontSize: '0.6875rem', color: T.accent,
                            paddingTop: '0.125rem', flexShrink: 0, minWidth: '2.25rem',
                          }}>{o.id}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.875rem', lineHeight: 1.6, color: T.text, margin: 0, marginBottom: '0.625rem',
                            }}>{o.text}</p>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              flexWrap: 'wrap', gap: '0.625rem',
                              paddingTop: '0.625rem', borderTop: `1px solid ${T.border}`,
                            }}>
                              <span style={{
                                fontFamily: T.mono, fontSize: '0.625rem', color: T.textMuted,
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                              }}>Enforced by · {o.enforcedBy}</span>
                              <Link href={link(o.surface.href)} style={{
                                fontFamily: T.mono, fontSize: '0.6875rem', color: T.accent,
                                textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em',
                              }}>{o.surface.label} →</Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <SectionTitle>Amendment & Provenance</SectionTitle>
        <Card>
          <div style={{ padding: '1.25rem' }}>
            <InfoRow label="Current version" value="v4.2.0 · ratified 2026-04-20 by covenant quorum 7-of-9" />
            <InfoRow label="Previous version" value="v4.1.3 · ratified 2026-03-12 (Article VIII clarification)" />
            <InfoRow label="Open Spec license" value="CC-BY-4.0 · forkable, attribution required" />
            <InfoRow label="Amendment surface" value={<Link href={link('/constitution-dsl')} style={{ color: T.accent, textDecoration: 'none' }}>Constitution-as-Code DSL →</Link>} />
            <InfoRow label="Public diff stream" value={<Link href={link('/transparency-report')} style={{ color: T.accent, textDecoration: 'none' }}>90-Day Transparency Report →</Link>} />
            <InfoRow label="Audit access" value={<Link href={link('/right-to-audit')} style={{ color: T.accent, textDecoration: 'none' }}>Right to Audit →</Link>} />
          </div>
        </Card>
      </div>
    </Layout>
  );
}
