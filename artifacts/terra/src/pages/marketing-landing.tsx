import { aboutSzlParagraph, copyrightLine } from '@szl-holdings/brand-registry';
import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  DollarSign,
  Eye,
  FileText,
  Flame,
  Layers,
  MapPin,
  Menu,
  Search,
  Shield,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ACCENT = '#2d6a4f';
const ACCENT_LIGHT = '#5a9e82';
const ACCENT_LIGHT_BG = '#40856a';
const BTN_BG = '#1e6e52';
const BRASS = '#9a7840';
const BRASS_LIGHT = '#b8943c';
const BG = '#0a0c10';
const BG2 = '#0f1218';

const doctrine = [
  {
    phase: 'Foundation',
    desc: 'Establish your data layer. Property ownership, LLC chains, tax records, and debt positions — resolved and de-duped.',
    icon: Layers,
  },
  {
    phase: 'Watch',
    desc: 'Surface distress before the market does. Pre-foreclosure, lis pendens, auction calendars, tax liens, expired listings.',
    icon: Eye,
  },
  {
    phase: 'Pipeline',
    desc: 'Move leads to deals in a structured acquisition workflow. Stage-gated, scored, and assigned.',
    icon: Activity,
  },
  {
    phase: 'Intelligence',
    desc: 'Cross-reference ownership, debt maturity, hold duration, and market comps to rank and prioritize every opportunity.',
    icon: BarChart3,
  },
  {
    phase: 'Action',
    desc: 'Execute. Outreach, diligence, underwriting, and deal routing — from one operating surface.',
    icon: ArrowRight,
  },
];

const capabilities = [
  {
    icon: Flame,
    title: 'Distress Intelligence',
    desc: 'Real-time pre-foreclosure tracking, lis pendens filings, auction calendars, and tax lien discovery across all NYC boroughs. AI-scored opportunity ranking.',
  },
  {
    icon: Search,
    title: 'Ownership Resolution',
    desc: 'LLC unmasking and entity resolution to identify beneficial owners, cross-reference debt maturity timelines, hold duration, and off-market propensity.',
  },
  {
    icon: Activity,
    title: 'Deal Pipeline',
    desc: 'Stage-gated acquisition and disposition pipeline with ownership assignments, priority scoring, and CRM-native workflow.',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence',
    desc: 'Comparable sales, price-per-sqft trends, borough-level dynamics, and off-market opportunity discovery — updated continuously.',
  },
  {
    icon: Users,
    title: 'Broker Operations',
    desc: 'Broker-native CRM with contact management, deal history, tenant profiles, lease schedules, and performance scorecards.',
  },
  {
    icon: DollarSign,
    title: 'Investment Analysis',
    desc: 'IRR modeling, cap rate analysis, and scenario planning. Climate risk overlays, FEMA zone cross-referencing, portfolio-level tracking.',
  },
];

const useCases = [
  {
    title: 'Off-Market Discovery',
    desc: 'Surface properties before they list. Distress signals, LLC ownership chains, and debt maturity flags create your sourcing edge.',
  },
  {
    title: 'Deal Sourcing at Scale',
    desc: 'Run structured outreach from a distress queue — not a spreadsheet. Convert property intelligence into live pipeline.',
  },
  {
    title: 'Portfolio Review',
    desc: 'Track lease expirations, occupancy gaps, and value-add opportunities across your entire hold.',
  },
  {
    title: 'Broker Management',
    desc: 'Performance scorecards, response analytics, and deal attribution — for a serious brokerage operation.',
  },
  {
    title: 'Distressed Opportunity Tracking',
    desc: 'Monitor pre-foreclosure through REO. Score, prioritize, and act — before the market catches up.',
  },
  {
    title: 'Diligence & Approvals',
    desc: 'Structure the diligence process. Ownership verification, document collection, and deal approvals in one auditable workflow.',
  },
];

