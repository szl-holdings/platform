import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ExternalLink, Loader, Search, ShieldOff } from 'lucide-react';

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface Pattern {
  id: string;
  name: string;
  description: string;
  icon?: string;
  repos?: string[];
  nexusCapability?: string;
  skills?: number;
}

export function PatternAtlasNative() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authBlocked, setAuthBlocked] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAuthBlocked(false);

    fetch('/api/nexus/patterns')
      .then(async (resp) => {
        if (resp.status === 401 || resp.status === 403) {
          if (!cancelled) setAuthBlocked(true);
          return null;
        }
        if (!resp.ok) throw new Error(`Patterns endpoint returned ${resp.status}`);
        return resp.json() as Promise<{ data?: Pattern[] } | Pattern[]>;
      })
      .then((body) => {
        if (cancelled || !body) return;
        const list = Array.isArray(body) ? body : (body.data ?? []);
        setPatterns(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load patterns');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = patterns.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.nexusCapability ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`${base}/lab`}
          className="flex items-center gap-1 text-xs text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Lab
        </Link>
        <span className="text-[var(--color-a11oy-border)]">/</span>
        <span className="text-xs text-[var(--color-a11oy-text)]">Pattern Atlas</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)]">Pattern Atlas</h1>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
            Curated catalog of governed pattern families — the language A11oy speaks. Each pattern
            has a nexus capability, source repos, and a skill count.
          </p>
        </div>
        <a
          href="/nexus/#patterns"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono px-3 py-2 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-gold)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors flex items-center gap-1.5"
        >
          Open in Praxis
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-a11oy-text-ghost)]" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter patterns by name, description, or capability…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] text-sm text-[var(--color-a11oy-text)] placeholder:text-[var(--color-a11oy-text-ghost)] focus:outline-none focus:ring-2 focus:ring-[var(--color-a11oy-gold-dim)]"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-[var(--color-a11oy-text-ghost)]">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="ml-2 text-sm">Loading patterns…</span>
        </div>
      )}

      {authBlocked && !loading && (
        <div className="rounded-xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] p-6">
          <div className="flex items-start gap-3">
            <ShieldOff className="w-4 h-4 text-[var(--color-a11oy-gold)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-a11oy-text)]">
                Pattern atlas requires authentication
              </p>
              <p className="text-xs text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed">
                Sign in to view governed patterns, or open the deep Praxis console.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !loading && !authBlocked && (
        <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 text-sm text-[var(--color-a11oy-text-sub)]">
          <p className="text-[var(--color-a11oy-text)] font-medium mb-1">Patterns unavailable</p>
          <p className="text-[var(--color-a11oy-text-ghost)] text-xs">{error}</p>
        </div>
      )}

      {!loading && !error && !authBlocked && (
        <>
          <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
            {filtered.length} of {patterns.length} patterns
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold text-[var(--color-a11oy-text)]">{p.name}</p>
                  {typeof p.skills === 'number' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]">
                      {p.skills} skills
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-a11oy-text-sub)] leading-relaxed line-clamp-3">
                  {p.description}
                </p>
                {p.nexusCapability && (
                  <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)] mt-3">
                    cap: <span className="text-[var(--color-a11oy-gold)]">{p.nexusCapability}</span>
                  </p>
                )}
                {p.repos && p.repos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.repos.slice(0, 3).map((r) => (
                      <span
                        key={r}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
