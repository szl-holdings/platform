import { useState } from 'react';
import type { Page } from '../lib/types';
import { productHref } from '@szl-holdings/brand-registry';

const ALLOY_HREF = productHref('alloy');

const T = {
  bg: '#07080a',
  surface: 'rgba(255,255,255,0.028)',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0f0f0',
  textDim: '#8a8a8a',
  textMuted: '#5a5a5a',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.15)',
  mono: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
};

const SURFACES = [
  { id: 'fleet', label: 'Fleet', desc: 'Every SZL surface in one place', live: true, href: `${ALLOY_HREF}/fleet` },
  { id: 'foundry', label: 'Foundry', desc: 'Models, datasets, spaces, inference', live: true, href: `${ALLOY_HREF}/foundry` },
  { id: 'governance', label: 'Governance', desc: 'Evidence stream & audit log', live: true, href: `${ALLOY_HREF}/governance` },
  { id: 'pricing', label: 'Pricing', desc: '3-tier enterprise pricing', live: true, href: `${ALLOY_HREF}/pricing` },
];

const CAPABILITIES = [
  { icon: '🔑', name: 'SSO', infra: 'Policy Engine', color: '#6366f1' },
  { icon: '🌍', name: 'Regions', infra: 'Proof Chain', color: '#3b82f6' },
  { icon: '📋', name: 'Audit Logs', infra: 'Proof Chain', color: '#f59e0b' },
  { icon: '🗂', name: 'Resource Groups', infra: 'Cognitive Runtime', color: '#8b5cf6' },
  { icon: '⚡', name: 'Dedicated Inference', infra: 'Cognitive Runtime', color: '#10b981' },
  { icon: '🔒', name: 'Private Spaces', infra: 'Prism Bus', color: '#ec4899' },
];

const TIERS = [
  { name: 'Operator', price: '$490', period: '/seat/mo', accent: T.textDim },
  { name: 'Team', price: '$1,290', period: '/seat/mo', accent: T.accent, featured: true },
  { name: 'Enterprise', price: 'Custom', period: '', accent: T.textDim },
];

