'use server';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import { TransactionSchema } from '@/lib/validation';
import { safeRevalidate } from '@/lib/server-utils';
import { eq, and } from 'drizzle-orm';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

function getUserId(): string {
  return DEV_USER_ID;
}

export async function createTransaction(data: unknown) {
  try {
    const validated = TransactionSchema.parse(data);
    const userId = getUserId();
    await db.insert(transactions).values({
      userId,
      ...validated,
    });
    safeRevalidate('/');
    safeRevalidate('/transactions');
    return { success: true };
  } catch (error) {
    console.error('createTransaction error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateTransaction(id: string, data: unknown) {
  try {
    const validated = TransactionSchema.parse(data);
    const userId = getUserId();
    await db.update(transactions)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    safeRevalidate('/');
    safeRevalidate('/transactions');
    return { success: true };
  } catch (error) {
    console.error('updateTransaction error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const userId = getUserId();
    await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    safeRevalidate('/');
    safeRevalidate('/transactions');
    return { success: true };
  } catch (error) {
    console.error('deleteTransaction error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
