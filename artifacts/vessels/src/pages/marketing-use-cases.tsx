import { ChevronRight, DollarSign, Radio, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const useCases = [
  {
    icon: TrendingUp,
    role: 'Fleet Executives',
    headline: 'Strategic confidence, not status updates.',
    description:
      'Fleet executives need portfolio-level visibility without wading through operational noise. SEXTANT gives you fleet utilization, TCE trends, margin exposure, and exception severity — at a glance, updated in real time.',
    points: [
      'Fleet utilization and TCE at a glance',
      'Voyage P&L and margin by charter type',
      'Exception exposure and business consequence',
      'Performance vs budget across active voyages',
      'Corridor-level profitability trends',
    ],
  },
  {
    icon: Radio,
    role: 'Fleet Operations Teams',
    headline: 'See the exceptions that matter. Act before they escalate.',
    description:
      'Operations teams deal with a high volume of signals. SEXTANT filters to the exceptions that have real business impact — and surfaces them with the context needed to make a decision, not just a notification.',
    points: [
      'Prioritized exception queue by severity and business impact',
      'Vessel status and ETA deviation in real time',
      'Maintenance watch and readiness state per vessel',
      'Alert stream with time-sensitive events',
      'Command mode for focused, high-tempo operations',
    ],
  },
  {
    icon: DollarSign,
    role: 'Commercial Teams',
    headline: 'Voyage economics, not just vessel positions.',
    description:
      'Commercial teams need to understand charter performance, voyage margins, and delay exposure — not just where vessels are on a map. SEXTANT surfaces the financial context behind every voyage.',
    points: [
      'Revenue, cost, and margin per voyage',
      'Charter performance vs budget',
      'Delay exposure and port cost impact',
      'Route profitability comparison',
      'Cargo and counterparty tracking',
    ],
  },
];

export default function MarketingUseCasesPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">
            Use Cases
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-50 mb-4">
            Who SEXTANT is built for
          </h1>
          <p className="text-sky-300/40 text-[15px] leading-relaxed max-w-xl">
            Three distinct operational personas. One platform that serves them all without
            compromising on depth.
          </p>
        </div>

        <div className="space-y-10">
          {useCases.map((uc) => (
            <div key={uc.role} className="border border-sky-500/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <uc.icon className="w-4.5 h-4.5 text-sky-400" />
                </div>
                <span className="text-[11px] font-semibold text-sky-400/60 uppercase tracking-[0.12em]">
                  {uc.role}
                </span>
              </div>
              <h2 className="text-[20px] font-bold text-sky-100 mb-3">{uc.headline}</h2>
              <p className="text-sky-300/40 text-[13.5px] leading-relaxed mb-5">{uc.description}</p>
              <ul className="space-y-2">
                {uc.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400/40 mt-1.5 shrink-0" />
                    <span className="text-sky-300/50 text-[13px]">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/demo">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
              Request a private demo <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
