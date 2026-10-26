'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSession, hashPassword, signToken, requireAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeRevalidate } from '@/lib/server-utils';

let announcementTableChecked = false;
async function ensureAnnouncementTable() {
  if (announcementTableChecked) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_announcements (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        message TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    announcementTableChecked = true;
  } catch (e) {
    console.error('ensureAnnouncementTable error:', e);
  }
}

let maintenanceTableChecked = false;
async function ensureMaintenanceTable() {
  if (maintenanceTableChecked) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_maintenance (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
        is_active BOOLEAN NOT NULL DEFAULT false,
        title TEXT NOT NULL DEFAULT 'Sistem Sedang Dalam Pemeliharaan',
        message TEXT NOT NULL DEFAULT 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.',
        estimated_end_time TEXT DEFAULT '',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    maintenanceTableChecked = true;
  } catch (e) {
    console.error('ensureMaintenanceTable error:', e);
  }
}

// 1. Reset user password directly
export async function adminResetUserPassword(userId: string, newPassword: string) {
  try {
    await requireAdmin();
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }

    const passwordHash = await hashPassword(newPassword);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminResetUserPassword error:', error);
    return { success: false, error: error.message || 'Gagal mereset password pengguna.' };
  }
}

// 2. Change user role (user <-> admin)
export async function adminUpdateUserRole(userId: string, newRole: 'user' | 'admin') {
  try {
    const adminSession = await requireAdmin();
    if (adminSession.userId === userId) {
      return { success: false, error: 'Anda tidak dapat mengubah role akun Anda sendiri.' };
    }

    await db.update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(users.id, userId));

    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminUpdateUserRole error:', error);
    return { success: false, error: error.message || 'Gagal mengubah role pengguna.' };
  }
}

// 3. Update user profile (name, username)
export async function adminUpdateUserProfile(userId: string, data: { name: string; username: string }) {
  try {
    await requireAdmin();
    const name = data.name?.trim();
    const username = data.username?.trim().toLowerCase();

    if (!name || !username) {
      return { success: false, error: 'Nama dan username wajib diisi.' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, error: 'Username hanya boleh huruf, angka, dan underscore.' };
    }

    // Check if new username collides with someone else
    const existing = await db.query.users.findFirst({
      where: (u, { and: a, eq: e, ne }) => a(e(u.username, username), ne(u.id, userId)),
    });
    if (existing) {
      return { success: false, error: 'Username tersebut sudah dipakai pengguna lain.' };
    }

    await db.update(users)
      .set({ name, username, updatedAt: new Date() })
      .where(eq(users.id, userId));

    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminUpdateUserProfile error:', error);
    return { success: false, error: error.message || 'Gagal memperbarui profil pengguna.' };
  }
}

// 4. Delete user permanently (cascades to all data)
export async function adminDeleteUser(userId: string) {
  try {
    const adminSession = await requireAdmin();
    if (adminSession.userId === userId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun admin yang sedang Anda gunakan.' };
    }

    const targetUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // PostgreSQL schema has ON DELETE CASCADE for all user relations
    await db.delete(users).where(eq(users.id, userId));

    safeRevalidate('/admin');
    return { success: true, name: targetUser.name };
  } catch (error: any) {
    console.error('adminDeleteUser error:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengguna.' };
  }
}

// 5. Impersonate user ("Login Sebagai Pengguna Ini")
export async function adminImpersonateUser(targetUserId: string) {
  try {
    const adminSession = await requireAdmin();
    if (adminSession.userId === targetUserId) {
      return { success: false, error: 'Ini adalah akun Anda sendiri.' };
    }

    const targetUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, targetUserId),
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna target tidak ditemukan.' };
    }

    // Sign temporary token impersonating the target user with admin metadata
    const token = await signToken({
      userId: targetUser.id,
      username: targetUser.username || targetUser.name,
      name: targetUser.name,
      role: (targetUser.role as 'user' | 'admin') || 'user',
      impersonatorAdminId: adminSession.userId,
      impersonatorAdminName: adminSession.name,
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    safeRevalidate('/');
    return { success: true };
  } catch (error: any) {
    console.error('adminImpersonateUser error:', error);
    return { success: false, error: error.message || 'Gagal login sebagai pengguna.' };
  }
}

