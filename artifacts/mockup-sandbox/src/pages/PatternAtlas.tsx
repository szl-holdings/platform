import { AlertCircle, ChevronRight, GitBranch, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { nexusApi } from '../lib/api';
import type { PatternFamily } from '../lib/types';

const FAMILY_COLORS = [
  '#00d4ff',
  '#a855f7',
  '#00ff88',
  '#ffb700',
  '#f472b6',
  '#22d3ee',
  '#fb923c',
  '#34d399',
  '#818cf8',
  '#e879f9',
];

export default function PatternAtlas() {
  const [patterns, setPatterns] = useState<PatternFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PatternFamily | null>(null);

  useEffect(() => {
    nexusApi
      .listPatterns()
      .then((data) => {
        setPatterns(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="w-5 h-5 text-nexus-green" />
          <div>
            <h1 className="text-lg font-semibold">Pattern Atlas</h1>
            <p className="text-xs text-muted-foreground">
              {patterns.length} pattern families absorbed from public repositories
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {patterns.map((family, i) => {
            const color = FAMILY_COLORS[i % FAMILY_COLORS.length];
            const isSelected = selected?.id === family.id;
            return (
              <div
                key={family.id}
                className="rounded-xl border cursor-pointer transition-all overflow-hidden"
                style={{
                  borderColor: isSelected ? color : '#1a2535',
                  background: isSelected
                    ? `linear-gradient(135deg, ${color}08 0%, transparent 60%)`
                    : 'transparent',
                  backgroundColor: isSelected ? undefined : '#0d1520',
                }}
                onClick={() => setSelected(isSelected ? null : family)}
              >
                <div className="flex items-start gap-4 px-5 py-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    {family.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? color : undefined }}
                      >
                        {family.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: `${color}15` }}
                        >
                          {family.skills} skills
                        </span>
                        <ChevronRight
                          className="w-3.5 h-3.5 transition-transform"
                          style={{
                            color,
                            transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {family.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {family.repos.map((repo) => (
                        <span
                          key={repo}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-nexus-bg border border-nexus text-muted-foreground/50"
                        >
                          {repo}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-5 pb-4 pt-2 border-t" style={{ borderColor: `${color}20` }}>
                    <div
                      className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                      style={{ color }}
                    >
                      What NEXUS does natively from this pattern
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {family.nexusCapability}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {patterns.length === 0 && !error && (
          <div className="text-center py-16 text-muted-foreground/40">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No pattern families indexed yet.</p>
            <p className="text-xs mt-1">Run an Ingest job to populate the Pattern Atlas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
