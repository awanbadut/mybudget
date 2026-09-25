'use server';

import { db } from '@/db';
import { budgets } from '@/db/schema';
import { BudgetSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { eq, and } from 'drizzle-orm';

export async function createBudget(data: unknown) {
  try {
    const validated = BudgetSchema.parse(data);
    const userId = await getUserId();
    await db.insert(budgets).values({ userId, ...validated });
    safeRevalidate('/budget');
    return { success: true };
  } catch (error) {
    console.error('createBudget error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateBudget(id: string, data: unknown) {
  try {
    const validated = BudgetSchema.parse(data);
    const userId = await getUserId();
    await db.update(budgets)
      .set({ amount: validated.amount, updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
    safeRevalidate('/budget');
    return { success: true };
  } catch (error) {
    console.error('updateBudget error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteBudget(id: string) {
  try {
    const userId = await getUserId();
    await db.delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
    safeRevalidate('/budget');
    return { success: true };
  } catch (error) {
    console.error('deleteBudget error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function upsertBudget(data: unknown) {
  try {
    const validated = BudgetSchema.parse(data);
    const userId = await getUserId();

    // Check if budget exists
    const existing = await db.query.budgets.findFirst({
      where: (b, { and: andFn, eq: eqFn }) => andFn(
        eqFn(b.userId, userId),
        eqFn(b.categoryId, validated.categoryId),
        eqFn(b.month, validated.month),
        eqFn(b.year, validated.year)
      ),
    });

    if (existing) {
      await db.update(budgets)
        .set({ amount: validated.amount, updatedAt: new Date() })
        .where(eq(budgets.id, existing.id));
    } else {
      await db.insert(budgets).values({ userId, ...validated });
    }
    safeRevalidate('/budget');
    safeRevalidate('/');
    return { success: true };
  } catch (error) {
    console.error('upsertBudget error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
