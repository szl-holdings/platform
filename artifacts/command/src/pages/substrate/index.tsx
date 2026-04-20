import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { SubstrateLayout } from "./layout";
import { MOCK_PENDING_APPROVALS } from "./mock-data";

const TrajectoryMap = lazy(() => import("./trajectory-map").then(m => ({ default: m.TrajectoryMap })));
const RunDetail = lazy(() => import("./run-detail").then(m => ({ default: m.RunDetail })));
const CounterfactualViewer = lazy(() => import("./counterfactual").then(m => ({ default: m.CounterfactualViewer })));
const ApprovalQueue = lazy(() => import("./approval-queue").then(m => ({ default: m.ApprovalQueue })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(34,211,238,0.25)", borderTopColor: "#22d3ee" }} />
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
          <Route component={TrajectoryMap} />
        </Switch>
      </Suspense>
    </SubstrateLayout>
  );
}
