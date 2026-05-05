import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { Header } from '../../components/command/header';
import { SignalChainsPanel } from '../../components/command/signal-chains-panel';
import { useEcosystemData } from '../../hooks/use-ecosystem-data';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function SignalChainsPage() {
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
            Autonomous Signal Chains
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Cross-domain trigger→action workflows that fire automatically when signal thresholds are
            crossed. Each execution is logged with full explainability for audit compliance.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-3 p-4 rounded-xl text-xs"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span style={{ color: 'var(--color-fg-muted)' }}>
              All chain executions are logged to the immutable audit trail with step-level
              explainability
            </span>
          </div>
        </div>

        <SignalChainsPanel />
      </main>
    </div>
  );
}
