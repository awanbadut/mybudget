'use server';

import { db } from '@/db';
import { savingsGoals, savingsTransactions } from '@/db/schema';
import { SavingsGoalSchema, SavingsTransactionSchema } from '@/lib/validation';
import { safeRevalidate } from '@/lib/server-utils';
import { eq, and } from 'drizzle-orm';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';
function getUserId(): string { return DEV_USER_ID; }

export async function createSavingsGoal(data: unknown) {
  try {
    const validated = SavingsGoalSchema.parse(data);
    const userId = getUserId();
    const [goal] = await db.insert(savingsGoals).values({ userId, ...validated }).returning();
    safeRevalidate('/savings');
    return { success: true, data: goal };
  } catch (error) {
    console.error('createSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateSavingsGoal(id: string, data: unknown) {
  try {
    const validated = SavingsGoalSchema.parse(data);
    const userId = getUserId();
    await db.update(savingsGoals)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    safeRevalidate('/savings');
    return { success: true };
  } catch (error) {
    console.error('updateSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteSavingsGoal(id: string) {
  try {
    const userId = getUserId();
    await db.delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    safeRevalidate('/savings');
    return { success: true };
  } catch (error) {
    console.error('deleteSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function addSavings(data: unknown) {
  try {
    const validated = SavingsTransactionSchema.parse(data);
    const userId = getUserId();
    
    // Verify the goal belongs to user
    const goal = await db.query.savingsGoals.findFirst({
      where: (g, { and: andFn, eq: eqFn }) => andFn(
        eqFn(g.id, validated.savingsGoalId),
        eqFn(g.userId, userId)
      ),
    });
    
    if (!goal) {
      return { success: false, error: 'Target tabungan tidak ditemukan.' };
    }
    
    await db.insert(savingsTransactions).values(validated);
    
    // Update current amount
    await db.update(savingsGoals)
      .set({ 
        currentAmount: goal.currentAmount + validated.amount,
        updatedAt: new Date()
      })
      .where(eq(savingsGoals.id, validated.savingsGoalId));
    
    safeRevalidate('/savings');
    safeRevalidate('/');
    return { success: true };
  } catch (error) {
    console.error('addSavings error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
