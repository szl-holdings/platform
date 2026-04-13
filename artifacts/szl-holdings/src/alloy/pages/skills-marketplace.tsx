import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Store, Search, Star, TrendingUp, Filter, Zap, CheckCircle, XCircle,
  ChevronRight, BarChart2, Users, Clock, Tag, Shield, Brain,
  MessageSquare, FileText, Globe, Database, Layers, Activity,
  Eye, Play, Pause, ArrowUpRight, Sparkles, Award, Package,
  Loader2, RefreshCw,
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
  updatedAt: string;
  capabilities: string[];
}

interface MarketplaceStats {
  totalSkills: number;
  activatedSkills: number;
  totalInvocations: number;
  userActivations: number;
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

function SkillCard({ skill, onToggle, isToggling }: {
  skill: SkillEntry;
  onToggle: (id: string, activate: boolean) => void;
  isToggling: boolean;
}) {
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
            disabled={isToggling}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
              skill.isActivated
                ? "bg-violet-500/20 text-violet-400 hover:bg-red-500/20 hover:text-red-400"
                : "bg-white/5 text-white/50 hover:bg-violet-500/20 hover:text-violet-400"
            }`}
          >
            {isToggling
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : skill.isActivated
                ? <><Pause className="w-3 h-3" /> Deactivate</>
                : <><Play className="w-3 h-3" /> Activate</>}
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
            <div className="text-sm font-semibold text-emerald-400">{(skill.successRate ?? 0).toFixed(1)}%</div>
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
            {(skill.capabilities ?? []).slice(0, 3).map(cap => (
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
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showActivatedOnly, setShowActivatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "usage">("popular");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const listingsQuery = useQuery({
    queryKey: ["marketplace-skills", search, selectedDomain, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams({ kind: "skill" });
      if (selectedDomain !== "All") params.set("domain", selectedDomain);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (search) params.set("search", search);
      return apiFetch<{ skills: SkillEntry[] }>(`/api/marketplace/listings?${params.toString()}`);
    },
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ["marketplace-stats-skills"],
    queryFn: () => apiFetch<{ totalSkills: number; userActivations: number; totalUsage: number }>("/api/marketplace/stats"),
    staleTime: 60_000,
  });

  const activateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ isActivated: boolean }>(`/api/marketplace/listings/${id}/activate`, { method: "POST", body: JSON.stringify({}) }),
    onMutate: ({ id }) => setTogglingIds(prev => new Set([...prev, id])),
    onSettled: (_, __, { id }) => {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      qc.invalidateQueries({ queryKey: ["marketplace-skills"] });
      qc.invalidateQueries({ queryKey: ["marketplace-stats-skills"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ isActivated: boolean }>(`/api/marketplace/listings/${id}/activate`, { method: "DELETE" }),
    onMutate: ({ id }) => setTogglingIds(prev => new Set([...prev, id])),
    onSettled: (_, __, { id }) => {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      qc.invalidateQueries({ queryKey: ["marketplace-skills"] });
      qc.invalidateQueries({ queryKey: ["marketplace-stats-skills"] });
    },
  });

  function toggleSkill(id: string, activate: boolean) {
    if (activate) {
      activateMutation.mutate({ id });
    } else {
      deactivateMutation.mutate({ id });
    }
  }

  const skills: SkillEntry[] = listingsQuery.data?.skills ?? [];

  const allDomains = useMemo(() => ["All", ...Array.from(new Set(skills.map(s => s.domain)))], [skills]);
  const allCategories = useMemo(() => ["All", ...Array.from(new Set(skills.map(s => s.category)))], [skills]);

  const filteredSkills = useMemo(() => {
    let result = [...skills];
    if (showActivatedOnly) result = result.filter(s => s.isActivated);
    result.sort((a, b) => {
      switch (sortBy) {
        case "popular": return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || b.usageCount - a.usageCount;
        case "rating": return b.rating - a.rating;
        case "usage": return b.usageCount - a.usageCount;
        case "newest": return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
        default: return 0;
      }
    });
    return result;
  }, [skills, showActivatedOnly, sortBy]);

  const featured = skills.filter(s => s.isFeatured);
  const activatedCount = skills.filter(s => s.isActivated).length;
  const totalInvocations = statsQuery.data?.totalUsage ?? skills.reduce((acc, s) => acc + (s.usageCount ?? 0), 0);
  const avgSuccessRate = skills.length
    ? skills.reduce((a, s) => a + (s.successRate ?? 0), 0) / skills.length
    : 0;

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
              {listingsQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
            </div>
            <p className="text-sm text-white/50 ml-13">Discover, activate, and manage AI skills across the SZL platform ecosystem</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { qc.invalidateQueries({ queryKey: ["marketplace-skills"] }); qc.invalidateQueries({ queryKey: ["marketplace-stats-skills"] }); }}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/70 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              {activatedCount} Active Skills
            </div>
          </div>
        </div>

        {listingsQuery.error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            Failed to load skills: {(listingsQuery.error as Error).message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Skills", value: statsQuery.data?.totalSkills ?? skills.length, icon: Package, color: "text-violet-400" },
            { label: "Activated", value: activatedCount, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Total Invocations", value: totalInvocations.toLocaleString(), icon: TrendingUp, color: "text-blue-400" },
            { label: "Avg Success Rate", value: `${avgSuccessRate.toFixed(1)}%`, icon: BarChart2, color: "text-amber-400" },
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
                      disabled={togglingIds.has(skill.id)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 ${
                        skill.isActivated
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      }`}
                    >
                      {togglingIds.has(skill.id) ? "..." : skill.isActivated ? "Activated" : "Activate"}
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
            {allDomains.map(d => <option key={d} value={d} className="bg-[#0f1623]">{d}</option>)}
          </select>

          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {allCategories.map(c => <option key={c} value={c} className="bg-[#0f1623]">{c}</option>)}
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
          {listingsQuery.isPending ? "Loading…" : `${filteredSkills.length} skill${filteredSkills.length !== 1 ? "s" : ""} found`}
        </div>

        {listingsQuery.isPending ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={toggleSkill}
                isToggling={togglingIds.has(skill.id)}
              />
            ))}
          </div>
        )}

        {!listingsQuery.isPending && filteredSkills.length === 0 && (
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
