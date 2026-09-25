export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { BudgetClient } from '@/components/BudgetClient';
import { getMonthDateRange } from '@/lib/dates';

import { getUserId } from '@/lib/auth';

export default async function BudgetPage() {
  const DEV_USER_ID = await getUserId();
  const currentMonth = 9;
  const currentYear = 2026;

  const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);

  const [budgets, categories, transactions] = await Promise.all([
    db.query.budgets.findMany({
      where: (b, { and: andFn, eq: eqFn }) => andFn(
        eqFn(b.userId, DEV_USER_ID),
        eqFn(b.month, currentMonth),
        eqFn(b.year, currentYear)
      ),
      with: { category: true },
    }),
    db.query.categories.findMany({
      where: (c, { and: andFn, eq: eqFn }) => andFn(
        eqFn(c.userId, DEV_USER_ID),
        eqFn(c.type, 'expense')
      ),
    }),
    db.query.transactions.findMany({
      where: (t, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) => andFn(
        eqFn(t.userId, DEV_USER_ID),
        eqFn(t.type, 'expense'),
        gteFn(t.transactionDate, startDate),
        lteFn(t.transactionDate, endDate)
      ),
    }),
  ]);

  const budgetsWithSpending = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
    };
  });

  return (
    <BudgetClient
      budgets={budgetsWithSpending}
      categories={categories}
      month={currentMonth}
      year={currentYear}
    />
  );
}
