'use server';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import { TransactionSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { ensureAccountsTable } from '@/actions/accounts';
import { eq, and } from 'drizzle-orm';

export async function createTransaction(data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = TransactionSchema.parse(data);
    const userId = await getUserId();

    let accountId = validated.accountId;
    if (!accountId) {
      const defaultAcc = await db.query.accounts.findFirst({
        where: (a, { eq: eqFn }) => eqFn(a.userId, userId),
        orderBy: (a, { desc, asc }) => [desc(a.isDefault), asc(a.name)],
      });
      accountId = defaultAcc?.id || null;
    }

    await db.insert(transactions).values({
      userId,
      ...validated,
      accountId,
    });
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/budget');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('createTransaction error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal menyimpan transaksi. Coba lagi.' };
  }
}

export async function updateTransaction(id: string, data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = TransactionSchema.parse(data);
    const userId = await getUserId();
    await db.update(transactions)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/budget');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('updateTransaction error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal memperbarui transaksi. Coba lagi.' };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const userId = await getUserId();
    await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/budget');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('deleteTransaction error:', error);
    return { success: false, error: 'Gagal menghapus transaksi. Coba lagi.' };
  }
}
