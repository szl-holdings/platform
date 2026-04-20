import { motion, useInView } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';

export interface HowItWorksStep {
  number: string;
  label: string;
  icon: LucideIcon;
  color: string;
  body: string;
}

export interface HowItWorksProps {
  headline?: string;
  subheadline?: string;
  steps: HowItWorksStep[];
  accentColor?: string;
  onStepView?: (step: number, label: string) => void;
}

export function HowItWorks({
  headline = 'Every consequential decision follows one canonical loop.',
  subheadline = 'Nine steps. Every domain. The governance does not change.',
  steps,
  accentColor = 'hsl(191,92%,44%)',
  onStepView,
}: HowItWorksProps) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const handleStepClick = (i: number) => {
    setActive(i);
    onStepView?.(i + 1, steps[i]?.label ?? '');
  };

  const step = steps[active];

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
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            {headline}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            {subheadline}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:min-w-[220px] lg:max-w-[240px]">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  onClick={() => handleStepClick(i)}
                  className="flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 whitespace-nowrap lg:whitespace-normal"
                  style={{
                    background: isActive ? `${s.color}12` : 'transparent',
                    border: `1px solid ${isActive ? `${s.color}40` : 'transparent'}`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold font-mono shrink-0"
                    style={{ color: isActive ? s.color : TEXT_SEC }}
                  >
                    {s.number}
                  </span>
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? s.color : TEXT_SEC }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isActive ? TEXT : TEXT_SEC }}
                  >
                    {s.label}
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          <motion.div
            key={active}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-2xl p-8 flex flex-col justify-center min-h-[240px]"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            {step && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                  >
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div>
                    <span
                      className="text-[10px] font-mono font-bold block"
                      style={{ color: step.color }}
                    >
                      Step {step.number}
                    </span>
                    <span className="text-xl font-bold" style={{ color: TEXT }}>
                      {step.label}
                    </span>
                  </div>
                </div>
                <p className="text-base leading-relaxed" style={{ color: TEXT_SEC }}>
                  {step.body}
                </p>
                <div className="flex gap-1 mt-8">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleStepClick(i)}
                      className="h-1 rounded-full flex-1 transition-all duration-200"
                      style={{ background: i === active ? step.color : BORDER }}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
