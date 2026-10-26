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

// 7. Manage System Broadcast Announcement
export async function adminSetBroadcast(message: string, isActive: boolean) {
  try {
    await requireAdmin();
    await ensureAnnouncementTable();

    await db.execute(sql`
      INSERT INTO system_announcements (id, message, is_active, updated_at)
      VALUES ('global', ${message.trim()}, ${isActive}, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET message = EXCLUDED.message, 
          is_active = EXCLUDED.is_active, 
          updated_at = NOW();
    `);

    safeRevalidate('/');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('adminSetBroadcast error:', error);
    return { success: false, error: error.message || 'Gagal menyimpan pengumuman.' };
  }
}

export async function getSystemBroadcast(): Promise<{ message: string; isActive: boolean }> {
  try {
    await ensureAnnouncementTable();
    const result: any = await db.execute(sql`
      SELECT message, is_active FROM system_announcements WHERE id = 'global' LIMIT 1;
    `);

    const row = result?.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : null);
    if (row) {
      return {
        message: String(row.message || ''),
        isActive: Boolean(row.is_active),
      };
    }
    return { message: '', isActive: false };
  } catch {
    return { message: '', isActive: false };
  }
}
