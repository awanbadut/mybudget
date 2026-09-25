import { db } from './index';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('📦 Running manual migration...');

  try {
    // Add username column if not exists
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(100),
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
    `);
    console.log('✅ Columns added to users table');
  } catch (err: any) {
    console.error('Migration error:', err.message);
  }

  process.exit(0);
}

migrate().catch(console.error);
