export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { ReportsClient } from '@/components/ReportsClient';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

export default async function ReportsPage() {
  // Get last 12 months of data
  const allTransactions = await db.query.transactions.findMany({
    where: (t, { eq: eqFn }) => eqFn(t.userId, DEV_USER_ID),
    with: { category: true },
    orderBy: (t, { desc }) => desc(t.transactionDate),
  });

  const savingsGoals = await db.query.savingsGoals.findMany({
    where: (g, { eq: eqFn }) => eqFn(g.userId, DEV_USER_ID),
    with: { transactions: true },
  });

  return <ReportsClient transactions={allTransactions} savingsGoals={savingsGoals} />;
}
