export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { DebtTrackerClient } from '@/components/DebtTrackerClient';
import { getUserId } from '@/lib/auth';

export default async function DebtsPage() {
  const userId = await getUserId();
  const debts = await db.query.debts.findMany({
    where: (d, { eq: eqFn }) => eqFn(d.userId, userId),
    with: { installments: { orderBy: (i, { asc }) => asc(i.installmentNumber) } },
  });

  return <DebtTrackerClient debts={debts} />;
}
