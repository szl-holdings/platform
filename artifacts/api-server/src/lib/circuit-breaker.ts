/**
 * circuit-breaker.ts
 *
 * Generic circuit breaker utility (inspired by Netflix Hystrix / Polly.NET patterns).
 * Wraps async calls with configurable failure thresholds, open-duration, and
 * half-open probe logic. Emits OpenTelemetry span events on state transitions.
 *
 * States:
 *   closed   → normal operation; failures are counted
 *   open     → fast-fail; no calls pass through until recoveryMs elapses
 *   half-open → single probe admitted at a time; concurrent callers fast-fail;
 *               success closes, failure re-opens
 *
 * Rolling metrics:
 *   - Last 100 latencies kept for p50/p95/p99 percentile computation
 *   - 60-second sliding window for error-rate calculation
 */

import { logger } from './logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  recoveryMs?: number;
  successThreshold?: number;
  timeoutMs?: number;
  /** Max latency samples to retain for percentile computation (default 100) */
  latencyBufferSize?: number;
  /** Window in ms for rolling error-rate calculation (default 60_000) */
  errorRateWindowMs?: number;
}

export interface LatencyPercentiles {
  p50: number | null;
  p95: number | null;
  p99: number | null;
  sampleCount: number;
}

export interface RollingErrorRate {
  calls: number;
  failures: number;
  errorPct: number;
  windowMs: number;
}

