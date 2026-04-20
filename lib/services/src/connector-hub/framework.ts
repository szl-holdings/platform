import type {
  AuthConfig,
  Capability,
  CircuitBreakerState,
  ConnectorCategory,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorRegistryEntry,
  ConnectorResult,
  RateLimitState,
} from './types.js';

const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_RECOVERY_MS = 60_000;
const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

export abstract class ToolConnector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: ConnectorCategory;
  abstract readonly version: string;
  abstract readonly authConfig: AuthConfig;
  abstract readonly capabilities: Capability[];

  private _enabled: boolean = true;
  private _errorCount: number = 0;
  private _requestCount: number = 0;
  private _latencySamples: number[] = [];
  private _lastCheckedAt: string | null = null;
  private _lastSuccessAt: string | null = null;
  private _lastError: string | null = null;
  private _circuitBreakerState: CircuitBreakerState = 'closed';
  private _circuitOpenedAt: number | null = null;
  private _consecutiveFailures: number = 0;
  private _rateLimitState: RateLimitState = {
    windowStart: Date.now(),
    requestsInWindow: 0,
    hourlyWindowStart: Date.now(),
    requestsInHour: 0,
  };

  get isEnabled(): boolean {
    return this._enabled;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get configuredCorrectly(): boolean {
    return this.authConfig.requiredEnvVars.every(
      (v) => process.env[v] !== undefined && process.env[v] !== '',
    );
  }

  get missingEnvVars(): string[] {
    return this.authConfig.requiredEnvVars.filter(
      (v) => process.env[v] === undefined || process.env[v] === '',
    );
  }

  get circuitBreakerState(): CircuitBreakerState {
    if (this._circuitBreakerState === 'open') {
      const elapsed = Date.now() - (this._circuitOpenedAt ?? 0);
      if (elapsed >= CIRCUIT_BREAKER_RECOVERY_MS) {
        this._circuitBreakerState = 'half_open';
      }
    }
    return this._circuitBreakerState;
  }

  get errorRate(): number {
    if (this._requestCount === 0) return 0;
    return this._errorCount / this._requestCount;
  }

  get averageLatencyMs(): number | null {
    if (this._latencySamples.length === 0) return null;
    return Math.round(
      this._latencySamples.reduce((a, b) => a + b, 0) / this._latencySamples.length,
    );
  }

  private checkCircuitBreaker(): void {
    if (this._consecutiveFailures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      if (this._circuitBreakerState === 'closed') {
        this._circuitBreakerState = 'open';
        this._circuitOpenedAt = Date.now();
      }
    }
  }

  private recordSuccess(latencyMs: number): void {
    this._requestCount++;
    this._consecutiveFailures = 0;
    this._lastSuccessAt = new Date().toISOString();
    this._latencySamples.push(latencyMs);
    if (this._latencySamples.length > 50) this._latencySamples.shift();
    if (this._circuitBreakerState === 'half_open') {
      this._circuitBreakerState = 'closed';
      this._circuitOpenedAt = null;
    }
  }

  private recordFailure(error: string, latencyMs: number): void {
    this._requestCount++;
    this._errorCount++;
    this._consecutiveFailures++;
    this._lastError = error;
    this._latencySamples.push(latencyMs);
    if (this._latencySamples.length > 50) this._latencySamples.shift();
    this.checkCircuitBreaker();
  }

  private checkRateLimit(capabilityId: string): boolean {
    const capability = this.capabilities.find((c) => c.id === capabilityId);
    if (!capability?.rateLimit) return false;

    const now = Date.now();
    const { requestsPerMinute, requestsPerHour } = capability.rateLimit;

    if (now - this._rateLimitState.windowStart >= 60_000) {
      this._rateLimitState.windowStart = now;
      this._rateLimitState.requestsInWindow = 0;
    }

    if (requestsPerHour && now - this._rateLimitState.hourlyWindowStart >= 3_600_000) {
      this._rateLimitState.hourlyWindowStart = now;
      this._rateLimitState.requestsInHour = 0;
    }

    if (this._rateLimitState.requestsInWindow >= requestsPerMinute) return true;
    if (requestsPerHour && this._rateLimitState.requestsInHour >= requestsPerHour) return true;

    return false;
  }

  private incrementRateLimit(): void {
    this._rateLimitState.requestsInWindow++;
    this._rateLimitState.requestsInHour++;
  }

  async execute(capabilityId: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    if (!this._enabled) {
      return {
        success: false,
        connectorId: this.id,
        capability: capabilityId,
        data: null,
        error: `Connector '${this.id}' is disabled`,
        latencyMs: 0,
        timestamp,
        fromCache: false,
        rateLimited: false,
      };
    }

    if (!this.configuredCorrectly) {
      return {
        success: false,
        connectorId: this.id,
        capability: capabilityId,
        data: null,
        error: `Connector '${this.id}' is not configured — missing env vars: ${this.missingEnvVars.join(', ')}`,
        latencyMs: 0,
        timestamp,
        fromCache: false,
        rateLimited: false,
      };
    }

    const state = this.circuitBreakerState;
    if (state === 'open') {
      return {
        success: false,
        connectorId: this.id,
        capability: capabilityId,
        data: null,
        error: `Circuit breaker is open for connector '${this.id}' — too many consecutive failures`,
        latencyMs: 0,
        timestamp,
        fromCache: false,
        rateLimited: false,
      };
    }

    if (this.checkRateLimit(capabilityId)) {
      return {
        success: false,
        connectorId: this.id,
        capability: capabilityId,
        data: null,
        error: `Rate limit exceeded for capability '${capabilityId}' on connector '${this.id}'`,
        latencyMs: Date.now() - start,
        timestamp,
        fromCache: false,
        rateLimited: true,
      };
    }

    let lastError: string = 'Unknown error';
    for (let attempt = 0; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, DEFAULT_RETRY_DELAY_MS * attempt));
        }
        const data = await this.performCapability(capabilityId, params);
        const latencyMs = Date.now() - start;
        this.recordSuccess(latencyMs);
        this.incrementRateLimit();
        return {
          success: true,
          connectorId: this.id,
          capability: capabilityId,
          data,
          error: null,
          latencyMs,
          timestamp,
          fromCache: false,
          rateLimited: false,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt === DEFAULT_RETRY_ATTEMPTS) {
          const latencyMs = Date.now() - start;
          this.recordFailure(lastError, latencyMs);
          return {
            success: false,
            connectorId: this.id,
            capability: capabilityId,
            data: null,
            error: lastError,
            latencyMs,
            timestamp,
            fromCache: false,
            rateLimited: false,
          };
        }
      }
    }

    const latencyMs = Date.now() - start;
    this.recordFailure(lastError, latencyMs);
    return {
      success: false,
      connectorId: this.id,
      capability: capabilityId,
      data: null,
      error: lastError,
      latencyMs,
      timestamp,
      fromCache: false,
      rateLimited: false,
    };
  }

  async healthCheck(): Promise<ConnectorHealth> {
    const start = Date.now();
    this._lastCheckedAt = new Date().toISOString();

    if (!this._enabled) {
      return this.buildHealth('disabled', Date.now() - start, 'Connector is disabled');
    }

    if (!this.configuredCorrectly) {
      return this.buildHealth(
        'unconfigured',
        Date.now() - start,
        `Missing env vars: ${this.missingEnvVars.join(', ')}`,
      );
    }

    if (this.circuitBreakerState === 'open') {
      return this.buildHealth(
        'down',
        Date.now() - start,
        'Circuit breaker is open — connector is failing repeatedly',
      );
    }

    try {
      await this.performHealthCheck();
      const latencyMs = Date.now() - start;
      this.recordSuccess(latencyMs);
      const status: ConnectorHealthStatus =
        this.circuitBreakerState === 'half_open' ? 'degraded' : 'healthy';
      return this.buildHealth(status, latencyMs, 'Health check passed');
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.recordFailure(errorMsg, latencyMs);
      return this.buildHealth('degraded', latencyMs, `Health check failed: ${errorMsg}`);
    }
  }

  private buildHealth(
    status: ConnectorHealthStatus,
    latencyMs: number,
    message: string,
  ): ConnectorHealth {
    return {
      connectorId: this.id,
      status,
      latencyMs,
      lastCheckedAt: this._lastCheckedAt ?? new Date().toISOString(),
      lastSuccessAt: this._lastSuccessAt,
      errorRate: this.errorRate,
      errorCount: this._errorCount,
      requestCount: this._requestCount,
      circuitBreakerState: this._circuitBreakerState,
      configuredCorrectly: this.configuredCorrectly,
      missingEnvVars: this.missingEnvVars,
      message,
    };
  }

  getRegistryEntry(): ConnectorRegistryEntry {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      authConfig: this.authConfig,
      capabilities: this.capabilities,
      version: this.version,
    };
  }

  protected abstract performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown>;

  protected async performHealthCheck(): Promise<void> {
    return;
  }
}
