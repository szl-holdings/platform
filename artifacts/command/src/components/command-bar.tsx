import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { getDomainColor, getSeverityColor } from "../lib/utils";

interface SearchResult {
  type: string;
  domain: string;
  title: string;
  detail: string;
  severity?: string;
}

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/command/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) {
        const body = await res.json();
        setResults(body.results ?? []);
        setSelected(0);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, results.length]);

  if (!open) return null;

  const typeLabel: Record<string, string> = { event: "Event", intelligence: "Intel", domain: "Domain" };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-surface-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-surface-border)" }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--color-fg-muted)" }} />
          ) : (
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--color-fg-muted)" }} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, alerts, domains, intelligence..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-fg-primary)" }}
          />
          <button onClick={onClose} style={{ color: "var(--color-fg-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {results.length === 0 && query.trim() && !loading && (
          <div className="p-6 text-center text-sm" style={{ color: "var(--color-fg-muted)" }}>
            No results for "{query}"
          </div>
        )}

        {results.length === 0 && !query.trim() && (
          <div className="p-6 text-center text-xs font-mono uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>
            Type to search across all domains
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: i === selected ? "var(--color-surface-base)" : "transparent",
                  borderBottom: "1px solid var(--color-surface-border)",
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: getDomainColor(result.domain),
                        backgroundColor: `color-mix(in srgb, ${getDomainColor(result.domain)} 12%, transparent)`,
                      }}
                    >
                      {result.domain}
                    </span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: "var(--color-fg-muted)" }}
                    >
                      {typeLabel[result.type] ?? result.type}
                    </span>
                    {result.severity && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: getSeverityColor(result.severity) }}
                      >
                        {result.severity}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-fg-primary)" }}>
                    {result.title}
                  </span>
                  <span className="text-xs truncate" style={{ color: "var(--color-fg-muted)" }}>
                    {result.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="px-4 py-2 flex items-center gap-4 text-[10px] font-mono"
          style={{
            borderTop: "1px solid var(--color-surface-border)",
            color: "var(--color-fg-muted)",
          }}
        >
          <span>↑↓ navigate</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
