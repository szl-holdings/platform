import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MetricCollector } from '../collector.js';
import type { AppObservabilityState, DomainConfig } from '../types.js';
import { initInteractionTracker } from './interaction-tracker.js';
import { initWebVitals } from './web-vitals.js';

interface ServerTelemetryData {
  requestCount: number;
  avgResponseTime: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  clientErrorRate: number;
  throughputPerHour: number;
  uptimeSeconds: number;
  windowMs: number;
}

interface ObservabilityContextValue {
  collector: MetricCollector;
  state: AppObservabilityState;
  config: DomainConfig;
  serverTelemetry: ServerTelemetryData | null;
  dataSource: 'api' | 'local';
}

const ObservabilityContext = createContext<ObservabilityContextValue | null>(null);

function resolveApiBase(): string {
  if (typeof window === 'undefined') return '/api/';
  return `${window.location.origin}/api/`;
}

export function ObservabilityProvider({
  config,
  children,
}: {
  config: DomainConfig;
  children: ReactNode;
}) {
  const collectorRef = useRef<MetricCollector | null>(null);
  if (!collectorRef.current) {
    collectorRef.current = new MetricCollector(config);
  }
  const collector = collectorRef.current;

  const [state, setState] = useState<AppObservabilityState>(() => collector.getSnapshot());
  const [serverTelemetry, setServerTelemetry] = useState<ServerTelemetryData | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local');
  const apiBase = useMemo(() => resolveApiBase(), []);

  useEffect(() => {
    initWebVitals(config.appSlug, apiBase);
    initInteractionTracker(collector, config.appSlug);
  }, [config.appSlug, apiBase, collector]);

  const fetchFromApi = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}observability/${config.appSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pillars && data.metrics && data.events) {
          setState({
            appSlug: data.appSlug,
            lenses: data.lenses ?? data.pillars,
            pillars: data.pillars,
            overallScore: data.overallScore,
            overallStatus: data.overallStatus,
            metrics: data.metrics,
            events: data.events,
            lastUpdated: Date.now(),
          } as AppObservabilityState);
          setDataSource('api');
        }
        if (data.serverTelemetry) {
          setServerTelemetry(data.serverTelemetry);
        }
        return true;
      }
    } catch {
      /* fall back to local collector */
    }
    return false;
  }, [apiBase, config.appSlug]);

  useEffect(() => {
    let useApi = false;

    const init = async () => {
      useApi = await fetchFromApi();
    };
    init();

    const interval = setInterval(async () => {
      if (useApi) {
        const ok = await fetchFromApi();
        if (!ok) {
          collector.simulateTick();
          setState(collector.getSnapshot());
          setDataSource('local');
        }
      } else {
        collector.simulateTick();
        setState(collector.getSnapshot());
        setDataSource('local');
        useApi = await fetchFromApi();
      }
    }, 5000);

    const unsubscribe = collector.subscribe(() => {
      if (!useApi) {
        setState(collector.getSnapshot());
      }
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [collector, fetchFromApi]);

  const value = useMemo(
    () => ({ collector, state, config, serverTelemetry, dataSource }),
    [collector, state, config, serverTelemetry, dataSource],
  );

  return <ObservabilityContext.Provider value={value}>{children}</ObservabilityContext.Provider>;
}

export function useObservability(): ObservabilityContextValue {
  const ctx = useContext(ObservabilityContext);
  if (!ctx) throw new Error('useObservability must be used within ObservabilityProvider');
  return ctx;
}
