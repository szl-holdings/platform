import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Mic, Calendar, MapPin, Users, Video, Star, ChevronRight, Play, ArrowRight, FileText, Clock, Tag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NoiseGrain } from "@szl-holdings/shared-ui";

const upcomingEvents = [
  {
    name: "SaaStr Annual 2026",
    topic: "AIOps at Enterprise Scale: Lessons from Building 16 Production Applications",
    abstract: "A deep-dive into the architectural and organizational lessons from building enterprise AI systems at portfolio scale — from the first line of TypeScript to a 1,618-endpoint API. Practical, opinionated, no vendor slide.",
    keyTakeaways: [
      "Why monorepo architecture compounds at portfolio scale",
      "The human-in-the-loop design patterns that make AI audit-safe",
      "How to build domain intelligence vs. generic tooling",
    ],
    date: "May 12–14, 2026",
    location: "San Mateo, CA",
    format: "Keynote",
    audience: "18,000+",
    status: "Confirmed",
    color: "#6366F1",
    category: "Enterprise AI",
  },
  {
    name: "Gartner IT Symposium/Xpo",
    topic: "The AI-Native Enterprise: A Blueprint for CIOs in 2026–2027",
    abstract: "Not a prediction talk — a practitioner's blueprint. Based on building five vertical operating systems simultaneously, this session covers the architectural decisions that separate AI-native from AI-augmented organisations.",
    keyTakeaways: [
      "The 'Governed Intelligence' framework for accountable AI deployment",
      "Why vertical AI beats horizontal AI in regulated industries",
      "The audit fabric: making AI decisions defensible to any regulator",
    ],
    date: "Oct 21, 2026",
    location: "Orlando, FL",
    format: "Main Stage",
    audience: "10,000+",
    status: "Confirmed",
    color: "#00D4FF",
    category: "CIO Strategy",
  },
  {
    name: "Web Summit 2026",
    topic: "Ecosystem Investing: How to Build 8 Companies Simultaneously",
    abstract: "The SZL playbook for portfolio architecture — how one founder, one codebase, and one thesis can produce 16 production applications across 5 industries. The case for shared foundations over distributed independence.",
    keyTakeaways: [
      "Portfolio architecture vs. holding company architecture",
      "The compound intelligence advantage of shared data fabric",
      "When to build together and when domain isolation is non-negotiable",
    ],
    date: "Nov 3–6, 2026",
    location: "Lisbon, Portugal",
    format: "Panel + Session",
    audience: "45,000+",
    status: "Pending",
    color: "#22C55E",
    category: "Venture Building",
  },
];

const pastSpeaking = [
  {
    name: "AI Summit NYC 2025",
    topic: "Maritime AI: The $4T Industry Still Running on Fax Machines",
    date: "Sep 2025",
    audience: "2,400",
    rating: 4.9,
    video: true,
    duration: "38 min",
    category: "Maritime",
    highlight: "Standing ovation. Voted #1 technical session.",
    color: "#3B8BEB",
  },
  {
    name: "TechCrunch Disrupt 2025",
    topic: "Building in the Open: The SZL Holdings Playbook",
    date: "Oct 2025",
    audience: "5,200",
    rating: 4.8,
    video: true,
    duration: "24 min",
    category: "Venture",
    highlight: "Most-shared session clip of the conference.",
    color: "#F59E0B",
  },
  {
    name: "CXO Summit — Goldman Sachs",
    topic: "Enterprise AI Adoption: Separating Hype from ROI",
    date: "Nov 2025",
    audience: "380",
    rating: 4.9,
    video: false,
    duration: "45 min",
    category: "Enterprise",
    highlight: "Private invitation. 12 C-suite follow-up meetings.",
    color: "#D4A054",
  },
  {
    name: "SXSW 2025",
    topic: "The Next Chapter of Cybersecurity: AI-Native Defense",
    date: "Mar 2025",
    audience: "3,100",
    rating: 4.7,
    video: true,
    duration: "31 min",
    category: "Security",
    highlight: "Featured in TechCrunch post-conference coverage.",
    color: "#EF4444",
  },
];

