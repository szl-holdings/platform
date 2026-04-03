import { Briefcase, Code, Award, Star, ExternalLink, Github, Linkedin, MapPin, GraduationCap, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { usePageMeta } from "@/hooks/usePageMeta";

const skills = [
  { name: "TypeScript", level: 95, category: "Language" },
  { name: "React / Next.js", level: 92, category: "Frontend" },
  { name: "Node.js", level: 90, category: "Backend" },
  { name: "Python", level: 85, category: "Language" },
  { name: "PostgreSQL", level: 88, category: "Database" },
  { name: "Azure / Cloud", level: 82, category: "Infrastructure" },
  { name: "System Design", level: 90, category: "Architecture" },
  { name: "AI/ML Integration", level: 78, category: "Specialization" },
];

const achievements = [
  { title: "Built 14-App Enterprise Ecosystem", description: "Architected and developed a comprehensive SaaS platform spanning security, AI research, maritime intelligence, real estate analytics, and creative tools", icon: Award },
  { title: "Full-Stack Architecture", description: "Designed multi-tenant architecture with shared component libraries, unified API layer, and cross-app intelligence features", icon: Code },
  { title: "AI/ML Platform Development", description: "Created INCA AI Research Command Center with model registry, prediction tracking, ensemble management, and drift monitoring", icon: Zap },
  { title: "Security Operations Center", description: "Built Firestorm SOC with real-time threat intelligence, MITRE ATT&CK mapping, and automated incident response workflows", icon: Star },
];

const experience = [
  { role: "Founder & Technical Lead", company: "SZL Holdings", period: "2024 — Present", description: "Leading development of an enterprise SaaS ecosystem comprising 14+ integrated applications serving security, intelligence, and operations domains" },
  { role: "Senior Software Engineer", company: "Previous Role", period: "2021 — 2024", description: "Full-stack development with focus on distributed systems, cloud architecture, and AI/ML integration" },
];

export default function HackajobProfile() {
  usePageMeta({
    title: "Hackajob Profile | Stephen Lutar – Senior Software Engineer",
    description: "Stephen Lutar's professional engineering profile: TypeScript, React, Node.js, and cloud infrastructure expertise with 15+ years of enterprise delivery.",
    canonical: "https://szlholdings.com/stephen/hackajob",
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/30 flex items-center justify-center text-3xl font-bold text-primary">
              SL
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Stephen Lutar</h1>
              <p className="text-lg text-primary mt-1">Full-Stack Engineer & Technical Founder</p>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Available for opportunities
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Open to work
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Briefcase className="w-3 h-3" /> Full-time / Contract
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Technical founder and full-stack engineer with deep expertise in building enterprise-scale SaaS platforms.
            Creator of the SZL Holdings ecosystem — a suite of 14+ integrated applications spanning security operations,
            AI research, maritime intelligence, real estate analytics, and creative content management. Passionate about
            system design, developer experience, and building products that solve complex business problems.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" /> Technical Skills
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {skills.map(skill => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{skill.name}</span>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{skill.category}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{skill.level}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${skill.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Key Achievements
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((a, i) => {
              const AchIcon = a.icon;
              return (
                <div key={i} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <AchIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-4 py-2">
                <h3 className="text-sm font-semibold text-foreground">{exp.role}</h3>
                <p className="text-xs text-primary">{exp.company} · {exp.period}</p>
                <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
