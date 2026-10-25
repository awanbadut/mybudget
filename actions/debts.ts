'use server';

import { db } from '@/db';
import { debts, debtInstallments, transactions, categories } from '@/db/schema';
import { DebtSchema, InstallmentSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { toDateString } from '@/lib/dates';
import { eq, and } from 'drizzle-orm';


export async function createDebt(data: unknown) {
  try {
    const validated = DebtSchema.parse(data);
    const userId = await getUserId();
    const [debt] = await db.insert(debts).values({ userId, ...validated }).returning();
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true, data: debt };
  } catch (error) {
    console.error('createDebt error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateDebt(id: string, data: unknown) {
  try {
    const validated = DebtSchema.parse(data);
    const userId = await getUserId();
    await db.update(debts)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(debts.id, id), eq(debts.userId, userId)));
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('updateDebt error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteDebt(id: string) {
  try {
    const userId = await getUserId();
    await db.delete(debts)
      .where(and(eq(debts.id, id), eq(debts.userId, userId)));
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('deleteDebt error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function createInstallment(data: unknown) {
  try {
    const validated = InstallmentSchema.parse(data);
    await db.insert(debtInstallments).values(validated);
    if (validated.status === 'pending') {
      await db.update(debts)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(debts.id, validated.debtId));
    }
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('createInstallment error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateInstallment(id: string, data: Partial<{
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
}>) {
  try {
    const [updated] = await db.update(debtInstallments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(debtInstallments.id, id))
      .returning();

    if (updated) {
      const allInst = await db.query.debtInstallments.findMany({
        where: (di, { eq: eqFn }) => eqFn(di.debtId, updated.debtId),
      });
      const hasPending = allInst.some(i => i.status === 'pending');
      await db.update(debts)
        .set({ status: hasPending ? 'active' : 'paid', updatedAt: new Date() })
        .where(eq(debts.id, updated.debtId));
    }

    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('updateInstallment error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteInstallment(id: string) {
  try {
    const inst = await db.query.debtInstallments.findFirst({
      where: (di, { eq: eqFn }) => eqFn(di.id, id),
    });
    await db.delete(debtInstallments).where(eq(debtInstallments.id, id));
    if (inst) {
      const remainingInst = await db.query.debtInstallments.findMany({
        where: (di, { eq: eqFn }) => eqFn(di.debtId, inst.debtId),
      });
      const hasPending = remainingInst.some(i => i.status === 'pending');
      await db.update(debts)
        .set({ status: hasPending ? 'active' : 'paid', updatedAt: new Date() })
        .where(eq(debts.id, inst.debtId));
    }
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('deleteInstallment error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function markInstallmentPaid(id: string, accountId?: string | null) {
  try {
    const userId = await getUserId();
    const [updated] = await db.update(debtInstallments)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(debtInstallments.id, id))
      .returning();

    if (updated) {
      const debtObj = await db.query.debts.findFirst({
        where: (d, { eq: eqFn }) => eqFn(d.id, updated.debtId),
      });

      // Record expense transaction in selected Bank/Cash wallet if accountId is provided
      if (accountId) {
        const userCats = await db.query.categories.findMany({
          where: (c, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(c.userId, userId), eqFn(c.type, 'expense')),
        });
        const debtCat =
          userCats.find(
            c =>
              c.name.toLowerCase().includes('cicil') ||
              c.name.toLowerCase().includes('utang') ||
              c.name.toLowerCase().includes('tagih')
          ) || userCats[0];

        await db.insert(transactions).values({
          userId,
          categoryId: debtCat?.id || null,
          accountId,
          type: 'expense',
          name: `Cicilan #${updated.installmentNumber}: ${debtObj?.name || 'Utang'}`,
          amount: updated.amount,
          transactionDate: toDateString(new Date()),
          note: `InstallmentRef:${updated.id}`,
        });
      }

      const allInst = await db.query.debtInstallments.findMany({
        where: (di, { eq: eqFn }) => eqFn(di.debtId, updated.debtId),
      });
      const hasPending = allInst.some(i => i.status === 'pending');
      if (!hasPending && allInst.length > 0) {
        await db.update(debts)
          .set({ status: 'paid', updatedAt: new Date() })
          .where(eq(debts.id, updated.debtId));
      }
    }
    safeRevalidate('/debts');
    safeRevalidate('/transactions');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('markInstallmentPaid error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function markInstallmentUnpaid(id: string) {
  try {
    const userId = await getUserId();
    const [updated] = await db.update(debtInstallments)
      .set({ status: 'pending', paidAt: null, updatedAt: new Date() })
      .where(eq(debtInstallments.id, id))
      .returning();

    if (updated) {
      // Remove linked expense transaction if it was recorded from a wallet
      await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.note, `InstallmentRef:${updated.id}`)
          )
        );

      await db.update(debts)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(debts.id, updated.debtId));
    }
    safeRevalidate('/debts');
    safeRevalidate('/transactions');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('markInstallmentUnpaid error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
