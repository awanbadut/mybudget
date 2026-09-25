export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { users, transactions, settings, savingsGoals, debts } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { Users, TrendingUp, TrendingDown, Wallet, ShieldCheck, LogOut } from 'lucide-react';
import { logoutAction } from '@/actions/auth';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/');
  }

  // Fetch all users with their data
  const allUsers = await db.query.users.findMany({
    where: (u, { ne }) => ne(u.role, 'admin'),
    with: {
      settings: true,
      transactions: true,
      savingsGoals: true,
      debts: {
        with: { installments: true },
      },
    },
    orderBy: (u, { asc }) => asc(u.createdAt),
  });

  const totalUsers = allUsers.length;
  const totalTransactions = allUsers.reduce((sum, u) => sum + u.transactions.length, 0);

  // Per-user stats
  const userStats = allUsers.map(user => {
    const income = user.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = user.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const savings = user.savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const activeDebts = user.debts.filter(d => d.status === 'active');
    const pendingDebtAmount = activeDebts.reduce((sum, d) => {
      return sum + d.installments.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    }, 0);
    return {
      id: user.id,
      name: user.name,
      username: user.username || '-',
      createdAt: user.createdAt,
      salary: user.settings?.salary || 0,
      income,
      expense,
      balance: income - expense,
      savings,
      activeDebtsCount: activeDebts.length,
      pendingDebtAmount,
      transactionCount: user.transactions.length,
    };
  });

  const totalIncome = userStats.reduce((sum, u) => sum + u.income, 0);
  const totalExpense = userStats.reduce((sum, u) => sum + u.expense, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Halo, {session.name}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total User</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-500">Total Transaksi</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Total Pemasukan</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm text-gray-500">Total Pengeluaran</span>
            </div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Daftar Pengguna</h2>
            <p className="text-sm text-gray-500 mt-0.5">Detail keuangan setiap pengguna</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengguna</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gaji</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pemasukan</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengeluaran</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tabungan</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utang Aktif</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userStats.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                        <p className="text-xs text-gray-300 mt-0.5">Bergabung: {formatDate(user.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(user.salary)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(user.income)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-500">{formatCurrency(user.expense)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${user.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(user.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-600 font-medium">{formatCurrency(user.savings)}</td>
                    <td className="px-6 py-4">
                      {user.activeDebtsCount > 0 ? (
                        <div>
                          <span className="text-sm text-orange-600 font-medium">{user.activeDebtsCount} utang</span>
                          <p className="text-xs text-gray-400">{formatCurrency(user.pendingDebtAmount)} pending</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.transactionCount}</td>
                  </tr>
                ))}
                {userStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      Belum ada pengguna terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
