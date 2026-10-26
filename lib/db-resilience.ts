/**
 * Database Resilience & Retry Helper
 * Handles transient Neon Serverless connection dropouts, cold starts, and socket timeouts.
 */

interface RetryOptions<T> {
  retries?: number;
  delayMs?: number;
  fallback?: T;
  tag?: string;
}

const TRANSIENT_ERROR_PATTERNS = [
  /fetch failed/i,
  /socket hang up/i,
  /connection reset/i,
  /econnreset/i,
  /etimedout/i,
  /timeout/i,
  /500 internal server error/i,
  /neondberror/i,
  /failed to fetch/i,
  /network error/i,
  /network timeout/i,
  /enotfound/i,
  /connection closed/i,
  /too many connections/i,
];

function isTransientError(error: any): boolean {
  if (!error) return false;
  const message = String(error?.message || error?.cause?.message || error || '');
  return TRANSIENT_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions<T> = {}
): Promise<T> {
  const {
    retries = 2,
    delayMs = 300,
    fallback,
    tag = 'db-query',
  } = options;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      attempt++;

      const isTransient = isTransientError(err);
      console.warn(
        `[DB Retry] ${tag} attempt ${attempt}/${retries + 1} failed: ${err?.message || err}. (Transient: ${isTransient})`
      );

      if (attempt <= retries && isTransient) {
        // Exponential backoff with small random jitter
        const backoff = delayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await wait(backoff);
      } else if (attempt > retries) {
        break;
      }
    }
  }

  // If a fallback was explicitly provided, return it gracefully instead of crashing
  if (fallback !== undefined) {
    console.warn(`[DB Fallback] ${tag} using fallback value due to repeated errors:`, lastError?.message || lastError);
    return fallback;
  }

  throw lastError;
}
