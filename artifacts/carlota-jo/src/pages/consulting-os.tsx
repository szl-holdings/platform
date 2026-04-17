import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useConsultingMetrics } from "@/hooks/useConsultingMetrics";
import { useCarlotaApiData } from "@/hooks/useCarlotaApiData";
import {
  Sparkles, FileText, Network, Radar, Activity, Heart,
  TrendingUp, GraduationCap, Lightbulb, Users, FolderOpen,
  ChevronRight, ArrowUpRight, Zap, Shield, Globe, Clock,
  BarChart3, Target, Star, CheckCircle, AlertCircle, Cpu, BookOpen
} from "lucide-react";

const GOLD = "var(--color-gold)";

const OS_MODULES = [
  {
    id: "proposals",
    icon: FileText,
    title: "AI Proposal Engine",
    subtitle: "Generate winning proposals in minutes",
    description: "Upload an RFP or describe prospect needs. AI generates complete proposals with scope, methodology, pricing, case studies, and team bios — optimised from win/loss data.",
    href: "/proposal-generator",
    metric: "94% client acceptance rate",
    status: "active",
    color: "#B8960C",
    tags: ["RFP Analysis", "Win/Loss Learning", "Template Library"],
  },
  {
    id: "knowledge",
    icon: Network,
    title: "Knowledge Graph & IP Library",
    subtitle: "Institutional intelligence at your fingertips",
    description: "Every engagement, deliverable, framework, and insight lives in a living knowledge graph. Query naturally: \"What frameworks have we used for digital transformation in healthcare?\"",
    href: "/knowledge-graph",
    metric: "47 frameworks indexed",
    status: "active",
    color: "#7C3AED",
    tags: ["Natural Language Queries", "IP Protection", "Engagement Learning"],
  },
  {
    id: "competitive",
    icon: Radar,
    title: "Competitive Intelligence",
    subtitle: "Always know what the market is doing",
    description: "AI agents continuously monitor competitor activities, pricing changes, and public wins. Battlecards auto-update. Win/loss analysis identifies positioning gaps.",
    href: "/competitive-radar",
    metric: "12 competitors tracked",
    status: "active",
    color: "#DC2626",
    tags: ["Auto-Battlecards", "Market Monitoring", "Win/Loss Analysis"],
  },
  {
    id: "engagement",
    icon: Activity,
    title: "Engagement Delivery",
    subtitle: "Zero scope creep. Perfect delivery.",
    description: "Automated milestone tracking, deliverable versioning, AI-generated weekly status updates, burn-rate monitoring, and real-time scope-creep detection with auto-alerts.",
    href: "/engagements",
    metric: "3 active engagements",
    status: "active",
    color: "#059669",
    tags: ["Milestone Tracking", "Burn-Rate Alerts", "Scope Protection"],
  },
  {
    id: "client-health",
    icon: Heart,
    title: "Client Health Intelligence",
    subtitle: "See churn before it happens",
    description: "Real-time relationship health scoring across all clients. Sentiment analysis, satisfaction surveys, delivery metrics — with churn risk prediction and automated retention plays.",
    href: "/client-health",
    metric: "8 clients monitored",
    status: "active",
    color: "#E11D48",
    tags: ["Health Scoring", "Churn Prediction", "NPS Tracking"],
  },
  {
    id: "revenue",
    icon: TrendingUp,
    title: "Revenue Intelligence",
    subtitle: "AI-predicted pipeline performance",
    description: "Full pipeline management with AI close probability, optimal follow-up timing, and deal velocity. Revenue forecasting with scenario modelling and utilisation optimisation.",
    href: "/revenue-intelligence",
    metric: "£2.4M pipeline value",
    status: "active",
    color: "#0284C7",
    tags: ["AI Close Probability", "Revenue Forecasting", "Utilisation Optimisation"],
  },
  {
    id: "workshops",
    icon: GraduationCap,
    title: "Workshop & Training Platform",
    subtitle: "World-class workshops, effortlessly",
    description: "Template-driven creation, participant management, AI-customised content by industry. Session recordings with AI-generated summaries, action items, and follow-up plans.",
    href: "/workshop-platform",
    metric: "18 workshops delivered",
    status: "active",
    color: "#D97706",
    tags: ["Content Generation", "Session Summaries", "Action Items"],
  },
  {
    id: "content",
    icon: Lightbulb,
    title: "Thought Leadership Engine",
    subtitle: "Turn insights into influence",
    description: "AI transforms engagement insights into publishable content — blog posts, whitepapers, LinkedIn articles — while protecting client confidentiality. SEO-optimised with content calendar.",
    href: "/content-strategy",
    metric: "24 pieces published",
    status: "active",
    color: "#7C3AED",
    tags: ["IP-Safe Publishing", "SEO Optimisation", "Content Calendar"],
  },
  {
    id: "experts",
    icon: Users,
    title: "Expert Network & Assembly",
    subtitle: "Right team. Every engagement.",
    description: "Skills-based team matching for every engagement. Subcontractor network with availability, rates, and performance scoring. AI recommends optimal team composition.",
    href: "/expert-network",
    metric: "8 vetted experts",
    status: "active",
    color: "#0F766E",
    tags: ["Skills Matching", "Performance Scoring", "AI Composition"],
  },
  {
    id: "portal",
    icon: FolderOpen,
    title: "Client Portal",
    subtitle: "Transparency without the status calls",
    description: "Self-service client workspace with real-time project visibility, document sharing, approval workflows, and a communication hub. Clients always know exactly where things stand.",
    href: "/client-portal",
    metric: "100% client satisfaction",
    status: "active",
    color: "#475569",
    tags: ["Real-Time Visibility", "Document Sharing", "Approval Workflows"],
  },
  {
    id: "time-tracking",
    icon: Clock,
    title: "Time Tracking & Smart Billing",
    subtitle: "Every hour captured. Every invoice optimised.",
    description: "Granular time entry by engagement, phase, and deliverable. AI suggests entries from calendar activity. Automated invoice generation, rate card management, and billing milestone tracking.",
    href: "/time-tracking",
    metric: "94% rate realisation",
    status: "active",
    color: "#B8960C",
    tags: ["Time Capture", "Invoice Generation", "Rate Cards"],
  },
  {
    id: "capacity-planner",
    icon: Users,
    title: "Resource & Capacity Planner",
    subtitle: "Right team. Right engagement. Always.",
    description: "Visual team allocation heatmap showing utilisation rates, bench time, skill-gap analysis, and forward-looking capacity across all engagements. The #1 feature top consulting firms need.",
    href: "/capacity-planner",
    metric: "87% avg utilisation",
    status: "active",
    color: "#059669",
    tags: ["Allocation Heatmap", "Bench Analysis", "Skill Gaps"],
  },
  {
    id: "knowledge-vault",
    icon: BookOpen,
    title: "Knowledge Vault & Methodology Library",
    subtitle: "Institutional intelligence. Always searchable.",
    description: "Every framework, playbook, template, and case study — searchable, version-controlled, and growing with every engagement. AI-powered 'find me a similar engagement' search.",
    href: "/knowledge-vault",
    metric: "8 assets · 93 total uses",
    status: "active",
    color: "#7C3AED",
    tags: ["Frameworks", "Playbooks", "AI Search"],
  },
  {
    id: "benchmark-database",
    icon: BarChart3,
    title: "Benchmark Database",
    subtitle: "Every number in industry context.",
    description: "Reference-quality industry benchmarks for consulting performance metrics auto-populated into client deliverables. 16 metrics across financial, delivery, talent, and client dimensions.",
    href: "/benchmark-database",
    metric: "16 benchmarks · 14 sources",
    status: "active",
    color: "#0F766E",
    tags: ["Industry Data", "Auto-populate", "Context"],
  },
  {
    id: "deliverable-workflow",
    icon: FileText,
    title: "Deliverable Approval Workflow",
    subtitle: "Version-controlled. Client-approved.",
    description: "Staged review pipeline with internal and client approval workflows, threaded comment resolution, full version history, and change tracking. Every deliverable, perfect every time.",
    href: "/deliverable-workflow",
    metric: "4 deliverables in pipeline",
    status: "active",
    color: "#6366F1",
    tags: ["Version Control", "Approval Tracking", "Comment Threads"],
  },
  {
    id: "profitability-analytics",
    icon: TrendingUp,
    title: "Engagement Profitability Analytics",
    subtitle: "True margins. Zero surprises.",
    description: "Real-time P&L per engagement with rate realization tracking, scope creep detection, write-off monitoring, and margin trend analysis. Know the true profitability of every client relationship.",
    href: "/profitability-analytics",
    metric: "48% blended margin",
    status: "active",
    color: "#059669",
    tags: ["Margin Tracking", "Scope Creep", "Write-off Dashboard"],
  },
];


