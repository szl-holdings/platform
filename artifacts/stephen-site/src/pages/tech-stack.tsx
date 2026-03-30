import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Cpu, Code2, BarChart3, Globe, Shield, Brain, Database, Terminal, Layers } from "lucide-react";

const stackCategories = [
  {
    name: "Product & Strategy",
    icon: Brain,
    color: "#8b5cf6",
    tools: [
      { name: "Amplitude", use: "Product analytics and funnel analysis" },
      { name: "Mixpanel", use: "Event tracking and user journey mapping" },
      { name: "Notion", use: "Strategy docs, PRDs, and research synthesis" },
      { name: "Miro", use: "Journey mapping, systems thinking, stakeholder workshops" },
      { name: "Figma", use: "Rapid wireframing and design review" },
      { name: "Linear", use: "Engineering roadmap and sprint planning" },
    ],
  },
  {
    name: "Development",
    icon: Code2,
    color: "#3b82f6",
    tools: [
      { name: "TypeScript", use: "Primary language for all client and server code" },
      { name: "React + Vite", use: "Frontend application development" },
      { name: "Node.js + Express", use: "API server and backend services" },
      { name: "PostgreSQL", use: "Primary relational database" },
      { name: "Prisma", use: "Type-safe ORM and schema management" },
      { name: "TailwindCSS", use: "Utility-first styling system" },
    ],
  },
  {
    name: "AI & Machine Learning",
    icon: Brain,
    color: "#ec4899",
    tools: [
      { name: "OpenAI API", use: "GPT-4 for analysis, summarization, and content generation" },
      { name: "Anthropic Claude", use: "Long-context reasoning and strategic analysis" },
      { name: "LangChain", use: "Agent orchestration and RAG pipelines" },
      { name: "Pinecone", use: "Vector database for semantic search" },
      { name: "Python + FastAPI", use: "ML model serving and data science workflows" },
      { name: "Jupyter", use: "Exploratory data analysis and financial modeling" },
    ],
  },
  {
    name: "Infrastructure & DevOps",
    icon: Terminal,
    color: "#10b981",
    tools: [
      { name: "AWS (EC2, RDS, S3)", use: "Core cloud infrastructure" },
      { name: "Docker + Kubernetes", use: "Container orchestration for microservices" },
      { name: "GitHub Actions", use: "CI/CD pipelines and automated testing" },
      { name: "Datadog", use: "APM, logging, and infrastructure monitoring" },
      { name: "Terraform", use: "Infrastructure as code for repeatable deployments" },
      { name: "Vercel / Replit", use: "Frontend deployment and rapid prototyping" },
    ],
  },
  {
    name: "Data & Analytics",
    icon: BarChart3,
    color: "#f59e0b",
    tools: [
      { name: "dbt", use: "Data transformation and analytics engineering" },
      { name: "Metabase", use: "Internal BI dashboards and reporting" },
      { name: "BigQuery", use: "Data warehouse for event data and product analytics" },
      { name: "Recharts", use: "Interactive charting in React applications" },
      { name: "Python Pandas", use: "Financial modeling and data manipulation" },
      { name: "Hex", use: "Collaborative data notebooks and stakeholder reporting" },
    ],
  },
  {
    name: "Security & Compliance",
    icon: Shield,
    color: "#ef4444",
    tools: [
      { name: "Snyk", use: "Dependency vulnerability scanning" },
      { name: "SonarQube", use: "Static code analysis and security review" },
      { name: "1Password Teams", use: "Secrets management and access control" },
      { name: "Cloudflare", use: "WAF, DDoS protection, and edge networking" },
      { name: "Vanta", use: "SOC 2 compliance automation" },
      { name: "PagerDuty", use: "Incident management and on-call coordination" },
    ],
  },
];

const principles = [
  { title: "AI-First by Default", description: "Every new workflow starts with the question: how does AI make this 10x better?" },
  { title: "Radical Simplicity", description: "The best stack is the smallest one that solves the problem. Add complexity only when necessary." },
  { title: "Observable Everything", description: "If you can't measure it, you can't improve it. Instrumentation is a first-class requirement." },
  { title: "Composable Systems", description: "Build for integration from day one. Every service should expose a clean API." },
];

export default function TechStack() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">Tools & Stack</p>
          <h1 className="text-4xl font-serif font-bold text-foreground">Technology Stack</h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">The tools, languages, and frameworks I use to build, analyze, and ship. Updated Q1 2026.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {principles.map(p => (
            <div key={p.title} className="p-4 rounded-xl border border-border bg-card">
              <p className="text-sm font-semibold text-primary mb-1">{p.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {stackCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <Card key={cat.name} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.tools.map(tool => (
                      <div key={tool.name} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cat.color }} />
                        <div>
                          <p className="text-xs font-medium text-foreground">{tool.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tool.use}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
