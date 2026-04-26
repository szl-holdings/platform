import React, { useCallback, useEffect, useRef, useState } from 'react';
import { typography } from './tokens';

export interface UniversalSearchResult {
  id: string;
  type: 'navigation' | 'alert' | 'contact' | 'report' | 'page' | 'entity' | 'setting';
  domain: string;
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  meta?: Record<string, string>;
  score: number;
}

interface UniversalSearchProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (href: string) => void;
  apiBase?: string;
  accentColor?: string;
  appName?: string;
}

const RECENT_SEARCHES_KEY = 'szl_universal_search_recent_v1';
const MAX_RECENT = 8;

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  navigation: { label: 'Navigate', color: '#8b7ac8' },
  alert: { label: 'Alerts', color: '#f59e0b' },
  contact: { label: 'Contacts', color: '#3b82f6' },
  report: { label: 'Reports', color: '#10b981' },
  page: { label: 'Pages', color: '#ec4899' },
  entity: { label: 'Entities', color: '#6366f1' },
  setting: { label: 'Settings', color: '#64748b' },
};

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function recordSearch(query: string) {
  try {
    const q = query.trim();
    if (!q || q.length < 2) return;
    const prev = getRecentSearches().filter((x) => x !== q);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}
}

function formatMeta(result: UniversalSearchResult): string {
  if (result.meta?.status) {
    return result.meta.status.replace(/_/g, ' ');
  }
  if (result.meta?.severity) {
    return result.meta.severity;
  }
  return result.domain;
}

