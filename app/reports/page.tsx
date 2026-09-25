export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { ReportsClient } from '@/components/ReportsClient';
import { getUserId } from '@/lib/auth';

export default async function ReportsPage() {
  const userId = await getUserId();
  // Get last 12 months of data
  const [allTransactions, savingsGoals] = await Promise.all([
    db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
      with: { category: true },
      orderBy: (t, { desc }) => desc(t.transactionDate),
    }),
    db.query.savingsGoals.findMany({
      where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
      with: { transactions: true },
    }),
  ]);

  return <ReportsClient transactions={allTransactions} savingsGoals={savingsGoals} />;
}