const buyers = [
  {
    role: 'Investors & Acquisitions',
    desc: 'Source distressed opportunities, analyze ownership structures, model returns, and track deals from discovery to close.',
  },
  {
    role: 'Brokers & Agents',
    desc: 'Manage your deal pipeline, track client relationships, monitor market movement, and hit your numbers.',
  },
  {
    role: 'Portfolio Teams',
    desc: 'Monitor property health, track lease expirations, model renewals, and surface disposition opportunities.',
  },
  {
    role: 'Lenders & Capital',
    desc: 'Underwrite with confidence. Cross-reference ownership, distress signals, market comps, and borrower history.',
  },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0' : 'translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function TerraMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoType, setDemoType] = useState<'demo' | 'consultation' | 'trial'>('demo');

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: BG, color: '#c8ccd6', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* NAV */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-400 ${scrolled ? 'border-b' : ''}`}
        style={{
          background: scrolled ? 'rgba(10,12,16,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: 'rgba(45,106,79,0.12)',
                border: `1px solid rgba(45,106,79,0.22)`,
              }}
            >
              <Building2 size={13} style={{ color: ACCENT_LIGHT }} />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">DOMAINE</span>
            <span
              aria-hidden="true"
              className="hidden sm:inline text-[9px] tracking-[0.14em] uppercase ml-1"
              style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}
            >
              Property Intelligence
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: 'Platform', href: '#platform' },
              { label: 'Doctrine', href: '#doctrine' },
              { label: 'Capabilities', href: '#capabilities' },
              { label: "Who It's For", href: '#buyers' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[11px] tracking-[0.06em] uppercase font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={onSignIn}
              className="text-[12px] font-semibold px-5 py-1.5 rounded-lg transition-all"
              style={{ background: BTN_BG, color: '#fff' }}
            >
              Sign in
            </button>
          </div>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileNav(!mobileNav)}
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 md:hidden"
          style={{ background: 'rgba(10,12,16,0.98)', backdropFilter: 'blur(16px)' }}
        >
          {[
            { label: 'Platform', href: '#platform' },
            { label: 'Doctrine', href: '#doctrine' },
            { label: 'Capabilities', href: '#capabilities' },
            { label: "Who It's For", href: '#buyers' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileNav(false)}
              className="text-lg tracking-wide"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              onSignIn?.();
              setMobileNav(false);
            }}
            className="mt-4 text-sm font-semibold px-8 py-3 rounded-xl"
            style={{ background: BTN_BG, color: '#fff' }}
          >
            Sign in
          </button>
        </div>
      )}

      {/* HERO */}
      <section className="relative pt-32 sm:pt-44 pb-24 sm:pb-32 max-w-[1100px] mx-auto px-6">
        <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden">
          <div
            className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(45,106,79,0.035) 0%, transparent 70%)',
            }}
          />
        </div>

        <Reveal>
          <p
            className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-8 font-mono"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            SZL Holdings &middot; Property / Portfolio / Broker Intelligence
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-[clamp(2.6rem,6.5vw,4.8rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-white max-w-[860px]">
            The operating surface for
            <br />
            <span style={{ color: ACCENT_LIGHT }}>serious real estate.</span>
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p
            className="text-[17px] sm:text-[19px] leading-[1.8] max-w-[600px] mt-7 mb-10"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Terra gives investors, brokers, and portfolio teams a single intelligence surface — from
            distressed property discovery through ownership analysis, pipeline management, and deal
            execution.
          </p>
        </Reveal>

        <Reveal delay={280}>
          <div className="flex flex-wrap gap-3 mb-20">
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-7 py-3 rounded-lg transition-all"
              style={{ background: BTN_BG, color: '#fff' }}
            >
              Sign In <ArrowRight size={14} />
            </button>
            <a
              href="./dashboard?demo=true"
              className="inline-flex items-center gap-2 text-[13px] font-medium px-7 py-3 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Try Platform Demo →
            </a>
          </div>
        </Reveal>

        <Reveal delay={360}>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {[
              { value: '1,025+', label: 'Distress properties' },
              { value: '$4.8B', label: 'Pipeline tracked' },
              { value: '5 boroughs', label: 'NYC coverage' },
              { value: '6 modules', label: 'Intelligence domains' },
            ].map((s) => (
              <div key={s.label} className="py-5 px-5" style={{ background: BG }}>
                <span className="text-[22px] font-extrabold font-mono text-white block">
                  {s.value}
                </span>
                <span
                  className="text-[10px] tracking-[0.06em] uppercase mt-1 block"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* PLATFORM THESIS */}
      <section id="platform" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[720px] mx-auto">
          <Reveal>
            <p
              className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 font-mono"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              The thesis
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-[1.15] tracking-tight text-white mb-8">
              Information asymmetry wins deals.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div
              className="text-[16px] leading-[2] space-y-6"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <p>
                The brokers and investors who consistently win in NYC real estate
                <span style={{ color: 'rgba(255,255,255,0.65)' }}> see distress signals first</span>
                , understand
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {' '}
                  ownership structures fastest
                </span>
                , and close deals with
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {' '}
                  more context than anyone else in the room
                </span>
                .
              </p>
              <p>
                Terra replaces the 14 browser tabs, three paid data services, and two hours of
                morning research that currently stand between you and your first actionable lead of
                the day.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div
              className="mt-14 rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(45,106,79,0.04)',
                border: '1px solid rgba(45,106,79,0.10)',
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <span
                  className="text-[9px] font-bold tracking-[0.15em] uppercase font-mono"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  NYC Distress Snapshot — Demo
                </span>
                <span
                  className="flex items-center gap-1.5 text-[9px] font-mono"
                  style={{ color: '#5a9e82' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ACCENT_LIGHT }}
                  />
                  Engine Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Pre-Foreclosure', count: '340+', color: '#b8943c' },
                  { label: 'Active Foreclosure', count: '180+', color: '#c0503a' },
                  { label: 'Tax Lien', count: '290+', color: '#8b5cf6' },
                  { label: 'Auction Imminent', count: '95', color: '#c05840' },
                  { label: 'REO / Bank-Owned', count: '120+', color: '#3a6a9a' },
                ].map((d) => (
                  <div key={d.label} className="text-center">
                    <span
                      className="text-[22px] font-extrabold font-mono block"
                      style={{ color: d.color }}
                    >
                      {d.count}
                    </span>
                    <span
                      className="text-[10px] mt-1 block"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TERRA DOCTRINE */}
      <section id="doctrine" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                The Terra Doctrine
              </p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Five phases. One operating system.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Every serious real estate operation moves through the same sequence. Terra
                structures it into a repeatable, intelligence-driven workflow.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {doctrine.map((d, i) => (
              <Reveal key={d.phase} delay={i * 60}>
                <div
                  className="p-5 rounded-xl h-full"
                  style={{ background: BG2, border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(45,106,79,0.10)',
                        border: '1px solid rgba(45,106,79,0.16)',
                      }}
                    >
                      <d.icon size={13} style={{ color: ACCENT_LIGHT }} />
                    </div>
                    <span
                      className="text-[9px] font-bold tracking-[0.12em] uppercase font-mono"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-white mb-2">{d.phase}</h3>
                  <p
                    className="text-[12px] leading-[1.75]"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {d.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Platform Capabilities
              </p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Six domains. Every angle covered.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 50}>
                <div
                  className="p-6 rounded-xl h-full"
                  style={{ background: BG2, border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(45,106,79,0.10)',
                      border: '1px solid rgba(45,106,79,0.16)',
                    }}
                  >
                    <c.icon size={14} style={{ color: ACCENT_LIGHT }} />
                  </div>
                  <h3 className="text-[14px] font-bold text-white mb-2">{c.title}</h3>
                  <p
                    className="text-[13px] leading-[1.8]"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {c.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[520px] mb-14">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Use Cases
              </p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Real problems. Real workflow.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((u, i) => (
              <Reveal key={u.title} delay={i * 50}>
                <div
                  className="p-6 rounded-xl h-full"
                  style={{ background: BG2, border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <h3 className="text-[13px] font-bold text-white mb-2">{u.title}</h3>
                  <p
                    className="text-[12px] leading-[1.8]"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {u.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section id="buyers" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[520px] mb-14">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Who It's For
              </p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Built for the people who close deals.
              </h2>
            </div>
          </Reveal>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {buyers.map((b) => (
              <div key={b.role} className="p-8" style={{ background: BG }}>
                <h3 className="text-[14px] font-bold text-white mb-3">{b.role}</h3>
                <p
                  className="text-[13px] leading-[1.85]"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / GOVERNANCE */}
      <section className="relative py-20 sm:py-24 px-6">
        <div className="max-w-[760px] mx-auto">
          <Reveal>
            <div
              className="p-8 sm:p-10 rounded-2xl"
              style={{ background: BG2, border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(45,106,79,0.10)',
                    border: '1px solid rgba(45,106,79,0.16)',
                  }}
                >
                  <Shield size={14} style={{ color: ACCENT_LIGHT }} />
                </div>
                <p
                  className="text-[10px] font-semibold tracking-[0.16em] uppercase font-mono"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  Trust & Governance
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    label: 'Data sourcing',
                    value: 'County records, court filings, public registries',
                  },
                  {
                    label: 'Access control',
                    value: 'Role-based permissions with full audit trail',
                  },
                  {
                    label: 'Accuracy',
                    value: 'Confidence scoring on every opportunity — no silent guesses',
                  },
                ].map((t) => (
                  <div key={t.label}>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: 'rgba(255,255,255,0.60)' }}
                    >
                      {t.label}
                    </p>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="access" className="relative py-28 sm:py-36 px-6">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p
                className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 font-mono"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Ready to operate at a higher level
              </p>
              <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight text-white mb-6">
                Three ways in.
              </h2>
              <p
                className="text-[17px] leading-[1.8] max-w-[560px] mx-auto"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Terra is available to qualified operators in three tiers. No free trials. No demo
                accounts. Real intelligence from day one.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              {
                tier: 'Demo',
                desc: 'Scheduled live walkthrough with your team. See the full distress engine, ownership resolution, and pipeline in action on live NYC data.',
                cta: 'Book a Demo',
                accent: BRASS_LIGHT,
                note: '30 min · No commitment',
                highlight: false,
                ctaType: 'demo' as const,
              },
              {
                tier: 'Pilot',
                desc: '90-day structured pilot for a single acquisition team or brokerage desk. Includes onboarding, data integration, and dedicated success support.',
                cta: 'Start a Pilot',
                accent: '#5a9e82',
                note: '90 days · Scoped engagement',
                highlight: true,
                ctaType: 'trial' as const,
              },
              {
                tier: 'Enterprise',
                desc: 'Full deployment for portfolio teams, multi-desk brokerages, or institutional investors requiring custom data integrations and role-based access.',
                cta: 'Enterprise Inquiry',
                accent: 'rgba(255,255,255,0.5)',
                note: 'Custom terms · SLA included',
                highlight: false,
                ctaType: 'consultation' as const,
              },
            ].map((t) => (
              <div
                key={t.tier}
                className="p-6 rounded-2xl flex flex-col"
                style={{
                  background: t.highlight ? `rgba(45,106,79,0.06)` : BG2,
                  border: t.highlight
                    ? `1px solid rgba(45,106,79,0.18)`
                    : `1px solid rgba(255,255,255,0.05)`,
                }}
              >
                <div
                  className="text-[10px] font-bold tracking-[0.14em] uppercase mb-3 font-mono"
                  style={{ color: t.accent }}
                >
                  {t.tier}
                </div>
                <p
                  className="text-[13px] leading-[1.85] flex-1 mb-5"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {t.desc}
                </p>
                <div>
                  <button
                    onClick={() => {
                      setDemoType(t.ctaType);
                      setDemoOpen(true);
                    }}
                    className="w-full text-[12px] font-semibold py-2.5 rounded-lg transition-all mb-2"
                    style={{
                      background: t.highlight ? BTN_BG : 'rgba(255,255,255,0.05)',
                      color: t.highlight ? '#fff' : t.accent,
                      border: t.highlight ? 'none' : `1px solid rgba(255,255,255,0.07)`,
                    }}
                  >
                    {t.cta} →
                  </button>
                  <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {t.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Reveal delay={100}>
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Already have access?
              </span>
              <button
                onClick={onSignIn}
                className="text-[12px] font-semibold"
                style={{ color: ACCENT_LIGHT }}
              >
                Sign in →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRODUCT TOUR */}
      <section
        className="py-24 sm:py-32 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-[10px] font-mono tracking-[0.3em] uppercase mb-3"
              style={{ color: '#5a9e82' }}
            >
              Platform Walkthrough
            </p>
            <h2 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold text-white mb-3 tracking-tight">
              How Terra works in practice
            </h2>
            <p className="text-[14px] max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
              From data connection to first distress lead in under 30 minutes.
            </p>
          </div>
          <div className="relative">
            <div
              className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
            <div className="space-y-10">
              {[
                {
                  step: '01',
                  title: 'Connect your market data sources',
                  body: 'Terra ingests public records data automatically — NYC ACRIS, DOB, HPD, tax records, court filings. Your existing CRM and deal tracking tools connect in one click.',
                  tag: 'Setup',
                },
                {
                  step: '02',
                  title: 'Distress scores surface within minutes',
                  body: 'The PRISM engine begins scoring every property in your selected market by acquisition urgency. Pre-foreclosure, lis pendens, auction calendar, tax arrears, and ownership signals combined into a single ranked list.',
                  tag: 'Intelligence',
                },
                {
                  step: '03',
                  title: 'Ownership resolution unlocks the deal',
                  body: "LLC unmasking and entity resolution identify the real decision-maker behind every property — not the registered agent. Terra surfaces contact pathways that don't exist in any other platform.",
                  tag: 'Sourcing',
                },
                {
                  step: '04',
                  title: 'Pipeline manages the acquisition workflow',
                  body: 'Move properties from watchlist to active deal in a structured, stage-gated workflow. Every property carries its distress context, comparable data, and ownership resolution into the deal stage.',
                  tag: 'Execution',
                },
                {
                  step: '05',
                  title: 'AI analyst contextualizes every opportunity',
                  body: 'The Terra AI copilot answers questions about any property, compares opportunity sets, and synthesizes market intelligence on demand. Not a search box — a reasoning layer with real domain knowledge.',
                  tag: 'Intelligence',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-8 md:gap-10">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-bold"
                      style={{
                        background: 'rgba(64,133,106,0.12)',
                        color: '#5a9e82',
                        border: '1px solid rgba(64,133,106,0.2)',
                      }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <div
                    className="flex-1 pb-10 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(64,133,106,0.08)',
                          color: '#5a9e82',
                          border: '1px solid rgba(64,133,106,0.1)',
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p
                      className="text-[13.5px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section
        className="py-20 sm:py-24 border-t px-6"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#080d12' }}
      >
        <div className="max-w-2xl mx-auto">
          <NewsletterSubscribe
            utmSource="terra"
            variant="inline"
            heading="Intelligence briefings from SZL Command"
            subheading="Insights on governed AI, real estate intelligence, and operational decision-making — straight from the founding team."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t px-6 py-10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1100px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg"
                style={{
                  background: 'rgba(45,106,79,0.10)',
                  border: '1px solid rgba(45,106,79,0.16)',
                }}
              >
                <Building2 size={12} style={{ color: ACCENT_LIGHT }} />
              </div>
              <span className="text-sm font-bold text-white">DOMAINE</span>
              <span
                className="text-[9px] font-mono ml-1"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Property Intelligence
              </span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { name: 'KORA', href: '/command/operations/' },
                { name: 'SEXTANT', href: '/vessels/' },
                { name: 'PARAGON', href: '/aegis/' },
                { name: 'Carlota Jo', href: '/carlota-jo/' },
                { name: 'SZL', href: '/szl-holdings/' },
              ].map((l) => (
                <a
                  key={l.name}
                  href={l.href}
                  className="text-[10px] transition-colors"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                >
                  {l.name}
                </a>
              ))}
            </div>
          </div>
          <p
            className="text-[10px] leading-relaxed mb-4 max-w-[540px]"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {aboutSzlParagraph()}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p
              className="text-[11px] text-center sm:text-left"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {copyrightLine()}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/szlholdings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                X
              </a>
              <a
                href="https://linkedin.com/company/szlholdings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                LinkedIn
              </a>
              <a
                href="https://medium.com/@stephen_38454"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                Medium
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type={demoType}
        app="terra"
        subtitle="Terra — Real Estate Intelligence"
      />
    </div>
  );
}
