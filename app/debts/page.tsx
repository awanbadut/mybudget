export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { DebtTrackerClient } from '@/components/DebtTrackerClient';
import { getUserId } from '@/lib/auth';
import { getAccounts } from '@/actions/accounts';

export default async function DebtsPage() {
  const userId = await getUserId();
  const [debts, accountsRes] = await Promise.all([
    db.query.debts.findMany({
      where: (d, { eq: eqFn }) => eqFn(d.userId, userId),
      with: { installments: { orderBy: (i, { asc }) => asc(i.installmentNumber) } },
    }),
    getAccounts(),
  ]);

  return <DebtTrackerClient debts={debts} accounts={accountsRes.data || []} />;
}