export function UniversalSearch({
  open,
  onClose,
  onNavigate,
  apiBase = '/api',
  accentColor = '#8b7ac8',
  appName,
}: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setHasSearched(false);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const doSearch = useCallback(
    async (q: string) => {
      if (abortRef.current) abortRef.current.abort();
      if (!q.trim() || q.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        setHasSearched(false);
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const res = await fetch(
          `${apiBase}/universal-search?q=${encodeURIComponent(q.trim())}&limit=20`,
          { credentials: 'include', signal: controller.signal },
        );
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        const data = json?.data ?? json;
        setResults(data.results ?? []);
        setSelectedIndex(0);
        setHasSearched(true);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const executeResult = useCallback(
    (result: UniversalSearchResult) => {
      recordSearch(query);
      if (result.href) {
        if (onNavigate) {
          onNavigate(result.href);
        } else {
          window.location.href = result.href;
        }
      }
      onClose();
    },
    [query, onNavigate, onClose],
  );

  const runSelected = useCallback(() => {
    const result = results[selectedIndex];
    if (result) executeResult(result);
  }, [results, selectedIndex, executeResult]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        runSelected();
        return;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, runSelected, results.length, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const grouped = new Map<string, UniversalSearchResult[]>();
  for (const r of results) {
    const key = r.type;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  let flatIndex = 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        fontFamily: typography.fontFamily.body,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '680px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8, 10, 18, 0.98)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow:
            '0 0 0 1px rgba(255, 255, 255, 0.04), 0 32px 100px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'szl-search-entrance 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes szl-search-entrance {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .szl-search-input::placeholder {
            color: rgba(255, 255, 255, 0.28);
          }
          .szl-search-result:hover {
            background: rgba(255, 255, 255, 0.04) !important;
          }
          .szl-search-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .szl-search-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .szl-search-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 3px;
          }
          .szl-search-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        `}</style>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            style={{ flexShrink: 0, opacity: 0.4 }}
          >
            <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
            <line
              x1="12"
              y1="12"
              x2="16"
              y2="16"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            className="szl-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything across the platform..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'rgba(255, 255, 255, 0.92)',
              fontSize: '16px',
              fontWeight: 400,
              fontFamily: typography.fontFamily.body,
              letterSpacing: '-0.01em',
            }}
          />
          {isLoading && (
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: accentColor,
                borderRadius: '50%',
                animation: 'szl-search-spin 0.6s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
          {appName && (
            <span
              style={{
                fontSize: '10px',
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
                borderRadius: '8px',
                padding: '3px 10px',
                fontWeight: 600,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                flexShrink: 0,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              {appName}
            </span>
          )}
          <div
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily: typography.fontFamily.mono,
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            ESC
          </div>
        </div>

        <style>{`
          @keyframes szl-search-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div ref={listRef} className="szl-search-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
          {!query.trim() && recentSearches.length > 0 && (
            <div>
              <div
                style={{
                  padding: '14px 20px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Recent searches
                </span>
                <span
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </span>
              </div>
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className="szl-search-result"
                  onClick={() => {
                    setQuery(term);
                    doSearch(term);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ flexShrink: 0, opacity: 0.25 }}
                  >
                    <path
                      d="M7 1.5V7L9.5 9.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    {term}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{ flexShrink: 0, opacity: 0.2, marginLeft: 'auto' }}
                  >
                    <path
                      d="M4 2L8.5 6L4 10"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}

          {!query.trim() && recentSearches.length === 0 && (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                style={{ margin: '0 auto 12px', opacity: 0.4 }}
              >
                <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2" />
                <line
                  x1="21"
                  y1="21"
                  x2="28"
                  y2="28"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                Search across the entire platform
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>
                Find pages, alerts, contacts, reports, and more
              </div>
            </div>
          )}

          {hasSearched && results.length === 0 && (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                No results for "{query}"
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.7 }}>
                Try a different search term or browse using the navigation
              </div>
            </div>
          )}

          {results.length > 0 &&
            Array.from(grouped.entries()).map(([type, items]) => {
              const config = TYPE_CONFIG[type] || { label: type, color: '#888' };
              return (
                <div key={type}>
                  <div
                    style={{
                      padding: '14px 20px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: config.color,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        flexShrink: 0,
                      }}
                    />
                    {config.label}
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.2)',
                        fontWeight: 400,
                        marginLeft: '4px',
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  {items.map((result) => {
                    const idx = flatIndex++;
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={result.id}
                        data-idx={idx}
                        className="szl-search-result"
                        onClick={() => executeResult(result)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '10px 20px',
                          cursor: 'pointer',
                          background: isSelected ? `${accentColor}10` : 'transparent',
                          borderLeft: isSelected
                            ? `2px solid ${accentColor}`
                            : '2px solid transparent',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            flexShrink: 0,
                            width: '24px',
                            textAlign: 'center',
                            filter: isSelected ? 'none' : 'grayscale(0.5)',
                            opacity: isSelected ? 1 : 0.65,
                          }}
                        >
                          {result.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: isSelected
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(255, 255, 255, 0.75)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {result.title}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: isSelected
                                ? 'rgba(255, 255, 255, 0.4)'
                                : 'rgba(255, 255, 255, 0.28)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {result.subtitle}
                          </div>
                        </div>
                        {result.meta && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: config.color,
                              background: `${config.color}12`,
                              border: `1px solid ${config.color}25`,
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontWeight: 500,
                              flexShrink: 0,
                              textTransform: 'capitalize',
                              fontFamily: typography.fontFamily.mono,
                            }}
                          >
                            {formatMeta(result)}
                          </span>
                        )}
                        {isSelected && result.href && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            style={{
                              flexShrink: 0,
                              opacity: 0.4,
                            }}
                          >
                            <path
                              d="M2 6H10M7 3L10 6L7 9"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {[
            { key: '↑↓', label: 'navigate' },
            { key: '↵', label: 'open' },
            { key: 'esc', label: 'close' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '5px',
                  padding: '2px 7px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.35)',
                  fontFamily: typography.fontFamily.mono,
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)' }}>{label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {results.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.18)',
                fontFamily: typography.fontFamily.mono,
              }}
            >
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function useUniversalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen, toggle: () => setOpen((v) => !v) };
}