const RECENT_ACTIVITY = [
  { type: "proposal", icon: FileText, text: "Proposal generated for Luminary Brands expansion — 47 pages", time: "2 hours ago", color: "#B8960C" },
  { type: "alert", icon: AlertCircle, text: "Scope-creep alert: Oasis Wellness engagement at 94% budget utilisation", time: "4 hours ago", color: "#DC2626" },
  { type: "intel", icon: Radar, text: "Competitor update: McKinsey launched new pricing advisory service", time: "6 hours ago", color: "#7C3AED" },
  { type: "content", icon: Lightbulb, text: "Thought leadership draft ready: \"The Future of Brand in AI Markets\"", time: "Yesterday", color: "#D97706" },
  { type: "health", icon: Heart, text: "Meridian Capital health score improved to 88 — relationship strengthening", time: "Yesterday", color: "#E11D48" },
  { type: "knowledge", icon: Network, text: "3 new frameworks indexed from Q1 Luminary Brands engagement", time: "2 days ago", color: "#059669" },
];

const AI_INSIGHTS = [
  {
    icon: Target,
    title: "Highest-value opportunity right now",
    body: "Oasis Wellness shows strong signals for a scope extension into organisational design — matched with 3 successful past engagements. Probability: 78%.",
    action: "View opportunity",
    href: "/revenue-intelligence",
  },
  {
    icon: AlertCircle,
    title: "Retention risk detected",
    body: "Meridian Capital's engagement momentum has declined 14 points over 6 weeks. Recommend scheduling an executive sponsor check-in within 5 business days.",
    action: "View client health",
    href: "/client-health",
  },
  {
    icon: Star,
    title: "Content opportunity identified",
    body: "Your healthcare digital transformation work is trending. AI has drafted a \"5 Lessons from 3 Healthcare Transformations\" article — ready for review.",
    action: "Review content",
    href: "/content-strategy",
  },
];

