import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazy singletons — env is only available at request time on Workers.
let _redis: Redis | null = null;
let _enabled: boolean | null = null;

function getRedis(): Redis | null {
  if (_enabled === false) return null;
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _enabled = false;
    return null;
  }
  _redis = new Redis({ url, token });
  _enabled = true;
  return _redis;
}

// cached(key, ttlSeconds, loader) — falls back to loader() if Redis is
// unavailable or any call throws, so feature code stays simple.
export async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const r = getRedis();
  if (!r) return loader();
  try {
    const hit = await r.get<T>(key);
    if (hit !== null && hit !== undefined) return hit as T;
  } catch (e) {
    console.warn("[cache.get]", key, e);
  }
  const fresh = await loader();
  try {
    await r.set(key, fresh as unknown as string, { ex: ttl });
  } catch (e) {
    console.warn("[cache.set]", key, e);
  }
  return fresh;
}

export async function invalidate(keys: string | string[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const arr = Array.isArray(keys) ? keys : [keys];
  if (!arr.length) return;
  try { await r.del(...arr); } catch (e) { console.warn("[cache.del]", e); }
}

let _limiters = new Map<string, Ratelimit>();
function getLimiter(name: string, limit: number, windowSeconds: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const key = `${name}:${limit}:${windowSeconds}`;
  const existing = _limiters.get(key);
  if (existing) return existing;
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix: `rl:${name}`,
  });
  _limiters.set(key, rl);
  return rl;
}

// rateLimit(identifier, opts) — throws a user-friendly error if the caller
// exceeds the limit. No-ops when Redis is unavailable.
export async function rateLimit(
  identifier: string,
  opts: { name: string; limit: number; windowSeconds: number },
): Promise<void> {
  const rl = getLimiter(opts.name, opts.limit, opts.windowSeconds);
  if (!rl) return;
  try {
    const { success } = await rl.limit(identifier);
    if (!success) throw new Error("Too many requests. Please slow down and try again in a moment.");
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Too many")) throw e;
    console.warn("[rateLimit]", e);
  }
}