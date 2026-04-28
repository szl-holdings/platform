import type { ReactNode } from 'react';

interface ContinuumLayoutProps {
  children: ReactNode;
}

export function ContinuumLayout({ children }: ContinuumLayoutProps) {
  return <>{children}</>;
}
