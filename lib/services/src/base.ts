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
    };
  }
}
