import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { BookOpen, Sparkles, DollarSign, Play, ChevronRight, Package, Zap } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const products = [
  {
    id: "aiops-masterclass",
    title: "AIOps Masterclass: From Alert Fatigue to AI Command",
    type: "course",
    price: 997,
    status: "live",
    enrolled: 412,
    completed: 284,
    revenue: 411164,
    rating: 4.9,
    modules: 8,
    lessons: 46,
    description: "The complete system for enterprise AIOps transformation. 8 modules, 46 lessons, real Lyte platform case studies.",
    lastUpdated: "Mar 2026",
    categories: ["AIOps", "Enterprise Tech", "Platform Engineering"],
  },
  {
    id: "ecosystem-framework",
    title: "The Ecosystem Investor's Framework",
    type: "course",
    price: 697,
    status: "live",
    enrolled: 218,
    completed: 149,
    revenue: 152006,
    rating: 4.8,
    modules: 5,
    lessons: 28,
    description: "How to architect, fund, and operate multiple companies simultaneously. Stephen's personal operating playbook.",
    lastUpdated: "Feb 2026",
    categories: ["Investing", "Venture Building", "Strategy"],
  },
  {
    id: "maritime-ai-toolkit",
    title: "Maritime AI Intelligence Toolkit",
    type: "template",
    price: 297,
    status: "live",
    enrolled: 341,
    completed: 341,
    revenue: 101277,
    rating: 4.7,
    modules: 1,
    lessons: 12,
    description: "20+ templates and frameworks for maritime intelligence analysis, vessel tracking workflows, and port optimization.",
    lastUpdated: "Jan 2026",
    categories: ["Maritime", "AI", "Operations"],
  },
  {
    id: "personal-brand-os",
    title: "Personal Brand Operating System",
    type: "course",
    price: 497,
    status: "draft",
    enrolled: 0,
    completed: 0,
    revenue: 0,
    rating: 0,
    modules: 6,
    lessons: 34,
    description: "Build your thought leadership engine: content systems, audience intelligence, media relations, and monetization.",
    lastUpdated: "In progress",
    categories: ["Personal Brand", "Creator Economy", "Content"],
  },
];

const courseOutlineAI = [
  { module: 1, title: "The Ecosystem Architecture Mindset", lessons: ["Why single-company focus is a vanishing edge", "The compounding data flywheel", "Designing for portfolio synergy from Day 1"] },
  { module: 2, title: "Capital Strategy & Investor Positioning", lessons: ["Bootstrapping vs. venture for ecosystem plays", "How to pitch multi-company founders to LPs", "Revenue recycling strategies across products"] },
  { module: 3, title: "Operational Infrastructure at Scale", lessons: ["The shared services model", "Hiring for ecosystem vs. single company", "AI-native operations playbook"] },
  { module: 4, title: "Data Moat Construction", lessons: ["Proprietary data as defensibility", "Cross-product data sharing frameworks", "Building data partnerships that compound"] },
  { module: 5, title: "Exit Architecture", lessons: ["Partial exit strategies", "When to spin out vs. hold", "Secondary market positioning"] },
];

