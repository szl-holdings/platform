import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

const ACCENT = "#7ba3d4";
const ACCENT_DIM = "rgba(123,163,212,0.08)";

const FRAMEWORKS = [
  {
    number: "01",
    tag: "Observability",
    title: "Visibility is a structural requirement, not a reporting feature",
    body: "A company's ability to see itself clearly — workflow state, ownership gaps, execution latency, risk exposure — is an architectural choice. It must be designed in at the foundation level, not bolted on when problems escalate. Every system I build treats observability as a product requirement on day one.",
    applications: ["Lyte", "SZL Platform", "Alloy Engine"],
    keyInsight: "You cannot govern what you cannot see. You cannot fix what you cannot measure.",
  },
  {
    number: "02",
    tag: "Architecture",
    title: "Compound infrastructure is the primary moat",
    body: "Every shared layer — authentication, design system, event fabric, audit trail, AI inference mesh — reduces the marginal cost of every subsequent product. The 8th platform built on shared infrastructure costs a fraction of the 1st. Structural compounding is more durable than any feature advantage.",
    applications: ["SZL Holdings ecosystem", "Shared-UI design system", "Worldline event fabric"],
    keyInsight: "Build once, leverage forever. The architecture is the product.",
  },
  {
    number: "03",
    tag: "Systems Design",
    title: "Command-centered product architecture",
    body: "The best operational software doesn't just display information — it surfaces the right decision at the right moment to the right person, with full context and clear action authority. That's the command metaphor: from observation to governed action, with accountability at every step.",
    applications: ["Aegis / Firestorm", "Vessels", "Terra", "Lyte"],
    keyInsight: "Observation without action is just expensive reporting.",
  },
  {
    number: "04",
    tag: "Domain Selection",
    title: "Precision-first domains compound authority",
    body: "Maritime, cybersecurity, real estate, and legal operations share a common trait: the cost of a wrong decision vastly exceeds the cost of a slow one. These domains reward builders who prioritise correctness, auditability, and decision authority over raw throughput.",
    applications: ["Vessels", "Aegis / Firestorm", "Terra", "PRISM Counsel"],
    keyInsight: "Domain depth is a moat. Vertical authority compounds over time.",
  },
  {
    number: "05",
    tag: "Product Governance",
    title: "Governed action over autonomous execution",
    body: "AI systems that act without human review in high-stakes contexts are risk multipliers, not productivity tools. Every consequential action should pass through a human-in-the-loop approval gate with an immutable audit trail. Automation accelerates. Governance protects.",
    applications: ["Alloy Engine", "PRISM Counsel", "All platform action primitives"],
    keyInsight: "The audit trail is not a compliance requirement. It's the trust mechanism.",
  },
  {
    number: "06",
    tag: "Capital & Focus",
    title: "Staged concentration beats simultaneous expansion",
    body: "A company with one well-told story and a concentrated commercial wedge will outperform one with five parallel bets. Capital, attention, and narrative all compound when pointed at a single target. The rest of the portfolio can remain visible as staged expansion value — just not simultaneously pursued.",
    applications: ["SZL Holdings portfolio strategy"],
    keyInsight: "One story well-told beats five stories half-told.",
  },
];

const OPERATING_PRINCIPLES = [
  "Ship working systems before documenting them",
  "Observability is a product requirement, not an afterthought",
  "Ownership without accountability is just assignment",
  "Simplicity in interface, complexity in infrastructure",
  "Every platform should be able to explain itself",
  "Compounding structural advantage over quarterly metrics",
  "Revenue-first instinct — services subsidise product",
  "Precision over throughput in high-stakes domains",
  "Audit trails are trust mechanisms, not compliance artifacts",
  "The best tool is the one that surfaces the right decision",
];

