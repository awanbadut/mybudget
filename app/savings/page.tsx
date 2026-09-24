export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { SavingsClient } from '@/components/SavingsClient';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

export default async function SavingsPage() {
  const goals = await db.query.savingsGoals.findMany({
    where: (g, { eq: eqFn }) => eqFn(g.userId, DEV_USER_ID),
    with: { transactions: { orderBy: (t, { desc }) => desc(t.transactionDate) } },
  });

  return <SavingsClient goals={goals} />;
}
