import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Intake and alignment',
    description:
      'A discreet initial conversation to understand the challenge, the stakes, and what success looks like. No templates. No sales process.',
  },
  {
    number: '02',
    title: 'Structured diagnosis',
    description:
      'We conduct a rigorous assessment — examining the situation from multiple vantage points before forming a view.',
  },
  {
    number: '03',
    title: 'Strategic development',
    description:
      'Working directly alongside leadership to develop options, test assumptions, and build a clear path forward.',
  },
  {
    number: '04',
    title: 'Implementation support',
    description:
      'We stay engaged through execution — advising on sequencing, stakeholder management, and course correction as needed.',
  },
];

export default function Approach() {
  return (
    <section id="approach" className="py-24 lg:py-32 bg-[#07090d] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-6">
              Our approach
            </p>
            <h2
              className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-7"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Calm execution.
              <br />
              <em>No noise.</em>
            </h2>
            <p className="text-[#f5f0e8]/55 text-base font-light leading-relaxed">
              We work with a small number of clients at any time to ensure every engagement receives
              the full attention of the principal. Our process is deliberate, structured, and
              entirely confidential.
            </p>
          </motion.div>

          <div className="lg:col-span-7 space-y-0 divide-y divide-[#f5f0e8]/5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="py-7"
              >
                <div className="flex items-start gap-7">
                  <span className="text-[#c8a96a]/30 text-[11px] tracking-widest font-medium shrink-0 mt-0.5">
                    {step.number}
                  </span>
                  <div>
                    <h3
                      className="text-lg font-light text-[#f5f0e8] mb-2"
                      style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[#f5f0e8]/50 text-[13.5px] font-light leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
