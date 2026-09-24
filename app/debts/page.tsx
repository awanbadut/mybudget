export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { DebtTrackerClient } from '@/components/DebtTrackerClient';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

export default async function DebtsPage() {
  const debts = await db.query.debts.findMany({
    where: (d, { eq: eqFn }) => eqFn(d.userId, DEV_USER_ID),
    with: { installments: { orderBy: (i, { asc }) => asc(i.installmentNumber) } },
  });

  return <DebtTrackerClient debts={debts} />;
}
