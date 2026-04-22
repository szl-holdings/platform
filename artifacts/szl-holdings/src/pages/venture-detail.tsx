import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { CaseStudyBlock } from '@/components/CaseStudyBlock';
import { InquiryForm } from '@/components/InquiryForm';
import { KPIStrip } from '@/components/KPIStrip';
import { SectionHeader } from '@/components/SectionHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { StatusTag } from '@/components/StatusTag';
import { TimelineBlock } from '@/components/TimelineBlock';
import { getVentureById, ventures } from '@/data/ventures';
import { analytics, initScrollDepthTracking } from '@/lib/analytics';

export default function VentureDetailPage() {
  const [_match, params] = useRoute('/ventures/:id');
  const [, _navigate] = useLocation();
  const ventureId = params?.id;

  const venture = ventureId ? getVentureById(ventureId) : undefined;

  useEffect(() => {
    if (venture) {
      document.title = `${venture.name} — SZL Holdings`;
      analytics.ventureDetailView(venture.id);
      const cleanup = initScrollDepthTracking(`venture-${venture.id}`);
      return cleanup;
    }
    return undefined;
  }, [venture]);

  if (!venture) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <div className="max-w-6xl mx-auto px-6 pt-40 text-center">
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-szl-text mb-4">
            Venture not found
          </h1>
          <Link href="/portfolio" className="text-szl-accent hover:underline text-sm">
            ← Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  const otherVentures = ventures.filter((v) => v.id !== venture.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="pt-24">
        <section className="bg-white border-b border-szl-border py-16">
          <div className="max-w-6xl mx-auto px-6">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-szl-text-muted hover:text-szl-text transition-colors mb-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
                    style={{
                      backgroundColor: `${venture.accentColor}18`,
                      color: venture.accentColor,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {venture.name.slice(0, 1)}
                  </div>
                  <div>
                    <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-extrabold text-szl-text">
                      {venture.name}
                    </h1>
                    <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mt-1">
                      {venture.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusTag status={venture.status} pulse />
                  {venture.externalPath && (
                    <a
                      href={venture.externalPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-szl-border text-szl-text-secondary text-xs font-semibold hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all"
                    >
                      Open Platform <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xl sm:text-2xl font-[var(--font-display)] font-semibold text-szl-text mb-4">
                {venture.tagline}
              </p>
              <p className="text-szl-text-secondary text-base leading-relaxed max-w-2xl mb-4">
                {venture.oneLiner}
              </p>
              <div className="flex items-center gap-2 text-xs text-szl-text-muted">
                <span className="font-semibold text-szl-text-secondary">Audience:</span>
                {venture.audience}
              </div>
            </m.div>
          </div>
        </section>

        <section className="py-10 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <KPIStrip
              items={venture.metrics.map((m) => ({
                value: m.value,
                label: m.label,
                trend: m.trend,
              }))}
              variant="border"
            />
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <SectionHeader eyebrow="What It Is" title="The full picture." className="mb-6" />
                <p className="text-szl-text-secondary text-base leading-relaxed mb-8">
                  {venture.description}
                </p>

                <SectionHeader
                  eyebrow="Pain Solved"
                  title="The problem it fixes."
                  className="mb-4"
                />
                <p className="text-szl-text-secondary text-base leading-relaxed">
                  {venture.painSolved}
                </p>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">
                    Capabilities
                  </p>
                  <div className="space-y-2.5">
                    {venture.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-szl-text-secondary leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">
                    Use Cases
                  </p>
                  <div className="space-y-2">
                    {venture.useCases.map((uc) => (
                      <div key={uc} className="flex items-start gap-2.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: venture.accentColor }}
                        />
                        <span className="text-sm text-szl-text-secondary">{uc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {venture.caseStudies.length > 0 && (
          <section className="py-16 lg:py-20 bg-szl-bg-secondary border-b border-szl-border">
            <div className="max-w-6xl mx-auto px-6">
              <SectionHeader
                eyebrow="Case Studies"
                title="Operational outcomes."
                subtitle="Real deployments. Measurable results."
              />
              <CaseStudyBlock studies={venture.caseStudies} accentColor={venture.accentColor} />
            </div>
          </section>
        )}

        <section className="py-16 lg:py-20 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <SectionHeader eyebrow="Timeline" title="Key milestones." />
                <TimelineBlock entries={venture.milestones} accentColor={venture.accentColor} />
              </div>
              <div>
                <SectionHeader eyebrow="What's Next" title="Next milestone." />
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: `${venture.accentColor}30`,
                    backgroundColor: `${venture.accentColor}08`,
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: venture.accentColor }}
                  >
                    In Progress
                  </p>
                  <p className="font-[var(--font-display)] text-base font-bold text-szl-text">
                    {venture.nextMilestone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-szl-bg-secondary border-b border-szl-border">
          <div className="max-w-3xl mx-auto px-6">
            <SectionHeader
              eyebrow="Get in Touch"
              title="Interested in this venture?"
              subtitle="Request a demo, pilot inquiry, or partnership discussion."
              align="center"
            />
            <div className="rounded-2xl border border-szl-border bg-white p-6 sm:p-8">
              <InquiryForm defaultType="client" showTypeSelector={false} />
            </div>
          </div>
        </section>

        <section className="py-16 bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-[var(--font-display)] text-xl font-bold text-szl-text">
                Other ventures
              </h2>
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-1.5 text-sm text-szl-text-secondary hover:text-szl-accent transition-colors"
              >
                View all{' '}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {otherVentures.map((ov, i) => (
                <m.div
                  key={ov.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={ov.path}
                    onClick={() => analytics.ventureCardClick(ov.id, ov.name)}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-szl-border bg-szl-bg-secondary hover:border-szl-border-hover hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: `${ov.accentColor}18`,
                        color: ov.accentColor,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {ov.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-szl-text group-hover:text-szl-accent transition-colors truncate">
                        {ov.name}
                      </p>
                      <p className="text-[10px] text-szl-text-muted truncate">{ov.tagline}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-szl-text-muted group-hover:text-szl-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
