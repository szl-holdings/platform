export interface ProxyRoute {
  prefix: string;
  port: number;
}

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: "/aegis/", port: 3000 },
  { prefix: "/firestorm/", port: 23931 },
  { prefix: "/carlota-jo/", port: 3101 },
  { prefix: "/command/", port: 3102 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 6899 },
  { prefix: "/pulse/", port: 5201 },
];
