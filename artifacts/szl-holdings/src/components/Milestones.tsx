import { m } from "framer-motion";

const milestones = [
  {
    date: "Q1 2022",
    title: "Company founded",
    description: "SZL Holdings incorporated with initial capital deployment into maritime intelligence.",
  },
  {
    date: "Q3 2022",
    title: "Vessels launched",
    description: "Vessels Maritime Intelligence enters private beta with first fleet operator clients.",
  },
  {
    date: "Q1 2023",
    title: "INCA platform operational",
    description: "INCA Intelligence Platform reaches operational status with enterprise AI research capabilities.",
  },
  {
    date: "Q2 2023",
    title: "Carlota Jo Advisory established",
    description: "Principal advisory practice launched serving boards, leadership teams, and investors.",
  },
  {
    date: "Q4 2023",
    title: "Firestorm in production",
    description: "Adversarial security simulation platform operational across regulated industry clients.",
  },
  {
    date: "2024–2025",
    title: "Ecosystem expansion",
    description: "Dreamscape and Terra enter beta. Shared infrastructure layer connects all six platforms.",
  },
];

export function Milestones() {
  return (
    <section id="milestones" className="py-20 lg:py-28 bg-neutral-50 border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-3">Progress</p>
          <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15]">
            Building since 2022
          </h2>
        </m.div>

        <div className="relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-neutral-200 hidden sm:block" />
          <div className="space-y-8 sm:space-y-0">
            {milestones.map((m_, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="relative sm:pl-8 sm:pb-8 last:pb-0"
              >
                <div className="hidden sm:block absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-[hsl(215,45%,32%)] bg-white z-10" />
                <div className="flex items-baseline gap-4 mb-1.5">
                  <span className="text-[11px] font-medium text-neutral-400 tracking-wide shrink-0">{m_.date}</span>
                  <h3 className="text-[15px] font-semibold text-neutral-900 tracking-tight">{m_.title}</h3>
                </div>
                <p className="text-neutral-500 text-[13.5px] leading-relaxed sm:max-w-xl">{m_.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
