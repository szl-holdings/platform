# OTLP Collector Setup — Run Console & Eval Studio Traces

The `command-web` artifact (`artifacts/command`) emits OpenTelemetry spans for
every Run Console execution and Eval Studio evaluation. By default these go to a
console exporter in development and are dropped in production — to send them to
a hosted observability platform, set two Vite environment variables and
restart the workflow.

## Environment variables

| Var | Purpose | Required? |
|---|---|---|
| `VITE_OTEL_ENDPOINT` | Base URL of the OTLP HTTP collector. The exporter automatically appends `/v1/traces` if it is not already present. | Yes (otherwise no traces are exported in production). |
| `VITE_OTEL_HEADERS` | Comma-separated `Header=Value` pairs sent with every export request. Matches the upstream OpenTelemetry SDK convention for `OTEL_EXPORTER_OTLP_HEADERS`. | Required by all hosted vendors below; optional for an unauthenticated self-hosted collector. |

Both are read by `artifacts/command/src/telemetry.ts → initTelemetry()`. After
changing either value, restart the `artifacts/command: web` workflow.

Spans are emitted with `service.name = command-web`,
`service.version = 0.0.0`, and `deployment.environment.name = <Vite mode>`.

## Per-platform configuration

### Honeycomb (free tier — easiest)

```env
VITE_OTEL_ENDPOINT=https://api.honeycomb.io
VITE_OTEL_HEADERS=x-honeycomb-team=<YOUR_INGEST_KEY>
```

Optional dataset header: `x-honeycomb-dataset=command-web`.
Get an ingest key at: https://ui.honeycomb.io/teams → Environment → API Keys.

### Grafana Cloud (free tier, full LGTM stack)

```env
VITE_OTEL_ENDPOINT=https://otlp-gateway-<region>.grafana.net/otlp
VITE_OTEL_HEADERS=Authorization=Basic <BASE64(instance_id:api_token)>
```

Where `<BASE64(...)>` is the base64-encoded `instance_id:api_token` pair from
Grafana Cloud → Connections → OpenTelemetry. Region examples: `prod-eu-west-0`,
`prod-us-central-0`.

### Datadog (paid, enterprise)

```env
VITE_OTEL_ENDPOINT=https://trace.agent.<site>/api/v0.2/traces
VITE_OTEL_HEADERS=DD-API-KEY=<YOUR_DD_API_KEY>
```

`<site>` is `datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, etc.
Datadog also accepts the standard OTLP HTTP intake at
`https://<site>/api/v2/otlp/v1/traces` with the same `DD-API-KEY` header — pick
whichever matches your account.

### Self-hosted OpenTelemetry Collector

```env
VITE_OTEL_ENDPOINT=https://otel-collector.example.com
# VITE_OTEL_HEADERS optional — set if your collector requires auth
```

Minimal collector config (`otel-collector-config.yaml`):

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins: ['*']
exporters:
  logging: { loglevel: info }
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [logging]
```

> **Browser CORS:** because `command-web` runs in the browser, any hosted or
> self-hosted collector must respond to OPTIONS preflight from the artifact's
> origin. All three hosted vendors above already do; for self-hosted you need
> the `cors` block shown above.

## Verifying the wiring

1. Set the two secrets and restart `artifacts/command: web`.
2. Open the Command artifact in the browser, visit Run Console, and execute one
   run. The browser DevTools Network tab should show a `POST` to
   `<VITE_OTEL_ENDPOINT>/v1/traces` returning `200`/`202`.
3. In your observability platform, filter by `service.name = command-web` —
   the span should appear within ~5–15 seconds (BatchSpanProcessor flushes
   every 1.5 s, vendors index within a few seconds after that).

## Rotating credentials

Both vars live in Replit Secrets. To rotate:

1. Update the secret value in the Secrets pane.
2. Restart `artifacts/command: web`.
3. (Optional) Revoke the old token at the vendor.