const speakingTopics = [
  {
    area: "Enterprise AI & Governed Intelligence",
    description: "How to deploy AI in regulated industries with full auditability — from the architecture to the regulatory defensibility layer.",
    formats: ["Keynote", "Workshop"],
    color: "#6366F1",
  },
  {
    area: "Maritime & Supply Chain Intelligence",
    description: "The $4T maritime industry is being transformed by AI. Practical lessons from building fleet command systems for global operators.",
    formats: ["Keynote", "Panel"],
    color: "#3B8BEB",
  },
  {
    area: "Ecosystem Investing & Venture Building",
    description: "Building multiple companies simultaneously from one architectural foundation — the portfolio model that makes compounding possible.",
    formats: ["Fireside", "Panel"],
    color: "#D4A054",
  },
  {
    area: "Cybersecurity in the AI Age",
    description: "AI-native defense and threat intelligence — why the SOC of 2027 looks nothing like today, and what to build for.",
    formats: ["Keynote", "Workshop"],
    color: "#EF4444",
  },
  {
    area: "AIOps & Platform Engineering",
    description: "The engineering architecture behind running 16 production applications from a single monorepo. Real decisions, real tradeoffs.",
    formats: ["Technical Talk", "Panel"],
    color: "#22C55E",
  },
  {
    area: "Domain Intelligence Over Generic Tooling",
    description: "Why vertical AI beats horizontal AI in every specialized domain — from maritime to defense to real estate.",
    formats: ["Keynote", "Fireside"],
    color: "#F59E0B",
  },
];

function EventCard({ event, expanded, onToggle }: { event: typeof upcomingEvents[0]; expanded: boolean; onToggle: () => void }) {
  return (
    <motion.div layout className="relative rounded-2xl overflow-hidden cursor-pointer" onClick={onToggle}>
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${event.color}60, transparent)` }}
      />
      <div
        style={{
          background: expanded ? `${event.color}08` : "rgba(255,255,255,0.02)",
          border: `1px solid ${expanded ? `${event.color}30` : "rgba(255,255,255,0.06)"}`,
          transition: "all 0.3s ease",
        }}
        className="p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{
                  color: event.status === "Confirmed" ? "#22C55E" : "#F59E0B",
                  background: event.status === "Confirmed" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                }}
              >
                {event.status}
              </span>
              <span
                className="text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{ color: event.color, background: `${event.color}12` }}
              >
                {event.format}
              </span>
              <span
                className="text-[9px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)" }}
              >
                {event.category}
              </span>
            </div>
            <h3 className="text-[15px] font-bold text-white/80 mb-1">{event.name}</h3>
            <p className="text-[12px] font-medium mb-3" style={{ color: event.color }}>"{event.topic}"</p>
            <div className="flex flex-wrap gap-4 text-[11px] text-white/30">
              <span className="flex items-center gap-1.5"><Calendar size={10} />{event.date}</span>
              <span className="flex items-center gap-1.5"><MapPin size={10} />{event.location}</span>
              <span className="flex items-center gap-1.5"><Users size={10} />{event.audience} attendees</span>
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={16} className="text-white/25 shrink-0" />
          </motion.div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="mb-4">
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-2">Abstract</div>
                  <p className="text-[12px] leading-[1.75] text-white/40">{event.abstract}</p>
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">Key Takeaways</div>
                  <div className="space-y-2">
                    {event.keyTakeaways.map((kp, i) => (
                      <div key={i} className="flex gap-2.5 text-[11px] text-white/40">
                        <span className="text-[9px] font-mono text-white/15 shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        {kp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function BookingFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const formats = ["Keynote (45–60 min)", "Fireside Chat (30 min)", "Workshop (90 min)", "Panel Moderator", "Podcast Guest", "Private Executive Session"];

  if (step === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="text-center py-8"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <Mic size={20} style={{ color: "#22C55E" }} />
        </div>
        <h3 className="text-[15px] font-bold text-white/80 mb-2">Request sent</h3>
        <p className="text-[12px] text-white/35 mb-6 max-w-xs mx-auto">
          Booking requests are reviewed within 48 hours. Format: <span className="text-white/55">{selected}</span>.
        </p>
        <button onClick={onClose} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">← Return to Speaking</button>
      </motion.div>
    );
  }

  return (
    <div className="py-2">
      <h3 className="text-[15px] font-bold text-white/80 mb-1">Request a Speaking Engagement</h3>
      <p className="text-[12px] text-white/30 mb-5">Select format, then contact directly. All inquiries reviewed within 48 hours.</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {formats.map((f) => (
          <button
            key={f}
            onClick={() => setSelected(f)}
            className="text-left px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all"
            style={{
              background: selected === f ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${selected === f ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
              color: selected === f ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <a
          href={`mailto:stephenlutar2@gmail.com?subject=Speaking Inquiry — ${selected || "Event"} — SZL Holdings&body=Hi Stephen,%0A%0AI'd like to book you for a ${selected || "[format]"} at [Event Name] on [Date] in [Location].%0A%0AExpected audience: [size]%0A%0ATopic preference: [topic]%0A%0ABrief: [context]`}
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all"
          style={{
            background: selected ? "white" : "rgba(255,255,255,0.06)",
            color: selected ? "#080b12" : "rgba(255,255,255,0.25)",
            pointerEvents: selected ? "auto" : "none",
          }}
        >
          Send Inquiry <ArrowRight size={12} />
        </a>
        <button onClick={onClose} className="text-[11px] text-white/25 hover:text-white/50 transition-colors px-3">Cancel</button>
      </div>
    </div>
  );
}