// 6. Stop impersonating and return to Admin Console
export async function adminStopImpersonating() {
  const session = await getSession();
  const adminId = session?.impersonatorAdminId;

  if (!adminId) {
    redirect('/');
  }

  const adminUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, adminId),
  });

  if (!adminUser) {
    redirect('/login');
  }

  const token = await signToken({
    userId: adminUser.id,
    username: adminUser.username || adminUser.name,
    name: adminUser.name,
    role: 'admin',
  });

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  safeRevalidate('/');
  safeRevalidate('/admin');
  redirect('/admin');
}

// 7. Manage System Broadcast Announcements (Supports Multiple Active Broadcasts)
export async function getActiveBroadcasts(): Promise<string[]> {
  try {
    const result: any = await db.execute(sql`
      SELECT message FROM system_announcements 
      WHERE is_active = true AND TRIM(message) != ''
      ORDER BY updated_at DESC;
    `);
    const rows = result?.rows || (Array.isArray(result) ? result : []);
    return rows.map((r: any) => String(r.message || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export interface BroadcastItem {
  id: string;
  message: string;
  isActive: boolean;
  updatedAt: string;
}

export async function adminGetAllBroadcasts(): Promise<BroadcastItem[]> {
  try {
    await ensureAnnouncementTable();
    const result: any = await db.execute(sql`
      SELECT id, message, is_active, updated_at 
      FROM system_announcements 
      ORDER BY updated_at DESC;
    `);
    const rows = result?.rows || (Array.isArray(result) ? result : []);
    return rows.map((r: any) => ({
      id: String(r.id),
      message: String(r.message || ''),
      isActive: Boolean(r.is_active),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function adminSaveBroadcast(id: string | null, message: string, isActive: boolean) {
  try {
    await requireAdmin();
    await ensureAnnouncementTable();

    const targetId = id && id.trim() ? id.trim() : `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const trimmedMsg = message.trim();

    await db.execute(sql`
      INSERT INTO system_announcements (id, message, is_active, updated_at)
      VALUES (${targetId}, ${trimmedMsg}, ${isActive}, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET message = EXCLUDED.message, 
          is_active = EXCLUDED.is_active, 
          updated_at = NOW();
    `);

    safeRevalidate('/');
    safeRevalidate('/admin');
    return { success: true, id: targetId };
  } catch (error: any) {
    console.error('adminSaveBroadcast error:', error);
    return { success: false, error: error.message || 'Gagal menyimpan pengumuman.' };
  }
}

export async function adminDeleteBroadcast(id: string) {
  try {
    await requireAdmin();
    await ensureAnnouncementTable();

    await db.execute(sql`
      DELETE FROM system_announcements WHERE id = ${id.trim()};
    `);

    safeRevalidate('/');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminDeleteBroadcast error:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengumuman.' };
  }
}

export async function adminSetBroadcast(message: string, isActive: boolean) {
  return adminSaveBroadcast('global', message, isActive);
}

export async function getSystemBroadcast(): Promise<{ message: string; isActive: boolean }> {
  try {
    const active = await getActiveBroadcasts();
    if (active.length > 0) {
      return { message: active.join('  ✦  '), isActive: true };
    }
    return { message: '', isActive: false };
  } catch {
    return { message: '', isActive: false };
  }
}

// 8. Maintenance Window (System Maintenance Mode)
export interface MaintenanceStatus {
  isActive: boolean;
  title: string;
  message: string;
  estimatedEndTime: string;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const result: any = await db.execute(sql`
      SELECT is_active, title, message, estimated_end_time 
      FROM system_maintenance 
      WHERE id = 'current' 
      LIMIT 1;
    `);

    const row = result?.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : null);
    if (row) {
      return {
        isActive: Boolean(row.is_active),
        title: String(row.title || 'Sistem Sedang Dalam Pemeliharaan'),
        message: String(row.message || 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.'),
        estimatedEndTime: String(row.estimated_end_time || ''),
      };
    }
    return {
      isActive: false,
      title: 'Sistem Sedang Dalam Pemeliharaan',
      message: 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.',
      estimatedEndTime: '',
    };
  } catch {
    return {
      isActive: false,
      title: 'Sistem Sedang Dalam Pemeliharaan',
      message: 'Kami sedang melakukan pemeliharaan berkala.',
      estimatedEndTime: '',
    };
  }
}

export async function adminSetMaintenance(
  isActive: boolean,
  title: string,
  message: string,
  estimatedEndTime: string
) {
  try {
    await requireAdmin();
    await ensureMaintenanceTable();

    const safeTitle = title.trim() || 'Sistem Sedang Dalam Pemeliharaan';
    const safeMsg = message.trim() || 'Kami sedang melakukan peningkatan performa dan pembaruan sistem. Mohon tunggu beberapa saat.';
    const safeEnd = estimatedEndTime.trim();

    await db.execute(sql`
      INSERT INTO system_maintenance (id, is_active, title, message, estimated_end_time, updated_at)
      VALUES ('current', ${isActive}, ${safeTitle}, ${safeMsg}, ${safeEnd}, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET is_active = EXCLUDED.is_active, 
          title = EXCLUDED.title, 
          message = EXCLUDED.message, 
          estimated_end_time = EXCLUDED.estimated_end_time, 
          updated_at = NOW();
    `);

    safeRevalidate('/');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminSetMaintenance error:', error);
    return { success: false, error: error.message || 'Gagal mengatur mode pemeliharaan.' };
  }
}

// 9. System Health & Database Telemetry
export interface SystemHealth {
  status: 'healthy' | 'degraded';
  latencyMs: number;
  database: string;
  counts: {
    users: number;
    transactions: number;
    accounts: number;
    savings: number;
    debts: number;
  };
  checkedAt: string;
}

export async function adminGetSystemHealth(): Promise<SystemHealth> {
  const start = Date.now();
  try {
    await requireAdmin();
    await db.execute(sql`SELECT 1;`);
    const latencyMs = Math.max(1, Date.now() - start);

    const [userCountRes, txCountRes, accCountRes, savCountRes, debtCountRes]: any = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int as count FROM users;`),
      db.execute(sql`SELECT COUNT(*)::int as count FROM transactions;`),
      db.execute(sql`SELECT COUNT(*)::int as count FROM accounts;`),
      db.execute(sql`SELECT COUNT(*)::int as count FROM savings_goals;`),
      db.execute(sql`SELECT COUNT(*)::int as count FROM debts;`),
    ]);

    const getCount = (res: any) => {
      const row = res?.rows ? res.rows[0] : (Array.isArray(res) ? res[0] : null);
      return Number(row?.count || 0);
    };

    return {
      status: 'healthy',
      latencyMs,
      database: 'Neon Serverless PostgreSQL',
      counts: {
        users: getCount(userCountRes),
        transactions: getCount(txCountRes),
        accounts: getCount(accCountRes),
        savings: getCount(savCountRes),
        debts: getCount(debtCountRes),
      },
      checkedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      status: 'degraded',
      latencyMs: Math.max(1, Date.now() - start),
      database: 'Neon PostgreSQL (Unreachable)',
      counts: { users: 0, transactions: 0, accounts: 0, savings: 0, debts: 0 },
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function adminFlushCacheAction() {
  try {
    await requireAdmin();
    safeRevalidate('/');
    safeRevalidate('/admin');
    safeRevalidate('/budget');
    safeRevalidate('/reports');
    safeRevalidate('/transactions');
    safeRevalidate('/savings');
    safeRevalidate('/debts');
    safeRevalidate('/settings');
    return { success: true, timestamp: new Date().toISOString() };
  } catch (e: any) {
    return { success: false, error: e.message || 'Gagal membersihkan cache.' };
  }
}
