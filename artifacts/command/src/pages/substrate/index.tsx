import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { SubstrateLayout } from './layout';
import { MOCK_PENDING_APPROVALS } from './mock-data';

const TrajectoryMap = lazy(() =>
  import('./trajectory-map').then((m) => ({ default: m.TrajectoryMap })),
);
const RunDetail = lazy(() => import('./run-detail').then((m) => ({ default: m.RunDetail })));
const CounterfactualViewer = lazy(() =>
  import('./counterfactual').then((m) => ({ default: m.CounterfactualViewer })),
);
const ApprovalQueue = lazy(() =>
  import('./approval-queue').then((m) => ({ default: m.ApprovalQueue })),
);
const GovernedApprovals = lazy(() =>
  import('./governed-approvals').then((m) => ({ default: m.GovernedApprovals })),
);
const RunLedgerPage = lazy(() =>
  import('./run-ledger').then((m) => ({ default: m.RunLedgerPage })),
);
const RunLedgerList = lazy(() =>
  import('./run-ledger').then((m) => ({ default: m.RunLedgerList })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(34,211,238,0.25)', borderTopColor: '#22d3ee' }}
      />
    </div>
  );
}

export function SubstrateCommandCenter() {
  const pendingCount = MOCK_PENDING_APPROVALS.length;

  return (
    <SubstrateLayout pendingCount={pendingCount}>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/substrate/runs/:id" component={RunDetail} />
          <Route path="/substrate/counterfactual" component={CounterfactualViewer} />
          <Route path="/substrate/approvals" component={ApprovalQueue} />
          {/* ACR governed approval interrupts — backed by /api/v1/approvals */}
          <Route path="/substrate/governed-approvals" component={GovernedApprovals} />
          {/* ACR Run Ledger — backed by /api/v1/runs */}
          <Route path="/substrate/ledger" component={RunLedgerList} />
          <Route path="/substrate/ledger/:runId" component={RunLedgerPage} />
          <Route component={TrajectoryMap} />
        </Switch>
      </Suspense>
    </SubstrateLayout>
  );
}
