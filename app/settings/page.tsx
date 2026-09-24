export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { SettingsClient } from '@/components/SettingsClient';

const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

export default async function SettingsPage() {
  const [user, userSettings] = await Promise.all([
    db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, DEV_USER_ID),
    }),
    db.query.settings.findFirst({
      where: (s, { eq: eqFn }) => eqFn(s.userId, DEV_USER_ID),
    }),
  ]);

  return <SettingsClient user={user} settings={userSettings} />;
}
