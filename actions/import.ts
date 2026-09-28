'use server';

import { db } from '@/db';
import { transactions, budgets, savingsGoals, savingsTransactions, debts, debtInstallments, categories } from '@/db/schema';
import { getUserId } from '@/lib/server-utils';
import { ExportSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function importData(jsonData: unknown) {
  try {
    const userId = await getUserId();
    const parsed = ExportSchema.parse(jsonData);

    // Validasi: data hanya bisa diimport ke user yang sama (opsional, skip jika tidak ada info user)
    // Import transactions saja (aman, tidak menghapus data existing)
    let imported = 0;

    // Map old category IDs ke new category IDs berdasarkan nama
    const userCategories = await db.query.categories.findMany({
      where: (c, { eq: e }) => e(c.userId, userId),
    });
    const catMap: Record<string, string> = {};
    for (const impCat of parsed.categories || []) {
      const existing = userCategories.find(
        c => c.name === impCat.name && c.type === impCat.type
      );
      if (existing) {
        catMap[impCat.id] = existing.id;
      } else {
        // Create new category
        const [newCat] = await db.insert(categories).values({
          userId,
          name: impCat.name,
          type: impCat.type,
          color: impCat.color,
          icon: impCat.icon,
        }).returning({ id: categories.id });
        catMap[impCat.id] = newCat.id;
      }
    }

    // Import transactions
    for (const tx of parsed.transactions || []) {
      const newCatId = catMap[tx.categoryId];
      if (!newCatId) continue;
      try {
        await db.insert(transactions).values({
          userId,
          categoryId: newCatId,
          type: tx.type,
          name: tx.name,
          amount: tx.amount,
          transactionDate: tx.transactionDate,
          note: tx.note,
        });
        imported++;
      } catch {
        // Skip duplicates
      }
    }

    // Import savings goals
    const goalMap: Record<string, string> = {};
    for (const goal of parsed.savingsGoals || []) {
      try {
        const [newGoal] = await db.insert(savingsGoals).values({
          userId,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount || 0,
          deadline: goal.deadline,
        }).returning({ id: savingsGoals.id });
        goalMap[goal.id] = newGoal.id;
      } catch {
        // Skip
      }
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/savings');

    return { success: true, imported };
  } catch (error: any) {
    console.error('importData error:', error);
    return { success: false, error: 'Format file tidak valid atau data rusak.' };
  }
}
