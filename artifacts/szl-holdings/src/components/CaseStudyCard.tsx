import { m } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  Layers,
  Zap,
} from 'lucide-react';

export interface CaseStudySection {
  problem: string;
  context: string;
  constraints: string[];
  systemBuilt: string;
  howItWorked: string[];
  outcome: string;
  visualProof?: { label: string; value: string; sub?: string }[];
  whyItMatters: string;
}

export interface CaseStudy {
  id: string;
  product: string;
  productAccent: string;
  category: string;
  title: string;
  subtitle: string;
  sections: CaseStudySection;
}

interface CaseStudyCardProps {
  study: CaseStudy;
  index?: number;
}

function SectionLabel({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export function CaseStudyCard({ study, index = 0 }: CaseStudyCardProps) {
  const { sections } = study;

  return (
    <m.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${study.productAccent}25`, background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: `${study.productAccent}15` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{
                  color: study.productAccent,
                  borderColor: `${study.productAccent}40`,
                  background: `${study.productAccent}12`,
                }}
              >
                {study.product}
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                {study.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">{study.title}</h3>
            <p className="text-sm text-white/50 mt-1">{study.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-xl p-4 border border-red-500/15 bg-red-500/5">
            <SectionLabel icon={AlertCircle} label="The Problem" color="#ef4444" />
            <p className="text-sm text-white/70 leading-relaxed">{sections.problem}</p>
          </div>
          <div className="rounded-xl p-4 border border-white/8 bg-white/3">
            <SectionLabel icon={Layers} label="Context" color="rgba(255,255,255,0.45)" />
            <p className="text-sm text-white/60 leading-relaxed">{sections.context}</p>
          </div>
        </div>

        <div className="rounded-xl p-4 border border-amber-500/15 bg-amber-500/5">
          <SectionLabel icon={AlertCircle} label="Constraints" color="#f59e0b" />
          <ul className="space-y-1.5">
            {sections.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                <span className="mt-1 w-1 h-1 rounded-full bg-amber-500/60 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-xl p-4 border bg-white/2"
          style={{
            borderColor: `${study.productAccent}20`,
            background: `${study.productAccent}06`,
          }}
        >
          <SectionLabel icon={Zap} label="System Built" color={study.productAccent} />
          <p className="text-sm text-white/70 leading-relaxed">{sections.systemBuilt}</p>
        </div>

        <div className="rounded-xl p-4 border border-white/8 bg-white/2">
          <SectionLabel icon={ArrowRight} label="How It Worked" color="rgba(255,255,255,0.4)" />
          <ol className="space-y-2">
            {sections.howItWorked.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                <span
                  className="mt-0.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${study.productAccent}20`, color: study.productAccent }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5">
          <SectionLabel icon={CheckCircle2} label="Outcome" color="#10b981" />
          <p className="text-sm text-white/70 leading-relaxed">{sections.outcome}</p>
        </div>

        {sections.visualProof && sections.visualProof.length > 0 && (
          <div className="rounded-xl p-4 border border-white/8 bg-white/2">
            <SectionLabel icon={BarChart3} label="Visual Proof" color="rgba(255,255,255,0.4)" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
              {sections.visualProof.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 text-center border"
                  style={{
                    borderColor: `${study.productAccent}20`,
                    background: `${study.productAccent}08`,
                  }}
                >
                  <div className="text-xl font-bold" style={{ color: study.productAccent }}>
                    {item.value}
                  </div>
                  <div className="text-[10px] font-medium text-white/60 mt-0.5">{item.label}</div>
                  {item.sub && <div className="text-[9px] text-white/35 mt-0.5">{item.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-4 border"
          style={{
            borderColor: `${study.productAccent}25`,
            background: `${study.productAccent}10`,
          }}
        >
          <SectionLabel icon={HelpCircle} label="Why It Matters" color={study.productAccent} />
          <p
            className="text-sm leading-relaxed font-medium"
            style={{ color: `${study.productAccent}cc` }}
          >
            {sections.whyItMatters}
          </p>
        </div>
      </div>
    </m.article>
  );
}
