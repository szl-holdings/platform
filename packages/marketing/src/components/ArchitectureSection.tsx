import { motion, useInView } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, FileCheck, GitBranch, Radio, ShieldCheck, Zap } from 'lucide-react';
import { useRef } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';

export interface ArchitectureLayer {
  tier: string;
  title: string;
  color: string;
  items: Array<{ name: string; note: string }>;
}

export interface TrustPoint {
  icon: LucideIcon;
  label: string;
  description: string;
}

const DEFAULT_PRIMITIVES: TrustPoint[] = [
  {
    icon: Radio,
    label: 'Event Fabric',
    description:
      'Cross-domain signal backbone. Every alert, filing, and telemetry stream shares a common routing layer.',
  },
  {
    icon: BarChart3,
    label: 'Decision Simulation',
    description:
      'Probabilistic risk modeling before any action. Operators see outcomes and confidence intervals, not just recommendations.',
  },
  {
    icon: ShieldCheck,
    label: 'Covenant Policy',
    description:
      'Human-in-the-loop governance enforced at the platform layer. AI cannot execute without explicit approval.',
  },
  {
    icon: FileCheck,
    label: 'Proof Chain',
    description:
      'Immutable record of every AI output — model identity, source citations, confidence score, and actor attribution.',
  },
  {
    icon: GitBranch,
    label: 'Outcome Graph',
    description: 'Full decision lifecycle tracking. The platform learns from every completed loop.',
  },
  {
    icon: Zap,
    label: 'Workflow Engine',
    description:
      'Durable multi-step process orchestration with checkpoint recovery and agent coordination.',
  },
];

export interface ArchitectureSectionProps {
  headline?: string;
  subheadline?: string;
  trustPoints?: TrustPoint[];
  layers?: ArchitectureLayer[];
  accentColor?: string;
  trustFootnote?: string;
}

export function ArchitectureSection({
  headline = 'Six primitives. Not features.',
  subheadline = 'Architectural constraints that run across every domain pack — not add-ons or configuration options.',
  trustPoints = DEFAULT_PRIMITIVES,
  accentColor = 'hsl(191,92%,44%)',
  trustFootnote = 'Advisory-only AI with mandatory human approval gates. Immutable Proof Chain on every decision. SOC 2 controls, certification targeted for 2026.',
}: ArchitectureSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            {headline}
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            {subheadline}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="p-5 rounded-2xl flex flex-col gap-3"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: TEXT }}>
                    {point.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: TEXT_SEC }}>
                    {point.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {trustFootnote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 p-6 rounded-2xl text-center"
            style={{ background: `${accentColor}06`, border: `1px solid ${accentColor}20` }}
          >
            <p className="text-sm" style={{ color: TEXT_SEC }}>
              {trustFootnote}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
