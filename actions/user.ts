'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/server-utils';
import { comparePassword, hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      return { success: false, error: 'Semua kolom harus diisi.' };
    }
    if (data.newPassword.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'Konfirmasi password tidak cocok.' };
    }

    const userId = await getUserId();
    const user = await db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.id, userId),
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Password saat ini tidak benar.' };
    }

    const newHash = await hashPassword(data.newPassword);
    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('changePassword error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
