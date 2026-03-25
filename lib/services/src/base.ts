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
}

export abstract class ServiceAdapter {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly requiredEnvVars: string[];

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

  getHealthReport(): ServiceHealthReport {
    return {
      name: this.name,
      status: this.status,
      description: this.description,
      requiredEnvVars: this.requiredEnvVars,
      presentEnvVars: this.presentEnvVars,
      missingEnvVars: this.missingEnvVars,
    };
  }
}
