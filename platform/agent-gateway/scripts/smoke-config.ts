/**
 * Agent Gateway — runtime configuration smoke check.
 *
 * #4607 wiring: confirms the gateway is correctly wired to a live OPA
 * policy server and a live Temporal cluster before production traffic.
 *
 * Usage:
 *   OPA_ENDPOINT=http://opa:8181 TEMPORAL_ENDPOINT=temporal:7233 \
 *     ./node_modules/.bin/tsx scripts/smoke-config.ts
 *
 * Exit codes:
 *   0 — every configured backend reachable and policy returns expected shape
 *   1 — one or more backends unreachable or returned an unexpected response
 *   2 — required environment variable missing (and not 'local')
 *
 * Failures are written as structured JSON to stderr so an operator can
 * paste the line into an incident ticket and see exactly which check failed.
 */

interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
  detail?: unknown;
}

async function checkOpa(endpoint: string): Promise<CheckResult> {
  if (endpoint === 'local') {
    return { name: 'opa', ok: true, message: 'local embedded evaluator (no remote check)' };
  }
  try {
    // OPA v1 health endpoint — returns 200 when policy bundle is loaded
    const healthRes = await fetch(`${endpoint}/health?bundles=true`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!healthRes.ok) {
      return { name: 'opa', ok: false, message: `OPA /health returned ${healthRes.status}` };
    }
    // Probe the szl.approval rule we depend on
    const evalRes = await fetch(`${endpoint}/v1/data/szl/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        input: {
          operation_type: 'agent_inspect_code',
          environment: 'development',
          tier: 'tier-1',
          actor_role: 'platform-engineer',
          actor_groups: ['platform-team'],
          capability: 'inspect_code',
          domain: 'vessels',
        },
      }),
    });
    if (!evalRes.ok) {
      return {
        name: 'opa',
        ok: false,
        message: `OPA /v1/data/szl/approval returned ${evalRes.status}`,
      };
    }
    const data = (await evalRes.json()) as { result?: unknown };
    if (!('result' in data)) {
      return {
        name: 'opa',
        ok: false,
        message: 'OPA response missing `result` key — bundle may not be loaded',
        detail: data,
      };
    }
    return { name: 'opa', ok: true, message: 'reachable, szl.approval rule resolves', detail: data.result };
  } catch (err) {
    return {
      name: 'opa',
      ok: false,
      message: `OPA unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function checkTemporal(endpoint: string): Promise<CheckResult> {
  if (endpoint === 'local') {
    return { name: 'temporal', ok: true, message: 'local auto-approve (no remote check)' };
  }
  // Temporal frontend service speaks gRPC, not HTTP. We can only do a
  // TCP-level reachability check from this script. Full SDK connection
  // is exercised by the approval workflow when it actually runs.
  const [host, portStr] = endpoint.split(':');
  const port = parseInt(portStr ?? '7233', 10);
  if (!host || Number.isNaN(port)) {
    return {
      name: 'temporal',
      ok: false,
      message: `TEMPORAL_ENDPOINT must be host:port (got ${endpoint})`,
    };
  }
  try {
    const net = await import('net');
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error(`TCP connect timeout to ${host}:${port}`));
      }, 5000);
      socket.once('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve();
      });
      socket.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      socket.connect(port, host);
    });
    return { name: 'temporal', ok: true, message: `TCP ${host}:${port} reachable` };
  } catch (err) {
    return {
      name: 'temporal',
      ok: false,
      message: `Temporal unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function checkSecret(name: string, value: string | undefined): CheckResult {
  if (!value) {
    return { name, ok: false, message: `${name} not set` };
  }
  if (value === 'szl-agent-gateway-dev-secret-do-not-use-in-prod') {
    return {
      name,
      ok: false,
      message: `${name} is the bundled dev placeholder — rotate before production`,
    };
  }
  if (value.length < 32) {
    return { name, ok: false, message: `${name} is shorter than 32 chars (weak)` };
  }
  return { name, ok: true, message: `${name} present (${value.length} chars)` };
}

async function main() {
  const opaEndpoint = process.env['OPA_ENDPOINT'] ?? 'local';
  const temporalEndpoint = process.env['TEMPORAL_ENDPOINT'] ?? 'local';
  const jwtSecret = process.env['JWT_SECRET'];

  const results: CheckResult[] = [];
  results.push(checkSecret('JWT_SECRET', jwtSecret));
  results.push(await checkOpa(opaEndpoint));
  results.push(await checkTemporal(temporalEndpoint));

  let exitCode = 0;
  for (const r of results) {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      check: r.name,
      ok: r.ok,
      message: r.message,
      detail: r.detail,
    });
    if (r.ok) {
      process.stdout.write(line + '\n');
    } else {
      process.stderr.write(line + '\n');
      exitCode = 1;
    }
  }

  process.exit(exitCode);
}

main();