export default function DigitalProducts() {
  usePageMeta({
    title: "Digital Products & Courses | Stephen Lutar — Creator Economy Engine",
    description: "Stephen Lutar's digital product and course library: AIOps masterclass, ecosystem investing framework, maritime AI toolkit, and more.",
    canonical: "https://szlholdings.com/stephen/products",
  });

  const [activeTab, setActiveTab] = useState<"products" | "outline" | "analytics" | "drip">("products");
  const [selectedProduct, setSelectedProduct] = useState<string | null>("aiops-masterclass");
  const [outlineExpanded, setOutlineExpanded] = useState<number | null>(1);

  const product = products.find(p => p.id === selectedProduct);
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalEnrolled = products.reduce((s, p) => s + p.enrolled, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Digital Products & Course Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, sell, and manage courses, templates, and digital products — with AI course generation</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
          <DollarSign className="w-3 h-3 mr-0.5" />
          ${(totalRevenue / 1000).toFixed(0)}K Revenue
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: "text-emerald-400", sub: "3 live products" },
          { label: "Total Students", value: totalEnrolled.toLocaleString(), color: "text-primary", sub: "Across all products" },
          { label: "Avg Completion Rate", value: "71%", color: "text-sky-400", sub: "Industry avg: 12%" },
          { label: "Avg Rating", value: "4.8★", color: "text-amber-400", sub: "From 312 reviews" },
        ].map(({ label, value, color, sub }) => (
          <Card key={label} className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border/40">
        {(["products", "outline", "analytics", "drip"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "outline" ? "AI Course Builder" : tab === "drip" ? "Drip Delivery" : tab}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <Card
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                className={`bg-card/50 border-border/40 cursor-pointer transition-all hover:border-primary/30 ${selectedProduct === p.id ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={`text-xs ${p.status === "live" ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"}`}>
                          {p.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground capitalize">{p.type}</Badge>
                      </div>
                      <div className="text-sm font-semibold leading-tight">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">${p.price}</div>
                      {p.rating > 0 && <div className="text-xs text-amber-400">{p.rating}★</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/20 text-xs">
                    <div><span className="text-muted-foreground">Enrolled</span><br /><span className="font-medium text-primary">{p.enrolled}</span></div>
                    <div><span className="text-muted-foreground">Revenue</span><br /><span className="font-medium text-emerald-400">${(p.revenue / 1000).toFixed(0)}K</span></div>
                    <div><span className="text-muted-foreground">Completion</span><br /><span className="font-medium">{p.enrolled > 0 ? Math.round((p.completed / p.enrolled) * 100) : "—"}%</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {product && (
            <Card className="bg-card/50 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <div className="text-muted-foreground">Modules</div>
                    <div className="text-xl font-bold text-primary mt-1">{product.modules}</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <div className="text-muted-foreground">Lessons</div>
                    <div className="text-xl font-bold text-sky-400 mt-1">{product.lessons}</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <div className="text-muted-foreground">Last Updated</div>
                    <div className="text-sm font-bold mt-1">{product.lastUpdated}</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <div className="text-muted-foreground">Categories</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.categories.slice(0, 2).map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "outline" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI-generated course outline for "The Ecosystem Investor's Framework" — built from your existing articles, LinkedIn posts, and speaking content.</p>
          </div>

          <div className="space-y-2">
            {courseOutlineAI.map(m => (
              <Card key={m.module} className="bg-card/50 border-border/40">
                <button
                  className="w-full"
                  onClick={() => setOutlineExpanded(outlineExpanded === m.module ? null : m.module)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">{m.module}</div>
                        <span className="text-sm font-semibold text-left">{m.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{m.lessons.length} lessons</span>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${outlineExpanded === m.module ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                    {outlineExpanded === m.module && (
                      <div className="mt-3 pt-3 border-t border-border/20 space-y-2 text-left">
                        {m.lessons.map((lesson, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Play className="w-3 h-3 text-primary shrink-0" />
                            {lesson}
                          </div>
                        ))}
                        <button className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Sparkles className="w-3 h-3" />
                          Generate lesson content with AI
                        </button>
                      </div>
                    )}
                  </CardContent>
                </button>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Expand All Lessons with AI
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/40 rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors">
              <Package className="w-3.5 h-3.5" />
              Export Course Structure
            </button>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {products.filter(p => p.status === "live").map(p => (
              <Card key={p.id} className="bg-card/50 border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs truncate">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.completed / p.enrolled) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Completion: <span className="text-primary font-medium">{Math.round((p.completed / p.enrolled) * 100)}%</span></span>
                    <span className="text-muted-foreground">Rating: <span className="text-amber-400 font-medium">{p.rating}★</span></span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-muted-foreground">{p.enrolled} enrolled</span>
                    <span className="text-emerald-400 font-semibold">${(p.revenue / 1000).toFixed(0)}K revenue</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Enrollment Trend (6 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {[28, 34, 41, 38, 52, 67, 58, 74, 82, 69, 91, 104].map((v, i) => (
                  <div key={i} className="flex-1">
                    <div className={`w-full rounded-sm ${i >= 6 ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${(v / 110) * 80}px` }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "drip" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Automated content delivery sequences for enrolled students.</p>
          {products.filter(p => p.status === "live").map(p => (
            <Card key={p.id} className="bg-card/50 border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs">{p.title}</CardTitle>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">{p.enrolled} active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { day: "Day 0", action: "Welcome email + Module 1 unlock", status: "auto" },
                  { day: "Day 3", action: "Progress check-in + Module 2 unlock (if M1 complete)", status: "auto" },
                  { day: "Day 7", action: "Community invitation + bonus resource drop", status: "auto" },
                  { day: "Day 14", action: "Mid-course assessment + personalized feedback", status: "auto" },
                  { day: "Day 30", action: "Completion certificate + upsell to next product", status: "auto" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/10 last:border-0">
                    <div className="w-14 text-primary font-mono shrink-0">{step.day}</div>
                    <div className="flex-1 text-muted-foreground">{step.action}</div>
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20">
                      <Zap className="w-2.5 h-2.5 mr-0.5" />Auto
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
