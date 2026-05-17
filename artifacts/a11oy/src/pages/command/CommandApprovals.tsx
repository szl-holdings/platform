import { lazy, Suspense } from 'react';
import { CommandShell } from './CommandShell';

const ApprovalQueue = lazy(() =>
  import('../ApprovalQueue').then((m) => ({ default: m.ApprovalQueue })),
);

export function CommandApprovals() {
  return (
    <CommandShell active="approvals">
      <Suspense fallback={<div style={{ color: '#8a8a8a', fontFamily: 'monospace', fontSize: 12 }}>Loading approvals…</div>}>
        <ApprovalQueue />
      </Suspense>
    </CommandShell>
  );
}

export default CommandApprovals;
