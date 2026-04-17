export interface RateLimitBucketState {
  windowStart: number;
  count: number;
}

export interface RateLimitState {
  minute: RateLimitBucketState;
  hour: RateLimitBucketState;
  concurrentActive: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

export class ToolRateLimiter {
  private readonly state = new Map<string, RateLimitState>();

  private getState(toolId: string): RateLimitState {
    if (!this.state.has(toolId)) {
      this.state.set(toolId, {
        minute: { windowStart: Date.now(), count: 0 },
        hour: { windowStart: Date.now(), count: 0 },
        concurrentActive: 0,
      });
    }
    return this.state.get(toolId)!;
  }

  check(
    toolId: string,
    limits: { requestsPerMinute?: number; requestsPerHour?: number; concurrency?: number },
  ): RateLimitCheck {
    const now = Date.now();
    const s = this.getState(toolId);

    if (limits.concurrency !== undefined && s.concurrentActive >= limits.concurrency) {
      return {
        allowed: false,
        reason: `Tool '${toolId}' at concurrency limit (${limits.concurrency})`,
      };
    }

    if (limits.requestsPerMinute !== undefined) {
      const windowMs = 60_000;
      const elapsed = now - s.minute.windowStart;
      if (elapsed > windowMs) {
        s.minute.windowStart = now;
        s.minute.count = 0;
      }
      if (s.minute.count >= limits.requestsPerMinute) {
        return {
          allowed: false,
          reason: `Tool '${toolId}' rate limit exceeded (${limits.requestsPerMinute} req/min)`,
          retryAfterMs: windowMs - elapsed,
        };
      }
    }

    if (limits.requestsPerHour !== undefined) {
      const windowMs = 3_600_000;
      const elapsed = now - s.hour.windowStart;
      if (elapsed > windowMs) {
        s.hour.windowStart = now;
        s.hour.count = 0;
      }
      if (s.hour.count >= limits.requestsPerHour) {
        return {
          allowed: false,
          reason: `Tool '${toolId}' hourly rate limit exceeded (${limits.requestsPerHour} req/hr)`,
          retryAfterMs: windowMs - elapsed,
        };
      }
    }

    return { allowed: true };
  }

  increment(toolId: string): void {
    const s = this.getState(toolId);
    s.minute.count += 1;
    s.hour.count += 1;
    s.concurrentActive += 1;
  }

  decrement(toolId: string): void {
    const s = this.getState(toolId);
    s.concurrentActive = Math.max(0, s.concurrentActive - 1);
  }

  reset(toolId: string): void {
    this.state.delete(toolId);
  }
}

export const defaultRateLimiter = new ToolRateLimiter();
