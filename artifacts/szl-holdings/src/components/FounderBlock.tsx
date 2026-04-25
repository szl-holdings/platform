import { m } from 'framer-motion';
import {
  Anchor,
  ArrowRight,
  BarChart3,
  Eye,
  Layers,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Link } from 'wouter';

const highlights = [
  {
    icon: Eye,
    label: 'Observability Architecture',
    desc: 'Designed the cross-platform signal layer that powers business visibility across all SZL ventures.',
    color: 'hsl(190,90%,55%)',
  },
  {
    icon: Layers,
    label: 'Compound Infrastructure',
    desc: 'Built the shared auth, design system, and observability stack that reduces marginal cost per new platform.',
    color: 'hsl(214,80%,65%)',
  },
  {
    icon: Anchor,
    label: 'Maritime Intelligence',
    desc: 'Developed Vessels — a real-time fleet command platform tracking voyage economics and operational exceptions.',
    color: 'hsl(205,85%,55%)',
  },
  {
    icon: Shield,
    label: 'Cyber Defense Systems',
    desc: 'Shipped Aegis — a unified defense and intelligence command platform for enterprise threat response.',
    color: 'hsl(232,68%,60%)',
  },
];

export function FounderBlock() {
  return (
    <section
      style={{
        padding: '7rem 0',
        background: 'hsl(210,12%,6%)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr,380px] gap-16 lg:gap-24 items-start mb-14">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,42%)',
                marginBottom: '0.875rem',
                fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
              }}
            >
              Built by an Operator
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
                fontWeight: '700',
                letterSpacing: '-0.022em',
                color: 'hsl(38,12%,94%)',
                lineHeight: '1.1',
                marginBottom: '1.25rem',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}
            >
              Stephen Lutar builds systems that connect visibility, execution, and operating
              discipline.
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: '1.72',
                color: 'hsl(210,5%,56%)',
                marginBottom: '1rem',
                maxWidth: '30rem',
              }}
            >
              From observability and workflow design to product architecture and execution systems,
              Stephen's work sits at the intersection of business clarity, technical structure, and
              command-centered thinking.
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.7',
                color: 'hsl(210,5%,46%)',
                maxWidth: '30rem',
                marginBottom: '2rem',
              }}
            >
              Every platform in the SZL ecosystem is founder-built, founder-operated, and structured
              around the same core principle: precision first, clarity always.
            </p>
            <div
              style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', flexWrap: 'wrap' }}
            >
              <Link
                href="/founder"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'hsl(38,12%,94%)',
                  background: 'hsla(0,0%,100%,0.08)',
                  border: '1px solid hsla(0,0%,100%,0.1)',
                  padding: '0.625rem 1.125rem',
                  textDecoration: 'none',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.13)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.18)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.08)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.1)';
                }}
              >
                Meet the Founder
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
              <a
                href="/founder"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'hsl(210,5%,52%)',
                  textDecoration: 'none',
                  padding: '0.625rem 1.125rem',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,72%)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,52%)';
                }}
              >
                Stephen's Site
                <ArrowRight size={13} strokeWidth={2.5} />
              </a>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '1.75rem',
              background: 'hsla(210,12%,8%,0.8)',
              border: '1px solid hsla(0,0%,100%,0.07)',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,38%)',
                marginBottom: '1rem',
                fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
              }}
            >
              Current Platform Roster
            </p>
            {[
              { Icon: Eye, name: 'Lyte', role: 'Decision Intelligence', color: 'hsl(190,90%,55%)' },
              {
                Icon: Anchor,
                name: 'Vessels',
                role: 'Maritime Intelligence',
                color: 'hsl(205,85%,55%)',
              },
              {
                Icon: Shield,
                name: 'Aegis',
                role: 'Defense & Intelligence',
                color: 'hsl(232,68%,60%)',
              },
              {
                Icon: BarChart3,
                name: 'Terra',
                role: 'Real Estate Intelligence',
                color: 'hsl(88,42%,44%)',
              },
              {
                Icon: Sparkles,
                name: 'Carlota Jo',
                role: 'Private Advisory',
                color: 'hsl(38,55%,58%)',
              },
            ].map((p, i) => (
              <m.div
                key={p.name}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.625rem',
                  borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                  transition: 'background 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <p.Icon size={11} style={{ color: p.color, flexShrink: 0 }} strokeWidth={2} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(210,5%,70%)' }}>
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    marginLeft: 'auto',
                    color: 'hsl(210,5%,38%)',
                    fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                  }}
                >
                  {p.role}
                </span>
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: p.color,
                    boxShadow: `0 0 5px ${p.color}80`,
                    flexShrink: 0,
                  }}
                />
              </m.div>
            ))}
          </m.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <m.div
                key={h.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  padding: '1.25rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.04)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.09)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.02)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.05)';
                }}
              >
                <Icon
                  size={14}
                  style={{ color: h.color, marginBottom: '0.75rem' }}
                  strokeWidth={1.5}
                />
                <p
                  style={{
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: 'hsl(38,12%,82%)',
                    marginBottom: '0.375rem',
                    letterSpacing: '-0.005em',
                    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  }}
                >
                  {h.label}
                </p>
                <p style={{ fontSize: '11.5px', lineHeight: '1.6', color: 'hsl(210,5%,48%)' }}>
                  {h.desc}
                </p>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
