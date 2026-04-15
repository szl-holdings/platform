export type ServiceStatus =
  | "LIVE_CONFIGURED"
  | "MOCKED_DEMO_MODE"
  | "MANUAL_REQUIRED";

export interface ServiceHealthReport {
  name: string;
  status: ServiceStatus;
  description: string;
  requiredEnvVars: string[];
  presentEnvVars: string[];
  missingEnvVars: string[];
  lastChecked: string | null;
  lastError: string | null;
  errorCount: number;
  responseTimeMs: number | null;
  lastSuccessfulCheck: string | null;
  consecutiveFailures: number;
  retryState: "idle" | "retrying" | "failed";
  enabled: boolean;
  circuitState: "closed" | "open" | "half-open";
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  latencyP99Ms: number | null;
  totalRequests: number;
}

export interface ConnectionTestResult {
  name: string;
  success: boolean;
  status: ServiceStatus;
  testedAt: string;
  responseTimeMs: number;
  message: string;
  error: string | null;
}

export interface ResilientFetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  acceptStatuses?: number[];
}

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailure: number;
  nextProbeAt: number;
}

interface RateLimiterState {
  tokens: number;
  lastRefill: number;
}

export abstract class ServiceAdapter {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly requiredEnvVars: string[];

  private _lastChecked: string | null = null;
  private _lastError: string | null = null;
  private _errorCount: number = 0;
  private _lastResponseTimeMs: number | null = null;
  private _lastSuccessfulCheck: string | null = null;
  private _consecutiveFailures: number = 0;
  private _enabled: boolean = true;
  private _latencies: number[] = [];
  private _totalRequests: number = 0;

  private _circuit: CircuitBreakerState = {
    state: "closed",
    failureCount: 0,
    lastFailure: 0,
    nextProbeAt: 0,
  };

  private _rateLimiter: RateLimiterState = {
    tokens: 0,
    lastRefill: 0,
  };

  protected circuitBreakerThreshold = 5;
  protected circuitBreakerCooldownMs = 30_000;
  protected rateLimitPerMinute = 60;

  get status(): ServiceStatus {
    const missing = this.missingEnvVars;
    if (missing.length === 0) return "LIVE_CONFIGURED";
    if (this.supportsMockMode) return "MOCKED_DEMO_MODE";
    return "MANUAL_REQUIRED";
  }

  get supportsMockMode(): boolean {
    return true;
  }

  get presentEnvVars(): string[] {
    return this.requiredEnvVars.filter(
      (v) => process.env[v] !== undefined && process.env[v] !== "",
    );
  }

  get missingEnvVars(): string[] {
    return this.requiredEnvVars.filter(
      (v) => process.env[v] === undefined || process.env[v] === "",
    );
  }

  get isLive(): boolean {
    return this.status === "LIVE_CONFIGURED";
  }

  get isDemoMode(): boolean {
    return this.status === "MOCKED_DEMO_MODE";
  }

  get lastChecked(): string | null {
    return this._lastChecked;
  }

