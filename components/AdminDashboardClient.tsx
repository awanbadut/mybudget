'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  LogOut,
  Search,
  ChevronRight,
  X,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';

interface TransactionItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  transactionDate: string;
  note: string | null;
}

interface InstallmentItem {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

interface DebtItem {
  id: string;
  name: string;
  totalAmount: number | null;
  status: string;
  installments: InstallmentItem[];
}

interface SavingsGoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface SettingsItem {
  salary: number;
  salaryDate: number;
  rentBudget: number;
  foodBudget: number;
  entertainmentBudget: number;
  toiletries_budget: number;
  transportBudget: number;
  startWorkDate: string | null;
}

export interface UserDetail {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  settings: SettingsItem | null;
  transactions: TransactionItem[];
  savingsGoals: SavingsGoalItem[];
  debts: DebtItem[];
  income: number;
  expense: number;
  balance: number;
  savings: number;
  activeDebtsCount: number;
  pendingDebtAmount: number;
}

interface AdminDashboardClientProps {
  adminName: string;
  users: UserDetail[];
}

export function AdminDashboardClient({ adminName, users }: AdminDashboardClientProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalTransactions = users.reduce((sum, u) => sum + u.transactions.length, 0);
  const totalIncome = users.reduce((sum, u) => sum + u.income, 0);
  const totalExpense = users.reduce((sum, u) => sum + u.expense, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Masuk sebagai: <span className="font-semibold text-purple-700">{adminName}</span></p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Pengguna</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Transaksi</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Pemasukan</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 truncate">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Pengeluaran</span>
            </div>
            <p className="text-xl font-bold text-rose-600 truncate">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-900"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daftar Pengguna ({filteredUsers.length})</h2>
              <p className="text-xs text-gray-500 mt-1">Klik nama pengguna untuk melihat rincian transaksi & cicilan lengkap</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Pengguna</th>
                  <th className="px-6 py-3.5">Gaji Pokok</th>
                  <th className="px-6 py-3.5">Pemasukan</th>
                  <th className="px-6 py-3.5">Pengeluaran</th>
                  <th className="px-6 py-3.5">Saldo</th>
                  <th className="px-6 py-3.5">Tabungan</th>
                  <th className="px-6 py-3.5">Utang Aktif</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                        <p className="text-[11px] text-gray-300 mt-0.5">Daftar: {formatDate(u.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {formatCurrency(u.settings?.salary || 0)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {formatCurrency(u.income)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-500">
                      {formatCurrency(u.expense)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${u.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        {formatCurrency(u.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-purple-600">
                      {formatCurrency(u.savings)}
                    </td>
                    <td className="px-6 py-4">
                      {u.activeDebtsCount > 0 ? (
                        <div>
                          <span className="font-semibold text-orange-600 text-xs bg-orange-50 px-2 py-0.5 rounded-full">
                            {u.activeDebtsCount} utang aktif
                          </span>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Sisa: {formatCurrency(u.pendingDebtAmount)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                      >
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                      Tidak ada pengguna yang cocok dengan pencarian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-start justify-between">
              <div>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">Detail Keuangan Pengguna</span>
                <h3 className="text-2xl font-bold mt-1">{selectedUser.name}</h3>
                <p className="text-xs text-blue-100 mt-0.5">@{selectedUser.username} • Tanggal Gaji: {selectedUser.settings?.salaryDate || 25} setiap bulan</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                  <span className="text-[11px] font-medium text-emerald-700">Total Pemasukan</span>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{formatCurrency(selectedUser.income)}</p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100">
                  <span className="text-[11px] font-medium text-rose-700">Total Pengeluaran</span>
                  <p className="text-base font-bold text-rose-700 mt-0.5">{formatCurrency(selectedUser.expense)}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                  <span className="text-[11px] font-medium text-blue-700">Sisa Saldo</span>
                  <p className="text-base font-bold text-blue-700 mt-0.5">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100">
                  <span className="text-[11px] font-medium text-purple-700">Tabungan</span>
                  <p className="text-base font-bold text-purple-700 mt-0.5">{formatCurrency(selectedUser.savings)}</p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    Riwayat Transaksi Lengkap ({selectedUser.transactions.length})
                  </h4>
                </div>

                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {selectedUser.transactions.length > 0 ? (
                    selectedUser.transactions.map((t) => (
                      <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            {t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{t.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(t.transactionDate)}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-xs">Belum ada transaksi tercatat</div>
                  )}
                </div>
              </div>

              {/* Debts & Installments */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  Rincian Utang & Cicilan ({selectedUser.debts.length})
                </h4>

                {selectedUser.debts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.debts.map((d) => (
                      <div key={d.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-500">
                              Total: {formatCurrency(d.totalAmount || 0)} • Status: <span className="font-semibold text-orange-600">{d.status}</span>
                            </p>
                          </div>
                        </div>

                        {/* Installments table */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-200">
                          {d.installments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-gray-100">
                              <div className="flex items-center gap-2">
                                {inst.status === 'paid' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span>Cicilan #{inst.installmentNumber} (Jatuh tempo: {formatDate(inst.dueDate)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{formatCurrency(inst.amount)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inst.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {inst.status === 'paid' ? 'LUNAS' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-2xl p-4 text-center text-xs text-gray-400">
                    Tidak ada utang tercatat
                  </div>
                )}
              </div>

              {/* Savings Goals */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Target Tabungan
                </h4>

                {selectedUser.savingsGoals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.savingsGoals.map((g) => (
                      <div key={g.id} className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/50">
                        <p className="font-bold text-sm text-gray-900">{g.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Terkumpul: <span className="font-bold text-purple-600">{formatCurrency(g.currentAmount)}</span> / {formatCurrency(g.targetAmount)}
                        </p>
                        {g.deadline && <p className="text-[11px] text-gray-400 mt-0.5">Target: {formatDate(g.deadline)}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-2xl p-4 text-center text-xs text-gray-400">
                    Belum ada target tabungan
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
