import { useEffect, useRef, useState } from 'react';
import type { EcosystemSnapshot } from '../types';

const DEMO_SNAPSHOT: EcosystemSnapshot = {
  compositeScore: 84,
  compositeStatus: 'Operational',
  lastUpdated: new Date(),
  domains: [
    {
      id: 'aegis',
      name: 'Aegis',
      icon: 'shield',
      color: '#6366f1',
      score: 91,
      status: 'Operational',
      kpis: [
        { label: 'Threat Score', value: 'Low', trend: 'down' },
        { label: 'Posture', value: '97%', trend: 'up' },
      ],
      alerts: { count: 2, severity: 'low' },
      sparkline: [82, 85, 88, 86, 90, 91],
      link: '/aegis',
    },
    {
      id: 'vessels',
      name: 'Vessels',
      icon: 'ship',
      color: '#4d8fcc',
      score: 87,
      status: 'Operational',
      kpis: [
        { label: 'Fleet Util', value: '87%', trend: 'up' },
        { label: 'On-Time', value: '94%', trend: 'up' },
      ],
      alerts: { count: 3, severity: 'medium' },
      sparkline: [80, 82, 84, 85, 86, 87],
      link: '/vessels',
    },
    {
      id: 'terra',
      name: 'Terra',
      icon: 'map',
      color: '#10b981',
      score: 79,
      status: 'Monitoring',
      kpis: [
        { label: 'Assets', value: '$127M', trend: 'up' },
        { label: 'Occupancy', value: '92%', trend: 'neutral' },
      ],
      alerts: { count: 1, severity: 'low' },
      sparkline: [75, 74, 76, 78, 77, 79],
      link: '/terra',
    },
    {
      id: 'lyte',
      name: 'Lyte',
      icon: 'zap',
      color: '#d4a054',
      score: 82,
      status: 'Operational',
      kpis: [
        { label: 'Uptime', value: '99.97%', trend: 'up' },
        { label: 'P95 Latency', value: '42ms', trend: 'down' },
      ],
      alerts: { count: 0, severity: 'info' },
      sparkline: [78, 80, 81, 82, 81, 82],
      link: '/operations',
    },
    {
      id: 'szl',
      name: 'SZL Holdings',
      icon: 'building',
      color: '#8b7ac8',
      score: 84,
      status: 'Operational',
      kpis: [
        { label: 'Revenue', value: '$14.2M', trend: 'up' },
        { label: 'Margin', value: '34%', trend: 'up' },
      ],
      alerts: { count: 1, severity: 'low' },
      sparkline: [80, 81, 82, 83, 83, 84],
      link: '/',
    },
    {
      id: 'prism',
      name: 'PRAXIS',
      icon: 'brain',
      color: '#ec4899',
      score: 88,
      status: 'Operational',
      kpis: [
        { label: 'Signals', value: '1,247', trend: 'up' },
        { label: 'Accuracy', value: '96.2%', trend: 'up' },
      ],
      alerts: { count: 0, severity: 'info' },
      sparkline: [84, 85, 86, 87, 87, 88],
      link: '/operations/prism/pulse',
    },
  ],
  timeline: [
    {
      id: 1,
      time: '08:42',
      domain: 'vessels',
      severity: 'medium',
      title: 'Fleet ETA compliance gap detected',
      detail: '3 vessels outside SLA — Bay of Bengal corridor',
    },
    {
      id: 2,
      time: '08:15',
      domain: 'aegis',
      severity: 'low',
      title: 'Perimeter scan complete',
      detail: 'Zero anomalies detected across all monitored zones',
    },
    {
      id: 3,
      time: '07:58',
      domain: 'terra',
      severity: 'info',
      title: 'Market data refresh',
      detail: 'Dallas-Fort Worth asset valuations updated',
    },
    {
      id: 4,
      time: '07:30',
      domain: 'lyte',
      severity: 'low',
      title: 'SLO budget healthy',
      detail: 'All services within error budget — 28 days remaining',
    },
    {
      id: 5,
      time: '07:12',
      domain: 'szl',
      severity: 'info',
      title: 'Morning briefing generated',
      detail: 'Executive digest ready for review',
    },
    {
      id: 6,
      time: '06:45',
      domain: 'prism',
      severity: 'low',
      title: 'Signal correlation complete',
      detail: '12 new cross-domain patterns identified',
    },
  ],
  intelligence: [
    {
      id: 'int-1',
      title: 'Vessel rerouting opportunity',
      severity: 'medium',
      description:
        'Weather pattern shift in Bay of Bengal may allow 3 vessels to optimize routes, saving ~$180K in fuel costs.',
      entities: ['M/V Meridian', 'M/V Catalyst', 'M/V Horizon'],
      action: 'Review route optimization',
    },
    {
      id: 'int-2',
      title: 'Terra asset appreciation signal',
      severity: 'low',
      description:
        'Dallas-Fort Worth industrial corridor showing 8% YoY appreciation — above portfolio average.',
      entities: ['DFW-Industrial-7', 'DFW-Industrial-12'],
      action: 'Schedule valuation review',
    },
    {
      id: 'int-3',
      title: 'Cross-domain correlation',
      severity: 'info',
      description:
        'PRISM detected correlation between Aegis perimeter events and Vessels port congestion in Singapore.',
      entities: ['Aegis-Zone-4', 'SG-Port-Authority'],
      action: 'Investigate pattern',
    },
  ],
  actions: [
    {
      id: 'act-1',
      domain: 'vessels',
      priority: 'high',
      text: 'Approve fleet rerouting for Bay of Bengal corridor',
      buttonText: 'Review & Approve',
    },
    {
      id: 'act-2',
      domain: 'terra',
      priority: 'medium',
      text: 'Schedule Q2 asset valuation for DFW portfolio',
      buttonText: 'Schedule',
    },
    {
      id: 'act-3',
      domain: 'aegis',
      priority: 'low',
      text: 'Acknowledge perimeter scan results',
      buttonText: 'Acknowledge',
    },
    {
      id: 'act-4',
      domain: 'lyte',
      priority: 'medium',
      text: 'Review SLO budget allocation for Q2',
      buttonText: 'Open',
    },
  ],
};

