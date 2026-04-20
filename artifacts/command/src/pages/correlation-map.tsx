import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { CorrelationMapViz } from '../components/correlation-map-viz';
import { Header } from '../components/header';
import { useEcosystemData } from '../hooks/use-ecosystem-data';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function CorrelationMapPage() {
  const { dataUpdatedAt, sseConnected } = useEcosystemData();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-fg-primary)' }}
    >
      <Header lastUpdatedAt={dataUpdatedAt} sseConnected={sseConnected} />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href={`${BASE}/strategy`}
            className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Command
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ color: 'var(--color-fg-primary)' }}
          >
            Entity Correlation Map
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Live connections between entities across all domains — vessels, ports, properties,
            incidents, contracts, and portfolio signals.
          </p>
        </div>

        <CorrelationMapViz />
      </main>
    </div>
  );
}
