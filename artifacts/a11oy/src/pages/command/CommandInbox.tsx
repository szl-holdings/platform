import { lazy, Suspense } from 'react';
import { CommandShell } from './CommandShell';

const FrontierInbox = lazy(() =>
  import('../FrontierInbox').then((m) => ({ default: m.FrontierInbox })),
);

export function CommandInbox() {
  return (
    <CommandShell active="inbox">
      <Suspense fallback={<div style={{ color: '#8a8a8a', fontFamily: 'monospace', fontSize: 12 }}>Loading inbox…</div>}>
        <FrontierInbox />
      </Suspense>
    </CommandShell>
  );
}

export default CommandInbox;
