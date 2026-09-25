'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, settings, categories, budgets, savingsGoals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, signToken, getSession } from '@/lib/auth';
import { safeRevalidate } from '@/lib/server-utils';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan password harus diisi.' };
  }

  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.username, username),
    });

    if (!user || !user.passwordHash) {
      return { error: 'Username atau password salah.' };
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return { error: 'Username atau password salah.' };
    }

    const token = await signToken({
      userId: user.id,
      username: user.username!,
      name: user.name,
      role: (user.role as 'user' | 'admin') || 'user',
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return { success: true, role: user.role };
  } catch (error) {
    console.error('loginAction error:', error);
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}

export async function registerAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name || !username || !password) {
    return { error: 'Semua kolom harus diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username hanya boleh mengandung huruf, angka, dan underscore.' };
  }

  try {
    // Check if username already taken
    const existing = await db.query.users.findFirst({
      where: (u, { eq: eqFn }) => eqFn(u.username, username),
    });
    if (existing) {
      return { error: 'Username sudah digunakan.' };
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name,
      username,
      passwordHash,
      role: 'user',
    }).returning({ id: users.id });

    // Create default settings for new user
    await db.insert(settings).values({
      userId: newUser.id,
      salary: 0,
      salaryDate: 25,
      rentBudget: 0,
      foodBudget: 0,
      entertainmentBudget: 0,
      toiletries_budget: 0,
      transportBudget: 0,
      salaryProrateEnabled: false,
      salaryProrateMethod: 'calendar_days',
    });

    // Create default expense categories
    const defaultExpenseCategories = [
      { name: 'Kos', color: '#6366f1', icon: 'Home' },
      { name: 'Makan', color: '#f59e0b', icon: 'UtensilsCrossed' },
      { name: 'Utang', color: '#ef4444', icon: 'CreditCard' },
      { name: 'Hiburan', color: '#ec4899', icon: 'Music' },
      { name: 'Toiletries', color: '#8b5cf6', icon: 'ShoppingBag' },
      { name: 'Transport', color: '#06b6d4', icon: 'Car' },
      { name: 'Belanja', color: '#f97316', icon: 'ShoppingCart' },
      { name: 'Tagihan', color: '#64748b', icon: 'FileText' },
      { name: 'Kesehatan', color: '#10b981', icon: 'Heart' },
      { name: 'Lainnya', color: '#94a3b8', icon: 'MoreHorizontal' },
    ];

    const defaultIncomeCategories = [
      { name: 'Gaji', color: '#10b981', icon: 'Banknote' },
      { name: 'Bonus', color: '#22c55e', icon: 'Gift' },
      { name: 'Freelance', color: '#84cc16', icon: 'Laptop' },
      { name: 'Lainnya', color: '#94a3b8', icon: 'MoreHorizontal' },
    ];

    for (const cat of defaultExpenseCategories) {
      await db.insert(categories).values({ userId: newUser.id, type: 'expense', ...cat });
    }
    for (const cat of defaultIncomeCategories) {
      await db.insert(categories).values({ userId: newUser.id, type: 'income', ...cat });
    }

    // Default savings goal
    await db.insert(savingsGoals).values({
      userId: newUser.id,
      name: 'Tabungan Utama',
      targetAmount: 10000000,
      currentAmount: 0,
    });

    return { success: true };
  } catch (error) {
    console.error('registerAction error:', error);
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function getCurrentSession() {
  return getSession();
}
