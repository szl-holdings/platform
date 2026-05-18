/**
 * Shared probe helper for the per-app `/api/{slug}/ops-core/snapshot`
 * routes.
 *
 * Round-5 unfreeze of the Round-3 *-ops-core.ts module-status contract.
 *
 * Background: before Round 5, each ops-core file declared `MODULES` with
 * a hardcoded `ok: true | false` per module — which was theater on both
 * sides:
 *
 *   - modules with `probe_path !== null` were hardcoded `ok: true` even
 *     though nothing was ever probed (false-green);
 *   - modules with `probe_path === null` (voice agents, connector
 *     frameworks, leaderboards — real mounted things without an HTTP
 *     probe surface) were hardcoded `ok: false` (false-red).
 *
 * The downstream a11oy ecosystem board therefore showed 5/8 apps DEGRADED
 * not because anything was actually unhealthy, but because the contract
 * couldn't express "unprobed".
 *
 * Round 5 introduces an explicit tri-state and live probing:
 *
 *   - status='healthy'  : mounted=true AND (probe_path=null OR probe 2xx)
 *                         (we trust the declared `mounted=true` for
 *                          non-HTTP modules; HTTP modules must respond
 *                          with a 2xx or 3xx)
 *   - status='unprobed' : mounted=true AND probe_path=null. Surfaced
 *                         explicitly so the operator can see which
 *                         modules are accepted on faith vs. measured.
 *                         Counts toward `healthy` because the alternative
 *                         is theater-red on real modules.
 *   - status='degraded' : mounted=false OR (probe_path!=null AND probe
 *                         returned 4xx/5xx/timeout/network-error).
 *
 * `healthy = items where status !== 'degraded'`. `probed = items where
 * probe_path !== null AND probe actually ran`. `unprobed = items where
 * status === 'unprobed'`. The shape is a superset of the Round-3
 * `b3_modules` contract — nothing is removed, only added — so existing
 * consumers (a11oy /organism, /api/ecosystem/snapshot) keep working.
 *
 * NO MOCK DATA: if a probe fails to even fire (e.g. network blew up),
 * we surface that as `probe_error` on the item, NOT a silent pass.
 */

export interface OpsCoreModuleDecl {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly probe_path: string | null;
  readonly mounted: boolean;
  // Round-3 legacy field. Round 5 keeps it on the wire (consumers may
  // still read it) but `status` is the authoritative signal going forward.
  readonly ok: boolean;
  // Round 5 (architect-flagged): only treat 401/403 as healthy when the
  // module explicitly opts in. The global-auth-enforcer also returns 401
  // for typo'd / unmounted protected paths, so accepting it blindly would
  // mask real gaps. Default false — strict 2xx/3xx-only — and the route
  // owner sets true ONLY for paths they have confirmed are mounted and
  // authentication-gated (i.e. the 401 proves a working surface).
  readonly auth_wall_ok?: boolean;
}

export interface OpsCoreModuleClassified extends OpsCoreModuleDecl {
  status: 'healthy' | 'unprobed' | 'degraded';
  probe_http_code: number | null;
  probe_latency_ms: number | null;
  probe_error?: string;
}

export interface OpsCoreModulesBlock {
  total: number;
  healthy: number;
  unprobed: number;
  degraded: number;
  probed: number;
  items: OpsCoreModuleClassified[];
}

async function probeOne(path: string, timeoutMs = 2_500): Promise<{ code: number; latency_ms: number; error?: string }> {
  const port = process.env.PORT ? Number(process.env.PORT) : 80;
  const start = Date.now();
  try {
    const r = await fetch(`http://localhost:${port}${path}`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'szl-ops-core-probe' },
      // Probes are diagnostic — they should not consume real session
      // cookies or carry user identity.
    });
    return { code: r.status, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      code: 0,
      latency_ms: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Probe every `probe_path !== null` module in parallel and return the
 * full classified block. Modules with `probe_path === null` are not
 * probed — their status is derived from `mounted`.
 *
 * For HTTP-probed modules, we accept 2xx and 3xx as healthy. 401/403 only
 * count as healthy when the module declares `auth_wall_ok: true` (architect
 * Round-5 hardening — the global auth enforcer also returns 401 for
 * unmounted protected paths, so blanket-accepting 401 would mask gaps).
 * Any other 4xx, any 5xx, network errors, and timeouts are degraded.
 */
export async function classifyOpsCoreModules(
  decls: readonly OpsCoreModuleDecl[],
): Promise<OpsCoreModulesBlock> {
  const probeJobs = decls.map(async (m): Promise<OpsCoreModuleClassified> => {
    if (!m.mounted) {
      return {
        ...m,
        status: 'degraded',
        probe_http_code: null,
        probe_latency_ms: null,
      };
    }
    if (m.probe_path === null) {
      return {
        ...m,
        status: 'unprobed',
        probe_http_code: null,
        probe_latency_ms: null,
      };
    }
    const probe = await probeOne(m.probe_path);
    const ok2xx = probe.code >= 200 && probe.code < 400;
    const okAuthWall = (probe.code === 401 || probe.code === 403) && m.auth_wall_ok === true;
    const healthy = ok2xx || okAuthWall;
    return {
      ...m,
      status: healthy ? 'healthy' : 'degraded',
      probe_http_code: probe.code || null,
      probe_latency_ms: probe.latency_ms,
      ...(probe.error ? { probe_error: probe.error } : {}),
    };
  });
  const items = await Promise.all(probeJobs);
  const healthy = items.filter((m) => m.status !== 'degraded').length;
  const unprobed = items.filter((m) => m.status === 'unprobed').length;
  const degraded = items.filter((m) => m.status === 'degraded').length;
  // Architect Round-5 fix: `probed` is the count of probes that ACTUALLY ran
  // (got an HTTP code or surfaced a network error), not the count of modules
  // that merely declared a probe_path. mounted:false short-circuits before
  // any fetch happens, so those don't count even though probe_path may be set.
  const probed = items.filter((m) => m.probe_http_code !== null || m.probe_error !== undefined).length;
  return { total: items.length, healthy, unprobed, degraded, probed, items };
}
