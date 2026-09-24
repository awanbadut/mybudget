import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import {
  users,
  settings,
  categories,
  debts,
  debtInstallments,
  savingsGoals,
  budgets,
} from './schema';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

// Use WebSocket for Node.js environment
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

async function seed() {
  console.log('🌱 Starting seed...');

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, DEV_USER_ID),
  });

  if (existingUser) {
    console.log('✅ User already exists, skipping seed.');
    await pool.end();
    process.exit(0);
  }

  // 1. Create user
  await db.insert(users).values({
    id: DEV_USER_ID,
    name: 'User',
    email: null,
  });
  console.log('✅ User created');

  // 2. Create settings
  await db.insert(settings).values({
    userId: DEV_USER_ID,
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
  console.log('✅ Settings created');

  // 3. Create expense categories
  const expenseCategories = [
    { name: 'Kos', color: '#6366f1', icon: 'Home' },
    { name: 'Makan', color: '#f59e0b', icon: 'UtensilsCrossed' },
    { name: 'Utang', color: '#ef4444', icon: 'CreditCard' },
    { name: 'Hiburan', color: '#ec4899', icon: 'Music' },
    { name: 'Toiletries', color: '#8b5cf6', icon: 'ShoppingBag' },
    { name: 'Transport', color: '#06b6d4', icon: 'Car' },
    { name: 'Belanja', color: '#f97316', icon: 'ShoppingCart' },
    { name: 'Tagihan', color: '#64748b', icon: 'FileText' },
    { name: 'Kesehatan', color: '#10b981', icon: 'Heart' },
    { name: 'Lainnya', color: '#94a3b8', icon: 'MoreHorizontal' },
  ];

  const createdExpenseCats: Record<string, string> = {};
  for (const cat of expenseCategories) {
    const [inserted] = await db.insert(categories).values({
      userId: DEV_USER_ID,
      name: cat.name,
      type: 'expense',
      color: cat.color,
      icon: cat.icon,
    }).returning({ id: categories.id, name: categories.name });
    createdExpenseCats[cat.name] = inserted.id;
  }
  console.log('✅ Expense categories created');

  // 4. Create income categories
  const incomeCategories = [
    { name: 'Gaji', color: '#10b981', icon: 'Banknote' },
    { name: 'Bonus', color: '#22c55e', icon: 'Gift' },
    { name: 'Freelance', color: '#84cc16', icon: 'Laptop' },
    { name: 'Lainnya', color: '#94a3b8', icon: 'MoreHorizontal' },
  ];
  for (const cat of incomeCategories) {
    await db.insert(categories).values({
      userId: DEV_USER_ID,
      name: cat.name,
      type: 'income',
      color: cat.color,
      icon: cat.icon,
    });
  }
  console.log('✅ Income categories created');

  // 5. Create budgets for September 2026
  const budgetData = [
    { name: 'Kos', amount: 650000 },
    { name: 'Makan', amount: 900000 },
    { name: 'Hiburan', amount: 200000 },
    { name: 'Toiletries', amount: 50000 },
    { name: 'Transport', amount: 0 },
    { name: 'Lainnya', amount: 200000 },
  ];
  for (const b of budgetData) {
    const catId = createdExpenseCats[b.name];
    if (catId) {
      await db.insert(budgets).values({
        userId: DEV_USER_ID,
        categoryId: catId,
        month: 9,
        year: 2026,
        amount: b.amount,
      });
    }
  }
  console.log('✅ Budgets created (September 2026)');

  // 6. Create debt
  const [debt] = await db.insert(debts).values({
    userId: DEV_USER_ID,
    name: 'Cicilan Utang',
    totalAmount: 6100000,
    status: 'active',
  }).returning({ id: debts.id });
  console.log('✅ Debt created');

  // 7. Create debt installments
  const installmentSchedule = [
    { month: 9,  year: 2026, amount: 1500000 },
    { month: 10, year: 2026, amount: 1100000 },
    { month: 11, year: 2026, amount: 1100000 },
    { month: 12, year: 2026, amount: 800000 },
    { month: 1,  year: 2027, amount: 800000 },
    { month: 2,  year: 2027, amount: 800000 },
  ];
  for (let i = 0; i < installmentSchedule.length; i++) {
    const s = installmentSchedule[i];
    const dueDate = `${s.year}-${String(s.month).padStart(2, '0')}-25`;
    await db.insert(debtInstallments).values({
      debtId: debt.id,
      installmentNumber: i + 1,
      dueDate,
      amount: s.amount,
      status: 'pending',
    });
  }
  console.log('✅ Debt installments created (6 bulan)');

  // 8. Create default savings goal
  await db.insert(savingsGoals).values({
    userId: DEV_USER_ID,
    name: 'Target Tabungan',
    targetAmount: 20000000,
    currentAmount: 0,
    deadline: '2027-09-06',
  });
  console.log('✅ Savings goal created (Rp20.000.000)');

  console.log('🎉 Seed completed successfully!');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
