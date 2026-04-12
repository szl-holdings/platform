import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const chapters = [
  {
    id: "origin",
    number: "01",
    year: "2018",
    phase: "The Problem",
    title: "Operators drowning in data, starving for decisions",
    body: "Watching enterprise teams run million-dollar operations from spreadsheets and phone calls — not because better tools didn't exist, but because existing tools were built by generalists who understood software more than they understood the domain. That gap became the thesis.",
    metric: { value: "$4T", label: "Maritime alone, running on fax machines" },
    color: "#6366F1",
    accent: "rgba(99,102,241,0.08)",
  },
  {
    id: "foundation",
    number: "02",
    year: "2022",
    phase: "The Architecture",
    title: "One codebase. One thesis. Applied everywhere.",
    body: "The insight wasn't to build one great platform — it was to build one great infrastructure and apply it to every domain where operators were underserved. One auth system, one execution engine, one monorepo. The compounding advantage of shared foundations.",
    metric: { value: "375+", label: "Database tables, one shared schema" },
    color: "#00D4FF",
    accent: "rgba(0,212,255,0.08)",
  },
  {
    id: "expansion",
    number: "03",
    year: "2023",
    phase: "The Build",
    title: "Five industries. One founder. Simultaneously.",
    body: "SZL Holdings incorporated as a strategic holding structure. Vessels, Lyte, Aegis, Terra, Carlota Jo — each a vertical operating system for operators who had been underserved for decades. Not a portfolio of separate companies, but a network where each platform makes the others stronger.",
    metric: { value: "16", label: "Applications live across 5 industries" },
    color: "#22C55E",
    accent: "rgba(34,197,94,0.08)",
  },
  {
    id: "doctrine",
    number: "04",
    year: "2024",
    phase: "The Doctrine",
    title: "Visibility → Control → Execution → Outcome",
    body: "The operating philosophy crystallized: platforms are judged by what they change, not what they show. Every SZL platform closes the loop from signal to decision to auditable action. Alloy, the shared execution fabric, became the fifth platform — the connective tissue of the ecosystem.",
    metric: { value: "1,618+", label: "API endpoints, fully typed" },
    color: "#F59E0B",
    accent: "rgba(245,158,11,0.08)",
  },
  {
    id: "now",
    number: "05",
    year: "2026",
    phase: "The Moment",
    title: "An ecosystem that learns from its own operations",
    body: "The compounding advantage is now visible. Signals from Vessels feed Alloy's routing models. Intelligence from Aegis informs Lyte's anomaly baselines. PRISM Counsel's case outcomes inform SZL's strategic allocation. The network is live. The flywheel has started.",
    metric: { value: "92", label: "Defensibility score, proprietary IP moat" },
    color: "#D4A054",
    accent: "rgba(212,160,84,0.08)",
  },
];

function ChapterCard({ chapter, index }: { chapter: typeof chapters[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40, y: 20 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative"
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${chapter.accent}, rgba(15,20,30,0.6))`,
          border: `1px solid ${chapter.color}22`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${chapter.color}60, transparent)` }}
        />
        <div className="p-8 lg:p-10">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <span
                className="text-[10px] font-black tracking-[0.3em] uppercase px-2.5 py-1 rounded-full"
                style={{ color: chapter.color, background: `${chapter.color}18`, border: `1px solid ${chapter.color}30` }}
              >
                {chapter.phase}
              </span>
              <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                {chapter.year}
              </span>
            </div>
            <span
              className="text-5xl font-black tabular-nums leading-none"
              style={{ color: `${chapter.color}18`, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {chapter.number}
            </span>
          </div>

          <h3
            className="text-xl lg:text-2xl font-bold mb-4 leading-tight"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {chapter.title}
          </h3>
          <p
            className="text-[14px] leading-[1.75]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {chapter.body}
          </p>

          <div
            className="mt-6 pt-5 flex items-center gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: chapter.color, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {chapter.metric.value}
            </span>
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {chapter.metric.label}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProgressLine({ active }: { active: number }) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-2 py-4">
      {chapters.map((ch, i) => (
        <div key={ch.id} className="flex flex-col items-center">
          <motion.div
            animate={{ scale: active === i ? 1.4 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-2 h-2 rounded-full"
            style={{
              background: active >= i ? ch.color : "rgba(255,255,255,0.08)",
              boxShadow: active === i ? `0 0 12px ${ch.color}` : "none",
            }}
          />
          {i < chapters.length - 1 && (
            <motion.div
              className="w-px"
              style={{ height: 60, background: active > i ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function FounderJourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const idx = Math.floor(v * (chapters.length + 1)) - 1;
      setActiveChapter(Math.max(0, Math.min(chapters.length - 1, idx)));
    });
    return unsub;
  }, [scrollYProgress]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity }}
      className="relative py-24 sm:py-32 overflow-hidden"
      id="journey"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[600px] blur-[160px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="mb-16 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            The Founder Journey
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Not a timeline.
            <br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>An experience.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] leading-[1.75]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Five chapters. One operating thesis. Applied consistently from the first line of code to the live ecosystem you see today.
          </motion.p>
        </div>

        <div className="flex gap-8 lg:gap-12">
          <ProgressLine active={activeChapter} />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {chapters.map((ch, i) => (
              <ChapterCard key={ch.id} chapter={ch} index={i} />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </motion.section>
  );
}