export default function AlloyPreview() {
  const [activeSection, setActiveSection] = useState<'overview' | 'surfaces' | 'capabilities' | 'pricing'>('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'surfaces', label: 'Hub Surfaces' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'pricing', label: 'Pricing' },
  ] as const;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: T.text, minHeight: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, border: `1px solid ${T.accent}`,
              borderRadius: 5, fontSize: 10, fontFamily: T.mono, color: T.accent, fontWeight: 700,
            }}>a</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>
              Alloy Hub Preview
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.15rem 0.5rem',
              background: T.accentDim, border: `1px solid rgba(201,183,135,0.25)`,
              borderRadius: 4, fontSize: '0.5625rem', fontFamily: T.mono,
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: T.accent,
            }}>Enterprise Preview</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: T.textDim }}>
            NEXUS view of the Alloy flagship hub — architecture overview, surface map, and pricing.
          </p>
        </div>
        <a
          href={ALLOY_HREF}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: T.accent, color: '#0a0a0a',
            borderRadius: 7, fontSize: '0.8125rem', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}
        >
          Open Alloy Hub →
        </a>
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '0.4375rem 0.875rem',
              background: activeSection === s.id ? T.accentDim : 'transparent',
              border: `1px solid ${activeSection === s.id ? 'rgba(201,183,135,0.25)' : T.border}`,
              borderRadius: 6, cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: activeSection === s.id ? 600 : 400,
              color: activeSection === s.id ? T.accent : T.textDim,
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            padding: '1.5rem',
            background: T.accentDim,
            border: '1px solid rgba(201,183,135,0.2)',
            borderRadius: 12,
          }}>
            <p style={{
              fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: T.accent, marginBottom: '0.625rem',
            }}>ALLOY — FLAGSHIP ENTERPRISE AI HUB</p>
            <p style={{ fontSize: '0.9375rem', color: T.text, lineHeight: 1.65, marginBottom: '0.875rem', fontWeight: 500 }}>
              The front door to every governed AI surface in the SZL ecosystem. Every product, agent, model, dataset, and governance record — browsable, deployable, and auditable from one place.
            </p>
            <p style={{ fontSize: '0.8125rem', color: T.textDim, lineHeight: 1.65 }}>
              Built on four real infrastructure layers: Proof Chain (immutable audit), Policy Engine (covenant governance), Cognitive Runtime (model orchestration), and Prism Bus (signal routing). No placeholders — every capability is production-grade and traceable.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            {[
              { label: 'Infrastructure Layers', value: '4', sub: 'Proof Chain · Policy Engine · Cognitive Runtime · Prism Bus' },
              { label: 'Hub Surfaces', value: '5', sub: 'Landing · Fleet · Foundry · Governance · Pricing' },
              { label: 'Enterprise Capabilities', value: '6', sub: 'SSO · Regions · Audit · Groups · Inference · Spaces' },
              { label: 'Pricing Tiers', value: '3', sub: 'Operator · Team · Enterprise' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '1.125rem',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: T.accent, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.25rem' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: T.text, marginBottom: '0.25rem' }}>{stat.label}</div>
                <div style={{ fontSize: '0.625rem', color: T.textMuted, fontFamily: T.mono, lineHeight: 1.4 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '1.25rem',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10,
          }}>
            <p style={{
              fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: T.textMuted, marginBottom: '0.875rem',
            }}>Ecosystem Positioning</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { product: 'Carlota Jo', role: 'Precision advisory, governed by Alloy', badge: 'Powered by Alloy' },
                { product: 'Vessels', role: 'Maritime intelligence routed through Alloy governance', badge: 'Fleet surface' },
                { product: 'Counsel', role: 'Legal intelligence with Proof Chain attribution', badge: 'Fleet surface' },
                { product: 'Terra', role: 'Real estate signals through Prism Bus', badge: 'Fleet surface' },
                { product: 'Sentra', role: 'Cyber resilience evidence recorded on Proof Chain', badge: 'Fleet surface' },
              ].map(row => (
                <div key={row.product} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(255,255,255,0.05)`,
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.text, minWidth: 80 }}>{row.product}</span>
                  <span style={{ fontSize: '0.75rem', color: T.textDim, flex: 1 }}>{row.role}</span>
                  <span style={{
                    padding: '0.15rem 0.4rem',
                    background: T.accentDim, border: '1px solid rgba(201,183,135,0.2)',
                    borderRadius: 4, fontSize: '0.5625rem', fontFamily: T.mono,
                    fontWeight: 600, letterSpacing: '0.08em', color: T.accent,
                    whiteSpace: 'nowrap',
                  }}>{row.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'surfaces' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {SURFACES.map(surface => (
            <div key={surface.id} style={{
              padding: '1.375rem',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: T.text }}>{surface.label}</span>
                {surface.live && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.5625rem', color: '#10b981', fontFamily: T.mono, fontWeight: 600 }}>LIVE</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: T.textDim, lineHeight: 1.55, marginBottom: '1rem' }}>{surface.desc}</p>
              <a
                href={surface.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  fontSize: '0.75rem', color: T.accent, textDecoration: 'none',
                }}
              >
                Open {surface.label} →
              </a>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'capabilities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
          {CAPABILITIES.map(cap => (
            <div key={cap.name} style={{
              padding: '1.25rem',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8,
                  background: `${cap.color}14`, border: `1px solid ${cap.color}28`,
                  fontSize: 16,
                }}>{cap.icon}</span>
                <span style={{
                  padding: '0.15rem 0.45rem',
                  background: `${cap.color}10`, border: `1px solid ${cap.color}20`,
                  borderRadius: 4, fontSize: '0.5625rem', fontFamily: T.mono,
                  fontWeight: 600, letterSpacing: '0.08em', color: cap.color,
                }}>{cap.infra}</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{cap.name}</div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem' }}>
          {TIERS.map(tier => (
            <div key={tier.name} style={{
              padding: '1.5rem',
              background: tier.featured ? T.accentDim : T.surface,
              border: `1px solid ${tier.featured ? 'rgba(201,183,135,0.25)' : T.border}`,
              borderRadius: 12, position: 'relative',
            }}>
              {tier.featured && (
                <span style={{
                  position: 'absolute', top: -1, left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0.2rem 0.75rem',
                  background: T.accent, borderRadius: '0 0 6px 6px',
                  fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#0a0a0a', whiteSpace: 'nowrap',
                }}>Most popular</span>
              )}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: T.text, marginBottom: '0.5rem' }}>{tier.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '1.625rem', fontWeight: 800,
                  color: tier.featured ? T.accent : T.text,
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>{tier.price}</span>
                {tier.period && <span style={{ fontSize: '0.75rem', color: T.textMuted }}>{tier.period}</span>}
              </div>
              <a
                href={`${ALLOY_HREF}/pricing`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0.5rem 0.875rem',
                  background: tier.featured ? T.accent : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${tier.featured ? T.accent : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6, fontSize: '0.8125rem', fontWeight: 600,
                  color: tier.featured ? '#0a0a0a' : T.text,
                  textDecoration: 'none', letterSpacing: '-0.01em',
                }}
              >
                View details →
              </a>
            </div>
          ))}
          <div style={{
            gridColumn: '1 / -1', marginTop: '0.25rem',
            padding: '1rem',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <p style={{ fontSize: '0.8125rem', color: T.textDim }}>
              Starting at $490/seat/mo. Volume discounts on Team. Enterprise negotiated.
            </p>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{ fontSize: '0.8125rem', color: T.accent, textDecoration: 'none' }}
            >
              Contact sales →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
