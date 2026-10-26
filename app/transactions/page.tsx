export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { TransactionListClient } from '@/components/TransactionListClient';
import { getUserId } from '@/lib/auth';
import { getRecurringTransactions } from '@/actions/recurring';
import { getCurrentMonth, getRecentCycles } from '@/lib/dates';

import { getAccounts } from '@/actions/accounts';
import { ensureSavingsCategory } from '@/actions/savings';

const PAGE_SIZE = 1000; // load riwayat transaksi lengkap lintas siklus

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string }>;
}) {
  const params = await searchParams;
  const userId = await getUserId();
  await ensureSavingsCategory(userId);
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  const [allCategories, allTransactions, recurringRes, accountsRes, userSettings] = await Promise.all([
    db.query.categories.findMany({
      where: (c, { eq: eqFn }) => eqFn(c.userId, userId),
    }),
    db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
      limit: PAGE_SIZE,
    }),
    getRecurringTransactions(),
    getAccounts(),
    db.query.settings.findFirst({
      where: (s, { eq: eqFn }) => eqFn(s.userId, userId),
    }),
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
    <TransactionListClient
      transactions={allTransactions}
      categories={allCategories}
      accounts={accountsRes.data || []}
      recurringList={recurringRes.data || []}
      cycles={cycles}
      currentMonth={currentMonth}
      currentYear={currentYear}
      initialType={(params.type as 'income' | 'expense' | 'transfer') || undefined}
      openForm={params.action === 'new'}
    />
  );
}
