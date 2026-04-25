import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { ComingSoon } from './pages/ComingSoon';

const BASE = import.meta.env.BASE_URL;

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash(BASE || '/a11oy');

export default function App() {
  return (
    <Switch>
      <Route path={`${base}/`} component={HomePage} />
      <Route path={`${base}`} component={HomePage} />
      <Route path={`${base}/command`}>
        <ComingSoon title="Command Surface" route="/command" />
      </Route>
      <Route path={`${base}/fabric`}>
        <ComingSoon title="Fabric Explorer" route="/fabric" />
      </Route>
      <Route path={`${base}/workcells`}>
        <ComingSoon title="Workcells" route="/workcells" />
      </Route>
      <Route path={`${base}/proof`}>
        <ComingSoon title="Proof Ledger" route="/proof" />
      </Route>
      <Route>
        <ComingSoon title="Page Not Found" route="404" />
      </Route>
    </Switch>
  );
}
