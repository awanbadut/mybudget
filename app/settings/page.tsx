export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { SettingsClient } from '@/components/SettingsClient';
import { getUserId } from '@/lib/auth';

export default async function SettingsPage() {
  const userId = await getUserId();
  const [user, userSettings] = await Promise.all([
    db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, userId),
    }),
    db.query.settings.findFirst({
      where: (s, { eq: eqFn }) => eqFn(s.userId, userId),
    }),
  ]);

  return <SettingsClient user={user} settings={userSettings} />;
}
