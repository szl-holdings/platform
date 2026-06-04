import { ChevronRight, Eye, Lock, Server, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const pillars = [
  {
    icon: Lock,
    title: 'Data encryption',
    desc: 'All data is encrypted at rest and in transit. AIS feeds, voyage data, and user activity are stored with industry-standard encryption.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    desc: 'Granular role and permission model. Fleet executives, operations teams, and commercial teams see the data relevant to their function — nothing more.',
  },
  {
    icon: Server,
    title: 'Tenant isolation',
    desc: "Complete multi-tenant isolation. Your fleet data is never commingled with another organisation's operational data.",
  },
  {
    icon: Eye,
    title: 'Audit trail',
    desc: 'Full audit log of user actions, data access, and configuration changes. Required for compliance and post-incident review.',
  },
];

export default function MarketingSecurityPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">
            Security
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-50 mb-4">
            Built for sensitive maritime operations
          </h1>
          <p className="text-sky-300/40 text-[15px] leading-relaxed max-w-2xl">
            Maritime intelligence involves commercially sensitive voyage data, vessel positions, and
            counterparty information. Vessels is designed with security as a baseline, not a
            feature.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {pillars.map((p) => (
            <div key={p.title} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-6">
              <p.icon className="w-5 h-5 text-sky-400 mb-3" />
              <h3 className="text-[15px] font-semibold text-sky-100 mb-2">{p.title}</h3>
              <p className="text-sky-300/40 text-[13px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="border border-sky-500/10 rounded-2xl p-8 mb-14">
          <h2 className="text-[18px] font-bold text-sky-100 mb-3">Sanctions compliance</h2>
          <p className="text-sky-300/40 text-[13.5px] leading-relaxed mb-4">
            Vessels includes real-time sanctions screening against OFAC, EU, and UN sanctions lists
            — matching against vessel identifiers, ownership structures, and counterparty data.
            Alerts are surfaced immediately when a match is detected.
          </p>
          <p className="text-sky-300/40 text-[13.5px] leading-relaxed">
            Dark vessel detection flags AIS manipulation and signal gaps in high-risk zones — a
            critical input for compliance teams managing sanctions exposure.
          </p>
        </div>

        <div className="text-center">
          <Link href="/demo">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
              Discuss security requirements <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
