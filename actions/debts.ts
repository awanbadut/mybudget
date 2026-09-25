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
    safeRevalidate('/debts');
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
    await db.update(debtInstallments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(debtInstallments.id, id));
    safeRevalidate('/debts');
    return { success: true };
  } catch (error) {
    console.error('updateInstallment error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteInstallment(id: string) {
  try {
    await db.delete(debtInstallments).where(eq(debtInstallments.id, id));
    safeRevalidate('/debts');
    return { success: true };
  } catch (error) {
    console.error('deleteInstallment error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function markInstallmentPaid(id: string) {
  try {
    await db.update(debtInstallments)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(debtInstallments.id, id));
    safeRevalidate('/debts');
    return { success: true };
  } catch (error) {
    console.error('markInstallmentPaid error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function markInstallmentUnpaid(id: string) {
  try {
    await db.update(debtInstallments)
      .set({ status: 'pending', paidAt: null, updatedAt: new Date() })
      .where(eq(debtInstallments.id, id));
    safeRevalidate('/debts');
    return { success: true };
  } catch (error) {
    console.error('markInstallmentUnpaid error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
