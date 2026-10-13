export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { SavingsClient } from '@/components/SavingsClient';
import { getUserId } from '@/lib/auth';
import { getAccounts } from '@/actions/accounts';

export default async function SavingsPage() {
  const userId = await getUserId();
  const [goals, accountsRes] = await Promise.all([
    db.query.savingsGoals.findMany({
      where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
      with: { transactions: { orderBy: (t, { desc }) => desc(t.transactionDate) } },
    }),
    getAccounts(),
  ]);

  return <SavingsClient goals={goals} accounts={accountsRes.data || []} />;
}
