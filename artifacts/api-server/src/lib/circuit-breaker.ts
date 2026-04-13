import { logger } from "./logger";

interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  recoveryWindowMs?: number;
}

type CircuitState = "closed" | "open" | "half-open";

interface CircuitStatus {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
  lastFailureReason: string | null;
}

const circuits = new Map<string, CircuitStatus>();

function getCircuit(name: string, failureThreshold: number): CircuitStatus {
  if (!circuits.has(name)) {
    circuits.set(name, { state: "closed", failures: 0, openedAt: null, lastFailureReason: null });
  }
  return circuits.get(name)!;
}

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  opts: CircuitBreakerOptions
): Promise<T> {
  const { name, failureThreshold = 5, recoveryWindowMs = 120000 } = opts;
  const circuit = getCircuit(name, failureThreshold);

  if (circuit.state === "open") {
    const elapsed = Date.now() - (circuit.openedAt ?? 0);
    if (elapsed < recoveryWindowMs) {
      throw new Error(`[CircuitBreaker:${name}] Circuit open — backing off until ${new Date((circuit.openedAt ?? 0) + recoveryWindowMs).toISOString()}. Last failure: ${circuit.lastFailureReason}`);
    }
    circuit.state = "half-open";
    logger.debug({ name }, "[CircuitBreaker] Entering half-open state");
  }

  try {
    const result = await fn();
    if (circuit.state === "half-open") {
      circuit.state = "closed";
      circuit.failures = 0;
      circuit.openedAt = null;
      circuit.lastFailureReason = null;
      logger.info({ name }, "[CircuitBreaker] Circuit closed after successful probe");
    } else if (circuit.failures > 0) {
      circuit.failures = 0;
    }
    return result;
  } catch (err) {
    circuit.failures += 1;
    circuit.lastFailureReason = err instanceof Error ? err.message : String(err);

    if (circuit.failures >= failureThreshold || circuit.state === "half-open") {
      circuit.state = "open";
      circuit.openedAt = Date.now();
      logger.warn({ name, failures: circuit.failures, reason: circuit.lastFailureReason }, "[CircuitBreaker] Circuit opened");
    }
    throw err;
  }
}

export async function fetchWithBackoff(url: string, opts: { timeoutMs?: number; maxRetries?: number; label?: string } = {}): Promise<unknown> {
  const { timeoutMs = 8000, maxRetries = 3, label = url } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 30000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "SZL-Intelligence/1.0", Accept: "application/json" },
      });
      clearTimeout(timer);
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000 * (attempt + 1);
        logger.debug({ label, attempt, waitMs }, "[fetchWithBackoff] Rate limited (429) — waiting before retry");
        lastErr = new Error(`HTTP 429 rate limited`);
        await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 60000)));
        continue;
      }
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`HTTP ${res.status} (client error — not retrying)`);
        }
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      return res.json();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (err instanceof Error && err.message.includes("client error")) {
        throw err;
      }
      logger.debug({ label, attempt, err }, "[fetchWithBackoff] Fetch attempt failed");
    }
  }

  throw lastErr ?? new Error(`[fetchWithBackoff] All ${maxRetries} attempts failed for ${label}`);
}
