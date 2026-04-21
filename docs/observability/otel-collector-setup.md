# OTLP Collector Setup — Run Console & Eval Studio Traces

The `command-web` artifact (`artifacts/command`) emits OpenTelemetry spans for
every Run Console execution and Eval Studio evaluation. By default these go to a
console exporter in development and are dropped in production — to send them to
a hosted observability platform, set two Vite environment variables and
restart the workflow.

> **Browser-secret warning.** `VITE_*` variables are inlined into the JS bundle
> at build time, which means **anything you put into `VITE_OTEL_HEADERS` is
> publicly visible to every browser that loads the Command app**. This is fine
> for vendor tokens that are *designed* to be public ingest credentials
> (Honeycomb classic ingest keys, Grafana Cloud OTLP tokens scoped to
> `metrics:write,traces:write`), and **not safe** for full-power vendor API
> keys (e.g. a Datadog `DD-API-KEY` that can also read/delete data). For those
> vendors run a self-hosted OpenTelemetry Collector and point
> `VITE_OTEL_ENDPOINT` at the collector — keep the privileged credential on
> the collector, not in the browser. The collector recipe at the bottom of
> this doc covers the exact relay shape.

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

### Datadog (paid, enterprise) — **server-side relay only**

A Datadog `DD-API-KEY` is a privileged credential (it grants read + delete on
your account, not just write). Do **not** put it in `VITE_OTEL_HEADERS` —
every browser would download a copy. Instead:

1. Run a self-hosted OpenTelemetry Collector (recipe below) with the Datadog
   exporter holding `DD-API-KEY` server-side:
   ```yaml
   exporters:
     datadog:
       api:
         site: datadoghq.com
         key: ${env:DD_API_KEY}
   service:
     pipelines:
       traces:
         receivers: [otlp]
         exporters: [datadog]
   ```
2. Point the browser at the collector:
   ```env
   VITE_OTEL_ENDPOINT=https://otel-collector.example.com
   # VITE_OTEL_HEADERS left unset
   ```

Datadog publishes a separate "OTLP HTTP intake" at
`https://<site>/api/v2/otlp/v1/traces` — it still requires `DD-API-KEY`, so
the same warning applies. Use the collector relay.

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

## Staging & production rollout runbook

`VITE_OTEL_ENDPOINT` and `VITE_OTEL_HEADERS` are non-prefixed Replit Secrets,
so they propagate automatically to every Replit environment in this project
(development, the hosted preview, the autoscale deployment defined in
`.replit → [deployment]`). There is **no per-environment override** needed in
`.replit` — keeping the auth header in `userenv.shared` would commit a secret
to source control, which is forbidden.

Procedure for a new environment (staging or production):

1. **Create / locate the vendor credential** for that environment. Use a
   *separate* ingest key per env so a leaked staging token can be rotated
   independently. Recommended naming: `command-web-staging`,
   `command-web-prod`.
2. **Set the two Replit Secrets** in the Secrets pane of the corresponding
   Repl/deployment:
   - `VITE_OTEL_ENDPOINT` — the vendor URL from the per-platform table above.
   - `VITE_OTEL_HEADERS` — `Header=Value[,Header=Value...]`. Never paste the
     raw token into chat, code, or `.replit`.
3. **Redeploy** (autoscale picks the new secret on the next cold start) or
   restart the `artifacts/command: web` workflow for the dev preview. Vite
   inlines `VITE_*` vars at build time, so a rebuild is required for the
   change to reach the browser.
4. **Verify at runtime**:
   - Open the deployed Command artifact and check the browser console. On a
     correctly wired environment you should see one log line:
     ```
     [telemetry] OTLP exporter wired {"service":"command-web","environment":"production","endpoint":"https://.../v1/traces","authHeaders":["x-honeycomb-team"]}
     ```
     If `VITE_OTEL_ENDPOINT` is missing in production you will instead see
     `[telemetry] VITE_OTEL_ENDPOINT is not set in production — Run Console / Eval Studio spans will be dropped.`
   - Trigger one Run Console execution. The DevTools Network tab should show a
     `POST https://<endpoint>/v1/traces` returning `200`/`202`.
   - In the vendor UI, filter by
     `service.name = command-web AND deployment.environment.name = production`
     (or `staging`). The trace should appear within ~5–15 seconds.
5. **Record the rollout** in the on-call runbook with: env name, vendor,
   ingest-key creation date, and the first verified trace ID.

Drop-detection: if the `[telemetry] OTLP exporter wired` log line is missing
from production browser logs after a deploy, treat it as a sev-3 — telemetry
is silently dark.
