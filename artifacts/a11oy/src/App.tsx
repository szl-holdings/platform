import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Route, Switch } from 'wouter';
import { GraphQLProvider } from './graphql';
import { AppShell } from './components/shell/AppShell';

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '') || '/a11oy');

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.08)', borderTopColor: '#c9b787' }}
      />
    </div>
  );
}

function WithShell({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
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
const WorkcellDetail = lazy(() => import('./pages/WorkcellDetail').then(m => ({ default: m.WorkcellDetail })));
const WorkcellReplayDetail = lazy(() => import('./pages/WorkcellReplayDetail').then(m => ({ default: m.WorkcellReplayDetail })));
const MirrorEval = lazy(() => import('./pages/MirrorEval').then(m => ({ default: m.MirrorEval })));
const ConnectorFirewall = lazy(() => import('./pages/ConnectorFirewall').then(m => ({ default: m.ConnectorFirewall })));
const TwinFoundry = lazy(() => import('./pages/TwinFoundry').then(m => ({ default: m.TwinFoundry })));
const TrustCenter = lazy(() => import('./pages/TrustCenter').then(m => ({ default: m.TrustCenter })));
const ModelRouter = lazy(() => import('./pages/ModelRouter').then(m => ({ default: m.ModelRouter })));
const SkillsLibrary = lazy(() => import('./pages/SkillsLibrary').then(m => ({ default: m.SkillsLibrary })));
const WorkcellReplay = lazy(() => import('./pages/WorkcellReplay').then(m => ({ default: m.WorkcellReplay })));
const SovereignReplayDetail = lazy(() => import('./pages/SovereignReplayDetail').then(m => ({ default: m.SovereignReplayDetail })));
const Sovereign = lazy(() => import('./pages/Sovereign').then(m => ({ default: m.Sovereign })));
const BoardroomMode = lazy(() => import('./pages/BoardroomMode').then(m => ({ default: m.BoardroomMode })));
const InvestorDemo = lazy(() => import('./pages/InvestorDemo').then(m => ({ default: m.InvestorDemo })));
const Terminal = lazy(() => import('./pages/Terminal').then(m => ({ default: m.Terminal })));
const Fabric = lazy(() => import('./pages/Fabric').then(m => ({ default: m.Fabric })));
const Verticals = lazy(() => import('./pages/Verticals').then(m => ({ default: m.Verticals })));
const Outcomes = lazy(() => import('./pages/Outcomes').then(m => ({ default: m.Outcomes })));
const Memory = lazy(() => import('./pages/Memory').then(m => ({ default: m.Memory })));
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })));
const Pce = lazy(() => import('./pages/Pce').then(m => ({ default: m.Pce })));
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Recommendations = lazy(() => import('./pages/Recommendations').then(m => ({ default: m.Recommendations })));
const ExecutiveBrief = lazy(() => import('./pages/ExecutiveBrief').then(m => ({ default: m.ExecutiveBrief })));
const AgentOrchestration = lazy(() => import('./pages/AgentOrchestration').then(m => ({ default: m.AgentOrchestration })));
const AgentViz = lazy(() => import('./pages/AgentViz').then(m => ({ default: m.AgentViz })));
const DevPlatform = lazy(() => import('./pages/DevPlatform').then(m => ({ default: m.DevPlatform })));
const A11oyCode = lazy(() => import('./pages/A11oyCode').then(m => ({ default: m.A11oyCode })));
const AgentMesh = lazy(() => import('./pages/AgentMesh').then(m => ({ default: m.AgentMesh })));
const PluginHub = lazy(() => import('./pages/PluginHub').then(m => ({ default: m.PluginHub })));
const DeepResearch = lazy(() => import('./pages/DeepResearch').then(m => ({ default: m.DeepResearch })));
const CiAction = lazy(() => import('./pages/CiAction').then(m => ({ default: m.CiAction })));
const AgiConvergence = lazy(() => import('./pages/AgiConvergence').then(m => ({ default: m.AgiConvergence })));
const OmniaAdoptionPage = lazy(() => import('./pages/OmniaAdoption').then(m => ({ default: m.OmniaAdoption })));
const Solutions = lazy(() => import('./pages/Solutions').then(m => ({ default: m.Solutions })));
const ApplicationsCatalog = lazy(() => import('./pages/ApplicationsCatalog').then(m => ({ default: m.ApplicationsCatalog })));
const ConstellationGraph = lazy(() => import('./pages/ConstellationGraph').then(m => ({ default: m.ConstellationGraph })));
const ArchitectureOverview = lazy(() => import('./pages/ArchitectureOverview').then(m => ({ default: m.ArchitectureOverview })));
const ResourcesHub = lazy(() => import('./pages/ResourcesHub').then(m => ({ default: m.ResourcesHub })));
const ControlTower = lazy(() => import('./pages/ControlTower').then(m => ({ default: m.ControlTower })));
const PipelineCanvas = lazy(() => import('./pages/PipelineCanvas').then(m => ({ default: m.PipelineCanvas })));
const IntentRouter = lazy(() => import('./pages/IntentRouter').then(m => ({ default: m.IntentRouter })));
const PlannerCanvas = lazy(() => import('./pages/PlannerCanvas').then(m => ({ default: m.PlannerCanvas })));
const OntologyGraph = lazy(() => import('./pages/OntologyGraph').then(m => ({ default: m.OntologyGraph })));
const LearningLoop = lazy(() => import('./pages/LearningLoop').then(m => ({ default: m.LearningLoop })));
const Counterfactuals = lazy(() => import('./pages/Counterfactuals').then(m => ({ default: m.Counterfactuals })));
const AdversarialResilience = lazy(() => import('./pages/AdversarialResilience').then(m => ({ default: m.AdversarialResilience })));
const FrontierIntelligence = lazy(() => import('./pages/FrontierIntelligence').then(m => ({ default: m.FrontierIntelligence })));
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue').then(m => ({ default: m.ApprovalQueue })));
const VerifierAgent = lazy(() => import('./pages/VerifierAgent').then(m => ({ default: m.VerifierAgent })));
const AtlasSection = lazy(() => import('./pages/AtlasSection').then(m => ({ default: m.AtlasSection })));
const TokensSection = lazy(() => import('./pages/TokensSection').then(m => ({ default: m.TokensSection })));
const VoiceSection = lazy(() => import('./pages/VoiceSection').then(m => ({ default: m.VoiceSection })));
const LibrarySection = lazy(() => import('./pages/LibrarySection').then(m => ({ default: m.LibrarySection })));
const ReleasesSection = lazy(() => import('./pages/ReleasesSection').then(m => ({ default: m.ReleasesSection })));
const AuditSection = lazy(() => import('./pages/AuditSection').then(m => ({ default: m.AuditSection })));

