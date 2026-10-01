'use server';

import { db } from '@/db';
import { debts, debtInstallments } from '@/db/schema';
import { DebtSchema, InstallmentSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
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

export async function markInstallmentPaid(id: string) {
  try {
    const [updated] = await db.update(debtInstallments)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(debtInstallments.id, id))
      .returning();

    if (updated) {
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
    const [updated] = await db.update(debtInstallments)
      .set({ status: 'pending', paidAt: null, updatedAt: new Date() })
      .where(eq(debtInstallments.id, id))
      .returning();

    if (updated) {
      await db.update(debts)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(debts.id, updated.debtId));
    }
    safeRevalidate('/debts');
    safeRevalidate('/');
    safeRevalidate('/reports');
    return { success: true };
  } catch (error) {
    console.error('markInstallmentUnpaid error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
