import { Link } from 'wouter';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const phases = [
  {
    number: '01',
    title: 'Discovery',
    description:
      "Every engagement begins with a deep orientation session. We don't start advising until we understand the history, the constraints, the dynamics, and what's actually at stake.",
  },
  {
    number: '02',
    title: 'Diagnosis',
    description:
      "Before recommending anything, we map what we're actually solving — distinguishing symptoms from root causes, and commercial challenges from structural ones.",
  },
  {
    number: '03',
    title: 'Strategy',
    description:
      "We develop a structured strategic position — not a slide deck, but a clear point of view on where to go, why, and what you'll need to believe for it to be right.",
  },
  {
    number: '04',
    title: 'Activation',
    description:
      'Strategy without implementation is analysis. We stay engaged through activation — ensuring that decisions translate into outcomes, and outcomes into momentum.',
  },
  {
    number: '05',
    title: 'Ongoing Review',
    description:
      'Markets change. Organisations evolve. The best strategy is one that adapts. Ongoing engagements include regular review cadences to stay ahead of the environment.',
  },
];

const principles = [
  {
    title: 'Founder-first',
    body: 'We work with founders and senior leaders who are accountable for outcomes — not delegating strategy to a junior team.',
  },
  {
    title: 'Small client base, deep engagement',
    body: 'We limit our client intake deliberately. Depth of engagement is the product, not a feature.',
  },
  {
    title: 'Confidentiality as default',
    body: 'Client relationships and engagement specifics are never disclosed. Our track record is demonstrated by outcome, not by name-dropping.',
  },
  {
    title: 'No retainers without intention',
    body: "We don't maintain relationships for their own sake. Every engagement has a clear purpose, and we end engagements when they've served it.",
  },
];

export default function ApproachPage() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Header />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">
            Approach
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-5"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            How we work
          </h1>
          <p className="text-[#f5f0e8]/45 text-[15px] font-light leading-relaxed max-w-xl">
            Our methodology is built around depth of engagement, not volume of deliverables. Every
            phase earns the right to the next.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-medium tracking-[0.2em] uppercase text-[#f5f0e8]/28 mb-8">
            Engagement phases
          </h2>
          <div className="space-y-8">
            {phases.map((phase) => (
              <div key={phase.number} className="flex gap-8">
                <div className="w-10 shrink-0">
                  <span className="text-[#c8a96a]/35 text-[13px] font-light font-mono">
                    {phase.number}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-[15px] font-medium text-[#f5f0e8]/85 mb-1.5"
                    style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                  >
                    {phase.title}
                  </h3>
                  <p className="text-[#f5f0e8]/38 text-[13.5px] font-light leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#f5f0e8]/6 pt-12 mb-14">
          <h2 className="text-[12px] font-medium tracking-[0.2em] uppercase text-[#f5f0e8]/28 mb-8">
            Core principles
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {principles.map((p) => (
              <div key={p.title} className="border-l border-[#c8a96a]/15 pl-5">
                <h3 className="text-[14px] font-medium text-[#f5f0e8]/75 mb-1.5">{p.title}</h3>
                <p className="text-[#f5f0e8]/35 text-[13px] font-light leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#f5f0e8]/6 pt-10">
          <h3
            className="text-[19px] font-light text-[#f5f0e8] mb-3"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Ready to start a conversation?
          </h3>
          <p className="text-[#f5f0e8]/40 text-[13px] font-light mb-5">
            We accept a limited number of new engagements each quarter.
          </p>
          <Link
            href="/inquiries"
            className="inline-block px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors"
          >
            Inquire privately
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
