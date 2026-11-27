/**
 * Pooled vs direct connection strings (gap G1).
 *
 * Runtime traffic goes through a pooler (Cloudflare Hyperdrive from Workers,
 * or the provider's pooled endpoint, e.g. Neon "-pooler" hosts, from Node).
 * Migrations, rebuilds, pg_dump backups and restore drills must use a DIRECT
 * (unpooled) session: transaction-mode poolers drop session state, so advisory
 * locks, SET, exported snapshots and multi-statement DDL become unsafe.
 *
 *   DATABASE_URL_DIRECT  direct/unpooled URL (preferred for every tool here)
 *   DATABASE_URL         runtime URL; used only if no direct URL is set
 *
 * Fails closed if the URL that would be used is a known pooled endpoint.
 */
export const POOLED_HOST = /(^|[.-])pooler([.-]|$)|^hyperdrive|\.hyperdrive\.local$/i;

export function isPooledUrl(url) {
  try {
    const u = new URL(url);
    return POOLED_HOST.test(u.hostname) || u.searchParams.get('pgbouncer') === 'true';
  } catch {
    return false;
  }
}

export function migrationDatabaseUrl(env = process.env) {
  const direct = env.DATABASE_URL_DIRECT?.trim();
  const runtime = env.DATABASE_URL?.trim();
  const url = direct || runtime;
  const name = direct ? 'DATABASE_URL_DIRECT' : 'DATABASE_URL';
  if (!url) throw new Error('DATABASE_URL_DIRECT (or DATABASE_URL) is required');
  if (!/^postgres(ql)?:\/\//i.test(url)) throw new Error(`${name} must be a postgres:// or postgresql:// URL`);
  if (isPooledUrl(url)) {
    throw new Error(`${name} points at a pooled endpoint; migrations, backups and restores need a direct connection. Set DATABASE_URL_DIRECT to the unpooled URL.`);
  }
  return url;
}