export interface CircuitBreakerSnapshot {
  name: string;
  state: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  openedAt: number | null;
  lastTransitionAt: number | null;
  lastErrorMessage?: string;
  latency: LatencyPercentiles;
  rollingErrorRate: RollingErrorRate;
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker '${name}' is OPEN — fast-failing request`);
    this.name = 'CircuitBreakerOpenError';
  }
}

interface RollingEntry {
  ts: number;
  failed: boolean;
}

export class CircuitBreaker {
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly recoveryMs: number;
  private readonly successThreshold: number;
  private readonly timeoutMs: number | null;
  private readonly latencyBufferSize: number;
  private readonly errorRateWindowMs: number;

  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private openedAt: number | null = null;
  private lastTransitionAt: number | null = null;
  private lastErrorMessage: string | undefined;

  /**
   * probeInFlight tracks whether an active probe is in-flight during half-open.
   * If true, concurrent callers fast-fail (CircuitBreakerOpenError) so we never
   * allow more than one probe at a time under recovery.
   */
  private probeInFlight = false;

  /** Circular buffer of recent call latencies (ms) for percentile computation */
  private readonly latencies: number[] = [];

  /** Sliding window of recent call outcomes for error-rate calculation */
  private readonly rollingWindow: RollingEntry[] = [];

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.recoveryMs = options.recoveryMs ?? 30_000;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeoutMs = options.timeoutMs ?? null;
    this.latencyBufferSize = options.latencyBufferSize ?? 100;
    this.errorRateWindowMs = options.errorRateWindowMs ?? 60_000;
  }

  get currentState(): CircuitState {
    return this._evaluateState();
  }

  private _evaluateState(): CircuitState {
    if (this.state === 'open') {
      const elapsed = Date.now() - (this.openedAt ?? 0);
      if (elapsed >= this.recoveryMs) {
        this._transition('half-open', 'recovery window elapsed');
      }
    }
    return this.state;
  }

  private _transition(next: CircuitState, reason: string): void {
    const prev = this.state;
    this.state = next;
    this.lastTransitionAt = Date.now();

    if (next !== 'half-open') {
      this.probeInFlight = false;
    }

    logger.info(
      { circuitBreaker: this.name, from: prev, to: next, reason },
      `[circuit-breaker] State transition: ${prev} → ${next}`,
    );

    try {
      const { trace } = require('@opentelemetry/api');
      const span = trace.getActiveSpan();
      if (span) {
        span.addEvent('circuit_breaker.transition', {
          'circuit.name': this.name,
          'circuit.state.from': prev,
          'circuit.state.to': next,
          'circuit.reason': reason,
        });
      }
    } catch {
    }
  }

  isOpen(): boolean {
    return this._evaluateState() === 'open';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this._evaluateState();
    this.totalCalls++;

    if (state === 'open') {
      this.totalFailures++;
      throw new CircuitBreakerOpenError(this.name);
    }

    if (state === 'half-open') {
      if (this.probeInFlight) {
        // Another probe is already running — fast-fail all concurrent callers
        this.totalFailures++;
        throw new CircuitBreakerOpenError(this.name);
      }
      this.probeInFlight = true;
    }

    const start = Date.now();
    try {
      let result: T;
      if (this.timeoutMs !== null) {
        result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Circuit breaker '${this.name}' timeout after ${this.timeoutMs}ms`)),
              this.timeoutMs!,
            ),
          ),
        ]);
      } else {
        result = await fn();
      }

      this._onSuccess(Date.now() - start);
      return result;
    } catch (err) {
      if (err instanceof CircuitBreakerOpenError) throw err;
      this._onFailure(err instanceof Error ? err.message : String(err), Date.now() - start);
      throw err;
    }
  }

  private _recordLatency(latencyMs: number): void {
    if (this.latencies.length >= this.latencyBufferSize) {
      this.latencies.shift();
    }
    this.latencies.push(latencyMs);
  }

  private _recordRolling(failed: boolean): void {
    const now = Date.now();
    this.rollingWindow.push({ ts: now, failed });
    // Evict expired entries
    const cutoff = now - this.errorRateWindowMs;
    while (this.rollingWindow.length > 0 && this.rollingWindow[0].ts < cutoff) {
      this.rollingWindow.shift();
    }
  }

  private _onSuccess(latencyMs: number): void {
    this.totalSuccesses++;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses++;
    this._recordLatency(latencyMs);
    this._recordRolling(false);

    if (this.state === 'half-open') {
      this.probeInFlight = false;
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.consecutiveSuccesses = 0;
        this.openedAt = null;
        this._transition('closed', `${this.successThreshold} consecutive successes in half-open`);
      }
    }

    logger.debug(
      { circuitBreaker: this.name, latencyMs, consecutiveSuccesses: this.consecutiveSuccesses },
      '[circuit-breaker] Call succeeded',
    );
  }

  private _onFailure(errorMessage: string, latencyMs: number): void {
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastErrorMessage = errorMessage;
    this._recordLatency(latencyMs);
    this._recordRolling(true);

    if (this.state === 'half-open') {
      this.probeInFlight = false;
      this._transition('open', `probe failed: ${errorMessage}`);
      this.openedAt = Date.now();
      return;
    }

    if (this.state === 'closed' && this.consecutiveFailures >= this.failureThreshold) {
      this._transition('open', `${this.consecutiveFailures} consecutive failures: ${errorMessage}`);
      this.openedAt = Date.now();
      return;
    }

    logger.warn(
      {
        circuitBreaker: this.name,
        latencyMs,
        consecutiveFailures: this.consecutiveFailures,
        threshold: this.failureThreshold,
        errorMessage,
      },
      '[circuit-breaker] Call failed',
    );
  }

  private _computePercentiles(): LatencyPercentiles {
    if (this.latencies.length === 0) {
      return { p50: null, p95: null, p99: null, sampleCount: 0 };
    }
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const at = (pct: number) => {
      const idx = Math.min(Math.floor(pct * sorted.length), sorted.length - 1);
      return sorted[idx];
    };
    return {
      p50: at(0.5),
      p95: at(0.95),
      p99: at(0.99),
      sampleCount: sorted.length,
    };
  }

  private _computeRollingErrorRate(): RollingErrorRate {
    const now = Date.now();
    const cutoff = now - this.errorRateWindowMs;
    const recent = this.rollingWindow.filter((e) => e.ts >= cutoff);
    const failures = recent.filter((e) => e.failed).length;
    const calls = recent.length;
    return {
      calls,
      failures,
      errorPct: calls === 0 ? 0 : Math.round((failures / calls) * 10000) / 100,
      windowMs: this.errorRateWindowMs,
    };
  }

  getSnapshot(): CircuitBreakerSnapshot {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      openedAt: this.openedAt,
      lastTransitionAt: this.lastTransitionAt,
      lastErrorMessage: this.lastErrorMessage,
      latency: this._computePercentiles(),
      rollingErrorRate: this._computeRollingErrorRate(),
    };
  }

  reset(): void {
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = null;
    this.probeInFlight = false;
    logger.info({ circuitBreaker: this.name }, '[circuit-breaker] Manually reset to closed');
  }
}

const registry = new Map<string, CircuitBreaker>();

export function getOrCreateCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  let cb = registry.get(options.name);
  if (!cb) {
    cb = new CircuitBreaker(options);
    registry.set(options.name, cb);
  }
  return cb;
}

export function getAllCircuitBreakerSnapshots(): CircuitBreakerSnapshot[] {
  return Array.from(registry.values()).map((cb) => cb.getSnapshot());
}

export function resetCircuitBreaker(name: string): boolean {
  const cb = registry.get(name);
  if (!cb) return false;
  cb.reset();
  return true;
}