  get errorCount(): number {
    return this._errorCount;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get retryState(): "idle" | "retrying" | "failed" {
    if (this._consecutiveFailures >= 3) return "failed";
    if (this._consecutiveFailures > 0) return "retrying";
    return "idle";
  }

  async runHealthCheck(): Promise<ConnectionTestResult> {
    const start = Date.now();
    this._lastChecked = new Date().toISOString();

    if (!this._enabled) {
      const elapsed = Date.now() - start;
      this._lastResponseTimeMs = elapsed;
      return {
        name: this.name,
        success: true,
        status: this.status,
        testedAt: this._lastChecked,
        responseTimeMs: elapsed,
        message: "Connector disabled by user",
        error: null,
      };
    }

    if (this.status === "MANUAL_REQUIRED") {
      const elapsed = Date.now() - start;
      this._lastResponseTimeMs = elapsed;
      this._lastError = "Missing required configuration";
      this._consecutiveFailures++;
      return {
        name: this.name,
        success: false,
        status: this.status,
        testedAt: this._lastChecked,
        responseTimeMs: elapsed,
        message: "Not configured — missing required environment variables",
        error: "Missing required configuration",
      };
    }

    try {
      if (this.isLive) {
        await this.performHealthCheck();
      }
      const elapsed = Date.now() - start;
      this._lastResponseTimeMs = elapsed;
      this._lastError = null;
      this._consecutiveFailures = 0;
      this._lastSuccessfulCheck = this._lastChecked;
      return {
        name: this.name,
        success: true,
        status: this.status,
        testedAt: this._lastChecked,
        responseTimeMs: elapsed,
        message: this.isLive ? "Connection verified" : "Running in demo mode",
        error: null,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      this._lastResponseTimeMs = elapsed;
      this._errorCount++;
      this._consecutiveFailures++;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this._lastError = errorMsg;
      return {
        name: this.name,
        success: false,
        status: this.status,
        testedAt: this._lastChecked,
        responseTimeMs: elapsed,
        message: "Connection test failed",
        error: errorMsg,
      };
    }
  }

  protected async performHealthCheck(): Promise<void> {
    return;
  }

  private _refillTokens(): void {
    const now = Date.now();
    if (this._rateLimiter.lastRefill === 0) {
      this._rateLimiter.tokens = this.rateLimitPerMinute;
      this._rateLimiter.lastRefill = now;
      return;
    }
    const elapsed = now - this._rateLimiter.lastRefill;
    const refill = Math.floor((elapsed / 60_000) * this.rateLimitPerMinute);
    if (refill > 0) {
      this._rateLimiter.tokens = Math.min(this.rateLimitPerMinute, this._rateLimiter.tokens + refill);
      this._rateLimiter.lastRefill = now;
    }
  }

  private _consumeToken(): boolean {
    this._refillTokens();
    if (this._rateLimiter.tokens <= 0) return false;
    this._rateLimiter.tokens--;
    return true;
  }

  private _recordCircuitSuccess(): void {
    this._circuit.failureCount = 0;
    this._circuit.state = "closed";
  }

  private _recordCircuitFailure(): void {
    this._circuit.failureCount++;
    this._circuit.lastFailure = Date.now();
    if (this._circuit.failureCount >= this.circuitBreakerThreshold) {
      this._circuit.state = "open";
      this._circuit.nextProbeAt = Date.now() + this.circuitBreakerCooldownMs;
    }
  }

  private _isCircuitOpen(): boolean {
    if (this._circuit.state === "closed") return false;
    if (this._circuit.state === "open" && Date.now() >= this._circuit.nextProbeAt) {
      this._circuit.state = "half-open";
      return false;
    }
    return this._circuit.state === "open";
  }

  private _recordLatency(ms: number): void {
    this._latencies.push(ms);
    if (this._latencies.length > 200) this._latencies.shift();
    this._totalRequests++;
  }

  private _percentile(p: number): number | null {
    if (this._latencies.length === 0) return null;
    const sorted = [...this._latencies].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  protected async resilientFetch(url: string, opts: ResilientFetchOptions = {}): Promise<Response> {
    const {
      timeoutMs = 15_000,
      maxRetries = 3,
      baseDelayMs = 500,
      maxDelayMs = 10_000,
      headers = {},
      method = "GET",
      body,
      acceptStatuses = [],
    } = opts;

    if (this._isCircuitOpen()) {
      throw new Error(`Circuit breaker OPEN for ${this.name} — cooling down`);
    }

    if (!this._consumeToken()) {
      throw new Error(`Rate limit exceeded for ${this.name} (${this.rateLimitPerMinute}/min)`);
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const jitter = Math.random() * 0.3 + 0.85;
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1) * jitter);
        await new Promise((r) => setTimeout(r, delay));
        if (this._isCircuitOpen()) {
          throw new Error(`Circuit breaker OPEN for ${this.name} — cooling down`);
        }
      }

      const start = Date.now();
      try {
        const res = await fetch(url, {
          method,
          headers: { "User-Agent": `SZL-${this.name}/1.0`, ...headers },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });

        const elapsed = Date.now() - start;
        this._recordLatency(elapsed);

        if (res.ok || acceptStatuses.includes(res.status) || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
          this._recordCircuitSuccess();
          return res;
        }

        if (res.status === 429) {
          this._rateLimiter.tokens = 0;
        }

        lastError = new Error(`HTTP ${res.status} from ${this.name}`);
      } catch (err) {
        const elapsed = Date.now() - start;
        this._recordLatency(elapsed);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    this._recordCircuitFailure();
    throw lastError ?? new Error(`All retries exhausted for ${this.name}`);
  }

  getHealthReport(): ServiceHealthReport {
    return {
      name: this.name,
      status: this.status,
      description: this.description,
      requiredEnvVars: this.requiredEnvVars,
      presentEnvVars: this.presentEnvVars,
      missingEnvVars: this.missingEnvVars,
      lastChecked: this._lastChecked,
      lastError: this._lastError,
      errorCount: this._errorCount,
      responseTimeMs: this._lastResponseTimeMs,
      lastSuccessfulCheck: this._lastSuccessfulCheck,
      consecutiveFailures: this._consecutiveFailures,
      retryState: this.retryState,
      enabled: this._enabled,
      circuitState: this._circuit.state,
      latencyP50Ms: this._percentile(50),
      latencyP95Ms: this._percentile(95),
      latencyP99Ms: this._percentile(99),
      totalRequests: this._totalRequests,
    };
  }
}
