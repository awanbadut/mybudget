import { db } from './index';
import { users, settings } from './schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

async function seedAuthUsers() {
  console.log('🔐 Seeding auth users...');

  // 1. Create/update zikrykurniawan
  const passwordHash = await bcrypt.hash('@Azik12345', 12);
  const existing = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.username, 'zikrykurniawan'),
  });

  if (!existing) {
    const [newUser] = await db.insert(users).values({
      name: 'Zikry Kurniawan',
      username: 'zikrykurniawan',
      passwordHash,
      role: 'user',
    }).returning({ id: users.id });

    // Create settings
    await db.insert(settings).values({
      userId: newUser.id,
      salary: 4000000,
      salaryDate: 25,
      rentBudget: 650000,
      foodBudget: 900000,
      entertainmentBudget: 200000,
      toiletries_budget: 50000,
      transportBudget: 0,
      startWorkDate: '2026-09-07',
      salaryProrateEnabled: true,
      salaryProrateMethod: 'calendar_days',
    });

    console.log('✅ User zikrykurniawan created, ID:', newUser.id);
  } else {
    await db.update(users)
      .set({ passwordHash, role: 'user', name: 'Zikry Kurniawan' })
      .where(eq(users.username, 'zikrykurniawan'));
    console.log('✅ User zikrykurniawan password updated');
  }

  // 2. Create admin
  const adminHash = await bcrypt.hash('Admin@2026!', 12);
  const existingAdmin = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.username, 'admin'),
  });

  if (!existingAdmin) {
    await db.insert(users).values({
      name: 'Administrator',
      username: 'admin',
      passwordHash: adminHash,
      role: 'admin',
    });
    console.log('✅ Admin created: username=admin, password=Admin@2026!');
  } else {
    await db.update(users)
      .set({ passwordHash: adminHash, role: 'admin' })
      .where(eq(users.username, 'admin'));
    console.log('✅ Admin password updated');
  }

  // 3. Update DEV_USER (the original user) with username
  const devUserId = process.env.DEV_USER_ID?.replace(/['"]/g, '').trim() || '00000000-0000-0000-0000-000000000001';
  const devUserHash = await bcrypt.hash('@Azik12345', 12);
  const devUser = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, devUserId),
  });

  if (devUser && !devUser.username) {
    await db.update(users)
      .set({ username: 'zikrykurniawan_dev', passwordHash: devUserHash, role: 'user' })
      .where(eq(users.id, devUserId));
    console.log('✅ Dev user updated with username');
  }

  console.log('\n🎉 Auth seed completed!');
  console.log('👤 User: zikrykurniawan / @Azik12345');
  console.log('👑 Admin: admin / Admin@2026!');
  process.exit(0);
}

seedAuthUsers().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
