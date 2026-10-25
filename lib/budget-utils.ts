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

    let prevBudgets = await db.query.budgets.findMany({
      where: (b, { and, eq }) => and(
        eq(b.userId, userId),
        eq(b.month, prevM),
        eq(b.year, prevY)
      ),
    });

    if (prevBudgets.length === 0) {
      // Find the most recent month that had budgets configured for this user
      const latestBudget = await db.query.budgets.findFirst({
        where: (b, { eq }) => eq(b.userId, userId),
        orderBy: (b, { desc }) => [desc(b.year), desc(b.month)],
      });

      if (latestBudget) {
        prevBudgets = await db.query.budgets.findMany({
          where: (b, { and, eq }) => and(
            eq(b.userId, userId),
            eq(b.month, latestBudget.month),
            eq(b.year, latestBudget.year)
          ),
        });
      }
    }

    // If still empty, check user settings for initial category budgets (Makan, Kos/Tempat Tinggal, dll.)
    if (prevBudgets.length === 0) {
      const [userSettings, userCategories] = await Promise.all([
        db.query.settings.findFirst({ where: (s, { eq }) => eq(s.userId, userId) }),
        db.query.categories.findMany({
          where: (c, { and, eq }) => and(eq(c.userId, userId), eq(c.type, 'expense')),
        }),
      ]);

      if (userSettings && userCategories.length > 0) {
        const settingMap: Array<{ names: string[]; amount: number }> = [
          { names: ['Makan', 'Makanan'], amount: userSettings.foodBudget || 0 },
          { names: ['Tempat Tinggal', 'Kos', 'Kontrakan', 'Sewa'], amount: userSettings.rentBudget || 0 },
          { names: ['Hiburan'], amount: userSettings.entertainmentBudget || 0 },
          { names: ['Belanja Bulanan', 'Kebutuhan Harian'], amount: userSettings.toiletries_budget || 0 },
          { names: ['Transportasi', 'Transport'], amount: userSettings.transportBudget || 0 },
        ];

        for (const item of settingMap) {
          if (item.amount > 0) {
            const matchedCat = userCategories.find(c =>
              item.names.some(n => c.name.toLowerCase() === n.toLowerCase())
            );
            if (matchedCat) {
              try {
                await db.insert(budgets).values({
                  userId,
                  categoryId: matchedCat.id,
                  month,
                  year,
                  amount: item.amount,
                });
              } catch {
                // ignore duplicate
              }
            }
          }
        }
      }
    }

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

  return userBudgets;
}
