import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { registry } from '@szl-holdings/brand-registry';
import { CapabilityTile, LogoWall, PricingTier } from '@szl-holdings/design-system';
import { T } from './alloy-theme';
import { AlloyTopBar } from './AlloyTopBar';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;

const ease = [0.22, 1, 0.36, 1] as const;

function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function KineticOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let af: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    const NODES = Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const r = 40 + Math.random() * 80;
      return {
        baseAngle: angle,
        r,
        speed: 0.003 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
      };
    });

    const draw = () => {
      if (document.hidden) { af = requestAnimationFrame(draw); return; }
      t += 0.008;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      const positions = NODES.map((n) => {
        const angle = n.baseAngle + t * n.speed;
        const r = n.r + Math.sin(t * 0.7 + n.phase) * 12;
        return {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          n,
        };
      });

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = `rgba(201,183,135,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      grad.addColorStop(0, 'rgba(201,183,135,0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.fill();

      for (const { x, y, n } of positions) {
        ctx.beginPath();
        ctx.arc(x, y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${n.opacity * 0.6})`;
        ctx.fill();
      }

      af = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(af); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  );
}

interface LiveStatus {
  hfHub: 'ok' | 'error' | 'pending';
  proofChain: 'ok' | 'error' | 'pending';
  covenant: 'ok' | 'error' | 'pending';
  auditEvents: 'ok' | 'error' | 'pending';
  hfModels: number;
  proofCount: number;
  auditCount: number;
  covenantCount: number;
}

function useLiveStatus(): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>({
    hfHub: 'pending', proofChain: 'pending', covenant: 'pending', auditEvents: 'pending',
    hfModels: 0, proofCount: 0, auditCount: 0, covenantCount: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const sig = controller.signal;

    const api = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/a11oy\/$/, '/api/');

    fetch(`${api}hf/hub/status`, { signal: sig })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: { status?: string; pinnedModels?: number }) => {
        setStatus((s) => ({
          ...s,
          hfHub: d.status === 'healthy' ? 'ok' : 'error',
          hfModels: d.pinnedModels ?? 0,
        }));
      })
      .catch(() => setStatus((s) => ({ ...s, hfHub: 'error' })));

    fetch(`${api}proof-chain/recent?limit=5`, { signal: sig })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: unknown[]) => {
        setStatus((s) => ({ ...s, proofChain: 'ok', proofCount: Array.isArray(data) ? data.length : 0 }));
      })
      .catch(() => setStatus((s) => ({ ...s, proofChain: 'error' })));

    fetch(`${api}covenant/status`, { signal: sig })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: { highRiskActions?: unknown[] }) => {
        setStatus((s) => ({ ...s, covenant: 'ok', covenantCount: Array.isArray(d.highRiskActions) ? d.highRiskActions.length : 0 }));
      })
      .catch(() => setStatus((s) => ({ ...s, covenant: 'error' })));

    fetch(`${api}audit/events?limit=5`, { signal: sig })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: unknown[]) => {
        setStatus((s) => ({ ...s, auditEvents: 'ok', auditCount: Array.isArray(data) ? data.length : 0 }));
      })
      .catch(() => setStatus((s) => ({ ...s, auditEvents: 'error' })));

    return () => controller.abort();
  }, []);

  return status;
}

