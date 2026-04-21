import { Archive, Bookmark, Calendar, Check, ChevronRight, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import ConfidenceChip from '../components/ConfidenceChip';
import { LibrarySkeleton } from '../components/SkeletonRow';
import {
  isDemoMode,
  useApproveBriefing,
  useArchiveBriefing,
  useBriefingSearch,
  useBriefings,
  useSaveBriefing,
  useSavedBriefingIds,
  useUnsaveBriefing,
} from '../lib/api';
import { PULSE_SYNTHESIZED_LABEL } from '../lib/claims';
import { type DomainKey, getRiskColor, type RiskLevel } from '../lib/data';
import { getSavedBriefIds, toggleSavedBrief } from '../lib/saved-briefs';

type RiskFilter = RiskLevel | 'all';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/pulse';

const DOMAIN_OPTIONS: { value: DomainKey | 'all'; label: string }[] = [
  { value: 'all', label: 'All Domains' },
  { value: 'maritime', label: 'Maritime' },
  { value: 'security', label: 'Security' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financial' },
  { value: 'platform', label: 'Platform' },
];

const SEARCH_DEBOUNCE_MS = 350;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Library() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<DomainKey | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [savedOnly, setSavedOnly] = useState(false);

  const { data: serverSavedIds } = useSavedBriefingIds();
  const saveMut = useSaveBriefing();
  const unsaveMut = useUnsaveBriefing();

  // Optimistic local state (localStorage) — provides instant UI feedback.
  // When the server query resolves, it becomes the source of truth.
  const [localIds, setLocalIds] = useState<Set<string>>(() => getSavedBriefIds());
  const savedIds: Set<string> = serverSavedIds != null
    ? new Set(serverSavedIds)
    : localIds;

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isSaved = savedIds.has(id);
    // Optimistic local update (immediate feedback while server round-trips)
    toggleSavedBrief(id);
    setLocalIds(getSavedBriefIds());
    // Persist to backend
    if (isSaved) {
      unsaveMut.mutate(id);
    } else {
      saveMut.mutate(id);
    }
  };

  const debouncedSearch = useDebounced(search.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = debouncedSearch.length > 0;

  const listQuery = useBriefings(
    isSearching ? undefined : { domain: domainFilter, risk: riskFilter },
  );
  const searchQuery = useBriefingSearch(debouncedSearch);

  const allBriefings = isSearching ? (searchQuery.data?.briefings ?? []) : (listQuery.data ?? []);

  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading;
  const error = isSearching ? searchQuery.error : listQuery.error;

  const filtered = (
    isSearching
      ? allBriefings
      : allBriefings.filter((b) => {
          if (domainFilter !== 'all' && !b.domains.includes(domainFilter)) return false;
          if (riskFilter !== 'all' && b.overallRisk !== riskFilter) return false;
          return true;
        })
  ).filter((b) => (savedOnly ? savedIds.has(b.id) : true));

  const approveMut = useApproveBriefing();
  const archiveMut = useArchiveBriefing();

  const totalLabel = isSearching
    ? `${searchQuery.data?.total ?? 0} results across all briefings`
    : `${listQuery.data?.length ?? 0} briefings · searchable archive of all AI-generated intelligence products`;

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 600,
            color: 'var(--pulse-text)',
            marginBottom: 6,
          }}
        >
          Briefing Library
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)' }}>{totalLabel}</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            background: 'var(--pulse-card)',
            border: '1px solid var(--pulse-border)',
            borderRadius: 6,
          }}
        >
          <Search size={14} color="var(--pulse-text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all briefings — titles, body, entities, citations…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--pulse-text)',
              fontSize: '0.85rem',
            }}
          />
          {isSearching && search !== debouncedSearch && (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--pulse-gold)',
                opacity: 0.7,
                flexShrink: 0,
              }}
            />
          )}
        </div>
        {!isSearching && (
          <>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as DomainKey | 'all')}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'var(--pulse-card)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {DOMAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'var(--pulse-card)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button
              onClick={() => setSavedOnly(!savedOnly)}
              title={savedOnly ? 'Show all briefings' : 'Show saved briefings only'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                borderRadius: 6,
                background: savedOnly ? 'rgba(200,168,75,0.12)' : 'var(--pulse-card)',
                border: savedOnly ? '1px solid rgba(200,168,75,0.4)' : '1px solid var(--pulse-border)',
                color: savedOnly ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: savedOnly ? 600 : 400,
              }}
            >
              <Bookmark size={13} style={{ fill: savedOnly ? 'currentColor' : 'none' }} />
              {savedOnly ? 'Saved' : 'Saved'}
              {savedIds.size > 0 && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: 8,
                  background: savedOnly ? 'rgba(200,168,75,0.2)' : 'rgba(255,255,255,0.06)',
                  color: savedOnly ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)',
                }}>
                  {savedIds.size}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Results count */}
      <div style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)', marginBottom: 12 }}>
        {isLoading
          ? isSearching
            ? `Searching across all briefings for "${debouncedSearch}"…`
            : 'Loading briefings…'
          : error
            ? `Error: ${error instanceof Error ? error.message : 'failed to load'}`
            : isSearching
              ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} for "${debouncedSearch}"`
              : `Showing ${filtered.length} of ${allBriefings.length} briefings`}
      </div>

      {/* Briefing list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <LibrarySkeleton />}
        {filtered.map((briefing, i) => (
          <Link key={briefing.id} href={`${BASE}/library/${briefing.id}`}>
            <a style={{ textDecoration: 'none' }}>
              <div
                className="section-card animate-fadeIn"
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  animationDelay: `${i * 0.03}s`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--pulse-border-bright)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--pulse-border)')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.67rem',
                          color: 'var(--pulse-text-muted)',
                        }}
                      >
                        <Calendar size={11} />
                        <span>
                          {new Date(briefing.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          background: 'var(--pulse-border-bright)',
                        }}
                      />
                      <span style={{ fontSize: '0.67rem', color: 'var(--pulse-text-muted)' }}>
                        {briefing.edition}
                      </span>
                      <div
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          background: 'var(--pulse-border-bright)',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.67rem',
                        }}
                      >
                        <Shield size={10} color="var(--pulse-gold-dim)" />
                        <span style={{ color: 'var(--pulse-gold-dim)' }}>
                          {briefing.classification}
                        </span>
                      </div>
                      {isDemoMode() && (
                        <>
                          <div
                            style={{
                              width: 3,
                              height: 3,
                              borderRadius: '50%',
                              background: 'var(--pulse-border-bright)',
                            }}
                          />
                          <span
                            className="font-mono"
                            title="This briefing card is rendered from a synthesized fixture, not a freshly produced live agent response."
                            style={{
                              fontSize: '0.62rem',
                              color: 'var(--pulse-gold)',
                              fontWeight: 600,
                              letterSpacing: '0.06em',
                              padding: '1px 5px',
                              border: '1px solid var(--pulse-border-bright)',
                              borderRadius: 3,
                            }}
                          >
                            {PULSE_SYNTHESIZED_LABEL}
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className="font-serif"
                      style={{
                        fontSize: '1rem',
                        color: 'var(--pulse-text)',
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      {briefing.headline}
                    </div>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--pulse-text-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      {briefing.leadSentence}
                    </p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                      {briefing.domains.map((d) => (
                        <span
                          key={d}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--pulse-border)',
                            fontSize: '0.65rem',
                            color: 'var(--pulse-text-muted)',
                          }}
                        >
                          {d.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: getRiskColor(briefing.overallRisk),
                        background: `${getRiskColor(briefing.overallRisk)}18`,
                        border: `1px solid ${getRiskColor(briefing.overallRisk)}40`,
                      }}
                    >
                      {briefing.overallRisk}
                    </span>
                    <ConfidenceChip score={briefing.overallConfidence} size="sm" />
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color:
                          briefing.status === 'archived'
                            ? '#7a8295'
                            : briefing.status === 'draft'
                              ? '#c8a84b'
                              : '#4eca8b',
                      }}
                    >
                      {briefing.status}
                    </span>
                    <div
                      style={{ display: 'flex', gap: 4 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <button
                        type="button"
                        title={savedIds.has(briefing.id) ? 'Remove from saved' : 'Save for later'}
                        onClick={(e) => handleToggleSave(briefing.id, e)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: savedIds.has(briefing.id) ? 'rgba(200,168,75,0.12)' : 'rgba(255,255,255,0.04)',
                          border: savedIds.has(briefing.id) ? '1px solid rgba(200,168,75,0.4)' : '1px solid rgba(255,255,255,0.1)',
                          color: savedIds.has(briefing.id) ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Bookmark size={10} style={{ fill: savedIds.has(briefing.id) ? 'currentColor' : 'none' }} />
                      </button>
                      <button
                        type="button"
                        title="Approve briefing"
                        disabled={approveMut.isPending || briefing.status === 'published'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          approveMut.mutate(briefing.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background:
                            briefing.status === 'published'
                              ? 'rgba(78,202,139,0.06)'
                              : 'rgba(78,202,139,0.12)',
                          border: '1px solid rgba(78,202,139,0.3)',
                          color: '#4eca8b',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: briefing.status === 'published' ? 'default' : 'pointer',
                          opacity: approveMut.isPending ? 0.6 : 1,
                        }}
                      >
                        <Check size={10} /> Approve
                      </button>
                      <button
                        type="button"
                        title="Archive briefing"
                        disabled={archiveMut.isPending || briefing.status === 'archived'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          archiveMut.mutate(briefing.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background:
                            briefing.status === 'archived'
                              ? 'rgba(122,130,149,0.06)'
                              : 'rgba(122,130,149,0.12)',
                          border: '1px solid rgba(122,130,149,0.3)',
                          color: '#a0a8b8',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: briefing.status === 'archived' ? 'default' : 'pointer',
                          opacity: archiveMut.isPending ? 0.6 : 1,
                        }}
                      >
                        <Archive size={10} /> Archive
                      </button>
                    </div>
                    <ChevronRight size={14} color="var(--pulse-text-muted)" />
                  </div>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pulse-text-muted)' }}>
            <p style={{ fontSize: '0.9rem' }}>
              {isSearching
                ? `No briefings match "${debouncedSearch}"`
                : 'No briefings match your current filters'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setDomainFilter('all');
                setRiskFilter('all');
              }}
              style={{
                marginTop: 12,
                padding: '6px 14px',
                borderRadius: 6,
                background: 'var(--pulse-card)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text-dim)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
