import { useState, useEffect } from 'react';
import type {
  VerticalProfile, DomainTwin, FabricSignal, FabricRisk,
  FabricDecision, FabricOutcome, FabricEvidence, FabricAgent,
  RoadmapPhase, FabricKpis,
} from '../data/fabric';
import {
  VERTICALS as STATIC_VERTICALS, DOMAIN_TWINS as STATIC_TWINS,
  FABRIC_SIGNALS as STATIC_SIGNALS, FABRIC_RISKS as STATIC_RISKS,
  FABRIC_DECISIONS as STATIC_DECISIONS, FABRIC_OUTCOMES as STATIC_OUTCOMES,
  FABRIC_EVIDENCE as STATIC_EVIDENCE, FABRIC_AGENTS as STATIC_AGENTS,
  ROADMAP_PHASES as STATIC_ROADMAP, deriveFabricKpis,
} from '../data/fabric';

export interface FabricData {
  kpis: FabricKpis;
  signals: FabricSignal[];
  risks: FabricRisk[];
  decisions: FabricDecision[];
  outcomes: FabricOutcome[];
  evidence: FabricEvidence[];
  twins: DomainTwin[];
  verticals: VerticalProfile[];
  agents: FabricAgent[];
  roadmap: RoadmapPhase[];
}

const STATIC_DATA: FabricData = {
  kpis: deriveFabricKpis(),
  signals: [...STATIC_SIGNALS],
  risks: [...STATIC_RISKS],
  decisions: [...STATIC_DECISIONS],
  outcomes: [...STATIC_OUTCOMES],
  evidence: [...STATIC_EVIDENCE],
  twins: [...STATIC_TWINS],
  verticals: [...STATIC_VERTICALS],
  agents: [...STATIC_AGENTS],
  roadmap: [...STATIC_ROADMAP],
};

export function useFabricData(): { data: FabricData; loading: boolean; error: string | null } {
  const isDemo = import.meta.env.VITE_IS_DEMO === 'true';
  const [data, setData] = useState<FabricData>(isDemo ? STATIC_DATA : {
    kpis: { verticalHealth: 0, activeSignals: 0, openRisks: 0, pendingDecisions: 0, approvalQueue: 0, evidenceCompleteness: 0, outcomeVelocity: 0, chainlightConfidence: 0 },
    signals: [], risks: [], decisions: [], outcomes: [], evidence: [],
    twins: [], verticals: [], agents: [], roadmap: [],
  });
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/a11oy/fabric/all')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (cancelled) return;
        if (d.ok) {
          setData(d.data);
        } else {
          setError('API returned an error. Check server status.');
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message ?? 'Failed to load fabric data');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isDemo]);

  return { data, loading, error };
}
