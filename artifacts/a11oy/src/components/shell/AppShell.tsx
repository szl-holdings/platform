import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-a11oy-navy)] text-[var(--color-a11oy-text)] flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 flex flex-col relative" style={{ outline: 'none' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
