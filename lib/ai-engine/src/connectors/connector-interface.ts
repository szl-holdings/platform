export type ConnectorAuthType = "api_key" | "oauth2" | "basic" | "bearer" | "none";
export type ConnectorCategory =
  | "ai_service"
  | "security"
  | "ticketing"
  | "communication"
  | "observability"
  | "data"
  | "workflow"
  | "maritime"
  | "crm";

export interface ConnectorAuthConfig {
  type: ConnectorAuthType;
  envVarNames: string[];
  headerName?: string;
  queryParamName?: string;
}

export interface ConnectorRateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface ConnectorHealthStatus {
  healthy: boolean;
  lastChecked: string;
  latencyMs?: number;
  error?: string;
}

export interface ConnectorToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  costEstimate: "free" | "low" | "medium" | "high";
}

export interface ConnectorAdapter<TInput = unknown, TOutput = unknown> {
  connectorId: string;
  displayName: string;
  description: string;
  category: ConnectorCategory;
  vendor: string;
  version: string;
  docsUrl: string;
  authConfig: ConnectorAuthConfig;
  rateLimit: ConnectorRateLimitConfig;
  tools: ConnectorToolDefinition[];

  isConfigured(): boolean;
  healthCheck(): Promise<ConnectorHealthStatus>;
  execute(toolName: string, input: TInput): Promise<TOutput>;
  normalizeError(err: unknown): ConnectorError;
}

export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly connectorId: string,
    public readonly toolName: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

export abstract class BaseConnectorAdapter<TInput = unknown, TOutput = unknown>
  implements ConnectorAdapter<TInput, TOutput>
{
  abstract connectorId: string;
  abstract displayName: string;
  abstract description: string;
  abstract category: ConnectorCategory;
  abstract vendor: string;
  abstract version: string;
  abstract docsUrl: string;
  abstract authConfig: ConnectorAuthConfig;
  abstract rateLimit: ConnectorRateLimitConfig;
  abstract tools: ConnectorToolDefinition[];

  isConfigured(): boolean {
    return this.authConfig.envVarNames.every(name => !!process.env[name]);
  }

  async healthCheck(): Promise<ConnectorHealthStatus> {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: `Missing env vars: ${this.authConfig.envVarNames.join(", ")}`,
      };
    }
    try {
      const start = Date.now();
      await this.pingEndpoint();
      return {
        healthy: true,
        lastChecked: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  protected async pingEndpoint(): Promise<void> {
    // Override in subclasses to implement actual health check
  }

  normalizeError(err: unknown): ConnectorError {
    if (err instanceof ConnectorError) return err;
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status;
    return new ConnectorError(message, this.connectorId, "unknown", status, status === 429);
  }

  protected getAuthHeaders(): Record<string, string> {
    switch (this.authConfig.type) {
      case "api_key": {
        const key = process.env[this.authConfig.envVarNames[0] ?? ""];
        if (key && this.authConfig.headerName) return { [this.authConfig.headerName]: key };
        if (key) return { "x-api-key": key };
        return {};
      }
      case "bearer": {
        const token = process.env[this.authConfig.envVarNames[0] ?? ""];
        return token ? { "Authorization": `Bearer ${token}` } : {};
      }
      case "basic": {
        const user = process.env[this.authConfig.envVarNames[0] ?? ""];
        const pass = process.env[this.authConfig.envVarNames[1] ?? ""];
        if (user && pass) {
          return { "Authorization": `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` };
        }
        return {};
      }
      default:
        return {};
    }
  }

  abstract execute(toolName: string, input: TInput): Promise<TOutput>;
}
