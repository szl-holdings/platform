export type ProviderMode = "mock" | "live" | "seed";

export interface DataProvider<T> {
  mode: ProviderMode;
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  search(query: string): Promise<T[]>;
}

export function resolveProviderMode(domain: string): ProviderMode {
  const envKey = `${domain.toUpperCase()}_PROVIDER_MODE`;
  const globalKey = "PROVIDER_MODE";
  const value = process.env[envKey] || process.env[globalKey] || "mock";
  return value === "live" ? "live" : "mock";
}

export function createProvider<T>(
  domain: string,
  mockProvider: DataProvider<T>,
  liveProvider: DataProvider<T>,
): DataProvider<T> {
  const mode = resolveProviderMode(domain);
  return mode === "live" ? liveProvider : mockProvider;
}
