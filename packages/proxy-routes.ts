export interface ProxyRoute {
  prefix: string;
  port: number;
}

// Canonical fallback owner for any prefix not explicitly listed below.
// szl-holdings is mounted at "/" (the artifact whose previewPath is "/"), so
// it is the natural home for everything that does not belong to a sibling
// artifact. Each shared-proxy listener forwards unknown prefixes here
// instead of to its own vite port, which keeps routing deterministic even
// when the kernel load-balances incoming connections across listeners that
// all bind 9090 with SO_REUSEPORT.
export const CANONICAL_FALLBACK_PORT = 5173;

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: '/aegis/', port: 3002 },
  { prefix: '/api/', port: 8080 },
  { prefix: '/carlota-jo/', port: 8098 },
  { prefix: '/command/', port: 5000 },
  { prefix: '/counsel/', port: 4199 },
  { prefix: '/lyte/', port: 7099 },
  { prefix: '/nexus/', port: 8008 },
  { prefix: '/sentra/', port: 4099 },
  { prefix: '/terra/', port: 6000 },
  { prefix: '/vessels/', port: 8099 },
  { prefix: '/pulse/', port: 5201 },
  { prefix: '/prism-counsel/', port: 7100 },
  { prefix: '/szl-demo-video/', port: 8765 },
];
