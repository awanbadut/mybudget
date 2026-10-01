import { db } from '@/db';
import { budgets } from '@/db/schema';

export async function getOrInitializeBudgets(userId: string, month: number, year: number) {
  let userBudgets = await db.query.budgets.findMany({
    where: (b, { and, eq }) => and(
      eq(b.userId, userId),
      eq(b.month, month),
      eq(b.year, year)
    ),
    with: { category: true },
  });

  if (userBudgets.length === 0) {
    let prevM = month - 1;
    let prevY = year;
    if (prevM <= 0) {
      prevM = 12;
      prevY -= 1;
    }

    const prevBudgets = await db.query.budgets.findMany({
      where: (b, { and, eq }) => and(
        eq(b.userId, userId),
        eq(b.month, prevM),
        eq(b.year, prevY)
      ),
    });

    if (prevBudgets.length > 0) {
      for (const pb of prevBudgets) {
        try {
          await db.insert(budgets).values({
            userId,
            categoryId: pb.categoryId,
            month,
            year,
            amount: pb.amount,
          });
        } catch {
          // ignore duplicate race condition
        }
      }

      userBudgets = await db.query.budgets.findMany({
        where: (b, { and, eq }) => and(
          eq(b.userId, userId),
          eq(b.month, month),
          eq(b.year, year)
        ),
        with: { category: true },
      });
    }
  }

  return userBudgets;
}
