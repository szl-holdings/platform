import { m, useReducedMotion } from 'framer-motion';

const PRIMITIVES = [
  {
    id: 'covenant',
    label: 'Covenant Policy',
    sublabel: 'Permission & constraint fabric',
    color: 'hsl(191,92%,44%)',
    bg: 'hsla(191,92%,44%,0.07)',
    border: 'hsla(191,92%,44%,0.2)',
  },
  {
    id: 'proof-chain',
    label: 'Proof Chain',
    sublabel: 'Immutable audit lineage',
    color: 'hsl(214,70%,60%)',
    bg: 'hsla(214,70%,60%,0.07)',
    border: 'hsla(214,70%,60%,0.2)',
  },
  {
    id: 'outcome-graph',
    label: 'Outcome Graph',
    sublabel: 'Decision outcome attribution',
    color: 'hsl(228,60%,62%)',
    bg: 'hsla(228,60%,62%,0.07)',
    border: 'hsla(228,60%,62%,0.2)',
  },
];

const DOMAIN_PACKS = [
  {
    id: 'aegis',
    label: 'PARAGON',
    sublabel: 'Security & Defense',
    color: 'hsl(222,60%,58%)',
    bg: 'hsla(222,60%,58%,0.07)',
    border: 'hsla(222,60%,58%,0.2)',
  },
  {
    id: 'vessels',
    label: 'SEXTANT',
    sublabel: 'Maritime Intelligence',
    color: 'hsl(205,85%,55%)',
    bg: 'hsla(205,85%,55%,0.07)',
    border: 'hsla(205,85%,55%,0.2)',
  },
  {
    id: 'terra',
    label: 'DOMAINE',
    sublabel: 'Real Estate Intelligence',
    color: 'hsl(140,52%,46%)',
    bg: 'hsla(140,52%,46%,0.07)',
    border: 'hsla(140,52%,46%,0.2)',
  },
  {
    id: 'counsel',
    label: 'Counsel',
    sublabel: 'Legal Matter Command',
    color: 'hsl(260,60%,65%)',
    bg: 'hsla(260,60%,65%,0.07)',
    border: 'hsla(260,60%,65%,0.2)',
  },
  {
    id: 'carlota',
    label: 'Carlota Jo',
    sublabel: 'Premium Advisory',
    color: 'hsl(38,55%,58%)',
    bg: 'hsla(38,55%,58%,0.07)',
    border: 'hsla(38,55%,58%,0.2)',
  },
  {
    id: 'imperium',
    label: 'IMPERIUM',
    sublabel: 'Cloud Sovereignty',
    color: 'hsl(25,72%,52%)',
    bg: 'hsla(25,72%,52%,0.07)',
    border: 'hsla(25,72%,52%,0.2)',
  },
];

const CONNECTOR_COLOR = 'hsla(214,10%,30%,0.8)';

