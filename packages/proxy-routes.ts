export interface ProxyRoute {
  prefix: string;
  port: number;
}

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: "/aegis/", port: 3002 },
  { prefix: "/carlota-jo/", port: 3101 },
  { prefix: "/command/", port: 5000 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 8099 },
  { prefix: "/pulse/", port: 5201 },
];
