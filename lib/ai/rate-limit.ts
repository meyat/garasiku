import "server-only";

/**
 * Minimal in-memory rate limiter for AI endpoints, keyed by user id.
 * NOTE: this resets on server restart and does not work across multiple server instances —
 * fine for getting started, but for production on Vercel (multiple/ephemeral instances)
 * swap this for a shared store (e.g. Upstash Redis) behind the same `checkRateLimit` signature.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = WINDOW_MS - (now - timestamps[0]!);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
}
