import { useState, useEffect, useCallback } from "react";
import { nexusApi } from "../lib/api";
import type { Skill } from "../lib/types";
import {
  Layers,
  Search,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Tag,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  GitFork,
  Zap,
} from "lucide-react";

const PRIMITIVE_COLORS: Record<string, string> = {
  Skill: "#00d4ff",
  Hook: "#a855f7",
  Command: "#ffb700",
  Agent: "#00ff88",
  MemorySchema: "#f472b6",
  RAGStrategy: "#22d3ee",
  Tool: "#fb923c",
};

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanding, setExpanding] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await nexusApi.listSkills({
        search: search || undefined,
        enabled:
          enabledFilter === "enabled"
            ? true
            : enabledFilter === "disabled"
            ? false
            : undefined,
      });
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, [search, enabledFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSkills();
  }, [fetchSkills]);

  async function handleToggle(skill: Skill) {
    try {
      const updated = await nexusApi.toggleSkill(skill.id, !skill.enabled);
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? updated : s)));
    } catch {}
  }

  const enabledCount = skills.filter((s) => s.enabled).length;

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-5 h-5 text-nexus-cyan" />
          <div>
            <h1 className="text-lg font-semibold">Skills Library</h1>
            <p className="text-xs text-muted-foreground">
              Adapted from 20+ public repos · Native NEXUS primitives · {enabledCount} enabled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="search"
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00d4ff]/30 placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="flex rounded-lg border border-nexus overflow-hidden text-xs">
            {(["all", "enabled", "disabled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEnabledFilter(f)}
                className={`px-3 py-2 transition-colors capitalize ${
                  enabledFilter === f
                    ? "bg-[#00d4ff]/10 text-nexus-cyan"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={handleToggle}
                expanded={expanding === skill.id}
                onExpand={() =>
                  setExpanding((e) => (e === skill.id ? null : skill.id))
                }
              />
            ))}
            {skills.length === 0 && (
              <div className="text-center py-16 text-muted-foreground/40">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No skills match your filters.</p>
                <p className="text-xs mt-1">Try running an Ingest job to populate the Skills Library.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillCard({
  skill,
  onToggle,
  expanded,
  onExpand,
}: {
  skill: Skill;
  onToggle: (s: Skill) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const primColor = PRIMITIVE_COLORS[skill.primitiveType] ?? "#00d4ff";

  return (
    <div className={`bg-nexus-surface border rounded-lg overflow-hidden transition-all ${
      skill.enabled ? "border-[#00d4ff]/20" : "border-nexus"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold">{skill.name}</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: primColor,
                  backgroundColor: `${primColor}15`,
                  border: `1px solid ${primColor}30`,
                }}
              >
                {skill.primitiveType}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg border border-nexus text-muted-foreground/50 font-mono">
                {skill.license}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
              <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 flex items-center gap-1">
                <GitFork className="w-2.5 h-2.5" />
                {skill.sourceRepo}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          {skill.usageCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
              <Zap className="w-3 h-3" />
              {skill.usageCount}
            </div>
          )}
          <button
            onClick={() => onToggle(skill)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              skill.enabled ? "text-nexus-cyan" : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            {skill.enabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-nexus space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                Original ({skill.sourceRepo})
              </h4>
              <div className="bg-nexus-bg rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                {skill.originalSummary}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-mono text-[#00d4ff]/70 uppercase tracking-widest mb-1.5">
                NEXUS Adaptation
              </h4>
              <div
                className="bg-nexus-bg rounded-lg p-3 text-xs leading-relaxed"
                style={{ color: "#c8d8e8" }}
              >
                {skill.nexusAdaptation}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg border border-nexus text-muted-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/40 font-mono">pattern: {skill.pattern}</span>
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-nexus-cyan hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
