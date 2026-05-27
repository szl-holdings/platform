import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Radio, Satellite, WifiOff, AlertTriangle } from 'lucide-react';

type Tone = 'live' | 'fallback' | 'stale' | 'unavailable';

interface AisMetaResponse {
  dataSource?: string;
  liveData?: boolean;
  cacheAgeSeconds?: number;
  isStale?: boolean;
  fetchedAt?: string;
}

interface SourceDescriptor {
  label: string;
  tone: Tone;
}

const SOURCE_MAP: Record<string, SourceDescriptor> = {
  'live-digitraffic': {
    label: 'Digitraffic — live (Finnish public AIS)',
    tone: 'live',
  },
  'live-barentswatch': {
    label: 'BarentsWatch — live (Norwegian public AIS)',
    tone: 'live',
  },
  'live-marinetraffic': {
    label: 'MarineTraffic — live (commercial satellite)',
    tone: 'live',
  },
  'live-uscg-nais': {
    label: 'USCG NAIS — live (US coastal)',
    tone: 'live',
  },
  live: {
    label: 'Multi-source AIS — live',
    tone: 'live',
  },
  'commercial-key-absent': {
    label: 'Public AIS — commercial provider not configured',
    tone: 'fallback',
  },
  'uscg-nais-api-key-required': {
    label: 'USCG NAIS — API key required',
    tone: 'fallback',
  },
  stale: {
    label: 'Cached AIS — stale',
    tone: 'stale',
  },
  unavailable: {
    label: 'AIS feed unavailable',
    tone: 'unavailable',
  },
};

function describeSource(raw: string | undefined, liveFlag: boolean | undefined): SourceDescriptor {
  if (!raw) {
    return liveFlag
      ? { label: 'AIS — live', tone: 'live' }
      : { label: 'AIS — source unknown', tone: 'fallback' };
  }
  if (SOURCE_MAP[raw]) return SOURCE_MAP[raw];
  if (raw.startsWith('uscg-nais-')) {
    return { label: `USCG NAIS — ${raw.replace('uscg-nais-', '')}`, tone: 'fallback' };
  }
  if (raw.startsWith('commercial-')) {
    return { label: `Commercial AIS — ${raw.replace('commercial-', '')}`, tone: 'fallback' };
  }
  if (raw.startsWith('live-')) {
    return { label: `${raw.replace('live-', '')} — live`, tone: 'live' };
  }
  return { label: `AIS — ${raw}`, tone: liveFlag ? 'live' : 'fallback' };
}

const TONE_STYLE: Record<Tone, { bg: string; color: string; border: string }> = {
  live: {
    bg: 'rgba(34,197,94,0.12)',
    color: '#22c55e',
    border: 'rgba(34,197,94,0.30)',
  },
  fallback: {
    bg: 'rgba(77,143,204,0.12)',
    color: 'var(--gi-accent-blue, #4d8fcc)',
    border: 'rgba(77,143,204,0.30)',
  },
  stale: {
    bg: 'rgba(251,191,36,0.14)',
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.35)',
  },
  unavailable: {
    bg: 'rgba(239,68,68,0.14)',
    color: '#f87171',
    border: 'rgba(239,68,68,0.35)',
  },
};

function freshnessLabel(seconds: number | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null;
  if (seconds < 60) return `cached ${seconds}s ago`;
  if (seconds < 3600) return `cached ${Math.round(seconds / 60)}m ago`;
  return `cached ${Math.round(seconds / 3600)}h ago`;
}

export interface AisProvenanceChipProps {
  /** API endpoint to probe. Defaults to combined feed. */
  endpoint?: string;
  /** Distinct query key suffix when multiple chips coexist on a page. */
  queryKeySuffix?: string;
  /** Compact rendering (no border, smaller padding). */
  compact?: boolean;
  className?: string;
}

export function AisProvenanceChip({
  endpoint = '/api/vessels/live/ais/combined',
  queryKeySuffix,
  compact = false,
  className,
}: AisProvenanceChipProps) {
  const { data, isLoading, error } = useStandardQuery<AisMetaResponse | null>({
    queryKey: ['ais-provenance', endpoint, queryKeySuffix ?? ''],
    queryFn: async () => {
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: AisMetaResponse } & AisMetaResponse;
      return (json.data ?? json) as AisMetaResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const raw = data?.dataSource;
  const live = data?.liveData;
  const descriptor: SourceDescriptor = (() => {
    if (error || (!data && !isLoading)) {
      return { label: 'AIS feed unavailable', tone: 'unavailable' };
    }
    if (data?.isStale) {
      const base = describeSource(raw, live);
      return { label: `${base.label} (stale)`, tone: 'stale' };
    }
    return describeSource(raw, live);
  })();

  const fresh = freshnessLabel(data?.cacheAgeSeconds);
  const tone = TONE_STYLE[descriptor.tone];

  const Icon =
    descriptor.tone === 'unavailable'
      ? WifiOff
      : descriptor.tone === 'stale'
        ? AlertTriangle
        : descriptor.tone === 'live'
          ? Radio
          : Satellite;

  return (
    <div
      title={raw ? `Source key: ${raw}` : 'AIS provenance unknown'}
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium leading-none',
        compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
        className ?? '',
      ].join(' ')}
      style={{
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`,
      }}
    >
      <Icon
        className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}
        style={descriptor.tone === 'live' ? { animation: 'pulse 2s infinite' } : undefined}
      />
      <span>
        AIS: {isLoading && !data ? 'probing…' : descriptor.label}
        {fresh ? ` · ${fresh}` : ''}
      </span>
    </div>
  );
}

export default AisProvenanceChip;
