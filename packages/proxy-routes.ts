export interface ProxyRoute {
  prefix: string;
  port: number;
}

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: "/aegis/", port: 3002 },
  { prefix: "/carlota-jo/", port: 8098 },
  { prefix: "/command/", port: 5000 },
  { prefix: "/counsel/", port: 4199 },
  { prefix: "/lyte/", port: 7099 },
  { prefix: "/sentra/", port: 4099 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 8099 },
  { prefix: "/pulse/", port: 5201 },
  { prefix: "/prism-counsel/", port: 7099 },
];
