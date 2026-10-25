export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { BudgetClient } from '@/components/BudgetClient';
import { getCurrentMonth, getCycleByOffset, getRecentCycles } from '@/lib/dates';
import { getOrInitializeBudgets } from '@/lib/budget-utils';
import { getUserId } from '@/lib/auth';

export default async function BudgetPage({
  searchParams,
}: {
  searchParams?: Promise<{ cycle?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawOffset = parseInt(params?.cycle || '0', 10);
  const cycleOffset = Number.isNaN(rawOffset) ? 0 : Math.min(0, rawOffset);

  const DEV_USER_ID = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  const userSettings = await db.query.settings.findFirst({
    where: (s, { eq }) => eq(s.userId, DEV_USER_ID),
  });

  const salary = userSettings?.salary || 0;
  const salaryDate = userSettings?.salaryDate || 25;
  const isStudentMode = salary === 0;

  const cycle = getCycleByOffset(salaryDate, isStudentMode, cycleOffset);
  const recentCycles = getRecentCycles(salaryDate, isStudentMode, 12).map(c => ({
    offset: c.offset || 0,
    label: c.label,
    startDateStr: c.startDateStr,
    endDateStr: c.endDateStr,
    isHistorical: c.isHistorical,
  }));

  const targetMonth = cycle.budgetMonth || currentMonth;
  const targetYear = cycle.budgetYear || currentYear;

  const [budgets, categories, cycleTransactions] = await Promise.all([
    getOrInitializeBudgets(DEV_USER_ID, targetMonth, targetYear),
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
      month={targetMonth}
      year={targetYear}
      cycleLabel={cycle.label}
      cycles={recentCycles}
      currentCycleOffset={cycleOffset}
      salaryDate={salaryDate}
      isStudentMode={isStudentMode}
    />
  );
}
