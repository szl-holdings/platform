import type { BusinessTwin } from '../schema';
import type { Vertical } from '../core/types';
import { SEED_SIGNALS } from '../demo/seedSignals';

export interface StateEngineInterface {
  snapshot(): Promise<{ twins: BusinessTwin[]; snapshotAt: string }>;
  getTwin(vertical: Vertical, entity: string): Promise<BusinessTwin | undefined>;
}

function buildDemoTwins(): BusinessTwin[] {
  const now = new Date().toISOString();

  const verticalGroups: Partial<Record<Vertical, { signals: typeof SEED_SIGNALS; entity: string; entityType: string }>> = {
    'lyte-revenue':      { signals: SEED_SIGNALS.filter(s => s.vertical === 'lyte-revenue'), entity: 'Lyte Platform', entityType: 'saas_product' },
    'vessels-maritime':  { signals: SEED_SIGNALS.filter(s => s.vertical === 'vessels-maritime'), entity: 'Maritime Fleet', entityType: 'fleet' },
    'terra-real-estate': { signals: SEED_SIGNALS.filter(s => s.vertical === 'terra-real-estate'), entity: 'Real Estate Portfolio', entityType: 'portfolio' },
    'aegis-defense':     { signals: SEED_SIGNALS.filter(s => s.vertical === 'aegis-defense'), entity: 'Aegis Platform', entityType: 'defense_platform' },
    'prism-counsel':     { signals: SEED_SIGNALS.filter(s => s.vertical === 'prism-counsel'), entity: 'Counsel Platform', entityType: 'legal_platform' },
    'carlota-jo':        { signals: SEED_SIGNALS.filter(s => s.vertical === 'carlota-jo'), entity: 'Carlota Jo Consulting', entityType: 'professional_services' },
    'alloy-core':        { signals: SEED_SIGNALS.filter(s => s.vertical === 'alloy-core'), entity: 'A11oy Fabric', entityType: 'platform' },
  };

  return Object.entries(verticalGroups).map(([vertical, data]) => {
    const sigs = data!.signals;
    const criticalCount = sigs.filter(s => s.severity === 'critical').length;
    const coverageScore = Math.max(0.5, 1 - criticalCount * 0.15);
    const lastSignal = sigs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      id: `twin-${vertical}`,
      vertical: vertical as Vertical,
      entity: data!.entity,
      entityType: data!.entityType,
      currentState: {
        signalCount: sigs.length,
        criticalSignals: criticalCount,
        activeSignals: sigs.filter(s => s.status === 'active').length,
      },
      lastSignalId: lastSignal?.id ?? '',
      signalCount: sigs.length,
      activeOutcomes: 0,
      pendingActions: 0,
      coverageScore,
      updatedAt: lastSignal?.updatedAt ?? now,
    } satisfies BusinessTwin;
  });
}

class InMemoryStateEngine implements StateEngineInterface {
  private twins: BusinessTwin[] = buildDemoTwins();

  async snapshot() {
    return { twins: this.twins, snapshotAt: new Date().toISOString() };
  }

  async getTwin(vertical: Vertical, entity: string) {
    return this.twins.find(t => t.vertical === vertical && t.entity === entity);
  }
}

export const stateEngine: StateEngineInterface = new InMemoryStateEngine();