function CapabilityStatusWidget({ color, type }: { color: string; type: 'auth' | 'region' | 'audit' | 'rbac' | 'inference' | 'space' }) {
  const live = useLiveStatus();

  const widgetStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    marginTop: '0.75rem', padding: '0.3rem 0.5rem',
    background: `${color}08`, border: `1px solid ${color}18`,
    borderRadius: 5, width: 'fit-content',
  };
  const dotStyle: React.CSSProperties = {
    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
  };
  const textStyle: React.CSSProperties = {
    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
    letterSpacing: '0.06em', color,
  };

  function resolve(): { dot: string; label: string } {
    switch (type) {
      case 'auth':
        return {
          dot: live.covenant === 'ok' ? '#10b981' : live.covenant === 'pending' ? '#f59e0b' : '#ef4444',
          label: live.covenant === 'ok' ? 'COVENANT ACTIVE' : live.covenant === 'pending' ? 'CHECKING…' : 'OFFLINE',
        };
      case 'region':
        return {
          dot: live.hfHub === 'ok' ? '#3b82f6' : live.hfHub === 'pending' ? '#f59e0b' : '#ef4444',
          label: live.hfHub === 'ok' ? `${live.hfModels} PINNED` : live.hfHub === 'pending' ? 'PROBING…' : 'UNREACHABLE',
        };
      case 'audit':
        return {
          dot: live.proofChain === 'ok' ? '#f59e0b' : live.proofChain === 'pending' ? '#a3a3a3' : '#ef4444',
          label: live.proofChain === 'ok' ? `${live.proofCount} RECENT` : live.proofChain === 'pending' ? 'CONNECTING…' : 'NO CHAIN',
        };
      case 'rbac':
        return {
          dot: live.covenant === 'ok' ? '#8b5cf6' : live.covenant === 'pending' ? '#a3a3a3' : '#ef4444',
          label: live.covenant === 'ok' ? `${live.covenantCount} POLICIES` : live.covenant === 'pending' ? 'LOADING…' : 'OFFLINE',
        };
      case 'inference':
        return {
          dot: live.hfHub === 'ok' ? '#10b981' : live.hfHub === 'pending' ? '#f59e0b' : '#ef4444',
          label: live.hfHub === 'ok' ? 'RUNTIME OK' : live.hfHub === 'pending' ? 'PROBING…' : 'RUNTIME DOWN',
        };
      case 'space':
        return {
          dot: live.auditEvents === 'ok' ? '#ec4899' : live.auditEvents === 'pending' ? '#a3a3a3' : '#ef4444',
          label: live.auditEvents === 'ok' ? `${live.auditCount} EVENTS` : live.auditEvents === 'pending' ? 'CHECKING…' : 'NO AUDIT',
        };
      default:
        return { dot: '#a3a3a3', label: 'UNKNOWN' };
    }
  }

  const cfg = resolve();

  return (
    <div style={widgetStyle}>
      <span style={{ ...dotStyle, background: cfg.dot, animation: cfg.dot !== '#ef4444' ? 'pulse 2s ease-in-out infinite' : 'none' }} />
      <span style={textStyle}>{cfg.label}</span>
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: '🔑',
    title: 'Single Sign-On',
    body: 'SAML 2.0, OIDC, and SSO across every SZL surface — one identity, unified governance. Powered by Policy Engine covenants and the AEEP auth fabric.',
    badge: 'Policy Engine',
    color: '#6366f1',
    widgetType: 'auth' as const,
  },
  {
    icon: '🌍',
    title: 'Regions & Residency',
    body: 'Deploy agents, models, and data stores to sovereign regions. Residency constraints are encoded in the Proof Chain — every placement decision is auditable.',
    badge: 'Proof Chain',
    color: '#3b82f6',
    widgetType: 'region' as const,
  },
  {
    icon: '📋',
    title: 'Audit Logs',
    body: 'Immutable, cryptographically verifiable audit records of every consequential action. Who proposed it, who approved it, what model recommended it.',
    badge: 'Proof Chain',
    color: '#f59e0b',
    widgetType: 'audit' as const,
  },
  {
    icon: '🗂',
    title: 'Resource Groups',
    body: 'Namespace every asset — models, datasets, spaces, agents, connectors — into governed resource groups with RBAC, budget guardrails, and policy inheritance.',
    badge: 'Cognitive Runtime',
    color: '#8b5cf6',
    widgetType: 'rbac' as const,
  },
  {
    icon: '⚡',
    title: 'Dedicated Inference',
    body: 'Reserved inference capacity for enterprise workloads via the Cognitive Runtime model router. Cold-start elimination, SLA guarantees, cost attribution per team.',
    badge: 'Cognitive Runtime',
    color: '#10b981',
    widgetType: 'inference' as const,
  },
  {
    icon: '🔒',
    title: 'Private Spaces',
    body: 'Air-gapped deployment spaces for regulated workloads. Prism Bus handles data routing; no signal leaves your boundary without a Policy Engine covenant.',
    badge: 'Prism Bus',
    color: '#ec4899',
    widgetType: 'space' as const,
  },
  {
    icon: '∮',
    title: 'Ouroboros Thesis v9',
    body: 'The canonical Lutar Invariant family v1 → v7 + Ω, rendered inline at /a11oy/thesis with deep-links into the Supreme Knowledge Codex and live API endpoints. Every formula is sourced, tested, and operational.',
    badge: 'Codex v11',
    color: '#c9b787',
    widgetType: 'audit' as const,
    href: b('/thesis'),
  },
];

