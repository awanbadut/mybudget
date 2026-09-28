'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/server-utils';
import { z } from 'zod';

const CategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori harus diisi').max(100),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Format warna tidak valid').optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

export async function createCategory(data: unknown) {
  try {
    const validated = CategorySchema.parse(data);
    const userId = await getUserId();
    const [cat] = await db.insert(categories).values({ userId, ...validated }).returning();
    revalidatePath('/settings');
    revalidatePath('/transactions');
    revalidatePath('/budget');
    return { success: true, data: cat };
  } catch (error: any) {
    console.error('createCategory error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors[0]?.message || 'Data tidak valid' };
    }
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateCategory(id: string, data: unknown) {
  try {
    const validated = CategorySchema.parse(data);
    const userId = await getUserId();
    await db.update(categories)
      .set(validated)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    revalidatePath('/settings');
    revalidatePath('/transactions');
    revalidatePath('/budget');
    return { success: true };
  } catch (error: any) {
    console.error('updateCategory error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors[0]?.message || 'Data tidak valid' };
    }
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const userId = await getUserId();
    // Check if category is in use
    const existing = await db.query.categories.findFirst({
      where: (c, { and: a, eq: e }) => a(e(c.id, id), e(c.userId, userId)),
      with: { transactions: { limit: 1 } },
    });
    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan.' };
    }
    if (existing.transactions && existing.transactions.length > 0) {
      return { success: false, error: 'Kategori tidak dapat dihapus karena masih digunakan oleh transaksi.' };
    }
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    revalidatePath('/settings');
    revalidatePath('/transactions');
    revalidatePath('/budget');
    return { success: true };
  } catch (error) {
    console.error('deleteCategory error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
