import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ExternalLink, FileText, Loader, ShieldOff } from 'lucide-react';

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface PromptSummary {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  routeClass?: string;
  activeVersion?: number | null;
  versionCount?: number;
  status?: string;
  lastEvalScore?: number | null;
  lastEvalPassRate?: number | null;
  tags?: string[];
  updatedAt?: string;
}

export function PromptRegistryNative() {
  const [prompts, setPrompts] = useState<PromptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authBlocked, setAuthBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAuthBlocked(false);

    fetch('/api/ai/prompts')
      .then(async (resp) => {
        if (resp.status === 401 || resp.status === 403) {
          if (!cancelled) setAuthBlocked(true);
          return null;
        }
        if (!resp.ok) throw new Error(`Prompts endpoint returned ${resp.status}`);
        return resp.json() as Promise<{ data?: PromptSummary[] } | PromptSummary[]>;
      })
      .then((body) => {
        if (cancelled || !body) return;
        const list = Array.isArray(body) ? body : (body.data ?? []);
        setPrompts(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load prompts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
        <span className="text-xs text-[var(--color-a11oy-text)]">Prompt Registry</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] flex items-center gap-3">
            <FileText className="w-6 h-6 text-[var(--color-a11oy-gold)]" />
            Prompt Registry
          </h1>
          <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
            Versioned, content-addressed prompts. Promote winners, retire stragglers — every change
            is governed and traceable.
          </p>
        </div>
        <a
          href="/nexus/#prompt-registry"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono px-3 py-2 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-gold)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors flex items-center gap-1.5"
        >
          Open in Praxis
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-[var(--color-a11oy-text-ghost)]">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="ml-2 text-sm">Loading prompts…</span>
        </div>
      )}

      {authBlocked && !loading && (
        <div className="rounded-xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] p-6">
          <div className="flex items-start gap-3">
            <ShieldOff className="w-4 h-4 text-[var(--color-a11oy-gold)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-a11oy-text)]">
                Prompt registry requires authentication
              </p>
              <p className="text-xs text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed">
                The registry sits behind A11oy's session-auth gate. Sign in to view prompts and
                promote versions, or open the deep Praxis console to browse with admin credentials.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !loading && !authBlocked && (
        <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 text-sm text-[var(--color-a11oy-text-sub)]">
          <p className="text-[var(--color-a11oy-text)] font-medium mb-1">Prompts unavailable</p>
          <p className="text-[var(--color-a11oy-text-ghost)] text-xs">{error}</p>
        </div>
      )}

      {!loading && !error && !authBlocked && (
        <>
          {prompts.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 text-sm text-[var(--color-a11oy-text-sub)]">
              No prompts registered yet.
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-4 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--color-a11oy-text)]">
                        {p.name}
                      </p>
                      {p.status && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)] uppercase">
                          {p.status}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-[var(--color-a11oy-text-sub)] mt-1 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                      {p.domain && <span>domain: {p.domain}</span>}
                      {p.routeClass && <span>route: {p.routeClass}</span>}
                      {p.activeVersion != null && (
                        <span>v{p.activeVersion} of {p.versionCount}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {p.lastEvalScore != null && (
                      <p className="text-base font-semibold text-[var(--color-a11oy-gold)]">
                        {(p.lastEvalScore * 100).toFixed(0)}%
                      </p>
                    )}
                    {p.lastEvalPassRate != null && (
                      <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                        pass {(p.lastEvalPassRate * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
