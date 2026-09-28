'use server';

import { db } from '@/db';
import { recurringTransactions, transactions, categories } from '@/db/schema';
import { getUserId, safeRevalidate } from '@/lib/server-utils';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDaysInMonth } from 'date-fns';

const RecurringSchema = z.object({
  name: z.string().min(1, 'Nama transaksi harus diisi').max(255),
  type: z.enum(['income', 'expense']).default('expense'),
  categoryId: z.string().uuid('Kategori tidak valid'),
  amount: z.number().int().positive('Nominal harus lebih dari 0'),
  dueDay: z.number().int().min(1).max(31).default(1),
  note: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

// Auto-check table existence
let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        type VARCHAR(20) NOT NULL DEFAULT 'expense',
        name VARCHAR(255) NOT NULL,
        amount BIGINT NOT NULL,
        due_day INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT true,
        note TEXT,
        last_posted_month INTEGER,
        last_posted_year INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS recurring_transactions_user_active_idx 
        ON recurring_transactions(user_id, is_active);
    `);
    tableChecked = true;
  } catch (err) {
    console.error('ensureTable recurring_transactions error:', err);
  }
}

export async function getRecurringTransactions() {
  try {
    await ensureTable();
    const userId = await getUserId();
    const items = await db.query.recurringTransactions.findMany({
      where: (r, { eq: eqFn }) => eqFn(r.userId, userId),
      with: { category: true },
      orderBy: (r, { asc }) => asc(r.dueDay),
    });
    return { success: true, data: items };
  } catch (error) {
    console.error('getRecurringTransactions error:', error);
    return { success: false, data: [] };
  }
}

export async function createRecurringTransaction(data: unknown) {
  try {
    await ensureTable();
    const validated = RecurringSchema.parse(data);
    const userId = await getUserId();

    const [created] = await db.insert(recurringTransactions).values({
      userId,
      ...validated,
    }).returning();

    safeRevalidate('/transactions');
    safeRevalidate('/settings');
    return { success: true, data: created };
  } catch (error: any) {
    console.error('createRecurringTransaction error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal membuat template transaksi berulang.' };
  }
}

export async function updateRecurringTransaction(id: string, data: unknown) {
  try {
    await ensureTable();
    const validated = RecurringSchema.parse(data);
    const userId = await getUserId();

    await db.update(recurringTransactions)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

    safeRevalidate('/transactions');
    safeRevalidate('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('updateRecurringTransaction error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal memperbarui transaksi berulang.' };
  }
}

export async function deleteRecurringTransaction(id: string) {
  try {
    await ensureTable();
    const userId = await getUserId();
    await db.delete(recurringTransactions)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

    safeRevalidate('/transactions');
    safeRevalidate('/settings');
    return { success: true };
  } catch (error) {
    console.error('deleteRecurringTransaction error:', error);
    return { success: false, error: 'Gagal menghapus template transaksi berulang.' };
  }
}

export async function toggleRecurringActive(id: string, currentState: boolean) {
  try {
    await ensureTable();
    const userId = await getUserId();
    await db.update(recurringTransactions)
      .set({ isActive: !currentState, updatedAt: new Date() })
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

    safeRevalidate('/transactions');
    safeRevalidate('/settings');
    return { success: true };
  } catch (error) {
    console.error('toggleRecurringActive error:', error);
    return { success: false, error: 'Gagal mengubah status.' };
  }
}

export async function postRecurringTransactions(month: number, year: number) {
  try {
    await ensureTable();
    const userId = await getUserId();

    const activeList = await db.query.recurringTransactions.findMany({
      where: (r, { and: a, eq: e }) => a(e(r.userId, userId), e(r.isActive, true)),
    });

    // Filter items that have not been posted for (month, year)
    const dueItems = activeList.filter(
      r => r.lastPostedMonth !== month || r.lastPostedYear !== year
    );

    if (dueItems.length === 0) {
      return { success: true, count: 0, message: 'Semua transaksi berulang sudah diposting untuk bulan ini.' };
    }

    const maxDays = getDaysInMonth(new Date(year, month - 1, 1));
    let postedCount = 0;

    for (const item of dueItems) {
      const actualDay = Math.min(item.dueDay, maxDays);
      const txDate = `${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;

      // Insert into transactions table
      await db.insert(transactions).values({
        userId,
        categoryId: item.categoryId,
        type: item.type,
        name: item.name,
        amount: item.amount,
        transactionDate: txDate,
        note: item.note ? `[Otomatis] ${item.note}` : '[Transaksi Berulang Rutin]',
      });

      // Mark as posted for this month/year
      await db.update(recurringTransactions)
        .set({
          lastPostedMonth: month,
          lastPostedYear: year,
          updatedAt: new Date(),
        })
        .where(eq(recurringTransactions.id, item.id));

      postedCount++;
    }

    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/budget');
    safeRevalidate('/reports');

    return {
      success: true,
      count: postedCount,
      message: `${postedCount} transaksi berulang berhasil diposting ke buku kas!`,
    };
  } catch (error) {
    console.error('postRecurringTransactions error:', error);
    return { success: false, error: 'Gagal mengeksekusi transaksi berulang.' };
  }
}
