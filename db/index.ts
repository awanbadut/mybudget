import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import dns from 'dns';

// Ensure IPv4 first to avoid IPv6 connection timeouts on certain network environments
if (typeof dns !== 'undefined' && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

function getDb() {
  let rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || rawUrl === 'YOUR_NEON_POSTGRES_CONNECTION_STRING') {
    throw new Error(
      'DATABASE_URL belum diatur di Environment Variables Vercel.'
    );
  }

  // Strip accidental quotes or whitespace
  rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '');

  // Strip libpq TCP-only parameters like channel_binding unsupported by HTTP fetch
  let normalizedUrl = rawUrl
    .replace(/([?&])channel_binding=[^&]*(&|$)/, '$1')
    .replace(/[?&]$/, '');

  const sql = neon(normalizedUrl);
  return drizzle(sql, { schema });
}

// Lazy singleton — initialized on first access
let _db: ReturnType<typeof getDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    if (!_db) {
      _db = getDb();
    }
    return (_db as any)[prop];
  },
});
