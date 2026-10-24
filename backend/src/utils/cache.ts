/**
 * Tiny in-process cache: TTL + stale-while-revalidate + single-flight + max entries + prefix invalidation.
 *
 * Best-effort only. On serverless every instance has its own memory, so this mainly protects the database
 * from bursts that hit the same warm instance. HTTP caching (see httpCache.ts) is the main lever.
 */

type Entry = { value: unknown; expiresAt: number; staleUntil: number };

const DEFAULT_MAX_ENTRIES = 200;

class MemoryCache {
  private entries = new Map<string, Entry>();
  private inflight = new Map<string, Promise<unknown>>();
  /** Bumped on every invalidation so loaders that started before it never write their (possibly stale) result. */
  private epoch = 0;

  constructor(private readonly maxEntries = DEFAULT_MAX_ENTRIES) {}

  get size() {
    return this.entries.size;
  }

  /**
   * Returns the cached value, loading it at most once for concurrent callers.
   * - fresh (age < ttlMs): served from memory
   * - stale (ttlMs <= age < ttlMs + staleMs): served immediately, refreshed in the background
   * - otherwise: loaded (single-flight)
   */
  async wrap<T>(
    key: string,
    loader: () => Promise<T>,
    options: { ttlMs?: number; staleMs?: number } = {}
  ): Promise<T> {
    const ttlMs = options.ttlMs ?? 30_000;
    const staleMs = options.staleMs ?? 30_000;
    const now = Date.now();
    const hit = this.entries.get(key);

    if (hit && now < hit.expiresAt) {
      // refresh LRU position
      this.entries.delete(key);
      this.entries.set(key, hit);
      return hit.value as T;
    }

    if (hit && now < hit.staleUntil) {
      void this.load(key, loader, ttlMs, staleMs).catch(() => undefined);
      return hit.value as T;
    }

    return this.load(key, loader, ttlMs, staleMs);
  }

  private load<T>(key: string, loader: () => Promise<T>, ttlMs: number, staleMs: number): Promise<T> {
    const running = this.inflight.get(key);
    if (running) return running as Promise<T>;

    const startedAtEpoch = this.epoch;
    let promise: Promise<T> | undefined;
    promise = (async () => {
      try {
        const value = await loader();
        if (startedAtEpoch === this.epoch) this.set(key, value, ttlMs, staleMs);
        return value;
      } finally {
        if (this.inflight.get(key) === promise) this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, promise);
    return promise;
  }

  private set(key: string, value: unknown, ttlMs: number, staleMs: number) {
    const now = Date.now();
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + ttlMs + staleMs });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  /** Drops every entry (and forgets in-flight loads) whose key starts with one of the prefixes. */
  invalidate(...prefixes: string[]) {
    this.epoch += 1;
    for (const key of Array.from(this.entries.keys())) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) this.entries.delete(key);
    }
    for (const key of Array.from(this.inflight.keys())) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) this.inflight.delete(key);
    }
  }

  clear() {
    this.epoch += 1;
    this.entries.clear();
    this.inflight.clear();
  }
}

export const cache = new MemoryCache();

/** Key prefixes, one per public resource. Mutations invalidate every prefix whose data they can affect. */
export const CACHE_PREFIX = {
  products: 'products:',
  menus: 'menus:',
  services: 'services:',
  accessories: 'accessories:',
} as const;

export const invalidateCatalog = (...prefixes: Array<keyof typeof CACHE_PREFIX>) =>
  cache.invalidate(...prefixes.map((name) => CACHE_PREFIX[name]));

export { MemoryCache };
