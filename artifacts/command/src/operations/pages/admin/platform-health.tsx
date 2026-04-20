import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AlertTriangle, CheckCircle, RefreshCw, Server, ShieldCheck, WifiOff } from 'lucide-react';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface AppHealthSummary {
  app: string;
  services: { name: string; status: string; latencyMs?: number }[];
  summary: {
    total: number;
    liveConfigured: number;
    mockedDemoMode: number;
    manualRequired: number;
  };
}

const apps = ['firestorm', 'lyte', 'aegis', 'terra', 'vessels', 'carlota-jo', 'szl-holdings'];

function AppCard({ slug }: { slug: string }) {
  const { data, isLoading, refetch, isRefetching } = useStandardQuery<AppHealthSummary>({
    queryKey: ['app-health', slug],
    queryFn: () => apiFetch(`/services/health/app/${slug}`),
    refetchInterval: 60000,
  });

  const status = !data
    ? 'unknown'
    : data.summary.manualRequired > 0
      ? 'needs_config'
      : data.summary.mockedDemoMode > 0
        ? 'demo'
        : 'live';
  const statusText = {
    live: 'Live',
    demo: 'Sandbox',
    needs_config: 'Needs Config',
    unknown: 'Loading',
  }[status];
  const statusColor = {
    live: 'text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20',
    demo: 'text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20',
    needs_config: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20',
    unknown: 'text-muted-foreground bg-muted border-border',
  }[status];
  const StatusIcon = {
    live: CheckCircle,
    demo: AlertTriangle,
    needs_config: WifiOff,
    unknown: Server,
  }[status];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusColor.split(' ')[0]}`} />
          <span className="text-sm font-semibold capitalize">{slug.replace(/-/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>
            {statusText}
          </span>
          <button
            onClick={() => refetch()}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-3 h-3 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-1.5">
          {data.services.slice(0, 5).map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[60%]">{svc.name}</span>
              <div className="flex items-center gap-1.5">
                {svc.latencyMs && (
                  <span className="text-[10px] text-muted-foreground">{svc.latencyMs}ms</span>
                )}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${svc.status === 'LIVE_CONFIGURED' ? 'bg-[#6b8f71]' : svc.status === 'MOCKED_DEMO_MODE' ? 'bg-[#d4a054]' : 'bg-[#c45a4a]'}`}
                />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{data.summary.total} connectors</span>
            <span>
              {data.summary.liveConfigured} live · {data.summary.mockedDemoMode} demo
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No health data available</p>
      )}
    </div>
  );
}

export default function PlatformHealth() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Platform Health
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Per-app connector status and ecosystem health matrix
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((slug) => (
          <AppCard key={slug} slug={slug} />
        ))}
      </div>
    </div>
  );
}
