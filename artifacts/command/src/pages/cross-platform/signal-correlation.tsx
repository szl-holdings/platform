import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  GitMerge,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { apiUrl, fetchJson } from '../cognitive/shared';
import { inferProductForEntity, productDashboardUrl, productEntityUrl } from './product-links';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const PRODUCT_COLORS: Record<string, string> = {
  lyte: '#d4a054',
  vessels: '#0ea5e9',
  terra: '#22c55e',
  prism: '#a855f7',
  aegis: '#ef4444',
  carlota: '#f59e0b',
};

const OUTCOME_META: Record<string, { color: string; icon: typeof CheckCircle }> = {
  escalated: { color: '#ef4444', icon: AlertCircle },
  'under-review': { color: '#f59e0b', icon: Clock },
  resolved: { color: '#22c55e', icon: CheckCircle },
  informational: { color: '#0ea5e9', icon: CheckCircle },
};

function strengthBar(value: number) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? '#ef4444' : value >= 0.72 ? '#f59e0b' : '#0ea5e9';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

interface TraceRef {
  traceId: string;
  domain: string;
  drillUrl: string;
}

interface Correlation {
  correlationId: string;
  rule: string;
  title: string;
  description: string;
  products: string[];
  entityIds: string[];
  /**
   * Authoritative entity → owning product map provided by the API. The owner
   * is the originating product (the earliest trace that recorded the entity).
   * UI prefers this over the local string-prefix heuristic.
   */
  entityOwners?: Record<string, string>;
  traceRefs: TraceRef[];
  strength: number;
  outcome: string;
  detectedAt: string;
  proofEnvelope: { hash: string; signedAt: string; signerAgentId: string };
}

interface CorrelationsResponse {
  correlations: Correlation[];
  total: number;
  productMeta: Record<string, { label: string; color: string; icon: string }>;
}

const PRODUCTS = ['lyte', 'vessels', 'terra', 'prism', 'aegis', 'carlota'];

