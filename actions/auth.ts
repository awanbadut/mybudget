'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, settings, categories, budgets, savingsGoals, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, signToken, getSession } from '@/lib/auth';
import { safeRevalidate } from '@/lib/server-utils';
import { ensureAccountsTable } from '@/actions/accounts';

export async function loginAction(formData: FormData) {
  const rawUsername = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!rawUsername || !password) {
    return { error: 'Username dan password harus diisi.' };
  }

  const username = rawUsername.toLowerCase();

  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq: eqFn, or: orFn }) =>
        orFn
          ? orFn(eqFn(u.username, rawUsername), eqFn(u.username, username))
          : eqFn(u.username, rawUsername),
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
  const rawUsername = (formData.get('username') as string)?.trim();
  const username = rawUsername?.toLowerCase();
  const email = (formData.get('email') as string)?.trim() || null;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string | null;

  if (!name || !username || !password) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  if (confirmPassword !== null && confirmPassword !== undefined && password !== confirmPassword) {
    return { error: 'Konfirmasi password tidak cocok.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username hanya boleh mengandung huruf, angka, dan underscore.' };
  }

  try {
    // Check if username already taken
    const existing = await db.query.users.findFirst({
      where: (u, { eq: eqFn, or: orFn }) =>
        orFn
          ? orFn(eqFn(u.username, rawUsername), eqFn(u.username, username))
          : eqFn(u.username, username),
    });
    if (existing) {
      return { error: 'Username sudah digunakan.' };
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name,
      username,
      email,
      passwordHash,
      role: 'user',
    }).returning({ id: users.id });

    // Create default settings for new user
    const salary = parseInt(formData.get('salary') as string || '0', 10) || 0;
    const salaryDate = parseInt(formData.get('salaryDate') as string || '25', 10) || 25;
    await db.insert(settings).values({
      userId: newUser.id,
      salary,
      salaryDate,
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
      { name: 'Tabungan', color: '#10b981', icon: 'PiggyBank' },
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

    await db.insert(categories).values([
      ...defaultExpenseCategories.map(cat => ({ userId: newUser.id, type: 'expense' as const, ...cat })),
      ...defaultIncomeCategories.map(cat => ({ userId: newUser.id, type: 'income' as const, ...cat })),
    ]);

    // Ensure accounts table and initialize default accounts for new user
    try {
      await ensureAccountsTable();
      await db.insert(accounts).values([
        { userId: newUser.id, name: 'Kas Tunai', type: 'cash', initialBalance: 0, color: '#16a34a', icon: 'Coins', isDefault: true },
        { userId: newUser.id, name: 'BCA', type: 'bank', initialBalance: 0, color: '#2563eb', icon: 'Building2', isDefault: false },
        { userId: newUser.id, name: 'GoPay', type: 'ewallet', initialBalance: 0, color: '#0284c7', icon: 'Smartphone', isDefault: false },
      ]);
    } catch (accErr) {
      console.warn('Accounts initialization note:', accErr);
    }

    // Default savings goal
    await db.insert(savingsGoals).values({
      userId: newUser.id,
      name: 'Tabungan Utama',
      targetAmount: 10000000,
      currentAmount: 0,
    });

    // Auto-login upon registration
    const token = await signToken({
      userId: newUser.id,
      username,
      name,
      role: 'user',
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    safeRevalidate('/');
    safeRevalidate('/admin');

    return { success: true };
  } catch (error) {
    console.error('registerAction error:', error);
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function getCurrentSession() {
  return getSession();
}
