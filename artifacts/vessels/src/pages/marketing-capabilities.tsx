import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Cpu,
  DollarSign,
  Eye,
  Globe,
  MapPin,
  Radio,
  Shield,
  Wrench,
} from 'lucide-react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const capabilityGroups = [
  {
    group: 'Position & Situation',
    items: [
      {
        icon: MapPin,
        title: 'Live AIS Fleet Map',
        desc: 'Real-time vessel positions across global shipping lanes with route line overlays and behavioral scoring.',
      },
      {
        icon: Radio,
        title: 'Signal Monitoring',
        desc: 'Continuous AIS transponder signal monitoring with gap detection and anomaly flagging.',
      },
      {
        icon: Eye,
        title: 'Dark Vessel Detection',
        desc: 'Identify vessels operating with AIS transponders disabled or manipulated in high-risk zones.',
      },
    ],
  },
  {
    group: 'Operations & Exceptions',
    items: [
      {
        icon: AlertTriangle,
        title: 'Exception Center',
        desc: 'Prioritized exception queue with impact scoring, root cause context, and recommended resolution paths.',
      },
      {
        icon: Activity,
        title: 'ETA Deviation Alerts',
        desc: 'Real-time alerts on ETA deviations with estimated delay cost and downstream schedule impact.',
      },
      {
        icon: Wrench,
        title: 'Maintenance Readiness',
        desc: 'Health scores, maintenance backlog, service risk, and readiness by vessel — updated continuously.',
      },
    ],
  },
  {
    group: 'Economics & Performance',
    items: [
      {
        icon: DollarSign,
        title: 'Voyage Economics',
        desc: 'Revenue, operating cost, margin, fuel cost, and delay exposure per voyage and per charter.',
      },
      {
        icon: BarChart3,
        title: 'Fleet Analytics',
        desc: 'Utilization rates, on-time performance, route profitability, and fleet-wide margin trends.',
      },
      {
        icon: Globe,
        title: 'Corridor Analysis',
        desc: 'Traffic density, delay frequency, and commercial performance across key shipping corridors.',
      },
    ],
  },
  {
    group: 'Compliance & Intelligence',
    items: [
      {
        icon: Shield,
        title: 'Sanctions Screening',
        desc: 'Real-time OFAC and EU sanctions list matching against vessel identifiers and counterparty data.',
      },
      {
        icon: Cpu,
        title: 'AI Route Intelligence',
        desc: 'Machine-assisted routing recommendations based on historical voyage data, weather, and port congestion.',
      },
      {
        icon: Eye,
        title: 'Risk Scoring',
        desc: 'Composite risk scores per vessel incorporating sanctions exposure, dark vessel history, and route risk.',
      },
    ],
  },
];

export default function MarketingCapabilitiesPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">
            Capabilities
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-50 mb-4">
            Every intelligence layer your fleet operation needs
          </h1>
          <p className="text-sky-300/40 text-[15px] max-w-2xl leading-relaxed">
            From AIS position tracking to voyage P&L to compliance screening — Vessels covers the
            full operational intelligence stack in one platform.
          </p>
        </div>

        <div className="space-y-14">
          {capabilityGroups.map((group) => (
            <div key={group.group}>
              <h2 className="text-[12px] font-semibold text-sky-400/60 uppercase tracking-[0.12em] mb-5">
                {group.group}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.title}
                    className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5"
                  >
                    <item.icon className="w-4.5 h-4.5 text-sky-400 mb-3" />
                    <h3 className="text-[14px] font-semibold text-sky-100 mb-1.5">{item.title}</h3>
                    <p className="text-sky-300/40 text-[12px] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/demo">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
              See capabilities live <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
