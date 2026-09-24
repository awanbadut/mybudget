export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { TransactionListClient } from '@/components/TransactionListClient';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string }>;
}) {
  const params = await searchParams;
  const [allCategories, allTransactions] = await Promise.all([
    db.query.categories.findMany({
      where: (c, { eq: eqFn }) => eqFn(c.userId, DEV_USER_ID),
    }),
    db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, DEV_USER_ID),
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
