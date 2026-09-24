'use server';

import { db } from '@/db';
import { settings, users } from '@/db/schema';
import { SettingsSchema } from '@/lib/validation';
import { safeRevalidate } from '@/lib/utils';
import { eq } from 'drizzle-orm';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';
function getUserId(): string { return DEV_USER_ID; }

export async function updateSettings(data: unknown) {
  try {
    const validated = SettingsSchema.parse(data);
    const userId = getUserId();
    const { name, ...settingsData } = validated;
    
    await db.update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    await db.update(settings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(settings.userId, userId));
    
    safeRevalidate('/');
    safeRevalidate('/settings');
    return { success: true };
  } catch (error) {
    console.error('updateSettings error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function getExportData() {
  try {
    const userId = getUserId();
    
    const [userSettings, userCategories, userTransactions, userBudgets, userDebts, userSavingsGoals] = await Promise.all([
      db.query.settings.findFirst({ where: (s, { eq: eqFn }) => eqFn(s.userId, userId) }),
      db.query.categories.findMany({ where: (c, { eq: eqFn }) => eqFn(c.userId, userId) }),
      db.query.transactions.findMany({ where: (t, { eq: eqFn }) => eqFn(t.userId, userId) }),
      db.query.budgets.findMany({ where: (b, { eq: eqFn }) => eqFn(b.userId, userId) }),
      db.query.debts.findMany({ 
        where: (d, { eq: eqFn }) => eqFn(d.userId, userId),
        with: { installments: true }
      }),
      db.query.savingsGoals.findMany({ 
        where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
        with: { transactions: true }
      }),
    ]);
    
    const allInstallments = userDebts.flatMap(d => d.installments);
    const allSavingsTransactions = userSavingsGoals.flatMap(g => g.transactions);
    
    return {
      success: true,
      data: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings: userSettings,
        categories: userCategories,
        transactions: userTransactions,
        budgets: userBudgets,
        debts: userDebts.map(({ installments, ...d }) => d),
        debtInstallments: allInstallments,
        savingsGoals: userSavingsGoals.map(({ transactions, ...g }) => g),
        savingsTransactions: allSavingsTransactions,
      }
    };
  } catch (error) {
    console.error('getExportData error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
