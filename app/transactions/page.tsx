export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { TransactionListClient } from '@/components/TransactionListClient';
import { getUserId } from '@/lib/auth';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string }>;
}) {
  const params = await searchParams;
  const userId = await getUserId();
  const [allCategories, allTransactions] = await Promise.all([
    db.query.categories.findMany({
      where: (c, { eq: eqFn }) => eqFn(c.userId, userId),
    }),
    db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
      with: { category: true },
      orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
    }),
  ]);

  return (
    <TransactionListClient
      transactions={allTransactions}
      categories={allCategories}
      initialType={(params.type as 'income' | 'expense') || undefined}
      openForm={params.action === 'new'}
    />
  );
}
