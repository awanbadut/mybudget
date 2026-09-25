export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { SavingsClient } from '@/components/SavingsClient';
import { getUserId } from '@/lib/auth';

export default async function SavingsPage() {
  const userId = await getUserId();
  const goals = await db.query.savingsGoals.findMany({
    where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
    with: { transactions: { orderBy: (t, { desc }) => desc(t.transactionDate) } },
  });

  return <SavingsClient goals={goals} />;
}
