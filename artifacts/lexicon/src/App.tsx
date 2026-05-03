import { Switch, Route } from 'wouter';
import HomePage from './pages/HomePage';
import LicensePage from './pages/LicensePage';
import ComparePage from './pages/ComparePage';
import RecommenderPage from './pages/RecommenderPage';
import MatrixPage from './pages/MatrixPage';
import FamilyTreePage from './pages/FamilyTreePage';
import ApiDocsPage from './pages/ApiDocsPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path={`${BASE}/`} component={HomePage} />
        <Route path={`${BASE}`} component={HomePage} />
        <Route path={`${BASE}/license/:id`} component={LicensePage} />
        <Route path={`${BASE}/compare`} component={ComparePage} />
        <Route path={`${BASE}/recommender`} component={RecommenderPage} />
        <Route path={`${BASE}/matrix`} component={MatrixPage} />
        <Route path={`${BASE}/families`} component={FamilyTreePage} />
        <Route path={`${BASE}/api`} component={ApiDocsPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Layout>
  );
}
