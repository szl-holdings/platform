import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Store, Search, Star, TrendingUp, Filter, Zap, CheckCircle, XCircle,
  ChevronRight, BarChart2, Users, Clock, Tag, Shield, Brain,
  MessageSquare, FileText, Globe, Database, Layers, Activity,
  Eye, Play, Pause, ArrowUpRight, Sparkles, Award, Package,
} from "lucide-react";

interface SkillEntry {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  domain: string;
  category: string;
  tags: string[];
  rating: number;
  ratingCount: number;
  usageCount: number;
  activeUsers: number;
  successRate: number;
  avgLatencyMs: number;
  isActivated: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  publisher: string;
  lastUpdated: string;
  capabilities: string[];
}

interface MarketplaceStats {
  totalSkills: number;
  activatedSkills: number;
  totalInvocations: number;
  topDomains: string[];
}

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Intelligence": Brain,
  "Communication": MessageSquare,
  "Documents": FileText,
  "Data": Database,
  "Research": Globe,
  "Orchestration": Layers,
  "Analytics": BarChart2,
  "Security": Shield,
  "Productivity": Zap,
  "Media": Activity,
};

const DEMO_SKILLS: SkillEntry[] = [
  {
    id: "sk_presentation_engine",
    name: "AI Presentation Engine",
    slug: "presentation-engine",
    version: "3.1.0",
    description: "Generate structured slide decks — investor pitches, board briefs, client presentations — directly from natural language prompts. Supports 8 layout types with domain-aware tone profiles.",
    domain: "Documents",
    category: "Content Generation",
    tags: ["slides", "decks", "investor", "board", "content"],
    rating: 4.8,
    ratingCount: 312,
    usageCount: 18420,
    activeUsers: 47,
    successRate: 98.2,
    avgLatencyMs: 1240,
    isActivated: true,
    isPopular: true,
    isFeatured: true,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(),
    capabilities: ["Multi-layout slides", "Domain tone profiles", "Speaker notes", "PDF export"],
  },
  {
    id: "sk_email_composer",
    name: "AI Email Composer",
    slug: "email-composer",
    version: "2.4.1",
    description: "Smart email drafting, intelligent reply suggestions, tone adjustment, and thread summarization. Domain-aware profiles for legal, maritime, security, and executive contexts.",
    domain: "Communication",
    category: "Communication",
    tags: ["email", "drafting", "tone", "summarize"],
    rating: 4.7,
    ratingCount: 287,
    usageCount: 23100,
    activeUsers: 62,
    successRate: 97.8,
    avgLatencyMs: 890,
    isActivated: true,
    isPopular: true,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString(),
    capabilities: ["Draft mode", "Reply suggestions", "Tone adjustment", "Thread summarization"],
  },
  {
    id: "sk_design_studio",
    name: "AI Design Studio",
    slug: "design-studio",
    version: "1.8.0",
    description: "On-demand generation of charts, diagrams, branded assets, and marketing visuals. Returns structured visual specifications compatible with any renderer.",
    domain: "Media",
    category: "Visual",
    tags: ["design", "graphics", "charts", "branding", "visual"],
    rating: 4.5,
    ratingCount: 189,
    usageCount: 9870,
    activeUsers: 31,
    successRate: 96.1,
    avgLatencyMs: 1650,
    isActivated: false,
    isPopular: false,
    isFeatured: true,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 10 * 86400000).toISOString(),
    capabilities: ["Charts", "Branded graphics", "UI mockups", "Infographics"],
  },
  {
    id: "sk_smart_spreadsheet",
    name: "AI Smart Spreadsheet",
    slug: "smart-spreadsheet",
    version: "2.2.0",
    description: "Natural language data queries returning structured tables, pivot analyses, and exportable CSV. Domain schemas for real estate, maritime, security, and general business.",
    domain: "Data",
    category: "Data",
    tags: ["spreadsheet", "data", "csv", "pivot", "tables"],
    rating: 4.9,
    ratingCount: 421,
    usageCount: 31200,
    activeUsers: 78,
    successRate: 99.0,
    avgLatencyMs: 720,
    isActivated: true,
    isPopular: true,
    isFeatured: true,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 1 * 86400000).toISOString(),
    capabilities: ["Natural language queries", "Pivot tables", "CSV export", "Domain schemas"],
  },
  {
    id: "sk_scheduling_engine",
    name: "AI Scheduling Intelligence",
    slug: "scheduling-engine",
    version: "2.0.3",
    description: "Calendar-aware scheduling with timezone intelligence, priority scoring, conflict detection, and predictive patterns. Powers the Carlota Jo Rhythm Calendar.",
    domain: "Productivity",
    category: "Productivity",
    tags: ["scheduling", "calendar", "timezone", "conflicts"],
    rating: 4.6,
    ratingCount: 156,
    usageCount: 7430,
    activeUsers: 24,
    successRate: 97.3,
    avgLatencyMs: 540,
    isActivated: false,
    isPopular: false,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 7 * 86400000).toISOString(),
    capabilities: ["Slot finding", "Conflict detection", "Pattern prediction", "Calendar optimization"],
  },
  {
    id: "sk_content_engine",
    name: "AI Writing & Content Engine",
    slug: "content-engine",
    version: "3.0.1",
    description: "Long-form content generation with domain-specific tone profiles. Supports reports, proposals, briefs, marketing copy, executive memos, and advisory notes.",
    domain: "Documents",
    category: "Content Generation",
    tags: ["writing", "content", "reports", "proposals", "marketing"],
    rating: 4.7,
    ratingCount: 298,
    usageCount: 14800,
    activeUsers: 53,
    successRate: 97.5,
    avgLatencyMs: 1120,
    isActivated: true,
    isPopular: true,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString(),
    capabilities: ["8 content types", "Domain tone profiles", "Style transfer", "Multi-format output"],
  },
  {
    id: "sk_knowledge_vault",
    name: "AI Knowledge Vault",
    slug: "knowledge-vault",
    version: "2.5.0",
    description: "Self-organizing cross-domain knowledge base with auto-tagging, smart linking, and semantic retrieval. Aggregates intelligence across all 7 domain agents.",
    domain: "Intelligence",
    category: "Intelligence",
    tags: ["knowledge", "semantic", "search", "retrieval", "graph"],
    rating: 4.8,
    ratingCount: 267,
    usageCount: 22100,
    activeUsers: 67,
    successRate: 98.7,
    avgLatencyMs: 380,
    isActivated: true,
    isPopular: true,
    isFeatured: true,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 4 * 86400000).toISOString(),
    capabilities: ["Semantic retrieval", "Auto-tagging", "Cross-domain links", "Knowledge graph"],
  },
  {
    id: "sk_meeting_intel",
    name: "AI Meeting Intelligence",
    slug: "meeting-intel",
    version: "1.9.2",
    description: "Transcription processing, summarization, action item extraction, and automated follow-up scheduling. Specialized modes for depositions, board meetings, and ops stand-ups.",
    domain: "Productivity",
    category: "Productivity",
    tags: ["meetings", "transcription", "action items", "follow-up"],
    rating: 4.5,
    ratingCount: 143,
    usageCount: 6200,
    activeUsers: 29,
    successRate: 96.8,
    avgLatencyMs: 960,
    isActivated: false,
    isPopular: false,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 14 * 86400000).toISOString(),
    capabilities: ["Transcription", "Summarization", "Action item extraction", "Auto-scheduling"],
  },
  {
    id: "sk_viz_engine",
    name: "AI Data Visualization",
    slug: "viz-engine",
    version: "2.1.0",
    description: "Natural language to interactive chart generation compatible with Recharts. Supports bar, line, scatter, heatmap, and geographic visualizations from any data source.",
    domain: "Analytics",
    category: "Data",
    tags: ["charts", "visualization", "recharts", "analytics"],
    rating: 4.6,
    ratingCount: 201,
    usageCount: 11300,
    activeUsers: 41,
    successRate: 97.9,
    avgLatencyMs: 820,
    isActivated: true,
    isPopular: false,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 6 * 86400000).toISOString(),
    capabilities: ["6 chart types", "Natural language queries", "Recharts-compatible", "Multi-source data"],
  },
  {
    id: "sk_video_engine",
    name: "AI Video Generation",
    slug: "video-engine",
    version: "1.3.0",
    description: "Agent-driven creation of summary videos, briefing clips, and data walkthroughs. Generates scripts, storyboards, and structured video specs from natural language.",
    domain: "Media",
    category: "Media",
    tags: ["video", "briefing", "storyboard", "media"],
    rating: 4.3,
    ratingCount: 98,
    usageCount: 3100,
    activeUsers: 18,
    successRate: 95.2,
    avgLatencyMs: 2100,
    isActivated: false,
    isPopular: false,
    isFeatured: false,
    publisher: "SZL Platform",
    lastUpdated: new Date(Date.now() - 20 * 86400000).toISOString(),
    capabilities: ["Script generation", "Storyboards", "Summary clips", "Data walkthroughs"],
  },
];

