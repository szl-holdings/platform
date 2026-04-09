interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<"OK" | null>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  incr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<"PONG">;
  quit(): Promise<void>;
}

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

class InMemoryRedisClient implements RedisClient {
  private store = new Map<string, CacheEntry>();

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt !== null && entry.expiresAt < Date.now();
  }

  private cleanExpired(key: string): void {
    const entry = this.store.get(key);
    if (entry && this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanExpired(key);
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<"OK" | null> {
    this.cleanExpired(key);
    if (options?.nx && this.store.has(key)) return null;
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    this.cleanExpired(key);
    return this.store.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.cleanExpired(key);
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async incrby(key: string, amount: number): Promise<number> {
    this.cleanExpired(key);
    const entry = this.store.get(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current + amount;
    const expiresAt = entry?.expiresAt ?? null;
    this.store.set(key, { value: String(next), expiresAt });
    return next;
  }

  async ttl(key: string): Promise<number> {
    this.cleanExpired(key);
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

let _redisClient: RedisClient | null = null;
let _isRealRedis = false;
let _initialized = false;

async function createRedisClient(): Promise<{ client: RedisClient; isReal: boolean }> {
  const redisUrl = process.env["REDIS_URL"] ?? process.env["AZURE_REDIS_CONNECTION_STRING"];

  if (!redisUrl) {
    return { client: new InMemoryRedisClient(), isReal: false };
  }

  try {
    const { default: Redis } = await import("ioredis") as { default: new (url: string) => RedisClient };
    const client = new Redis(redisUrl);
    await client.ping();
    return { client, isReal: true };
  } catch {
    return { client: new InMemoryRedisClient(), isReal: false };
  }
}

export async function getRedisClient(): Promise<RedisClient> {
  if (!_initialized) {
    _initialized = true;
    const { client, isReal } = await createRedisClient();
    _redisClient = client;
    _isRealRedis = isReal;
  }
  return _redisClient!;
}

export function isRedisReal(): boolean {
  return _isRealRedis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  try {
    const client = await getRedisClient();
    const raw = JSON.stringify(value);
    await client.set(key, raw, ttlSeconds ? { ex: ttlSeconds } : undefined);
  } catch {
    // Cache failures are non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch {
    // Cache failures are non-fatal
  }
}

export async function rateLimitIncr(key: string, windowSeconds: number): Promise<number> {
  try {
    const client = await getRedisClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds);
    }
    return count;
  } catch {
    return 0;
  }
}

export async function getRedisStatus(): Promise<{ configured: boolean; connected: boolean; mode: "real" | "in-memory" }> {
  const redisUrl = process.env["REDIS_URL"] ?? process.env["AZURE_REDIS_CONNECTION_STRING"];
  if (!redisUrl) {
    return { configured: false, connected: false, mode: "in-memory" };
  }
  try {
    const client = await getRedisClient();
    await client.ping();
    return { configured: true, connected: _isRealRedis, mode: _isRealRedis ? "real" : "in-memory" };
  } catch {
    return { configured: true, connected: false, mode: "in-memory" };
  }
}
