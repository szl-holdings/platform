import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const risks = [
  {
    id: 1,
    title: 'Ransomware Attack on Production Systems',
    description:
      'Critical exposure due to delayed patching cycles and insufficient network segmentation between production and development environments.',
    severity: 'critical' as const,
    likelihood: 'likely',
    status: 'open',
    mitigation:
      'Deploy EDR with Governed threat detection, implement air-gap backups, and complete network micro-segmentation project by Q2.',
    owner: 'CISO',
    createdAt: '2026-01-15',
  },
  {
    id: 2,
    title: 'Data Breach — Customer PII Exposure',
    description:
      'Third-party API integrations handling customer data without adequate encryption and access controls.',
    severity: 'critical' as const,
    likelihood: 'possible',
    status: 'mitigating',
    mitigation:
      'Enforce encryption at rest and in transit for all PII, implement DLP monitoring, and review all third-party API access contracts.',
    owner: 'DPO',
    createdAt: '2026-01-20',
  },
  {
    id: 3,
    title: 'Third-Party Vendor Compromise',
    description:
      'Supply chain risk from vendors with inadequate security controls accessing production systems.',
    severity: 'high' as const,
    likelihood: 'possible',
    status: 'open',
    mitigation:
      'Conduct full vendor security assessment program, enforce contractual SLAs with security requirements, and implement vendor access controls.',
    owner: 'CISO',
    createdAt: '2026-02-01',
  },
  {
    id: 4,
    title: 'Key Person Dependency — Engineering',
    description:
      'Critical knowledge concentrated in fewer than 3 engineers for core infrastructure components.',
    severity: 'high' as const,
    likelihood: 'likely',
    status: 'mitigating',
    mitigation:
      'Launch cross-training program, create comprehensive documentation sprint, and hire to reduce single-person dependencies.',
    owner: 'CTO',
    createdAt: '2026-02-10',
  },
  {
    id: 5,
    title: 'Regulatory Non-compliance — GDPR',
    description:
      'Data retention policies and subject access request procedures not fully documented or enforced.',
    severity: 'medium' as const,
    likelihood: 'unlikely',
    status: 'open',
    mitigation:
      'Implement comprehensive privacy program with automated DSAR handling, conduct regular compliance audits.',
    owner: 'DPO',
    createdAt: '2026-02-15',
  },
];

const SeverityColors = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-orange-400/40 bg-orange-500/5 border-orange-500/10',
};

const SeverityIcon = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: Info,
  low: Info,
};

export default function ComplianceRisks() {
  const [resolved, setResolved] = useState<number[]>([]);

  return (
    <div className="space-y-5">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-lg font-bold text-orange-50">
            Compliance Risk Register
          </h1>
          <p className="text-orange-400/50 text-xs mt-0.5">
            Active threats to organizational readiness with mitigation strategies.
          </p>
        </div>
        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Log Risk
        </button>
      </header>

      <div className="grid gap-4">
        {risks.map((risk, i) => {
          const Icon = SeverityIcon[risk.severity];
          const isResolved =
            resolved.includes(risk.id) || risk.status === 'resolved' || risk.status === 'accepted';
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-orange-500/5 border rounded-xl p-5 transition-all border-l-4 ${
                isResolved
                  ? 'opacity-60 border-l-emerald-500 border-orange-500/10'
                  : risk.severity === 'critical'
                    ? 'border-l-red-500 border-orange-500/10'
                    : risk.severity === 'high'
                      ? 'border-l-orange-500 border-orange-500/10'
                      : 'border-l-amber-500 border-orange-500/10'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${SeverityColors[risk.severity]}`}
                    >
                      <Icon className="w-3 h-3" /> {risk.severity}
                    </span>
                    <span className="text-[10px] font-medium text-orange-400/40 px-2 py-1 bg-orange-500/5 rounded-md border border-orange-500/10 uppercase tracking-wider">
                      {risk.likelihood.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${isResolved ? 'text-emerald-400 bg-emerald-500/10' : 'text-orange-400/60 bg-orange-500/10'}`}
                    >
                      {isResolved ? 'resolved' : risk.status}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-bold font-display mb-2 ${isResolved ? 'text-orange-50/50 line-through' : 'text-orange-50'}`}
                  >
                    {risk.title}
                  </h3>
                  <p className="text-orange-400/50 text-xs mb-3 leading-relaxed max-w-2xl">
                    {risk.description}
                  </p>
                  <div className="bg-black/20 rounded-lg p-3 border border-orange-500/10">
                    <div className="text-[10px] font-bold text-orange-400/40 uppercase tracking-widest mb-1">
                      Mitigation Strategy
                    </div>
                    <p className="text-xs text-orange-50/80">{risk.mitigation}</p>
                  </div>
                </div>
                <div className="w-full lg:w-40 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-orange-500/10 pt-4 lg:pt-0 lg:pl-5">
                  <div className="space-y-3 mb-4 lg:mb-0">
                    <div>
                      <div className="text-[10px] text-orange-400/40 uppercase tracking-widest font-semibold mb-0.5">
                        Owner
                      </div>
                      <div className="text-xs font-medium text-orange-50">{risk.owner}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-orange-400/40 uppercase tracking-widest font-semibold mb-0.5">
                        Logged
                      </div>
                      <div className="text-xs font-medium text-orange-50">
                        {new Date(risk.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  {!isResolved && (
                    <button
                      onClick={() => setResolved((prev) => [...prev, risk.id])}
                      className="flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
