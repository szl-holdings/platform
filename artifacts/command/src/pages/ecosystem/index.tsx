import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { EcosystemLayout } from './layout';

const TopologyMap = lazy(() =>
  import('./topology-map').then((m) => ({ default: m.TopologyMapPage })),
);
const AgentObservatory = lazy(() =>
  import('./agent-observatory').then((m) => ({ default: m.AgentObservatoryPage })),
);
const ToolInspector = lazy(() =>
  import('./tool-inspector').then((m) => ({ default: m.ToolInspectorPage })),
);
const CounterfactualStudio = lazy(() =>
  import('./counterfactual-studio').then((m) => ({ default: m.CounterfactualStudioPage })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(201,162,39,0.25)', borderTopColor: '#c9a227' }}
      />
    </div>
  );
}

export function EcosystemCommandCenter() {
  return (
    <EcosystemLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/ecosystem/observatory" component={AgentObservatory} />
          <Route path="/ecosystem/inspector" component={ToolInspector} />
          <Route path="/ecosystem/counterfactual" component={CounterfactualStudio} />
          <Route component={TopologyMap} />
        </Switch>
      </Suspense>
    </EcosystemLayout>
  );
}