const FLEET = registry.products.filter((p) => p.status === 'live').map((p) => ({
  id: p.id,
  name: p.name,
  tagline: p.tagline,
  oneLiner: p.oneLiner,
  doctrineRole: p.doctrineRole,
  link: p.link,
  color: p.color ?? '#c9b787',
}));

const PRICING_TIERS = [
  {
    name: 'Operator',
    tagline: 'For teams getting started with governed AI',
    price: '$490',
    period: 'per seat / mo',
    features: [
      { text: 'Up to 10 operator seats', included: true },
      { text: 'Proof Chain (30-day retention)', included: true },
      { text: 'Policy Engine — standard covenants', included: true },
      { text: '3 connected packs', included: true },
      { text: 'Cognitive Runtime — shared inference', included: true },
      { text: 'SSO (OIDC)', included: true },
      { text: 'Dedicated inference capacity', included: false },
      { text: 'Sovereign regions & residency', included: false },
      { text: 'Custom covenant authoring', included: false },
    ],
    cta: 'Start trial',
    featured: false,
  },
  {
    name: 'Team',
    tagline: 'For scaling enterprise deployments',
    price: '$1,290',
    period: 'per seat / mo',
    features: [
      { text: 'Unlimited operator seats', included: true },
      { text: 'Proof Chain (1-year retention)', included: true },
      { text: 'Policy Engine — custom covenants', included: true },
      { text: 'All connected packs', included: true },
      { text: 'Cognitive Runtime — dedicated inference', included: true },
      { text: 'SSO (SAML 2.0 + OIDC)', included: true },
      { text: 'Resource groups + RBAC', included: true },
      { text: 'Sovereign regions & residency', included: false },
      { text: 'Air-gapped private spaces', included: false },
    ],
    cta: 'Contact sales',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For regulated industries and sovereign deployments',
    price: 'Custom',
    period: '',
    features: [
      { text: 'Unlimited seats + resource groups', included: true },
      { text: 'Proof Chain (unlimited retention)', included: true },
      { text: 'Policy Engine — full covenant stack', included: true },
      { text: 'All packs + custom connectors', included: true },
      { text: 'Dedicated Cognitive Runtime cluster', included: true },
      { text: 'SSO + MFA + SCIM provisioning', included: true },
      { text: 'Sovereign regions + air-gapped spaces', included: true },
      { text: 'SLA + dedicated support', included: true },
      { text: 'Custom covenant authoring + audit export', included: true },
    ],
    cta: 'Talk to us',
    featured: false,
  },
];