export default function ConsultingOS() {
  usePageMeta({
    title: "Consulting OS | Carlota Jo",
    description: "The AI-native operating system for boutique consulting — proposals, knowledge graphs, engagement delivery, and revenue intelligence in one platform.",
    canonical: "https://szlholdings.com/carlota-jo/consulting-os",
  });

  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const metrics = useConsultingMetrics();
  const apiData = useCarlotaApiData();
  const PLATFORM_METRICS = [
    ...metrics.platform,
    ...(apiData.isLive ? [
      {
        label: "Client Inquiries",
        value: apiData.inquiriesTotal.toString(),
        change: "from CRM",
        up: true,
        source: "live" as const,
      },
      ...(apiData.servicesCount > 0 ? [{
        label: "Services Offered",
        value: apiData.servicesCount.toString(),
        change: "live catalogue",
        up: true,
        source: "live" as const,
      }] : []),
    ] : []),
  ];
  const liveModuleMetrics: Record<string, string> = {
    "time-tracking": metrics.modules.timeTracking,
    "capacity-planner": metrics.modules.capacityPlanner,
    "profitability-analytics": metrics.modules.profitability,
    engagement: metrics.modules.engagementDelivery,
    revenue: metrics.modules.revenue,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingTop: 64 }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F0F0D 0%, #1A1A14 50%, #0A0A08 100%)", padding: "64px 0 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cpu size={16} color={GOLD} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase" }}>Consulting Operating System</span>
            </div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
              The AI-Native Platform for<br />
              <em style={{ color: GOLD, fontStyle: "italic" }}>Boutique Excellence</em>
            </h1>
            <p style={{ fontSize: 17, color: "#A89878", maxWidth: 560, lineHeight: 1.7, marginBottom: 32 }}>
              Ten AI-powered modules that replace a team of ops specialists — so Carlota Jo can deliver Fortune 500 quality with boutique precision.
            </p>

            {/* Platform metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, maxWidth: 900 }}>
              {PLATFORM_METRICS.map((m) => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "#A89878", marginTop: 2, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={10} /> {m.change}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* AI Insights */}
        <div style={{ padding: "40px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Sparkles size={16} color={GOLD} />
            <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#6B5E47", textTransform: "uppercase" }}>AI Intelligence Briefing</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 48 }}>
            {AI_INSIGHTS.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                <insight.icon size={18} color={GOLD} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A14", marginBottom: 8 }}>{insight.title}</div>
                <div style={{ fontSize: 13, color: "#6B5E47", lineHeight: 1.6, marginBottom: 16 }}>{insight.body}</div>
                <Link href={insight.href}>
                  <a style={{ fontSize: 12, color: GOLD, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                    {insight.action} <ChevronRight size={12} />
                  </a>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Module Grid */}
        <div style={{ paddingBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={GOLD} />
              <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#6B5E47", textTransform: "uppercase" }}>Platform Modules</h2>
            </div>
            <div style={{ fontSize: 12, color: "#A89878" }}>16 modules · All active</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {OS_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              const isHovered = hoveredModule === mod.id;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <Link href={mod.href}>
                    <a style={{ textDecoration: "none", display: "block" }}>
                      <div style={{
                        background: "#fff",
                        border: `1px solid ${isHovered ? mod.color + "40" : "#E8E2D6"}`,
                        borderRadius: 16,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        transform: isHovered ? "translateY(-2px)" : "none",
                        boxShadow: isHovered ? `0 8px 32px ${mod.color}15` : "none",
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: isHovered ? `linear-gradient(90deg, ${mod.color}, transparent)` : "transparent", transition: "all 0.2s" }} />
                        
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${mod.color}12`, border: `1px solid ${mod.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={18} color={mod.color} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
                            <span style={{ fontSize: 11, color: "#6B5E47" }}>Active</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A14", marginBottom: 3 }}>{mod.title}</div>
                          <div style={{ fontSize: 12, color: mod.color, fontWeight: 500 }}>{mod.subtitle}</div>
                        </div>

                        <p style={{ fontSize: 13, color: "#6B5E47", lineHeight: 1.6, marginBottom: 16 }}>{mod.description}</p>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                          {mod.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 6, background: `${mod.color}10`, color: mod.color, border: `1px solid ${mod.color}20` }}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F0EBE0" }}>
                          <span style={{ fontSize: 12, color: "#A89878" }}>{liveModuleMetrics[mod.id] ?? mod.metric}</span>
                          <ArrowUpRight size={14} color={mod.color} style={{ opacity: isHovered ? 1 : 0.4, transition: "opacity 0.2s" }} />
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ paddingBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Clock size={16} color={GOLD} />
            <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#6B5E47", textTransform: "uppercase" }}>Platform Activity</h2>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, overflow: "hidden" }}>
            {RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 24px", borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid #F0EBE0" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}12`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <Icon size={14} color={item.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#1A1A14", lineHeight: 1.5 }}>{item.text}</div>
                    <div style={{ fontSize: 11, color: "#A89878", marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Differentiators */}
        <div style={{ paddingBottom: 80 }}>
          <div style={{ background: "linear-gradient(135deg, #0F0F0D, #1A1A14)", borderRadius: 24, padding: "48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", marginBottom: 16 }}>Why This Matters</div>
              <h3 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2, marginBottom: 20 }}>
                The AI consulting market hits<br />
                <em style={{ color: GOLD }}>$91B by 2035</em>
              </h3>
              <p style={{ fontSize: 14, color: "#A89878", lineHeight: 1.7, marginBottom: 24 }}>
                89% of organisations expect AI in the consulting services they buy. 67% will leave firms that don't adopt AI. Carlota Jo is ahead of the curve — delivering institutional-quality intelligence through a boutique practice.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Fortune 500 quality at boutique cost structure",
                  "Zero knowledge loss between engagements",
                  "AI agents working 24/7 between client calls",
                  "Every engagement makes the next one better",
                ].map((point, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle size={14} color="#4ADE80" />
                    <span style={{ fontSize: 13, color: "#D4C5A0" }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignContent: "start" }}>
              {[
                { icon: Shield, label: "IP Protected", desc: "Client data never leaves your control" },
                { icon: Zap, label: "Always On", desc: "AI agents work between client calls" },
                { icon: Globe, label: "Scalable", desc: "Grow without headcount" },
                { icon: BarChart3, label: "Evidence-Based", desc: "Every recommendation backed by data" },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 }}>
                    <Icon size={20} color={GOLD} style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F0E8", marginBottom: 4 }}>{feat.label}</div>
                    <div style={{ fontSize: 12, color: "#A89878" }}>{feat.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
