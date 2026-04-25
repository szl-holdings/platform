import { Route, Switch, Redirect } from 'wouter';
import { OrgProvider } from './context/OrgContext';
import { AppShell } from './components/shell/AppShell';
import { AtlasSection } from './pages/AtlasSection';
import { TokensSection } from './pages/TokensSection';
import { VoiceSection } from './pages/VoiceSection';
import { LibrarySection } from './pages/LibrarySection';
import { ReleasesSection } from './pages/ReleasesSection';
import { AuditSection } from './pages/AuditSection';

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '') || '/a11oy');

export default function App() {
  return (
    <OrgProvider>
      <AppShell>
        <Switch>
          <Route path={`${base}/`} component={() => <Redirect to={`${base}/atlas`} />} />
          <Route path={`${base}`} component={() => <Redirect to={`${base}/atlas`} />} />
          <Route path={`${base}/atlas`} component={AtlasSection} />
          <Route path={`${base}/tokens`} component={TokensSection} />
          <Route path={`${base}/voice`} component={VoiceSection} />
          <Route path={`${base}/library`} component={LibrarySection} />
          <Route path={`${base}/releases`} component={ReleasesSection} />
          <Route path={`${base}/audit`} component={AuditSection} />
          <Route>
            <div className="p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-display text-[var(--color-a11oy-text)] mb-2">Section Not Found</h2>
                <p className="text-[var(--color-a11oy-text-sub)]">The requested orchestration module does not exist.</p>
              </div>
            </div>
          </Route>
        </Switch>
      </AppShell>
    </OrgProvider>
  );
}
