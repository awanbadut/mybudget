'use server';

import { db } from '@/db';
import { savingsGoals, savingsTransactions, transactions, categories, accounts } from '@/db/schema';
import { SavingsGoalSchema, SavingsTransactionSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { ensureAccountsTable } from '@/actions/accounts';
import { eq, and } from 'drizzle-orm';

export async function createSavingsGoal(data: unknown) {
  try {
    const validated = SavingsGoalSchema.parse(data);
    const userId = await getUserId();
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
    const userId = await getUserId();
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
    const userId = await getUserId();
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
    await ensureAccountsTable();
    const validated = SavingsTransactionSchema.parse(data);
    const userId = await getUserId();
    
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

    let linkedCashTxId: string | null = null;

    // If deductFromCash is true, record matching expense in cash ledger
    if (validated.deductFromCash) {
      // Find category for tabungan
      let savingsCat = await db.query.categories.findFirst({
        where: (c, { and: a, eq: e }) => a(e(c.userId, userId), e(c.name, 'Tabungan'), e(c.type, 'expense')),
      });
      if (!savingsCat) {
        savingsCat = await db.query.categories.findFirst({
          where: (c, { and: a, eq: e }) => a(e(c.userId, userId), e(c.type, 'expense')),
        });
      }

      const [cashTx] = await db.insert(transactions).values({
        userId,
        categoryId: savingsCat?.id || null,
        accountId: validated.accountId || null,
        type: 'expense',
        name: `Setor Tabungan: ${goal.name}`,
        amount: validated.amount,
        transactionDate: validated.transactionDate,
        note: validated.note ? `[Tabungan] ${validated.note}` : `[Alokasi ke target: ${goal.name}]`,
      }).returning();

      linkedCashTxId = cashTx.id;
    }
    
    await db.insert(savingsTransactions).values({
      savingsGoalId: validated.savingsGoalId,
      amount: validated.amount,
      transactionDate: validated.transactionDate,
      note: validated.note,
      accountId: validated.accountId || null,
      transactionId: linkedCashTxId,
    });
    
    // Update current amount
    await db.update(savingsGoals)
      .set({ 
        currentAmount: goal.currentAmount + validated.amount,
        updatedAt: new Date()
      })
      .where(eq(savingsGoals.id, validated.savingsGoalId));
    
    safeRevalidate('/savings');
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error) {
    console.error('addSavings error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteSavingsTransaction(id: string, goalId: string) {
  try {
    await ensureAccountsTable();
    const userId = await getUserId();
    
    // Verify goal belongs to user
    const goal = await db.query.savingsGoals.findFirst({
      where: (g, { and: a, eq: e }) => a(e(g.id, goalId), e(g.userId, userId)),
    });
    if (!goal) return { success: false, error: 'Target tabungan tidak ditemukan.' };

    // Get the transaction before deleting
    const tx = await db.query.savingsTransactions.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!tx) return { success: false, error: 'Setoran tidak ditemukan.' };

    // If there is a linked cash expense transaction, delete it to refund the wallet balance
    if (tx.transactionId) {
      await db.delete(transactions)
        .where(and(eq(transactions.id, tx.transactionId), eq(transactions.userId, userId)));
    }

    // Delete savings transaction
    await db.delete(savingsTransactions).where(eq(savingsTransactions.id, id));

    // Update currentAmount
    const newAmount = Math.max(0, goal.currentAmount - tx.amount);
    await db.update(savingsGoals)
      .set({ currentAmount: newAmount, updatedAt: new Date() })
      .where(eq(savingsGoals.id, goalId));

    safeRevalidate('/savings');
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteSavingsTransaction error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
