import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';

const BASE = import.meta.env.BASE_URL;

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash(BASE || '/a11oy');

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-a11oy-navy)' }}>
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(59,130,246,0.2)', borderTopColor: '#3b82f6' }}
      />
    </div>
  );
}

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const NowBoard = lazy(() => import('./pages/NowBoard').then(m => ({ default: m.NowBoard })));
const CommandSurface = lazy(() => import('./pages/CommandSurface').then(m => ({ default: m.CommandSurface })));
const SignalMesh = lazy(() => import('./pages/SignalMesh').then(m => ({ default: m.SignalMesh })));
const ActionRail = lazy(() => import('./pages/ActionRail').then(m => ({ default: m.ActionRail })));
const ProofLedger = lazy(() => import('./pages/ProofLedger').then(m => ({ default: m.ProofLedger })));
const Governance = lazy(() => import('./pages/Governance').then(m => ({ default: m.Governance })));
const Agents = lazy(() => import('./pages/Agents').then(m => ({ default: m.Agents })));
const Workcells = lazy(() => import('./pages/Workcells').then(m => ({ default: m.Workcells })));
const MirrorEval = lazy(() => import('./pages/MirrorEval').then(m => ({ default: m.MirrorEval })));
const ConnectorFirewall = lazy(() => import('./pages/ConnectorFirewall').then(m => ({ default: m.ConnectorFirewall })));
const TwinFoundry = lazy(() => import('./pages/TwinFoundry').then(m => ({ default: m.TwinFoundry })));
const TrustCenter = lazy(() => import('./pages/TrustCenter').then(m => ({ default: m.TrustCenter })));
const ModelRouter = lazy(() => import('./pages/ModelRouter').then(m => ({ default: m.ModelRouter })));
const SkillsLibrary = lazy(() => import('./pages/SkillsLibrary').then(m => ({ default: m.SkillsLibrary })));
const WorkcellReplay = lazy(() => import('./pages/WorkcellReplay').then(m => ({ default: m.WorkcellReplay })));
const Sovereign = lazy(() => import('./pages/Sovereign').then(m => ({ default: m.Sovereign })));
const BoardroomMode = lazy(() => import('./pages/BoardroomMode').then(m => ({ default: m.BoardroomMode })));
const InvestorDemo = lazy(() => import('./pages/InvestorDemo').then(m => ({ default: m.InvestorDemo })));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path={`${base}/`} component={HomePage} />
        <Route path={`${base}`} component={HomePage} />
        <Route path={`${base}/now`} component={NowBoard} />
        <Route path={`${base}/command`} component={CommandSurface} />
        <Route path={`${base}/signals`} component={SignalMesh} />
        <Route path={`${base}/actions`} component={ActionRail} />
        <Route path={`${base}/proof`} component={ProofLedger} />
        <Route path={`${base}/governance`} component={Governance} />
        <Route path={`${base}/agents`} component={Agents} />
        <Route path={`${base}/workcells`} component={Workcells} />
        <Route path={`${base}/evals`} component={MirrorEval} />
        <Route path={`${base}/connectors`} component={ConnectorFirewall} />
        <Route path={`${base}/twins`} component={TwinFoundry} />
        <Route path={`${base}/trust`} component={TrustCenter} />
        <Route path={`${base}/model-router`} component={ModelRouter} />
        <Route path={`${base}/skills`} component={SkillsLibrary} />
        <Route path={`${base}/replay`} component={WorkcellReplay} />
        <Route path={`${base}/sovereign`} component={Sovereign} />
        <Route path={`${base}/boardroom`} component={BoardroomMode} />
        <Route path={`${base}/investor-demo`} component={InvestorDemo} />
        <Route>
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
            <div className="text-center">
              <div className="text-6xl font-display font-bold mb-4" style={{ color: 'var(--color-a11oy-border)' }}>404</div>
              <div className="text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Page not found</div>
              <a href={`${base}/`} className="mt-4 inline-block text-sm" style={{ color: '#3b82f6' }}>← Back to A11oy</a>
            </div>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}
