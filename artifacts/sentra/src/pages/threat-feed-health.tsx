/**
 * Threat Feed Health Panel
 *
 * Shows live status of all Sentra threat-intel feeds:
 * NVD, KEV, EPSS, MITRE ATT&CK, abuse.ch URLhaus, ThreatFox, OTX.
 * Per-feed: freshness badge, latency, record count, last-fetch time.
 */
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { getThreatFeedHealth, getDailyBrief, type FeedHealth } from '../lib/sentra-api';

const FEED_ICONS: Record<string, typeof Shield> = {
  nvd: Database,
  kev: AlertTriangle,
  epss: Activity,
  mitre: Shield,
  urlhaus: Wifi,
  threatfox: WifiOff,
  otx: Zap,
};

function freshnessColor(f: FeedHealth['freshness']): string {
  switch (f) {
    case 'live': return 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10';
    case 'cached': return 'text-[#8a8a8a] border-[#8a8a8a]/30 bg-[#8a8a8a]/10';
    case 'stale': return 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10';
    case 'error': return 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10';
  }
}

function FreshnessIcon({ freshness }: { freshness: FeedHealth['freshness'] }) {
  if (freshness === 'live') return <CheckCircle2 className="w-3 h-3 text-[#c9b787]" />;
  if (freshness === 'cached') return <Clock className="w-3 h-3 text-[#8a8a8a]" />;
  if (freshness === 'stale') return <AlertTriangle className="w-3 h-3 text-[#c9b787]" />;
  return <AlertTriangle className="w-3 h-3 text-[#f5f5f5]" />;
}

function formatAge(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return 'never';
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function FeedCard({ feed }: { feed: FeedHealth }) {
  const Icon = FEED_ICONS[feed.feedId] ?? Database;
  return (
    <div className={cn(
      'rounded-xl border p-3 transition-all',
      feed.freshness === 'error'
        ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/5'
        : feed.freshness === 'live'
        ? 'border-[#c9b787]/20 bg-[#c9b787]/5'
        : 'border-white/8 bg-white/3',
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#8a8a8a]" />
          <span className="text-[11px] font-medium text-white">{feed.displayName}</span>
        </div>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1', freshnessColor(feed.freshness))}>
          <FreshnessIcon freshness={feed.freshness} />
          {feed.freshness}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>{feed.recordCount > 0 ? `${feed.recordCount.toLocaleString()} records` : '—'}</span>
        <span>{feed.latencyMs > 0 ? `${feed.latencyMs}ms` : '—'}</span>
      </div>
      <div className="mt-1 text-[9px] text-zinc-600">
        {feed.lastFetched ? formatAge(feed.cacheAgeMs) : 'not yet fetched'}
      </div>
      {feed.error && (
        <div className="mt-1.5 text-[9px] text-[#f5f5f5] truncate" title={feed.error}>
          ⚠ {feed.error.slice(0, 60)}
        </div>
      )}
    </div>
  );
}

export default function ThreatFeedHealth() {
  const qc = useQueryClient();

  const { data: healthData, isLoading, error } = useQuery({
    queryKey: ['sentra-feed-health'],
    queryFn: getThreatFeedHealth,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: brief } = useQuery({
    queryKey: ['sentra-daily-brief'],
    queryFn: getDailyBrief,
    staleTime: 5 * 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Read CSRF token from cookie; prime it via /api/csrf-token if absent
      let csrf = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] ?? null;
      if (!csrf) {
        await fetch('/api/csrf-token', { credentials: 'include' }).catch(() => {});
        csrf = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] ?? null;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);

      const resp = await fetch('/api/sentra/threat-feeds/refresh', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    },
    onSuccess: () => {
      toast.success('All threat feeds refreshed');
      void qc.invalidateQueries({ queryKey: ['sentra-feed-health'] });
      void qc.invalidateQueries({ queryKey: ['sentra-daily-brief'] });
    },
    onError: () => toast.error('Failed to refresh feeds — check connectivity'),
  });

  const feeds = healthData?.feeds ?? [];
  const liveCount = feeds.filter(f => f.freshness === 'live').length;
  const errorCount = feeds.filter(f => f.freshness === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-lg font-semibold text-white">Threat Intelligence Feeds</h1>
            {errorCount === 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase">
                {liveCount}/{feeds.length} Live
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#f5f5f5]/30 bg-[#f5f5f5]/10 text-[#f5f5f5] font-mono uppercase">
                {errorCount} Errors
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            Live feeds: NIST NVD · CISA KEV · FIRST EPSS · MITRE ATT&CK · abuse.ch URLhaus/ThreatFox · AlienVault OTX
          </p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshMutation.isPending && 'animate-spin')} />
          Refresh All
        </button>
      </div>

      {brief && (
        <div className={cn(
          'rounded-xl border p-4',
          brief.threatLevel === 'elevated'
            ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/5'
            : 'border-[#c9b787]/20 bg-[#c9b787]/5',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#c9b787]" />
            <span className="text-xs font-semibold text-[#c9b787]">Daily Threat Brief — {brief.date}</span>
            <span className={cn(
              'ml-auto text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase',
              brief.threatLevel === 'elevated'
                ? 'text-[#f5f5f5] border-[#f5f5f5]/30 bg-[#f5f5f5]/10'
                : 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10',
            )}>
              {brief.threatLevel}
            </span>
          </div>
          <p className="text-xs text-zinc-300">{brief.headline}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-[#f5f5f5]">{brief.recentKev.length}</div>
              <div className="text-[9px] text-zinc-500">Recent KEV</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-[#c9b787]">{brief.topCves.length}</div>
              <div className="text-[9px] text-zinc-500">Critical CVEs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-[#8a8a8a]">{brief.topPulses.length}</div>
              <div className="text-[9px] text-zinc-500">OTX Pulses</div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400 p-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading feed health…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#f5f5f5]/20 bg-[#f5f5f5]/5 p-4 text-xs text-[#f5f5f5]">
          Unable to load feed health. The feeds will refresh automatically when available.
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#c9b787]" />
            Per-Feed Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {feeds.map(feed => <FeedCard key={feed.feedId} feed={feed} />)}
          </div>
          {feeds.length === 0 && (
            <div className="text-xs text-zinc-500 p-4 text-center">
              No feeds have been fetched yet. Trigger a refresh to initialize all feeds.
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#8a8a8a]" />
          Feed Architecture
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
          {[
            { label: 'Vulnerability', feeds: ['NIST NVD', 'CISA KEV', 'FIRST EPSS'], color: '#c9b787' },
            { label: 'Threat Actor', feeds: ['MITRE ATT&CK', 'AlienVault OTX'], color: '#8a8a8a' },
            { label: 'IOC / Malware', feeds: ['abuse.ch URLhaus', 'abuse.ch ThreatFox'], color: '#f5f5f5' },
            { label: 'Enrichment', feeds: ['EPSS correlation', 'KEV fleet-match'], color: '#c9b787' },
          ].map(group => (
            <div key={group.label}>
              <div className="font-medium mb-1.5" style={{ color: group.color }}>{group.label}</div>
              {group.feeds.map(f => (
                <div key={f} className="text-zinc-500 flex items-center gap-1.5 mb-0.5">
                  <span className="w-1 h-1 rounded-full bg-current inline-block" style={{ color: group.color }} />
                  {f}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