class FetchError extends Error {
  status: number;
  constructor(status: number, statusText: string) {
    super(`Failed to fetch ecosystem snapshot: ${status} ${statusText}`);
    this.status = status;
  }
}

async function fetchEcosystemSnapshot(): Promise<EcosystemSnapshot> {
  const res = await fetch('/api/command/snapshot', { credentials: 'include' });
  if (!res.ok) {
    throw new FetchError(res.status, res.statusText);
  }
  const body = (await res.json()) as Omit<EcosystemSnapshot, 'lastUpdated'> & {
    generatedAt: string;
  };
  return {
    ...body,
    lastUpdated: new Date(body.generatedAt),
  };
}

function isAuthError(err: unknown): boolean {
  return err instanceof FetchError && (err.status === 401 || err.status === 403);
}

export interface EcosystemDataResult {
  data: EcosystemSnapshot | null;
  dataUpdatedAt: number;
  sseConnected: boolean;
}

export function useEcosystemData(): EcosystemDataResult {
  const [data, setData] = useState<EcosystemSnapshot | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchEcosystemSnapshot()
      .then((snapshot) => {
        if (!cancelled) {
          setData(snapshot);
          setDataUpdatedAt(Date.now());
        }
      })
      .catch((err) => {
        if (!cancelled && isAuthError(err)) {
          setData((prev) => prev ?? { ...DEMO_SNAPSHOT, lastUpdated: new Date() });
          setDataUpdatedAt(Date.now());
        }
      });

    const startSSE = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      const es = new EventSource('/api/command/snapshot/stream');
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) setSseConnected(true);
        if (fallbackRef.current) {
          clearInterval(fallbackRef.current);
          fallbackRef.current = null;
        }
      };

      es.onmessage = (event) => {
        if (cancelled) return;
        try {
          const body = JSON.parse(event.data) as Omit<EcosystemSnapshot, 'lastUpdated'> & {
            generatedAt: string;
          };
          setData({ ...body, lastUpdated: new Date(body.generatedAt) });
          setDataUpdatedAt(Date.now());
        } catch {}
      };

      es.onerror = () => {
        if (!cancelled) {
          setSseConnected(false);
          es.close();
          esRef.current = null;
          if (!fallbackRef.current) {
            fallbackRef.current = setInterval(() => {
              fetchEcosystemSnapshot()
                .then((snapshot) => {
                  if (!cancelled) {
                    setData(snapshot);
                    setDataUpdatedAt(Date.now());
                  }
                })
                .catch((err) => {
                  if (!cancelled && isAuthError(err)) {
                    setData((prev) => prev ?? { ...DEMO_SNAPSHOT, lastUpdated: new Date() });
                    setDataUpdatedAt(Date.now());
                  }
                });
            }, 30_000);
          }
          setTimeout(startSSE, 5_000);
        }
      };
    };

    startSSE();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
  }, []);

  return { data, dataUpdatedAt, sseConnected };
}
