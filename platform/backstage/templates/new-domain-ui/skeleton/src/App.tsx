import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter basename="/${{ values.domainSlug }}">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
