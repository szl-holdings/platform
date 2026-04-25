import type { Vertical, FabricLayer } from '../core/types';
import type { FabricStatus } from '../schema';
import { VERTICALS, FABRIC_LAYERS } from '../core/constants';
import { SEED_SIGNALS } from '../demo/seedSignals';

export interface CoverageNode {
  vertical: Vertical;
  label: string;
  signalCount: number;
  coverageScore: number;
  layersActive: FabricLayer[];
}

export interface CoverageGraphInterface {
  getGraph(): Promise<{ nodes: CoverageNode[]; fabricHealth: FabricStatus[] }>;
}

class InMemoryCoverageGraph implements CoverageGraphInterface {
  async getGraph() {
    const now = new Date().toISOString();

    const nodes: CoverageNode[] = VERTICALS.map(v => {
      const sigs = SEED_SIGNALS.filter(s => s.vertical === v.id);
      const criticals = sigs.filter(s => s.severity === 'critical').length;
      const coverageScore = Math.max(0.4, 1 - criticals * 0.12 + Math.min(0.2, sigs.length * 0.04));
      return {
        vertical: v.id as Vertical,
        label: v.label,
        signalCount: sigs.length,
        coverageScore: Math.min(1, coverageScore),
        layersActive: (['signal_mesh', 'state_engine', 'causal_core', 'proof_ledger'] as FabricLayer[]),
      };
    });

    const fabricHealth: FabricStatus[] = FABRIC_LAYERS.map(layer => ({
      layer: layer.id as FabricLayer,
      status: layer.id === 'signal_mesh' ? 'degraded' : 'healthy',
      signalCount: layer.id === 'signal_mesh' ? SEED_SIGNALS.length : undefined,
      processingRateHz: layer.id === 'signal_mesh' ? 24 : undefined,
      latencyMs: layer.id === 'signal_mesh' ? 340 : layer.id === 'state_engine' ? 18 : undefined,
      lastHeartbeat: now,
    }));

    return { nodes, fabricHealth };
  }
}

export const coverageGraph: CoverageGraphInterface = new InMemoryCoverageGraph();