export function SignalCorrelationPage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useStandardQuery<CorrelationsResponse>({
    queryKey: ['cross-platform', 'correlations', selectedProduct],
    queryFn: () =>
      fetchJson<CorrelationsResponse>(
        apiUrl(
          `/cross-platform/correlations${selectedProduct ? `?product=${selectedProduct}&limit=100` : '?limit=100'}`,
        ),
      ),
    staleTime: 30_000,
  });

  const correlations = data?.correlations ?? [];
  const total = data?.total ?? 0;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#080c14', color: 'rgba(255,255,255,0.85)' }}
    >
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`${BASE}/strategy`}
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Command
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>/</span>
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4" style={{ color: '#8b7ac8' }} />
            <span className="text-sm font-semibold">Signal Correlation</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {total} correlations
          </span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs hover:opacity-80 transition-opacity"
            style={{
              background: 'rgba(139,122,200,0.1)',
              border: '1px solid rgba(139,122,200,0.2)',
              color: '#8b7ac8',
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      <div
        className="px-6 py-3 border-b flex items-center gap-2 flex-wrap"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={() => setSelectedProduct(null)}
          className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all"
          style={{
            background: !selectedProduct ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${!selectedProduct ? 'rgba(139,122,200,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: !selectedProduct ? '#8b7ac8' : 'rgba(255,255,255,0.4)',
          }}
        >
          All
        </button>
        {PRODUCTS.map((p) => {
          const color = PRODUCT_COLORS[p] ?? '#8b7ac8';
          const active = selectedProduct === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedProduct(active ? null : p)}
              className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all"
              style={{
                background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                color: active ? color : 'rgba(255,255,255,0.4)',
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(139,122,200,0.2)', borderTopColor: '#8b7ac8' }}
            />
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-sm" style={{ color: '#ef4444' }}>
            Failed to load correlations
          </div>
        )}
        {!isLoading && !error && correlations.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <GitMerge className="w-8 h-8" style={{ color: 'rgba(139,122,200,0.25)' }} />
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              No correlations detected yet
            </div>
            <div
              className="text-xs text-center max-w-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Correlations surface as agent runs from multiple products share entity identifiers or
              run in overlapping time windows. Once agent activity is recorded, cross-product
              signals will appear here automatically.
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {correlations.map((c) => {
            const isOpen = expanded === c.correlationId;
            const outcomeMeta = OUTCOME_META[c.outcome] ?? OUTCOME_META['informational'];
            const OutcomeIcon = outcomeMeta.icon;

            return (
              <div
                key={c.correlationId}
                className="rounded-lg border transition-all"
                style={{
                  background: isOpen ? 'rgba(139,122,200,0.04)' : 'rgba(255,255,255,0.02)',
                  borderColor: isOpen ? 'rgba(139,122,200,0.2)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : c.correlationId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpanded(isOpen ? null : c.correlationId);
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {c.products.map((p) => {
                      const color = PRODUCT_COLORS[p] ?? '#8b7ac8';
                      return (
                        <a
                          key={p}
                          href={productDashboardUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`Open ${p} dashboard`}
                          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase hover:opacity-80 transition-opacity"
                          style={{
                            color,
                            background: `${color}12`,
                            border: `1px solid ${color}25`,
                          }}
                        >
                          {p}
                        </a>
                      );
                    })}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold leading-snug"
                        style={{ color: 'rgba(255,255,255,0.9)' }}
                      >
                        {c.title}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {c.correlationId}
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-0.5 leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {strengthBar(c.strength)}
                    <span
                      className="flex items-center gap-1 text-[10px] font-mono"
                      style={{ color: outcomeMeta.color }}
                    >
                      <OutcomeIcon className="w-3 h-3" />
                      {c.outcome}
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 transition-transform"
                      style={{
                        color: 'rgba(255,255,255,0.2)',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div
                    className="px-4 pb-4 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {c.entityIds.length > 0 && (
                          <>
                            <div
                              className="text-[9px] uppercase tracking-widest font-mono mb-2"
                              style={{ color: 'rgba(255,255,255,0.2)' }}
                            >
                              Shared Entities
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {c.entityIds.map((e) => {
                                const apiOwner = c.entityOwners?.[e];
                                const owner = apiOwner ?? inferProductForEntity(e, c.products);
                                const url = productEntityUrl(owner, e);
                                const ownerColor = PRODUCT_COLORS[owner] ?? '#8b7ac8';
                                if (!url) {
                                  return (
                                    <span
                                      key={e}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                                      style={{
                                        color: '#8b7ac8',
                                        background: 'rgba(139,122,200,0.1)',
                                        border: '1px solid rgba(139,122,200,0.2)',
                                      }}
                                    >
                                      {e}
                                    </span>
                                  );
                                }
                                return (
                                  <a
                                    key={e}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Open ${e} in ${owner}`}
                                    className="group flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
                                    style={{
                                      color: ownerColor,
                                      background: `${ownerColor}10`,
                                      border: `1px solid ${ownerColor}30`,
                                    }}
                                  >
                                    <span className="text-[8px] uppercase opacity-70">{owner}</span>
                                    <span>{e}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                  </a>
                                );
                              })}
                            </div>
                          </>
                        )}
                        <div
                          className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          Detection Rule
                        </div>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          {c.rule}
                        </span>

                        {c.traceRefs.length > 0 && (
                          <div className="mt-3">
                            <div
                              className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                              style={{ color: 'rgba(255,255,255,0.2)' }}
                            >
                              Source Traces
                            </div>
                            <div className="flex flex-col gap-1">
                              {c.traceRefs.map((ref) => (
                                <a
                                  key={ref.traceId}
                                  href={ref.drillUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-[10px] font-mono hover:opacity-70 transition-opacity"
                                  style={{ color: PRODUCT_COLORS[ref.domain] ?? '#8b7ac8' }}
                                >
                                  <span className="uppercase text-[8px]">{ref.domain}</span>
                                  <span
                                    className="truncate"
                                    style={{ color: 'rgba(255,255,255,0.45)' }}
                                  >
                                    {ref.traceId}
                                  </span>
                                  <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div
                          className="text-[9px] uppercase tracking-widest font-mono mb-2"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          Proof Envelope
                        </div>
                        <div
                          className="rounded p-2.5 text-[10px] font-mono space-y-1"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex gap-2">
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>hash</span>
                            <span className="truncate" style={{ color: 'rgba(139,122,200,0.9)' }}>
                              {c.proofEnvelope.hash}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>signer</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                              {c.proofEnvelope.signerAgentId}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>signed</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                              {new Date(c.proofEnvelope.signedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                            detected {new Date(c.detectedAt).toLocaleString()}
                          </span>
                          <Link
                            href={`${BASE}/strategy/cross-platform/evidence`}
                            className="text-[10px] hover:opacity-80 transition-opacity flex items-center gap-1"
                            style={{ color: '#8b7ac8' }}
                          >
                            View evidence <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
