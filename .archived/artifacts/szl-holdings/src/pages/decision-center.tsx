import { DecisionCenter } from '@szl-holdings/shared-ui/DecisionCenter';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import type { RecommendationAction } from '@szl-holdings/shared-ui/os-layer';
import { RunConsole } from '@szl-holdings/shared-ui/RunConsole';
import { SourceHealthStrip } from '@szl-holdings/shared-ui/SourceHealthStrip';
import {
  useOsRecommendations,
  useOsSourceHealth,
  useOsRuns,
  useOsEvalResults,
  useOsAction,
} from '@szl-holdings/shared-ui/use-os-data';
import * as React from 'react';

const VARIANT = 'szl-holdings';
const ACCENT = LANE_ACCENT_HEX.lyte.primaryLight;

type Tab = 'decisions' | 'runs';

export default function DecisionCenterPage() {
  const [tab, setTab] = React.useState<Tab>('decisions');
  const { data: recs = [], refetch: refetchRecs } = useOsRecommendations(VARIANT);
  const { data: sources = [] } = useOsSourceHealth(VARIANT);
  const { data: runs = [] } = useOsRuns(VARIANT);
  const { data: evalResults = [] } = useOsEvalResults();
  const actionMutation = useOsAction(VARIANT);

  async function handleAction(id: string, action: RecommendationAction, justification?: string) {
    actionMutation.mutate({ recId: id, action, justification });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gi-bg-surface, #0c1018)' }}>
      <SourceHealthStrip sources={sources} variant={VARIANT} />

      <div
        className="flex gap-1 px-6 pt-4 pb-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {(['decisions', 'runs'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-4 py-2 text-[12px] font-medium capitalize rounded-t transition-colors"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: tab === t ? ACCENT : 'rgba(255,255,255,0.40)',
              borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
            }}
          >
            {t === 'decisions' ? 'Decision Center' : 'Run Console'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'decisions' && (
          <DecisionCenter
            variant="SZL Holdings"
            recommendations={recs}
            onAction={handleAction}
            onRefresh={() => refetchRecs()}
            accentColor={ACCENT}
            className="h-full"
          />
        )}
        {tab === 'runs' && (
          <RunConsole
            variant="SZL Holdings"
            runs={runs}
            evalResults={evalResults}
            onRefresh={() => {}}
            accentColor={ACCENT}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
