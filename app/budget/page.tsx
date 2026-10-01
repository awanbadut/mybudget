export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { BudgetClient } from '@/components/BudgetClient';
import { getCurrentMonth, getPayrollCycle } from '@/lib/dates';
import { getOrInitializeBudgets } from '@/lib/budget-utils';
import { getUserId } from '@/lib/auth';

export default async function BudgetPage() {
  const DEV_USER_ID = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  const userSettings = await db.query.settings.findFirst({
    where: (s, { eq }) => eq(s.userId, DEV_USER_ID),
  });

  const salaryDate = userSettings?.salaryDate || 25;
  const cycle = getPayrollCycle(salaryDate, new Date());

  const [budgets, categories, cycleTransactions] = await Promise.all([
    getOrInitializeBudgets(DEV_USER_ID, currentMonth, currentYear),
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
        gteFn(t.transactionDate, cycle.startDateStr),
        lteFn(t.transactionDate, cycle.endDateStr)
      ),
    }),
  ]);

  const budgetsWithSpending = budgets.map(budget => {
    const spent = cycleTransactions
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
