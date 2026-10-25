export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { ReportsClient } from '@/components/ReportsClient';
import { getUserId } from '@/lib/auth';
import { getAccounts } from '@/actions/accounts';
import { getCurrentMonth, getRecentCycles } from '@/lib/dates';
import { getOrInitializeBudgets } from '@/lib/budget-utils';

export default async function ReportsPage() {
  const userId = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  const [allTransactions, savingsGoals, debtsList, userSettings, categories, accountsRes, currentBudgets] =
    await Promise.all([
      db.query.transactions.findMany({
        where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
        with: { category: true, account: true, toAccount: true },
        orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
      }),
      db.query.savingsGoals.findMany({
        where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
        with: { transactions: true },
      }),
      db.query.debts.findMany({
        where: (d, { and: a, eq: e }) => a(e(d.userId, userId), e(d.status, 'active')),
        with: { installments: true },
      }),
      db.query.settings.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.userId, userId),
      }),
      db.query.categories.findMany({
        where: (c, { eq: eqFn }) => eqFn(c.userId, userId),
      }),
      getAccounts(),
      getOrInitializeBudgets(userId, currentMonth, currentYear),
    ]);

  const salary = userSettings?.salary || 0;
  const salaryDate = userSettings?.salaryDate || 25;
  const isStudentMode = salary === 0;
  const cycles = getRecentCycles(salaryDate, isStudentMode, 12).map(c => ({
    offset: c.offset || 0,
    label: c.label,
    startDateStr: c.startDateStr,
    endDateStr: c.endDateStr,
    isHistorical: c.isHistorical,
  }));

  return (
    <ReportsClient
      transactions={allTransactions}
      savingsGoals={savingsGoals}
      debts={debtsList}
      categories={categories}
      accounts={accountsRes.data || []}
      cycles={cycles}
      budgets={currentBudgets}
      foodBudgetTotal={userSettings?.foodBudget || 0}
      salaryDate={salaryDate}
      isStudentMode={isStudentMode}
    />
  );
}
