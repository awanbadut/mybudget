import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Required for Node.js environments (Next.js server-side)
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var _pool: Pool | undefined;
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url || url === 'YOUR_NEON_POSTGRES_CONNECTION_STRING') {
    throw new Error(
      'DATABASE_URL is not configured. Please set it in .env.local'
    );
  }
  const pool = globalThis._pool ?? new Pool({ connectionString: url });
  if (process.env.NODE_ENV !== 'production') {
    globalThis._pool = pool;
  }
  return drizzle(pool, { schema });
}

// Lazy singleton — only initialized when first accessed
let _db: ReturnType<typeof getDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    if (!_db) {
      _db = getDb();
    }
    return (_db as any)[prop];
  },
});