const ALL_DOMAINS = ["All", ...Array.from(new Set(DEMO_SKILLS.map(s => s.domain)))];
const ALL_CATEGORIES = ["All", "Content Generation", "Communication", "Data", "Productivity", "Analytics", "Intelligence", "Media", "Visual"];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
          />
        ))}
      </div>
      <span className="text-xs text-white/50">{rating.toFixed(1)} ({count})</span>
    </div>
  );
}

function SkillCard({ skill, onToggle }: { skill: SkillEntry; onToggle: (id: string, activate: boolean) => void }) {
  const DomainIcon = DOMAIN_ICONS[skill.domain] ?? Package;
  return (
    <div className={`relative rounded-xl border transition-all duration-200 hover:border-white/20 group ${
      skill.isActivated
        ? "border-violet-500/40 bg-violet-500/5"
        : "border-white/10 bg-white/[0.03]"
    }`}>
      {skill.isFeatured && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          <Award className="w-2.5 h-2.5" /> Featured
        </div>
      )}
      {skill.isPopular && !skill.isFeatured && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <TrendingUp className="w-2.5 h-2.5" /> Popular
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              skill.isActivated ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/40"
            }`}>
              <DomainIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white leading-tight">{skill.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-white/40">v{skill.version}</span>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/40">{skill.publisher}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggle(skill.id, !skill.isActivated)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              skill.isActivated
                ? "bg-violet-500/20 text-violet-400 hover:bg-red-500/20 hover:text-red-400"
                : "bg-white/5 text-white/50 hover:bg-violet-500/20 hover:text-violet-400"
            }`}
          >
            {skill.isActivated ? (
              <><Pause className="w-3 h-3" /> Deactivate</>
            ) : (
              <><Play className="w-3 h-3" /> Activate</>
            )}
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed mb-4 line-clamp-2">{skill.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {skill.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
              {tag}
            </span>
          ))}
          {skill.tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
              +{skill.tags.length - 3}
            </span>
          )}
        </div>

        <StarRating rating={skill.rating} count={skill.ratingCount} />

        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-sm font-semibold text-white">{skill.usageCount.toLocaleString()}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Total Uses</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-emerald-400">{skill.successRate.toFixed(1)}%</div>
            <div className="text-[10px] text-white/40 mt-0.5">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-blue-400">{skill.avgLatencyMs}ms</div>
            <div className="text-[10px] text-white/40 mt-0.5">Avg Latency</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="text-[10px] text-white/40 mb-2">Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {skill.capabilities.slice(0, 3).map(cap => (
              <span key={cap} className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                <CheckCircle className="w-2.5 h-2.5" />{cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkillsMarketplace() {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "usage">("popular");
  const [skills, setSkills] = useState<SkillEntry[]>(DEMO_SKILLS);

  const stats: MarketplaceStats = useMemo(() => ({
    totalSkills: skills.length,
    activatedSkills: skills.filter(s => s.isActivated).length,
    totalInvocations: skills.reduce((acc, s) => acc + s.usageCount, 0),
    topDomains: ["Data", "Documents", "Intelligence"],
  }), [skills]);

  const filteredSkills = useMemo(() => {
    let result = [...skills];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }
    if (selectedDomain !== "All") result = result.filter(s => s.domain === selectedDomain);
    if (selectedCategory !== "All") result = result.filter(s => s.category === selectedCategory);
    if (showActivatedOnly) result = result.filter(s => s.isActivated);

    result.sort((a, b) => {
      switch (sortBy) {
        case "popular": return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || b.usageCount - a.usageCount;
        case "rating": return b.rating - a.rating;
        case "usage": return b.usageCount - a.usageCount;
        case "newest": return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default: return 0;
      }
    });
    return result;
  }, [skills, search, selectedDomain, selectedCategory, showActivatedOnly, sortBy]);

  function toggleSkill(id: string, activate: boolean) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, isActivated: activate } : s));
  }

  const featured = skills.filter(s => s.isFeatured);

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Skills Marketplace</h1>
            </div>
            <p className="text-sm text-white/50 ml-13">Discover, activate, and manage AI skills across the SZL platform ecosystem</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              {stats.activatedSkills} Active Skills
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Skills", value: stats.totalSkills, icon: Package, color: "text-violet-400" },
            { label: "Activated", value: stats.activatedSkills, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Total Invocations", value: stats.totalInvocations.toLocaleString(), icon: TrendingUp, color: "text-blue-400" },
            { label: "Avg Success Rate", value: `${(DEMO_SKILLS.reduce((a, s) => a + s.successRate, 0) / DEMO_SKILLS.length).toFixed(1)}%`, icon: BarChart2, color: "text-amber-400" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-white/50">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {featured.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white/80">Featured Skills</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {featured.map(skill => (
                <div key={skill.id} className="flex-shrink-0 w-64 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {DOMAIN_ICONS[skill.domain] && (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        {(() => {
                          const Icon = DOMAIN_ICONS[skill.domain]!;
                          return <Icon className="w-4 h-4 text-amber-400" />;
                        })()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-white">{skill.name}</div>
                      <StarRating rating={skill.rating} count={skill.ratingCount} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mb-3">{skill.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{skill.usageCount.toLocaleString()} uses</span>
                    <button
                      onClick={() => toggleSkill(skill.id, !skill.isActivated)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                        skill.isActivated
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      }`}
                    >
                      {skill.isActivated ? "Activated" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
              placeholder="Search skills by name, tag, or capability..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50"
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
          >
            {ALL_DOMAINS.map(d => <option key={d} value={d} className="bg-[#0f1623]">{d}</option>)}
          </select>

          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {ALL_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f1623]">{c}</option>)}
          </select>

          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="popular" className="bg-[#0f1623]">Sort: Popular</option>
            <option value="rating" className="bg-[#0f1623]">Sort: Rating</option>
            <option value="usage" className="bg-[#0f1623]">Sort: Most Used</option>
            <option value="newest" className="bg-[#0f1623]">Sort: Newest</option>
          </select>

          <button
            onClick={() => setShowActivatedOnly(!showActivatedOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              showActivatedOnly
                ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Active Only
          </button>
        </div>

        <div className="text-xs text-white/40 mb-4">
          {filteredSkills.length} skill{filteredSkills.length !== 1 ? "s" : ""} found
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} onToggle={toggleSkill} />
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <div className="text-white/40 text-sm">No skills match your filters</div>
            <button
              onClick={() => { setSearch(""); setSelectedDomain("All"); setSelectedCategory("All"); setShowActivatedOnly(false); }}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
