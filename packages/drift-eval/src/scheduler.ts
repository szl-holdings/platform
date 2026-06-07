import type { EvalRegistry, ScheduledJobConfig } from './types.js';
import { detectDrift } from './drift.js';
import { runChampionChallenger } from './champion-challenger.js';

export interface SchedulerHandle {
  stop(): void;
  readonly isRunning: boolean;
}

function log(level: 'info' | 'warn' | 'error', msg: string, meta?: unknown): void {
  const entry = { level, msg, meta, ts: new Date().toISOString() };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

async function runDriftJob(headName: string, registry: EvalRegistry): Promise<void> {
  try {
    const result = await detectDrift(headName, registry);
    if (result) {
      log('info', 'drift-job completed', { headName, driftScore: result.driftScore, severity: result.severity });
    }
  } catch (err) {
    log('error', 'drift-job failed', { headName, error: String(err) });
  }
}

async function runCCJob(headName: string, registry: EvalRegistry): Promise<void> {
  try {
    const champion = await registry.latestSnapshot(`${headName}::champion`);
    const challenger = await registry.latestSnapshot(`${headName}::challenger`);
    if (!champion || !challenger) {
      log('info', 'cc-job skipped: no champion/challenger snapshots yet', { headName });
      return;
    }
    const result = await runChampionChallenger(headName, champion, challenger, registry);
    log('info', 'cc-job completed', { headName, outcome: result.outcome, improvementDelta: result.improvementDelta });
  } catch (err) {
    log('error', 'cc-job failed', { headName, error: String(err) });
  }
}

class DriftEvalScheduler implements SchedulerHandle {
  private _isRunning = false;
  private timers: ReturnType<typeof setInterval>[] = [];

  get isRunning(): boolean {
    return this._isRunning;
  }

  start(configs: ScheduledJobConfig[], registry: EvalRegistry): void {
    if (this._isRunning) return;
    this._isRunning = true;

    for (const cfg of configs) {
      const driftTimer = setInterval(() => {
        void runDriftJob(cfg.headName, registry);
      }, cfg.driftIntervalMs);

      const ccTimer = setInterval(() => {
        void runCCJob(cfg.headName, registry);
      }, cfg.ccIntervalMs);

      this.timers.push(driftTimer, ccTimer);
    }

    log('info', 'drift-eval scheduler started', { headCount: configs.length });
  }

  stop(): void {
    for (const t of this.timers) {
      clearInterval(t);
    }
    this.timers = [];
    this._isRunning = false;
    log('info', 'drift-eval scheduler stopped');
  }
}

export const globalScheduler = new DriftEvalScheduler();

export function startDriftEvalScheduler(
  configs: ScheduledJobConfig[],
  registry: EvalRegistry,
): SchedulerHandle {
  globalScheduler.start(configs, registry);
  return globalScheduler;
}

export function defaultSchedulerConfigs(headNames: string[]): ScheduledJobConfig[] {
  return headNames.map((headName) => ({
    headName,
    driftIntervalMs: 6 * 60 * 60 * 1000,
    ccIntervalMs: 24 * 60 * 60 * 1000,
  }));
}