function TierLabel({ label, delay }: { label: string; delay: number }) {
  const prefersReduced = useReducedMotion();
  return (
    <m.span
      initial={prefersReduced ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.5625rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'hsl(214,7%,38%)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </m.span>
  );
}

export function PlatformArchitectureDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: '1.75rem',
        background: 'hsla(214,12%,5%,0.9)',
        borderRadius: '0.875rem',
        border: '1px solid var(--color-szl-border, hsla(214,10%,20%,0.8))',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-szl-text-muted, hsl(214,7%,42%))',
          marginBottom: '1.75rem',
        }}
      >
        Platform Architecture
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* ── Tier 1: Platform ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', width: '100%', maxWidth: '640px' }}>
          <TierLabel label="Platform" delay={0} />
          <m.div
            initial={prefersReduced ? false : { opacity: 0, scaleX: 0.92 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              borderRadius: '0.625rem',
              background: 'hsla(191,92%,44%,0.07)',
              border: '1px solid hsla(191,92%,44%,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'hsl(191,92%,44%)',
                boxShadow: '0 0 8px hsla(191,92%,44%,0.55)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(38,8%,88%)', letterSpacing: '-0.01em' }}>
              SZL Governed Intelligence Platform
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5625rem',
                fontWeight: 500,
                color: 'hsl(191,92%,44%)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              Foundation
            </span>
          </m.div>
        </div>

        {/* ── Connector: Platform → Primitives ─────────────────────────── */}
        <m.div
          initial={prefersReduced ? false : { opacity: 0, scaleY: 0 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.28 }}
          style={{ transformOrigin: 'top', width: '1.5px', height: '28px', background: CONNECTOR_COLOR, margin: '0 auto' }}
        />

        {/* ── Tier 2: Primitives ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', width: '100%', maxWidth: '640px' }}>
          <TierLabel label="Primitives" delay={0.32} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {/* Horizontal bar connecting three primitives */}
            <m.div
              initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: 0.34 }}
              style={{
                transformOrigin: 'center',
                width: 'calc(100% - 64px)',
                height: '1.5px',
                background: CONNECTOR_COLOR,
                alignSelf: 'center',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
              {PRIMITIVES.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {/* Vertical drop from bar */}
                  <m.div
                    initial={prefersReduced ? false : { opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.22, delay: 0.42 + i * 0.06 }}
                    style={{ transformOrigin: 'top', width: '1.5px', height: '16px', background: CONNECTOR_COLOR }}
                  />
                  <m.div
                    initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.48 + i * 0.08 }}
                    style={{
                      padding: '0.75rem 0.625rem',
                      borderRadius: '0.5rem',
                      background: p.bg,
                      border: `1px solid ${p.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.375rem',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: p.color,
                        boxShadow: `0 0 5px ${p.color}66`,
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(38,8%,86%)', letterSpacing: '-0.01em', textAlign: 'center', lineHeight: 1.3 }}>
                      {p.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.5rem',
                        fontWeight: 500,
                        color: 'hsl(214,7%,44%)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      {p.sublabel}
                    </span>
                  </m.div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Connector: Primitives → Domain Packs ─────────────────────── */}
        <m.div
          initial={prefersReduced ? false : { opacity: 0, scaleY: 0 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.7 }}
          style={{ transformOrigin: 'top', width: '1.5px', height: '28px', background: CONNECTOR_COLOR, margin: '0 auto' }}
        />

        {/* ── Tier 3: Domain Packs ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', width: '100%' }}>
          <TierLabel label="Domain Packs" delay={0.74} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {/* Horizontal bar spanning all packs */}
            <m.div
              initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: 0.76 }}
              style={{
                transformOrigin: 'center',
                width: 'calc(100% - 48px)',
                height: '1.5px',
                background: CONNECTOR_COLOR,
                alignSelf: 'center',
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                width: '100%',
              }}
            >
              {DOMAIN_PACKS.map((pack, i) => (
                <div key={pack.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <m.div
                    initial={prefersReduced ? false : { opacity: 0, scaleY: 0 }}
                    whileInView={{ opacity: 1, scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2, delay: 0.82 + i * 0.06 }}
                    style={{ transformOrigin: 'top', width: '1.5px', height: '16px', background: CONNECTOR_COLOR }}
                  />
                  <m.div
                    initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: 0.88 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      padding: '0.75rem 0.625rem',
                      borderRadius: '0.5rem',
                      background: pack.bg,
                      border: `1px solid ${pack.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.375rem',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: pack.color,
                        boxShadow: `0 0 5px ${pack.color}55`,
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(38,8%,88%)', letterSpacing: '-0.01em', textAlign: 'center', lineHeight: 1.3 }}>
                      {pack.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.5rem',
                        fontWeight: 500,
                        color: 'hsl(214,7%,44%)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      {pack.sublabel}
                    </span>
                  </m.div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Legend */}
      <m.div
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 1.2 }}
        style={{ marginTop: '1.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}
      >
        {[
          { label: 'Shared governance at every tier', color: 'hsl(191,92%,44%)' },
          { label: 'One Proof Chain, all packs', color: 'hsl(214,70%,60%)' },
          { label: 'Domain intelligence inherits primitives', color: 'hsl(228,60%,62%)' },
        ].map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: t.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5625rem',
                fontWeight: 500,
                color: 'hsl(214,7%,40%)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </m.div>
    </div>
  );
}
