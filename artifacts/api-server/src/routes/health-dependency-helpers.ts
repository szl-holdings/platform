import { pool } from '@szl-holdings/db';

export function getPoolStats(): {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  max: number;
  usedPct: number;
  status: 'ok' | 'elevated' | 'saturated';
} {
  const total = (pool as unknown as { totalCount: number }).totalCount ?? 0;
  const idle = (pool as unknown as { idleCount: number }).idleCount ?? 0;
  const waiting = (pool as unknown as { waitingCount: number }).waitingCount ?? 0;
  const max = ((pool as unknown as { options?: { max?: number } }).options?.max ?? 10) || 10;
  const active = Math.max(0, total - idle);
  const usedPct = max > 0 ? (active / max) * 100 : 0;
  let status: 'ok' | 'elevated' | 'saturated' = 'ok';
  if (usedPct > 80 || waiting > 0) status = 'saturated';
  else if (usedPct > 60) status = 'elevated';
  return { total, idle, active, waiting, max, usedPct: Math.round(usedPct * 10) / 10, status };
}
