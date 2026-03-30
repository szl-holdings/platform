import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";

const careerTimeline = [
  { year: "2024-Present", role: "Founder & CEO", company: "SZL Holdings", description: "Leading a diversified technology holding company spanning AI, maritime intelligence, cybersecurity, and creative technology.", highlight: true },
  { year: "2022-2024", role: "Chief Technology Officer", company: "Enterprise SaaS Co.", description: "Led engineering organization of 45+ engineers. Architected microservices platform processing 2M+ daily transactions.", highlight: false },
  { year: "2020-2022", role: "VP of Engineering", company: "FinTech Startup", description: "Scaled platform from MVP to $10M ARR. Built and managed cross-functional teams across 3 continents.", highlight: false },
  { year: "2018-2020", role: "Senior Staff Engineer", company: "Fortune 500 Tech", description: "Core platform architect. Designed systems handling 500K concurrent users with 99.99% uptime.", highlight: false },
  { year: "2016-2018", role: "Lead Software Engineer", company: "Digital Agency", description: "Delivered 20+ enterprise projects. Full-stack development with React, Node.js, and cloud infrastructure.", highlight: false },
];

const skillRadar = [
  { skill: "Leadership & Strategy", level: 95, category: "Executive" },
  { skill: "System Architecture", level: 98, category: "Technical" },
  { skill: "Full-Stack Development", level: 96, category: "Technical" },
  { skill: "Cloud Infrastructure", level: 94, category: "Technical" },
  { skill: "AI / Machine Learning", level: 88, category: "Technical" },
  { skill: "Team Building", level: 92, category: "Executive" },
  { skill: "Product Strategy", level: 90, category: "Executive" },
  { skill: "DevOps & CI/CD", level: 91, category: "Technical" },
];

const projectDeepDives = [
  { name: "Vessels Maritime Intelligence", tech: ["React", "TypeScript", "Real-time Data", "SVG Maps"], impact: "Monitoring 200+ vessels across global shipping lanes", status: "Live" },
  { name: "Firestorm Security Operations", tech: ["SOC Dashboard", "MITRE ATT&CK", "Threat Intel"], impact: "Enterprise-grade security operations center", status: "Live" },
  { name: "INCA AI Research Platform", tech: ["Neural Networks", "Model Benchmarking", "GPU Clusters"], impact: "Training and evaluating custom AI models", status: "Live" },
  { name: "Alloy Workflow Engine", tech: ["Signal Normalization", "Workflow Orchestration", "Artifact Generation"], impact: "Governs cross-platform signal routing, workflows, and approvals", status: "Live" },
  { name: "Lyte Command Center", tech: ["Infrastructure", "AIOps", "Observability"], impact: "Full-stack infrastructure intelligence platform", status: "Live" },
];

export default function CareerCommand() {
  usePageMeta({
    title: "Career | Stephen Lutar – Technology Executive & Full-Stack Engineer",
    description: "Explore Stephen Lutar's career journey: from Lead Engineer to Founder & CEO of SZL Holdings. 15+ years building enterprise systems at scale.",
    canonical: "https://szlholdings.com/stephen/career",
  });
  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Career Command</span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6">
              Professional <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Authority</span> Showcase
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mb-12">A decade of building, leading, and scaling technology organizations.</p>
          </motion.div>

          <div className="relative pl-8 mb-16">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            {careerTimeline.map((item, i) => (
              <motion.div key={item.year} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative mb-8 last:mb-0 rounded-xl border p-6 ${item.highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card/50"}`}>
                <div className={`absolute -left-5 top-6 w-3 h-3 rounded-full border-2 border-background ${item.highlight ? "bg-primary" : "bg-muted-foreground"}`} />
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-primary">{item.year}</span>
                  <span className="text-sm font-bold">{item.role}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{item.company}</p>
                <p className="text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mb-16">
            <h3 className="text-xl font-display font-bold mb-6">Skills Mastery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skillRadar.map((s) => (
                <div key={s.skill} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                  <span className="text-sm w-40 font-medium">{s.skill}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${s.level}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8">{s.level}%</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.category}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h3 className="text-xl font-display font-bold mb-6">Project Deep Dives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectDeepDives.map((project) => (
                <div key={project.name} className="rounded-xl border border-border bg-card/50 p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold">{project.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">{project.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{project.impact}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
