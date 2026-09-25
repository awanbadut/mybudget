import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import dns from 'dns';

// Ensure IPv4 first to avoid IPv6 connection timeouts on certain networks
if (typeof dns !== 'undefined' && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url || url === 'YOUR_NEON_POSTGRES_CONNECTION_STRING') {
    throw new Error(
      'DATABASE_URL is not configured. Please set DATABASE_URL in Vercel project Environment Variables.'
    );
  }
  const sql = neon(url);
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
