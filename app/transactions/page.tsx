export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { TransactionListClient } from '@/components/TransactionListClient';
import { getUserId } from '@/lib/auth';
import { getRecurringTransactions } from '@/actions/recurring';
import { getCurrentMonth } from '@/lib/dates';

import { getAccounts } from '@/actions/accounts';

const PAGE_SIZE = 100; // load max 100 terbaru, filter di client

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string }>;
}) {
  const params = await searchParams;
  const userId = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  const [allCategories, allTransactions, recurringRes, accountsRes] = await Promise.all([
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
  ]);

  return (
    <TransactionListClient
      transactions={allTransactions}
      categories={allCategories}
      accounts={accountsRes.data || []}
      recurringList={recurringRes.data || []}
      currentMonth={currentMonth}
      currentYear={currentYear}
      initialType={(params.type as 'income' | 'expense' | 'transfer') || undefined}
      openForm={params.action === 'new'}
    />
  );
}
