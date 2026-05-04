import { EvalBadge } from '@szl-holdings/design-system/eval/badge';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, ExternalLink, FileText, Lock, MessageSquare, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { CARLOTA_JO_RETENTION, CARLOTA_JO_YEARS_EXPERIENCE, metricDisplay } from '@/lib/claims';

import { productHref } from '@szl-holdings/brand-registry';

const ALLOY_HREF = productHref('alloy');
const EVAL_API = `${import.meta.env.BASE_URL}api/eval-registry/public/benchmarks`;
const EVAL_TRACE_BASE = 'https://github.com/szlholdings/eval-results/blob/main/.eval_results';

const GOLD = 'var(--color-gold)';
const _GOLD_DIM = 'var(--color-gold-dim)';
const CREAM = 'var(--color-cream-warm)';
const INK = 'var(--color-ink-900)';
const INK_600 = 'var(--color-ink-600)';
const INK_500 = 'var(--color-ink-500)';
const STONE_200 = 'var(--color-stone-200)';

function GoldDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let animFrame: number;
    let time = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * (canvas.offsetWidth || 1200),
      y: Math.random() * (canvas.offsetHeight || 800),
      vx: (Math.random() - 0.5) * 0.12,
      vy: -Math.random() * 0.08 - 0.015,
      size: Math.random() * 1.0 + 0.25,
      opacity: Math.random() * 0.12 + 0.02,
    }));
    const draw = () => {
      if (document.hidden) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      time += 0.001;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time * 1.8 + p.y * 0.009) * 0.04;
        p.y += p.vy;
        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,170,126,${p.opacity})`;
        ctx.fill();
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}

function LuxuryHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#18150f', minHeight: 'min(94vh, 860px)' }}
    >
      <GoldDust />
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(196,170,126,0.18), transparent)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 72% 35%, rgba(196,170,126,0.05) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(to top, #18150f, transparent)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-36 sm:pt-44 lg:pt-48 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 xl:col-span-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="w-8 h-px" style={{ background: 'rgba(196,170,126,0.45)' }} />
              <span
                className="text-[10px] font-medium tracking-[0.38em] uppercase"
                style={{ color: 'rgba(196,170,126,0.65)' }}
              >
                Private Advisory
              </span>
              <span style={{ color: 'rgba(196,170,126,0.25)', margin: '0 0.25rem' }}>·</span>
              <a
                href={ALLOY_HREF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  color: 'rgba(196,170,126,0.5)',
                  padding: '0.2rem 0.5rem',
                  border: '1px solid rgba(196,170,126,0.18)',
                  borderRadius: 4,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = 'rgba(196,170,126,0.9)';
                  el.style.borderColor = 'rgba(196,170,126,0.4)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = 'rgba(196,170,126,0.5)';
                  el.style.borderColor = 'rgba(196,170,126,0.18)';
                }}
              >
                Powered by Alloy
              </a>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                lineHeight: 1.05,
                color: '#f4ede0',
              }}
            >
              Where life's complexity
              <br />
              <em style={{ color: 'rgba(196,170,126,0.88)', fontStyle: 'italic' }}>
                finds quiet clarity.
              </em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 text-[15px] font-light leading-[1.8] max-w-lg"
              style={{ color: 'rgba(244,237,224,0.6)' }}
            >
              Precision advisory, governed by Alloy — for individuals who demand discretion,
              expert presence, and a trusted partner across every dimension of their private life.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col sm:flex-row items-start gap-4"
            >
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 px-8 py-4 text-[12px] font-medium tracking-[0.1em] uppercase transition-all duration-300"
                style={{ background: 'rgba(196,170,126,0.92)', color: '#18150f' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(196,170,126,1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(196,170,126,0.92)';
                }}
              >
                Begin a Conversation
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-4 text-[11px] font-medium tracking-[0.18em] uppercase transition-all duration-300"
                style={{
                  color: 'rgba(196,170,126,0.45)',
                  border: '1px solid rgba(196,170,126,0.14)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(196,170,126,0.32)';
                  el.style.color = 'rgba(196,170,126,0.75)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(196,170,126,0.14)';
                  el.style.color = 'rgba(196,170,126,0.45)';
                }}
              >
                Explore Services
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 xl:col-span-5 lg:mt-6"
          >
            <div
              style={{
                border: '1px solid rgba(196,170,126,0.1)',
                background: 'rgba(24,21,15,0.7)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div
                className="px-8 py-7"
                style={{ borderBottom: '1px solid rgba(196,170,126,0.08)' }}
              >
                <p
                  className="text-[9px] tracking-[0.32em] uppercase font-medium mb-5"
                  style={{ color: 'rgba(196,170,126,0.45)' }}
                >
                  Service Disciplines
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Residence Operations',
                      desc: 'Primary and secondary properties managed with complete care',
                    },
                    {
                      label: 'Household Systems',
                      desc: 'Staff, vendors, and domestic infrastructure unified',
                    },
                    {
                      label: 'Special Projects',
                      desc: 'Acquisitions, relocations, estate transitions',
                    },
                    {
                      label: 'Lifestyle Administration',
                      desc: 'Travel, events, appointments, and daily operations',
                    },
                    {
                      label: 'Advisory Continuity',
                      desc: 'Strategic guidance as circumstances evolve',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2.5"
                      style={{ borderBottom: i < 4 ? '1px solid rgba(196,170,126,0.06)' : 'none' }}
                    >
                      <span
                        className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: 'rgba(196,170,126,0.35)' }}
                      />
                      <div>
                        <p
                          className="text-[12px] font-light"
                          style={{ color: 'rgba(244,237,224,0.78)' }}
                        >
                          {item.label}
                        </p>
                        <p
                          className="text-[10px] font-light mt-0.5"
                          style={{ color: 'rgba(244,237,224,0.36)' }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-8 py-5 flex items-center gap-6">
                {[
                  { value: metricDisplay(CARLOTA_JO_RETENTION), label: 'Client Retention' },
                  { value: '24h', label: 'Response SLA' },
                  { value: 'Private', label: 'Engagement Model' },
                ].map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: '1.4rem',
                        fontWeight: 300,
                        color: 'rgba(244,237,224,0.88)',
                      }}
                    >
                      {s.value}
                    </p>
                    <p
                      className="text-[8px] tracking-[0.22em] uppercase mt-0.5"
                      style={{ color: 'rgba(196,170,126,0.38)' }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="mt-4 px-1 flex justify-between text-[9px] tracking-[0.2em] uppercase"
              style={{ color: 'rgba(196,170,126,0.22)' }}
            >
              <span>New York · Miami</span>
              <span>By referral</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const TOP_SCORES = [
  {
    entity: 'Counsel',
    benchmark: 'Contract Risk Detection',
    task: 'Clause Classification Accuracy',
    score: '94.2',
    unit: '%',
    rank: 1,
    badgeState: 'verified' as const,
    href: '/open-evaluation',
  },
  {
    entity: 'Pulse',
    benchmark: 'Executive Brief Quality',
    task: 'Insight Relevance',
    score: '4.6',
    unit: '/5',
    rank: 1,
    badgeState: 'verified' as const,
    href: '/open-evaluation',
  },
  {
    entity: 'SEXTANT',
    benchmark: 'Vessel ETA Accuracy',
    task: 'Mean Absolute % Error',
    score: '3.1',
    unit: '%',
    rank: 1,
    badgeState: 'verified' as const,
    href: '/open-evaluation',
  },
];

interface TopScore {
  entity: string;
  benchmark: string;
  task: string;
  score: string;
  unit: string;
  rank: number;
  badgeState: 'verified' | 'community' | 'leaderboard';
  href: string;
  sourceUrl?: string;
}

function LiveProofCallouts() {
  const [scores, setScores] = useState<TopScore[]>(TOP_SCORES);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(EVAL_API, {
        credentials: 'include',
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return;
      const json = await res.json();
      const apiBenchmarks: Array<{
        benchmarkId: string;
        name: string;
        tasks?: Array<{ taskId: string; name: string; primaryMetric: string; higherIsBetter: boolean }>;
      }> = json?.benchmarks ?? [];
      if (!apiBenchmarks.length) return;
      const liveScores: TopScore[] = [];
      for (const bm of apiBenchmarks.slice(0, 4)) {
        for (const task of (bm.tasks ?? []).slice(0, 1)) {
          const lb = await fetch(
            `${EVAL_API}/${bm.benchmarkId}/leaderboard?task_id=${task.taskId}&limit=1`,
            { credentials: 'include', signal: AbortSignal.timeout(5000) },
          ).catch(() => null);
          if (!lb?.ok) continue;
          const lbJson = await lb.json();
          const top = lbJson?.entries?.[0];
          if (!top) continue;
          const scoreStr = top.numericValue ?? String(Math.round((top.value ?? 0) * 100) / 100);
          liveScores.push({
            entity: top.entityLabel ?? top.entityId,
            benchmark: bm.name,
            task: task.name,
            score: scoreStr,
            unit: top.unit ?? (task.higherIsBetter ? '' : '%'),
            rank: top.rank ?? 1,
            badgeState: (top.badgeState ?? 'community') as TopScore['badgeState'],
            href: '/open-evaluation',
            sourceUrl: top.sourceUrl
              ? top.sourceUrl
              : `${EVAL_TRACE_BASE}/${(top.entityId ?? 'entity').replace(/[^a-z0-9-]/gi, '-')}-${top.evalDate ?? 'latest'}.yaml`,
          });
        }
      }
      if (liveScores.length > 0) setScores(liveScores.slice(0, 3));
    } catch {
      // silently keep static seeds on any error
    }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  return (
    <section
      style={{
        background: '#18150f',
        borderBottom: '1px solid rgba(196,170,126,0.08)',
        padding: '3.5rem 1.5rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-4 w-4" style={{ color: 'rgba(196,170,126,0.65)' }} />
            <span
              className="text-[10px] font-medium tracking-[0.35em] uppercase"
              style={{ color: 'rgba(196,170,126,0.65)' }}
            >
              Verified Performance — Live Rankings
            </span>
          </div>
          <Link href="/open-evaluation">
            <span
              className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase font-medium transition-opacity hover:opacity-70"
              style={{ color: 'rgba(196,170,126,0.5)' }}
            >
              Browse all benchmarks
              <ExternalLink className="h-3 w-3" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {scores.map((s) => (
            <Link key={s.entity} href={s.href}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
                style={{
                  border: '1px solid rgba(196,170,126,0.1)',
                  background: 'rgba(24,21,15,0.7)',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className="text-xs font-medium tracking-wide"
                    style={{ color: 'rgba(196,170,126,0.55)' }}
                  >
                    #{s.rank} {s.entity}
                  </span>
                  <EvalBadge state={s.badgeState} compact />
                </div>
                <div
                  className="text-3xl font-light mb-1 tabular-nums"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: '#f4ede0',
                  }}
                >
                  {s.score}
                  <span className="text-lg ml-0.5" style={{ color: 'rgba(244,237,224,0.45)' }}>
                    {s.unit}
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: 'rgba(244,237,224,0.45)' }}>
                  {s.benchmark}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(244,237,224,0.3)' }}>
                  {s.task}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesOverview() {
  const services = [
    {
      num: '01',
      title: 'Residence Operations',
      body: 'Complete oversight of primary and secondary residences — from staff management to maintenance, seasonal preparation, and vendor relationships. You define the standard; we maintain it.',
    },
    {
      num: '02',
      title: 'Household Systems Design',
      body: "Structure, staffing, and operations built around your household's rhythms. We design systems that run quietly and can scale with your life.",
    },
    {
      num: '03',
      title: 'Special Projects',
      body: 'Major transitions handled with precision — property acquisitions, international relocations, estate organization, and high-stakes personal logistics.',
    },
    {
      num: '04',
      title: 'Lifestyle Administration',
      body: 'Travel planning, event coordination, scheduling, and daily administrative operations managed discreetly and without friction.',
    },
    {
      num: '05',
      title: 'Vendor Management',
      body: "Your vendors, contractors, and service providers organized and accountable. We handle the relationships so you don't have to.",
    },
    {
      num: '06',
      title: 'Advisory Continuity',
      body: 'Strategic counsel as your life and household evolve — trusted, independent, and always available.',
    },
  ];

  return (
    <section style={{ background: CREAM, borderTop: `1px solid ${STONE_200}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="py-20 lg:py-28 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-[10px] tracking-[0.38em] uppercase font-medium mb-6"
              style={{ color: GOLD }}
            >
              Services
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: INK,
                lineHeight: 1.1,
              }}
            >
              Six practice areas.
              <br />
              <em>One uncompromising standard.</em>
            </h2>
            <p className="mt-5 text-[14px] font-light leading-[1.75]" style={{ color: INK_600 }}>
              Every engagement is conducted through Rosa directly — no associates, no handoffs, no
              templated service models.
            </p>
          </motion.div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ borderTop: `1px solid ${STONE_200}` }}
        >
          {services.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="px-0 py-10 pr-8"
              style={{
                borderBottom: `1px solid ${STONE_200}`,
                borderRight: i % 3 !== 2 ? `1px solid ${STONE_200}` : 'none',
                paddingLeft: i % 3 === 0 ? '0' : '2rem',
              }}
            >
              <p
                className="text-[9px] tracking-[0.3em] uppercase mb-5"
                style={{ color: 'var(--color-gold)', opacity: 0.6 }}
              >
                {s.num}
              </p>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 400,
                  fontSize: '1.25rem',
                  color: INK,
                  lineHeight: 1.2,
                }}
                className="mb-3"
              >
                {s.title}
              </h3>
              <p className="text-[13px] font-light leading-[1.75]" style={{ color: INK_500 }}>
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="py-10 flex justify-start">
          <Link href="/services">
            <span
              className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-ink-700)' }}
            >
              Full Service Overview <ArrowRight size={12} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function DiscreetApproach() {
  const pillars = [
    {
      label: 'Discretion',
      body: 'Your life is not shared with anyone. Every engagement operates under strict confidentiality, with no third-party data sharing of any kind.',
    },
    {
      label: 'Responsiveness',
      body: '24-hour response to all active client communications. Urgent matters escalated within the hour.',
    },
    {
      label: 'Depth',
      body: 'We do not manage surface-level coordination. We understand the full context of your life and act accordingly.',
    },
    {
      label: 'Precision',
      body: 'Thoroughness without excess. Every instruction is executed with care and documented with clarity.',
    },
    {
      label: 'Continuity',
      body: 'The same principal throughout — no handoffs, no coverage gaps, no reintroductions.',
    },
  ];

  return (
    <section style={{ background: 'var(--color-stone-50)', borderTop: `1px solid ${STONE_200}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 max-w-xl"
        >
          <p
            className="text-[10px] tracking-[0.38em] uppercase font-medium mb-6"
            style={{ color: GOLD }}
          >
            Our Approach
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)',
              color: INK,
              lineHeight: 1.1,
            }}
          >
            The standard we hold.
            <br />
            <em>Every engagement, without exception.</em>
          </h2>
        </motion.div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px"
          style={{ background: STONE_200 }}
        >
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="p-8"
              style={{ background: 'var(--color-stone-50)' }}
            >
              <p
                className="text-[8px] tracking-[0.28em] uppercase mb-4"
                style={{ color: GOLD, opacity: 0.6 }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 400,
                  fontSize: '1.1rem',
                  color: INK,
                }}
                className="mb-3"
              >
                {p.label}
              </h3>
              <p className="text-[12.5px] font-light leading-[1.7]" style={{ color: INK_500 }}>
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RosaIntro() {
  return (
    <section style={{ background: CREAM, borderTop: `1px solid ${STONE_200}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          <div className="lg:col-span-4">
            <p
              className="text-[10px] tracking-[0.38em] uppercase font-medium mb-5"
              style={{ color: GOLD }}
            >
              Principal
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: '2rem',
                color: INK,
                lineHeight: 1.1,
              }}
              className="mb-2"
            >
              Rosa Carlota Jo
            </h2>
            <p className="text-[12px] font-light" style={{ color: INK_500 }}>
              Founder & Principal Advisor
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-stone-400)' }}>
              Carlota Jo Advisory
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[14px] font-light leading-[1.8] mb-5" style={{ color: INK_600 }}>
              Rosa brings {metricDisplay(CARLOTA_JO_YEARS_EXPERIENCE)} of private advisory
              experience to a highly selective roster of clients. Her work spans primary residence
              management, international household operations, special projects, and long-term
              advisory continuity.
            </p>
            <p className="text-[13px] font-light leading-[1.8]" style={{ color: INK_500 }}>
              Every client engagement is handled by Rosa personally. There are no associates, no
              delivery teams, and no templated service models. This is a deliberate choice — and the
              foundation of the trust her clients place in her.
            </p>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Link href="/founder">
              <span
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                style={{ color: GOLD }}
              >
                Full biography
              </span>
            </Link>
            <Link href="/contact">
              <span
                className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors"
                style={{ background: GOLD, color: 'var(--color-cream)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = GOLD;
                }}
              >
                Request Consultation
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ClientExperienceStrip() {
  const features = [
    {
      icon: Lock,
      label: 'Private Client Portal',
      desc: 'Secure access to your documents, updates, and direct communications.',
    },
    {
      icon: FileText,
      label: 'Document Access',
      desc: 'All engagement documents and deliverables in one private workspace.',
    },
    {
      icon: MessageSquare,
      label: 'Direct Communications',
      desc: 'Message Rosa directly — no intermediaries, no routing delays.',
    },
    {
      icon: CheckCircle,
      label: 'Service Status',
      desc: 'Real-time visibility into ongoing projects and open milestones.',
    },
  ];

  return (
    <section style={{ background: '#18150f', borderTop: '1px solid rgba(196,170,126,0.1)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <p
            className="text-[10px] tracking-[0.38em] uppercase font-medium mb-5"
            style={{ color: 'rgba(196,170,126,0.6)' }}
          >
            Client Experience
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)',
              color: '#f4ede0',
              lineHeight: 1.1,
            }}
          >
            Your private workspace,
            <br />
            <em style={{ color: 'rgba(196,170,126,0.8)' }}>always within reach.</em>
          </h2>
        </motion.div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: 'rgba(196,170,126,0.06)' }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-8"
              style={{ background: '#18150f' }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center mb-5"
                style={{ border: '1px solid rgba(196,170,126,0.14)' }}
              >
                <f.icon size={15} strokeWidth={1.2} style={{ color: 'rgba(196,170,126,0.65)' }} />
              </div>
              <h3
                className="text-[14px] font-light mb-2"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#f4ede0' }}
              >
                {f.label}
              </h3>
              <p
                className="text-[12px] font-light leading-[1.7]"
                style={{ color: 'rgba(244,237,224,0.45)' }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/client-portal">
            <span
              className="inline-flex items-center gap-2.5 px-8 py-4 text-[11px] font-medium tracking-[0.1em] uppercase transition-all"
              style={{
                background: 'rgba(196,170,126,0.12)',
                border: '1px solid rgba(196,170,126,0.2)',
                color: 'rgba(196,170,126,0.85)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(196,170,126,0.18)';
                el.style.color = 'rgba(196,170,126,0.95)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(196,170,126,0.12)';
                el.style.color = 'rgba(196,170,126,0.85)';
              }}
            >
              <Lock size={12} /> Access Client Portal
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SZLPlatformNote() {
  return (
    <section style={{ background: 'var(--color-stone-50)', borderTop: `1px solid ${STONE_200}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-14">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8"
        >
          <div className="flex-1">
            <p
              className="text-[11px] font-light leading-relaxed"
              style={{ color: 'var(--color-stone-400)' }}
            >
              Carlota Jo operates as an independent advisory practice within the{' '}
              <span style={{ color: 'var(--color-stone-500)' }}>SZL Holdings</span> family of
              companies — sharing infrastructure, values, and a commitment to discretion without
              compromising independence.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-3">
            <a
              href="/"
              className="text-[10px] tracking-[0.2em] uppercase font-light transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-stone-400)' }}
            >
              SZL Holdings
            </a>
            <a
              href={ALLOY_HREF}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.3125rem 0.75rem',
                background: 'rgba(196,170,126,0.06)',
                border: '1px solid rgba(196,170,126,0.2)',
                borderRadius: 6,
                fontSize: '0.5625rem', fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(196,170,126,0.65)',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'rgba(196,170,126,0.1)';
                el.style.color = 'rgba(196,170,126,0.9)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'rgba(196,170,126,0.06)';
                el.style.color = 'rgba(196,170,126,0.65)';
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 12, height: 12,
                border: '1px solid rgba(196,170,126,0.5)',
                borderRadius: 2, fontSize: 7, fontWeight: 700,
                color: 'rgba(196,170,126,0.7)',
              }}>a</span>
              Powered by Alloy
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section style={{ background: '#18150f', borderTop: '1px solid rgba(196,170,126,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-28 lg:py-36 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p
            className="text-[10px] tracking-[0.38em] uppercase font-medium mb-7"
            style={{ color: 'rgba(196,170,126,0.5)' }}
          >
            Get Started
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              color: '#f4ede0',
              lineHeight: 1.08,
            }}
            className="mb-6"
          >
            Engagements begin
            <br />
            <em style={{ color: 'rgba(196,170,126,0.8)' }}>with a single conversation.</em>
          </h2>
          <p
            className="text-[14px] font-light max-w-md mx-auto mb-10"
            style={{ color: 'rgba(244,237,224,0.5)' }}
          >
            Send a private inquiry and we will respond within one business day to arrange an
            introduction.
          </p>
          <Link href="/contact">
            <span
              className="inline-flex items-center gap-3 px-10 py-4 text-[12px] font-medium tracking-[0.1em] uppercase transition-all"
              style={{ background: 'rgba(196,170,126,0.88)', color: '#18150f' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(196,170,126,1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(196,170,126,0.88)';
              }}
            >
              Submit a Private Inquiry
              <ArrowRight size={12} />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function PremiumHomePage() {
  return (
    <div style={{ minHeight: '100vh', background: CREAM }}>
      <Header />
      <main id="main-content" tabIndex={-1}>
      <LuxuryHero />
      <LiveProofCallouts />
      <ServicesOverview />
      <DiscreetApproach />
      <RosaIntro />
      <ClientExperienceStrip />
      <SZLPlatformNote />
      <section
        style={{
          background: '#18150f',
          borderTop: '1px solid rgba(196,170,126,0.08)',
          padding: '4rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <NewsletterSubscribe
            utmSource="carlota-jo"
            variant="inline"
            accentColor="hsl(36, 48%, 52%)"
            heading="Stay ahead with SZL Command"
            subheading="Founder-written intelligence on governed AI, advisory practice, and strategic operations — no filler."
          />
        </div>
      </section>
      <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