function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6rem, 12vw, 9rem) clamp(1.25rem, 5vw, 4rem) 5rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,183,135,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <KineticOrb />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
        <FadeIn>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3125rem 0.875rem',
            background: T.accentDim, border: `1px solid rgba(201,183,135,0.2)`,
            borderRadius: 100, marginBottom: '2rem',
            fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: T.accent, display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            Now in Enterprise Preview
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            fontWeight: 800,
            color: T.text,
            letterSpacing: '-0.04em',
            lineHeight: 1.04,
            marginBottom: '1.5rem',
          }}>
            The front door to every
            <br />
            <span style={{ color: T.accent }}>governed AI surface</span>
            <br />
            in your enterprise.
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
            color: T.textDim,
            lineHeight: 1.65,
            maxWidth: '56ch',
            margin: '0 auto 2.5rem',
          }}>
            Alloy is where every product, agent, model, dataset, and governance record
            in the SZL ecosystem becomes browsable, deployable, and auditable — from one place.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link
              href={b('/hub/fleet')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem',
                background: T.text, color: T.bg,
                borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700,
                textDecoration: 'none', letterSpacing: '-0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              Enter Alloy →
            </Link>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem',
                background: 'transparent', color: T.text,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 10, fontSize: '0.9375rem', fontWeight: 600,
                textDecoration: 'none', letterSpacing: '-0.01em',
              }}
            >
              Talk to us
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '1.25rem' }}>
            Starting at $490 per seat / mo &nbsp;·&nbsp; Enterprise pricing available
          </p>
          <LogoWall
            items={FLEET.map((p) => ({
              id: p.id,
              name: p.name,
              color: p.color,
              glyph: p.name.slice(0, 1).toLowerCase(),
              href: p.link ?? undefined,
            }))}
            label="Powered by the SZL fleet"
          />
        </FadeIn>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section style={{ padding: '5rem clamp(1.25rem, 5vw, 4rem)', maxWidth: 1200, margin: '0 auto' }}>
      <FadeIn>
        <p style={{
          fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: T.textMuted, marginBottom: '0.75rem',
        }}>Enterprise Capabilities</p>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 700, color: T.text,
          letterSpacing: '-0.03em', marginBottom: '0.75rem',
        }}>
          Built for enterprises that can't afford to guess.
        </h2>
        <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '52ch', marginBottom: '3rem' }}>
          Every capability is grounded in real SZL infrastructure — Proof Chain, Policy Engine,
          Cognitive Runtime, Prism Bus. No placeholders.
        </p>
      </FadeIn>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
      }}>
        {CAPABILITIES.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 * i, ease }}
          >
            {cap.href ? (
              <Link href={cap.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <CapabilityTile
                  icon={<span style={{ fontSize: 18 }}>{cap.icon}</span>}
                  title={cap.title}
                  body={cap.body}
                  productBadge={cap.badge}
                  productColor={cap.color}
                >
                  <CapabilityStatusWidget color={cap.color} type={cap.widgetType} />
                </CapabilityTile>
              </Link>
            ) : (
              <CapabilityTile
                icon={<span style={{ fontSize: 18 }}>{cap.icon}</span>}
                title={cap.title}
                body={cap.body}
                productBadge={cap.badge}
                productColor={cap.color}
              >
                <CapabilityStatusWidget color={cap.color} type={cap.widgetType} />
              </CapabilityTile>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FleetSection() {
  return (
    <section style={{
      padding: '5rem clamp(1.25rem, 5vw, 4rem)',
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      background: 'rgba(255,255,255,0.012)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <p style={{
                fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: T.textMuted, marginBottom: '0.5rem',
              }}>Fleet</p>
              <h2 style={{
                fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                fontWeight: 700, color: T.text, letterSpacing: '-0.03em',
              }}>
                Every SZL surface, one front door.
              </h2>
            </div>
            <Link href={b('/hub/fleet')} style={{
              fontSize: '0.8125rem', color: T.accent,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              View all →
            </Link>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.875rem',
        }}>
          {FLEET.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 * i, ease }}
            >
              {p.link ? (
                <a
                  href={p.link}
                  style={{
                    display: 'block', padding: '1.25rem',
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10, textDecoration: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'rgba(255,255,255,0.045)';
                    el.style.borderColor = T.borderStrong;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = T.surface;
                    el.style.borderColor = T.border;
                  }}
                >
                  <FleetCard p={p} />
                </a>
              ) : (
                <div style={{
                  padding: '1.25rem', background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 10,
                  opacity: 0.6,
                }}>
                  <FleetCard p={p} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FleetCard({ p }: { p: typeof FLEET[0] }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: p.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f0f0f0' }}>{p.name}</span>
        </div>
        {p.doctrineRole && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.45rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: T.textDim,
          }}>
            {p.doctrineRole}
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.7875rem', color: T.textDim, lineHeight: 1.55, margin: 0 }}>
        {p.oneLiner}
      </p>
    </>
  );
}

function FoundryPreviewSection() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [counts, setCounts] = useState({ models: 0, datasets: 0, spaces: 0 });

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/a11oy/';
    const api = base.replace('/a11oy/', '/api/');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    interface CountResponse { count?: number; length?: number; total?: number }

    Promise.allSettled([
      fetch(`${api}foundry/models`, { signal: controller.signal }).then((r) => r.ok ? r.json() as Promise<CountResponse[] | CountResponse> : null),
      fetch(`${api}foundry/datasets`, { signal: controller.signal }).then((r) => r.ok ? r.json() as Promise<CountResponse[] | CountResponse> : null),
      fetch(`${api}foundry/spaces`, { signal: controller.signal }).then((r) => r.ok ? r.json() as Promise<CountResponse[] | CountResponse> : null),
    ]).then(([m, d, s]) => {
      clearTimeout(timer);
      const getCount = (result: PromiseSettledResult<CountResponse[] | CountResponse | null>): number => {
        if (result.status !== 'fulfilled' || !result.value) return 0;
        if (Array.isArray(result.value)) return result.value.length;
        const v = result.value;
        return v.count ?? v.total ?? v.length ?? 0;
      };
      const mc = getCount(m);
      const dc = getCount(d);
      const sc = getCount(s);
      setCounts({ models: mc, datasets: dc, spaces: sc });
      setApiStatus(mc > 0 || dc > 0 || sc > 0 ? 'online' : 'offline');
    }).catch(() => {
      clearTimeout(timer);
      setApiStatus('offline');
    });

    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  const items = [
    { label: 'Models', count: counts.models, icon: 'M', color: '#6366f1' },
    { label: 'Datasets', count: counts.datasets, icon: 'D', color: '#3b82f6' },
    { label: 'Spaces', count: counts.spaces, icon: 'S', color: '#10b981' },
  ];

  return (
    <section style={{ padding: '5rem clamp(1.25rem, 5vw, 4rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <FadeIn>
          <p style={{
            fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: T.textMuted, marginBottom: '0.5rem',
          }}>Foundry</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 700, color: T.text, letterSpacing: '-0.03em',
            }}>
              Your governed AI foundry.
            </h2>
            <Link href={b('/hub/foundry')} style={{
              fontSize: '0.8125rem', color: T.accent, textDecoration: 'none',
            }}>
              Open Foundry →
            </Link>
          </div>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '52ch', marginBottom: '2.5rem' }}>
            Browse and deploy models, datasets, and spaces — all governed by Policy Engine and attributed via Proof Chain.
          </p>
        </FadeIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem',
        }}>
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease }}
            >
              <Link
                href={b('/hub/foundry')}
                style={{
                  display: 'block', padding: '1.5rem',
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 10, textDecoration: 'none',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = T.surface;
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 7,
                    background: `${item.color}14`, border: `1px solid ${item.color}28`,
                    fontSize: 13, fontFamily: T.mono, color: item.color, fontWeight: 700,
                  }}>{item.icon}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: T.text }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: T.text, marginBottom: '0.25rem' }}>
                  {apiStatus === 'checking' ? '—' : apiStatus === 'online' ? item.count : '—'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono }}>
                  {apiStatus === 'checking' ? 'Connecting to registry…' :
                   apiStatus === 'online' ? 'registered in Foundry' :
                   'Connect API to browse'}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: apiStatus === 'online' ? '#10b981' : apiStatus === 'checking' ? '#f59e0b' : T.textMuted,
          }} />
          <span style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono }}>
            Foundry API: {apiStatus === 'checking' ? 'connecting…' : apiStatus === 'online' ? 'connected' : 'unavailable — start API server to browse assets'}
          </span>
        </div>
      </div>
    </section>
  );
}