export function SpeakingUpgrade() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="min-h-screen bg-[#080b12] text-white selection:bg-indigo-500/30 selection:text-white relative">
      <NoiseGrain opacity={0.02} />
      <Navbar />

      <main ref={ref}>
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-[600px] h-[400px] blur-[180px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
          </div>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-3">Speaking</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.05]">
                Conference Talks &
                <br />
                <span className="text-white/30">Executive Sessions</span>
              </h1>
              <p className="text-[16px] text-white/40 max-w-2xl leading-[1.75] mb-8">
                Practical, opinionated talks on enterprise AI, maritime intelligence, ecosystem building, and the architecture of domain-specific software. No vendor slides. No hype.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Star size={11} style={{ color: "#F59E0B" }} className="fill-current" />
                  <span className="text-[11px] font-semibold text-white/50">4.83 avg speaker rating</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Users size={11} className="text-white/30" />
                  <span className="text-[11px] font-semibold text-white/50">11,000+ total 2025 audience</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Video size={11} className="text-white/30" />
                  <span className="text-[11px] font-semibold text-white/50">4 recorded sessions available</span>
                </div>
              </div>

              <button
                onClick={() => setShowBooking(true)}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-[14px] font-bold transition-all duration-200"
                style={{ background: "white", color: "#080b12" }}
              >
                <Mic size={15} />
                Book a Speaking Engagement
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-[0.12em]">Upcoming 2026</h2>
              <span className="text-[11px] text-white/25">Click to expand talk details</span>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => (
                <EventCard
                  key={event.name}
                  event={event}
                  expanded={expandedIdx === i}
                  onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-[0.12em] mb-8">Past Speaking</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pastSpeaking.map((p) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative p-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-white/65">{p.name}</span>
                        {p.video && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)" }}>
                            <Play size={7} style={{ color: "#6366F1" }} />
                            <span className="text-[9px] font-bold text-white/30">Recording</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-medium mb-2" style={{ color: p.color }}>"{p.topic}"</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Calendar size={9} />{p.date}</span>
                        <span className="flex items-center gap-1"><Users size={9} />{p.audience.toLocaleString()} attendees</span>
                        <span className="flex items-center gap-1"><Clock size={9} />{p.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={11} className="fill-current" style={{ color: "#F59E0B" }} />
                      <span className="text-[13px] font-black tabular-nums" style={{ color: "#F59E0B" }}>{p.rating}</span>
                    </div>
                  </div>
                  <div
                    className="text-[10px] px-3 py-2 rounded-lg italic"
                    style={{ background: `${p.color}06`, border: `1px solid ${p.color}15`, color: "rgba(255,255,255,0.30)" }}
                  >
                    "{p.highlight}"
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-[0.12em] mb-8">Topic Areas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {speakingTopics.map((topic) => (
                <motion.div
                  key={topic.area}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="p-5 rounded-2xl"
                  style={{ background: `${topic.color}06`, border: `1px solid ${topic.color}18` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: topic.color, boxShadow: `0 0 8px ${topic.color}` }} />
                    <h3 className="text-[12px] font-bold" style={{ color: topic.color }}>{topic.area}</h3>
                  </div>
                  <p className="text-[11px] leading-[1.65] text-white/35 mb-3">{topic.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.formats.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                        style={{ color: topic.color, background: `${topic.color}12` }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white/85 mb-4">Book Stephen for your event</h2>
            <p className="text-[14px] text-white/35 mb-8 max-w-lg mx-auto leading-relaxed">
              Speaking requests are reviewed within 48 hours. Preference given to events with 500+ technical or executive attendees.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowBooking(true)}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[14px] font-bold transition-all"
                style={{ background: "white", color: "#080b12" }}
              >
                <Mic size={14} />
                Request Speaking Engagement
              </button>
              <a
                href="mailto:stephenlutar2@gmail.com?subject=Speaker Kit Request — SZL Holdings"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[14px] font-medium transition-all text-white/40 hover:text-white/70"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FileText size={14} />
                Request Speaker Kit
              </a>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(8,11,18,0.85)", backdropFilter: "blur(20px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowBooking(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg rounded-2xl p-8"
              style={{ background: "rgba(20,26,40,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <BookingFlow onClose={() => setShowBooking(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default SpeakingUpgrade;
