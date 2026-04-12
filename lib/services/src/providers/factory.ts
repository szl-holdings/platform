export type ProviderMode = "mock" | "live";

export interface DataProvider<T> {
  mode: ProviderMode;
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  search(query: string): Promise<T[]>;
}

const LIVE_DEFAULT_DOMAINS = new Set([
  "vessels",
  "terra",
  "prism",
  "aegis",
  "lyte",
  "firestorm",
]);

export function resolveProviderMode(domain: string): ProviderMode {
  const envKey = `${domain.toUpperCase()}_PROVIDER_MODE`;
  const globalKey = "PROVIDER_MODE";
  const envOverride = process.env[envKey] ?? process.env[globalKey];
  if (envOverride === "mock") return "mock";
  if (envOverride === "live") return "live";
  return LIVE_DEFAULT_DOMAINS.has(domain.toLowerCase()) ? "live" : "mock";
}

export function createProvider<T>(
  domain: string,
  mockProvider: DataProvider<T>,
  liveProvider: DataProvider<T>,
): DataProvider<T> {
  const mode = resolveProviderMode(domain);
  return mode === "live" ? liveProvider : mockProvider;
}