const READING = [
  { title: "The Information", author: "James Gleick", why: "On the architecture of information systems — the deepest possible grounding for anyone building data-driven products." },
  { title: "High Output Management", author: "Andy Grove", why: "The clearest framework for operational leverage. Output, not activity. Every founder should own this." },
  { title: "The Innovator's Dilemma", author: "Clayton Christensen", why: "The canonical text on why incumbents fail. Essential context for any vertical SaaS play." },
  { title: "Working in Public", author: "Nadia Eghbal", why: "On building in public, community as infrastructure, and the economics of open creation." },
  { title: "Antifragile", author: "Nassim Nicholas Taleb", why: "Systems that gain from disorder. The right mental model for building platforms meant to persist." },
];

export default function OperatingPhilosophyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-20">

        {/* Hero */}
        <section className="py-20 lg:py-28 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <p className="text-[11px] font-medium tracking-[0.3em] uppercase mb-5" style={{ color: ACCENT }}>
                Operating Philosophy
              </p>
              <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight tracking-tight mb-6">
                How I think about building systems.
              </h1>
              <p className="text-lg leading-relaxed text-white/60">
                These are the frameworks that govern how I design software, allocate attention, structure companies, and make decisions under ambiguity. Not values — operating principles. The difference is that these are falsifiable, actionable, and derived from actual failure.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Frameworks */}
        <section className="py-16 lg:py-20 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="space-y-12">
              {FRAMEWORKS.map((fw, i) => (
                <motion.div
                  key={fw.number}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.04 }}
                  className="grid lg:grid-cols-12 gap-8 pb-12 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="lg:col-span-1">
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: ACCENT }}>{fw.number}</span>
                  </div>
                  <div className="lg:col-span-8">
                    <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: ACCENT }}>{fw.tag}</p>
                    <h2 className="text-2xl font-semibold text-white mb-4 leading-snug">{fw.title}</h2>
                    <p className="text-base text-white/60 leading-relaxed mb-6">{fw.body}</p>
                    <div className="rounded-xl px-5 py-4 mb-4 border" style={{ background: ACCENT_DIM, borderColor: `${ACCENT}20` }}>
                      <p className="text-sm italic leading-relaxed" style={{ color: ACCENT }}>"{fw.keyInsight}"</p>
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/30 mb-3">Applied to</p>
                    <div className="space-y-1.5">
                      {fw.applications.map((app) => (
                        <div key={app} className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full shrink-0" style={{ background: ACCENT }} />
                          <span className="text-sm text-white/50">{app}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Operating Principles */}
        <section className="py-16 lg:py-20 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <p className="text-[11px] font-medium tracking-[0.3em] uppercase mb-3" style={{ color: ACCENT }}>
                  Compressed Principles
                </p>
                <h2 className="text-3xl font-semibold text-white mb-8">In plain language.</h2>
                <div className="space-y-3">
                  {OPERATING_PRINCIPLES.map((principle, i) => (
                    <motion.div
                      key={principle}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-xs mt-0.5 shrink-0 w-5 text-right" style={{ color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-sm text-white/65 leading-relaxed">{principle}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium tracking-[0.3em] uppercase mb-3" style={{ color: ACCENT }}>
                  Foundational Reading
                </p>
                <h2 className="text-3xl font-semibold text-white mb-8">What shaped the thinking.</h2>
                <div className="space-y-6">
                  {READING.map((book, i) => (
                    <motion.div
                      key={book.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="flex gap-4"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono" style={{ background: ACCENT_DIM, color: ACCENT }}>
                        {String(i + 1)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{book.title}</p>
                        <p className="text-xs text-white/40 mb-1">{book.author}</p>
                        <p className="text-xs text-white/55 leading-relaxed">{book.why}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">See the systems in production</h2>
                <p className="text-white/50 text-sm">Explore the platforms where these frameworks are applied.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/work" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white border border-white/15 hover:border-white/30 transition-colors">
                  Selected Work <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="/szl-holdings/" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80" style={{ background: ACCENT, color: "#0a0e14" }}>
                  SZL Holdings <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
