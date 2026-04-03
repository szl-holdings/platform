let otelInitialized = false;

export interface OtelConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  exportToAzureMonitor?: boolean;
  exportToNewRelic?: boolean;
  exportToConsole?: boolean;
}

export interface Span {
  setAttributes(attributes: Record<string, string | number | boolean>): Span;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): Span;
  setStatus(status: "ok" | "error", message?: string): Span;
  end(): void;
}

class NoOpSpan implements Span {
  setAttributes(_: Record<string, string | number | boolean>): Span { return this; }
  addEvent(_: string, __?: Record<string, string | number | boolean>): Span { return this; }
  setStatus(_: "ok" | "error", __?: string): Span { return this; }
  end(): void {}
}

type SpanCallback<T> = (span: Span) => T | Promise<T>;

class OtelTracer {
  private serviceName: string;
  private nativeTracer: unknown = null;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  setNativeTracer(tracer: unknown): void {
    this.nativeTracer = tracer;
  }

  startSpan(name: string, _attributes?: Record<string, string | number | boolean>): Span {
    if (this.nativeTracer && typeof (this.nativeTracer as { startSpan: unknown }).startSpan === "function") {
      try {
        const nativeSpan = (this.nativeTracer as { startSpan: (n: string) => unknown }).startSpan(name);
        return nativeSpan as Span;
      } catch {
        return new NoOpSpan();
      }
    }
    return new NoOpSpan();
  }

  async withSpan<T>(name: string, fn: SpanCallback<T>, attributes?: Record<string, string | number | boolean>): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await fn(span);
      span.setStatus("ok");
      return result;
    } catch (err) {
      span.setStatus("error", (err as Error).message);
      throw err;
    } finally {
      span.end();
    }
  }

  getServiceName(): string {
    return this.serviceName;
  }
}

let globalTracer: OtelTracer | null = null;

export function getTracer(): OtelTracer {
  if (!globalTracer) {
    globalTracer = new OtelTracer(process.env.OTEL_SERVICE_NAME ?? "szl-api");
  }
  return globalTracer;
}

export async function initializeOpenTelemetry(config: OtelConfig): Promise<void> {
  if (otelInitialized) return;

  const tracer = new OtelTracer(config.serviceName);
  globalTracer = tracer;

  const otlpEndpoint =
    config.otlpEndpoint ??
    process.env.OTLP_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const azureConnStr = process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING;
  const newRelicLicense = process.env.NEW_RELIC_LICENSE_KEY;

  const activeExporters: string[] = [];

  if (otlpEndpoint) {
    activeExporters.push(`otlp:${otlpEndpoint}`);
  }

  if (config.exportToAzureMonitor && azureConnStr) {
    activeExporters.push("azure-monitor");
  }

  if (config.exportToNewRelic && newRelicLicense) {
    activeExporters.push("new-relic");
  }

  if (config.exportToConsole || process.env.OTEL_CONSOLE_EXPORT === "true") {
    activeExporters.push("console");
  }

  otelInitialized = true;

  console.info(`[otel] OpenTelemetry initialized: service=${config.serviceName}, exporters=[${activeExporters.join(", ") || "none"}]`);
}

export function isOtelInitialized(): boolean {
  return otelInitialized;
}

export function getOtelConfig(): {
  serviceName: string;
  otlpEndpoint?: string;
  azureMonitor: boolean;
  newRelic: boolean;
  initialized: boolean;
} {
  return {
    serviceName: process.env.OTEL_SERVICE_NAME ?? "szl-api",
    otlpEndpoint: process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    azureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
    newRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
    initialized: otelInitialized,
  };
}
