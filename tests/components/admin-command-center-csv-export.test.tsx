import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCommandCenter from '../../artifacts/szl-holdings/src/pages/admin-command-center';

vi.mock('@szl-holdings/replit-auth-web', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { displayName: 'Admin User', avatarUrl: null },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('@szl-holdings/api-client-react', () => ({
  useStandardQuery: vi.fn().mockReturnValue({
    data: { tickets: [], total: 0, openTotal: 0, logs: [], tenants: [], users: [], roles: [] },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useStandardMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@szl-holdings/shared-ui/use-user-preferences', () => ({
  useUserPreferences: vi.fn().mockReturnValue({
    prefs: {},
    setPreference: vi.fn(),
    isLoaded: true,
  }),
}));

vi.mock('@szl-holdings/shared-ui/EmptyState', () => ({
  EmptyState: ({ headline }: { headline: string }) => React.createElement('div', null, headline),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  m: new Proxy({} as Record<string, unknown>, {
    get:
      (_, tag: string) =>
      ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
        React.createElement(tag, rest, children),
  }),
}));

vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
  useLocation: vi.fn().mockReturnValue(['/', vi.fn()]),
}));

function makeCsvResponse(): Response {
  return new Response(new Blob(['id,name\n1,test'], { type: 'text/csv' }), { status: 200 });
}

function makeJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: makeQueryClient() }, children);
}

describe('Admin Command Center — CSV Export Loading Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  function setupFetch(exportFactory: () => Promise<Response> | Response) {
    vi.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = url.toString();
      if (path.includes('/admin/support-queue') || path.includes('/admin/audit-log')) {
        return Promise.resolve(exportFactory()) as Promise<Response>;
      }
      if (path.includes('/auth/my-roles')) {
        return Promise.resolve(makeJsonResponse({ roles: ['super_admin'] }));
      }
      return Promise.resolve(makeJsonResponse({}));
    });
  }

  async function renderAndNavigateTo(section: 'Support Queue' | 'Audit Log') {
    render(React.createElement(Wrapper, null, React.createElement(AdminCommandCenter)));
    await waitFor(() => {
      expect(screen.queryByText(section)).toBeTruthy();
    });
    fireEvent.click(screen.getByText(section));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Export CSV/i })).toBeTruthy();
    });
  }

  describe('Support Queue export button', () => {
    it('shows "Export CSV" label when idle', async () => {
      setupFetch(() => makeCsvResponse());
      await renderAndNavigateTo('Support Queue');
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeTruthy();
    });

    it('shows "Exporting…" and disables the button while fetch is in progress', async () => {
      let capturedResolve!: (v: Response) => void;
      setupFetch(() => new Promise((res) => { capturedResolve = res; }));

      await renderAndNavigateTo('Support Queue');

      const btn = screen.getByRole('button', { name: /Export CSV/i });
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);

      await waitFor(() => expect(screen.queryByText('Exporting…')).toBeTruthy());

      const loadingBtn = screen.getByRole('button', { name: /Exporting/i });
      expect(loadingBtn).toBeDisabled();

      await act(async () => { capturedResolve(makeCsvResponse()); });
    });

    it('re-enables the button and shows "Downloaded" after the download completes', async () => {
      let capturedResolve!: (v: Response) => void;
      setupFetch(() => new Promise((res) => { capturedResolve = res; }));

      await renderAndNavigateTo('Support Queue');

      const btn = screen.getByRole('button', { name: /Export CSV/i });
      fireEvent.click(btn);

      await waitFor(() => expect(screen.queryByText('Exporting…')).toBeTruthy());

      await act(async () => { capturedResolve(makeCsvResponse()); });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).not.toBeDisabled();
        expect(screen.queryByText('Exporting…')).toBeNull();
        expect(screen.queryByText('Downloaded')).toBeTruthy();
      });
    });

    it('prevents double-click: the button is disabled while exporting', async () => {
      setupFetch(() => new Promise(() => {}));

      await renderAndNavigateTo('Support Queue');

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /Export CSV/i }));

      await waitFor(() => expect(screen.queryByText('Exporting…')).toBeTruthy());

      const exportingBtn = screen.getByRole('button', { name: /Exporting/i });
      expect(exportingBtn).toBeDisabled();
    });
  });

  describe('Audit Log export button', () => {
    it('shows "Export CSV" label when idle', async () => {
      setupFetch(() => makeCsvResponse());
      await renderAndNavigateTo('Audit Log');
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeTruthy();
    });

    it('shows "Exporting…" and disables the button while fetch is in progress', async () => {
      let capturedResolve!: (v: Response) => void;
      setupFetch(() => new Promise((res) => { capturedResolve = res; }));

      await renderAndNavigateTo('Audit Log');

      const btn = screen.getByRole('button', { name: /Export CSV/i });
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);

      await waitFor(() => expect(screen.queryByText('Exporting…')).toBeTruthy());

      const loadingBtn = screen.getByRole('button', { name: /Exporting/i });
      expect(loadingBtn).toBeDisabled();

      await act(async () => { capturedResolve(makeCsvResponse()); });
    });

    it('re-enables the button and shows "Downloaded" after the download completes', async () => {
      let capturedResolve!: (v: Response) => void;
      setupFetch(() => new Promise((res) => { capturedResolve = res; }));

      await renderAndNavigateTo('Audit Log');

      const btn = screen.getByRole('button', { name: /Export CSV/i });
      fireEvent.click(btn);

      await waitFor(() => expect(screen.queryByText('Exporting…')).toBeTruthy());

      await act(async () => { capturedResolve(makeCsvResponse()); });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).not.toBeDisabled();
        expect(screen.queryByText('Exporting…')).toBeNull();
        expect(screen.queryByText('Downloaded')).toBeTruthy();
      });
    });
  });
});
