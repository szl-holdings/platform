/**
 * Startup smoke check
 * -------------------
 * After migrations + listen() complete, probe each registered artifact's
 * root path *through the shared proxy* (port 9090) so this check tells
 * operators whether the surface is actually reachable end-to-end via
 * the same path the user's preview iframe takes — not just whether the
 * service's TCP port is bound. A bound port that 503s through the
 * proxy is just as broken as one that's down.
 *
 * The probe issues GET <SHARED_PROXY>/<prefix> with a short timeout.
 * Vite/Expo dev servers reply 200 for the SPA shell at the prefix root,
 * so a 2xx/3xx proves end-to-end reachability without requiring each
 * artifact to ship a dedicated health route. We classify results as:
 *
 *   - UP        : HTTP 2xx/3xx
 *   - 4XX/5XX   : reached the artifact but it returned an error
 *   - DOWN      : connection refused / timeout / proxy mis-route
 *
 * The whole check is best-effort and never throws; transient failures
 * simply log "DOWN" so the next reboot reflects current reachability.
 */
import { request as httpRequest } from 'node:http';
import type { Logger } from 'pino';

interface ArtifactProbe {
  /** Display name written into the log table. */
  name: string;
  /** Path prefix served by the shared proxy (must include trailing slash). */
  prefix: string;
}

/** Default shared-proxy port; mirrors `SHARED_PROXY_PORT` constant. */
const SHARED_PROXY_PORT = Number(process.env.SHARED_PROXY_PORT ?? 9090);

/**
 * Mirrors the canonical proxy table in `packages/shared-proxy/src/index.ts`.
 * Duplicated here intentionally so the api-server bundle does not pick
 * up a runtime dep on the shared-proxy package (which would pull the
 * full proxy server into the api bundle).
 */
const ARTIFACT_PROBES: readonly ArtifactProbe[] = [
  { name: 'a11oy', prefix: '/a11oy/' },
  { name: 'carlota-jo', prefix: '/carlota-jo/' },
  { name: 'command', prefix: '/command/' },
  { name: 'counsel', prefix: '/counsel/' },
  { name: 'nexus', prefix: '/nexus/' },
  { name: 'sentra', prefix: '/sentra/' },
  { name: 'terra', prefix: '/terra/' },
  { name: 'vessels', prefix: '/vessels/' },
  { name: 'pulse', prefix: '/pulse/' },
  { name: 'szl-demo-video', prefix: '/szl-demo-video/' },
];

type ProbeStatus = 'UP' | 'ERR' | 'DOWN';

interface ProbeResult {
  name: string;
  prefix: string;
  status: ProbeStatus;
  httpStatus: number | null;
  /** Brief reason on failure (e.g. "ECONNREFUSED", "timeout", "404"). */
  reason?: string;
}

/**
 * Issue a single GET against the shared proxy with a short timeout.
 * Resolves with a structured result; never throws.
 *
 * Vite/Expo dev servers reply 200 to GET on the prefix root with the
 * SPA shell, so a 2xx/3xx response proves the proxy can reach the
 * artifact. Following redirects is intentionally not done — a 301/302
 * back to the same artifact is still proof of life.
 */
function probeViaProxy(probe: ArtifactProbe, timeoutMs = 1500): Promise<ProbeResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status: ProbeStatus, httpStatus: number | null, reason?: string) => {
      if (settled) return;
      settled = true;
      resolve({ name: probe.name, prefix: probe.prefix, status, httpStatus, reason });
    };

    // Path is the prefix itself (already trailing-slashed in the table).
    const path = probe.prefix;
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: SHARED_PROXY_PORT,
        method: 'GET',
        path,
        // Avoid HTTP keep-alive lingering past process exit
        agent: false,
        timeout: timeoutMs,
      },
      (res) => {
        const sc = res.statusCode ?? 0;
        // Drain to free the socket regardless of the body content
        res.resume();
        if (sc >= 200 && sc < 400) finish('UP', sc);
        else finish('ERR', sc, String(sc));
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
      finish('DOWN', null, 'timeout');
    });
    req.on('error', (err: NodeJS.ErrnoException) => {
      finish('DOWN', null, err.code ?? err.message ?? 'error');
    });
    req.end();
  });
}

/**
 * Probe every registered artifact through the shared proxy and emit a
 * single structured log entry summarising reachability. Caller may pass
 * a logger; if absent, fall back to console.
 */
export async function runStartupSmokeCheck(logger?: Logger): Promise<void> {
  const log = (level: 'info' | 'warn', payload: Record<string, unknown>, msg: string) => {
    if (logger) {
      (logger[level] as (p: Record<string, unknown>, m: string) => void).call(logger, payload, msg);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[smoke] ${msg}`, payload);
    }
  };

  const results = await Promise.all(ARTIFACT_PROBES.map((p) => probeViaProxy(p)));

  const up = results.filter((r) => r.status === 'UP').map((r) => r.name);
  const errs = results.filter((r) => r.status === 'ERR').map((r) => `${r.name}(${r.reason})`);
  const down = results.filter((r) => r.status === 'DOWN').map((r) => `${r.name}(${r.reason})`);

  // Render an aligned text table for human readers; structured payload
  // is preserved alongside for log shippers.
  const table = results
    .map((r) => {
      const tag = r.status.padEnd(4, ' ');
      const code = r.httpStatus != null ? String(r.httpStatus).padStart(3, ' ') : '   ';
      const why = r.reason ? `  (${r.reason})` : '';
      return `  ${tag}  ${code}  ${r.prefix.padEnd(20, ' ')}  ${r.name}${why}`;
    })
    .join('\n');

  log(
    down.length === 0 && errs.length === 0 ? 'info' : 'warn',
    {
      proxyPort: SHARED_PROXY_PORT,
      up,
      errs,
      down,
      total: results.length,
    },
    `[smoke] Artifact reachability via shared proxy (:${SHARED_PROXY_PORT}):\n${table}`,
  );
}