function GovernanceSection() {
  const [entries, setEntries] = useState<Array<{ id: string; type: string; actor: string; action: string; ts: string; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/a11oy/';
    const apiBase = base.replace('/a11oy/', '/api/');
    interface GovApiEntry {
      id?: string; type?: string; actor?: string;
      description?: string; action?: string;
      createdAt?: string; timestamp?: string;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch(`${apiBase}proof-chain/recent?limit=6`, { signal: controller.signal })
      .then((r) => r.ok ? r.json() as Promise<GovApiEntry[]> : Promise.reject(new Error(`${r.status}`)))
      .then((data) => {
        clearTimeout(timer);
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data.map((e) => ({
            id: e.id ?? `g-${Math.random().toString(36).slice(2)}`,
            type: e.type ?? 'PROOF',
            actor: e.actor ?? 'system',
            action: e.description ?? e.action ?? 'Record entry',
            ts: e.createdAt ?? e.timestamp ?? new Date().toISOString(),
            color: '#c9b787',
          })));
        } else {
          setEntries([]);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        setEntries([]);
      })
      .finally(() => setLoading(false));
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  return (
    <section style={{
      padding: '5rem clamp(1.25rem, 5vw, 4rem)',
      borderTop: `1px solid ${T.border}`,
      background: 'rgba(255,255,255,0.008)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <p style={{
                fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: T.textMuted, marginBottom: '0.5rem',
              }}>Governance</p>
              <h2 style={{
                fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                fontWeight: 700, color: T.text, letterSpacing: '-0.03em',
              }}>
                Evidence stream. Live.
              </h2>
            </div>
            <Link href={b('/hub/governance')} style={{
              fontSize: '0.8125rem', color: T.accent, textDecoration: 'none',
            }}>
              Full audit log →
            </Link>
          </div>
        </FadeIn>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: 60, borderRadius: 8,
                background: T.surface, border: `1px solid ${T.border}`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12,
          }}>
            <p style={{ fontSize: '0.875rem', color: T.textDim, marginBottom: '0.5rem' }}>
              No governance events recorded yet.
            </p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted }}>
              Events will appear here as agents execute and approvals are processed.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.06 * i }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1rem',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 6,
                  background: `${entry.color}14`, border: `1px solid ${entry.color}28`,
                  fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: entry.color,
                  flexShrink: 0,
                }}>
                  {entry.type.slice(0, 2)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', color: '#e0e0e0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.action}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono }}>
                    {entry.actor}
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono, flexShrink: 0 }}>
                  {new Date(entry.ts).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section style={{ padding: '5rem clamp(1.25rem, 5vw, 4rem)', borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{
              fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: T.textMuted, marginBottom: '0.5rem',
            }}>Pricing & Plans</p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 700, color: T.text, letterSpacing: '-0.03em', marginBottom: '0.75rem',
            }}>
              Governance that scales with you.
            </h2>
            <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '48ch', margin: '0 auto' }}>
              Every tier is built on compounding intelligence — not raw model count. The more your operators use Alloy, the smarter the evidence stream becomes.
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}>
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease }}
            >
              <PricingTier
                name={tier.name}
                tagline={tier.tagline}
                price={tier.price === 'Custom' ? undefined : tier.price}
                priceSuffix={tier.period || undefined}
                features={tier.features}
                cta={tier.cta}
                ctaHref="mailto:inquiries@szlholdings.com"
                featured={tier.featured}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${T.border}`,
      padding: '3rem clamp(1.25rem, 5vw, 4rem)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, border: `1px solid ${T.accent}`,
            borderRadius: 4, fontSize: 9, fontFamily: T.mono, color: T.accent, fontWeight: 700,
          }}>a</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.textDim }}>
            Alloy — A SZL Holdings product.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
            { label: 'Security', href: b('/security-compliance') },
            { label: 'Status', href: '#' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: '0.75rem', color: T.textMuted, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: T.textMuted }}>
          &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

export function AlloyHubLanding() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.sans }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <AlloyTopBar />
      <HeroSection />
      <CapabilitiesSection />
      <FleetSection />
      <FoundryPreviewSection />
      <GovernanceSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
