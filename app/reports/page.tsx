export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { ReportsClient } from '@/components/ReportsClient';
import { getUserId } from '@/lib/auth';

export default async function ReportsPage() {
  const userId = await getUserId();
  // Get last 12 months of data, savings, and debts
  const [allTransactions, savingsGoals, debtsList] = await Promise.all([
    db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
      with: { category: true },
      orderBy: (t, { desc }) => desc(t.transactionDate),
    }),
    db.query.savingsGoals.findMany({
      where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
      with: { transactions: true },
    }),
    db.query.debts.findMany({
      where: (d, { and: a, eq: e }) => a(e(d.userId, userId), e(d.status, 'active')),
      with: { installments: true },
    }),
  ]);

  return (
    <ReportsClient
      transactions={allTransactions}
      savingsGoals={savingsGoals}
      debts={debtsList}
    />
  );
}