export default function App() {
  return (
    <GraphQLProvider>
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path={`${base}/`} component={HomePage} />
        <Route path={`${base}`} component={HomePage} />
        <Route path={`${base}/now`} component={NowBoard} />
        <Route path={`${base}/recommendations`} component={Recommendations} />
        <Route path={`${base}/brief`} component={ExecutiveBrief} />
        <Route path={`${base}/command`} component={CommandSurface} />
        <Route path={`${base}/signals`} component={SignalMesh} />
        <Route path={`${base}/actions`} component={ActionRail} />
        <Route path={`${base}/proof`} component={ProofLedger} />
        <Route path={`${base}/governance`} component={Governance} />
        <Route path={`${base}/agents`} component={Agents} />
        <Route path={`${base}/workcells/:id/replay`} component={WorkcellReplayDetail} />
        <Route path={`${base}/workcells/:id`} component={WorkcellDetail} />
        <Route path={`${base}/workcells`} component={Workcells} />
        <Route path={`${base}/evals`} component={MirrorEval} />
        <Route path={`${base}/connectors`} component={ConnectorFirewall} />
        <Route path={`${base}/twins`} component={TwinFoundry} />
        <Route path={`${base}/model-router`} component={ModelRouter} />
        <Route path={`${base}/skills`} component={SkillsLibrary} />
        <Route path={`${base}/replay/:id`} component={SovereignReplayDetail} />
        <Route path={`${base}/replay`} component={WorkcellReplay} />
        <Route path={`${base}/trust`} component={TrustCenter} />
        <Route path={`${base}/sovereign`} component={Sovereign} />
        <Route path={`${base}/boardroom`} component={BoardroomMode} />
        <Route path={`${base}/investor-demo`} component={InvestorDemo} />
        <Route path={`${base}/terminal`} component={Terminal} />
        <Route path={`${base}/fabric`} component={Fabric} />
        <Route path={`${base}/verticals`} component={Verticals} />
        <Route path={`${base}/outcomes`} component={Outcomes} />
        <Route path={`${base}/memory`} component={Memory} />
        <Route path={`${base}/tools`} component={Tools} />
        <Route path={`${base}/pce`} component={Pce} />
        <Route path={`${base}/demo`} component={Demo} />
        <Route path={`${base}/orchestration`} component={AgentOrchestration} />
        <Route path={`${base}/agent-viz`} component={AgentViz} />
        <Route path={`${base}/sdk`} component={DevPlatform} />
        <Route path={`${base}/a11oy-code`} component={A11oyCode} />
        <Route path={`${base}/agent-mesh`} component={AgentMesh} />
        <Route path={`${base}/plugins`} component={PluginHub} />
        <Route path={`${base}/deep-research`} component={DeepResearch} />
        <Route path={`${base}/action`} component={CiAction} />
        <Route path={`${base}/convergence`} component={AgiConvergence} />
        <Route path={`${base}/solutions`} component={Solutions} />
        <Route path={`${base}/about`} component={About} />
        <Route path={`${base}/omnia-adoption`} component={OmniaAdoptionPage} />
        <Route path={`${base}/applications`} component={ApplicationsCatalog} />
        <Route path={`${base}/constellation`} component={ConstellationGraph} />
        <Route path={`${base}/architecture`} component={ArchitectureOverview} />
        <Route path={`${base}/resources`} component={ResourcesHub} />
        <Route path={`${base}/control-tower`} component={ControlTower} />
        <Route path={`${base}/pipeline`} component={PipelineCanvas} />
        <Route path={`${base}/intent-router`} component={IntentRouter} />
        <Route path={`${base}/planner`} component={PlannerCanvas} />
        <Route path={`${base}/ontology`} component={OntologyGraph} />
        <Route path={`${base}/learning`} component={LearningLoop} />
        <Route path={`${base}/counterfactuals`} component={Counterfactuals} />
        <Route path={`${base}/adversarial`} component={AdversarialResilience} />
        <Route path={`${base}/frontier`} component={FrontierIntelligence} />
        <Route path={`${base}/approval-queue`} component={ApprovalQueue} />
        <Route path={`${base}/verifier`} component={VerifierAgent} />
        <Route path={`${base}/atlas`}>
          <WithShell><AtlasSection /></WithShell>
        </Route>
        <Route path={`${base}/tokens`}>
          <WithShell><TokensSection /></WithShell>
        </Route>
        <Route path={`${base}/voice`}>
          <WithShell><VoiceSection /></WithShell>
        </Route>
        <Route path={`${base}/library`}>
          <WithShell><LibrarySection /></WithShell>
        </Route>
        <Route path={`${base}/releases`}>
          <WithShell><ReleasesSection /></WithShell>
        </Route>
        <Route path={`${base}/audit`}>
          <WithShell><AuditSection /></WithShell>
        </Route>
        <Route>
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
            <div className="text-center">
              <div className="text-6xl font-display font-bold mb-4" style={{ color: 'var(--color-a11oy-border)' }}>404</div>
              <div className="text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Page not found</div>
              <a href={`${base}/`} className="mt-4 inline-block text-sm" style={{ color: '#c9b787' }}>← Back to A11oy</a>
            </div>
          </div>
        </Route>
      </Switch>
    </Suspense>
    </GraphQLProvider>
  );
}
