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
    <div className="min-h-screen bg-[#FAFAF9] pb-16 font-sans text-zinc-900">
      {/* Admin Header */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-zinc-900 leading-none">
                Admin Console
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Audit data pengguna My Budget ({adminName})
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Total Pengguna</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="font-bold text-2xl sm:text-3xl text-zinc-900 tabular-nums">{totalUsers}</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Total Transaksi</span>
              <Wallet className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="font-bold text-2xl sm:text-3xl text-zinc-900 tabular-nums">{totalTransactions}</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Total Pemasukan</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-emerald-600 tabular-nums truncate">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Total Pengeluaran</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-zinc-900 tabular-nums truncate">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 ml-1" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-base sm:text-xs bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 touch-manipulation"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-700 touch-manipulation">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-zinc-900">
                Daftar Pengguna ({filteredUsers.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Klik baris pengguna untuk audit mendalam rincian kas & cicilan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Pengguna</th>
                  <th className="px-5 py-3">Gaji Pokok</th>
                  <th className="px-5 py-3">Pemasukan</th>
                  <th className="px-5 py-3">Pengeluaran</th>
                  <th className="px-5 py-3">Saldo</th>
                  <th className="px-5 py-3">Tabungan</th>
                  <th className="px-5 py-3">Utang Aktif</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-stone-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 group-hover:text-zinc-950 transition-colors">
                          {u.name}
                        </p>
                        <p className="text-xs text-zinc-400">@{u.username}</p>
                        <p className="text-[10px] text-zinc-400">Daftar: {formatDate(u.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 tabular-nums">
                      {formatCurrency(u.settings?.salary || 0)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-emerald-600 tabular-nums">
                      {formatCurrency(u.income)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 tabular-nums">
                      {formatCurrency(u.expense)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold tabular-nums ${u.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(u.balance)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900 tabular-nums">
                      {formatCurrency(u.savings)}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.activeDebtsCount > 0 ? (
                        <div>
                          <span className="font-medium text-rose-600 text-xs bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                            {u.activeDebtsCount} utang aktif
                          </span>
                          <p className="text-[10px] text-zinc-400 mt-1 tabular-nums">
                            Sisa: {formatCurrency(u.pendingDebtAmount)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">Nihil</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 text-xs">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200/80 max-w-3xl w-full my-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold bg-stone-100 text-zinc-700 px-2.5 py-0.5 rounded-full">
                  Audit Data Pengguna
                </span>
                <h3 className="font-bold text-xl sm:text-2xl mt-1.5 text-zinc-900">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  @{selectedUser.username} · Siklus Gaji: Tanggal {selectedUser.settings?.salaryDate || 25}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50/70 border border-stone-200/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-emerald-600 block mb-1">Pemasukan</span>
                  <p className="text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(selectedUser.income)}</p>
                </div>
                <div className="bg-stone-50/70 border border-stone-200/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-rose-600 block mb-1">Pengeluaran</span>
                  <p className="text-base font-bold text-zinc-900 tabular-nums">{formatCurrency(selectedUser.expense)}</p>
                </div>
                <div className="bg-stone-50/70 border border-stone-200/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 block mb-1">Saldo Bersih</span>
                  <p className="text-base font-bold text-zinc-900 tabular-nums">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div className="bg-stone-50/70 border border-stone-200/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-indigo-600 block mb-1">Tabungan</span>
                  <p className="text-base font-bold text-indigo-600 tabular-nums">{formatCurrency(selectedUser.savings)}</p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm text-zinc-900">
                  Daftar Transaksi ({selectedUser.transactions.length})
                </h4>

                <div className="border border-stone-200/80 rounded-xl divide-y divide-stone-100 max-h-56 overflow-y-auto">
                  {selectedUser.transactions.length > 0 ? (
                    selectedUser.transactions.map((t) => (
                      <div key={t.id} className="p-3 flex items-center justify-between hover:bg-stone-50 text-xs">
                        <div>
                          <p className="font-semibold text-zinc-900">{t.name}</p>
                          <p className="text-[11px] text-zinc-400">{formatDate(t.transactionDate)}</p>
                        </div>
                        <span className={`font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-zinc-400 text-xs">Belum ada transaksi tercatat</div>
                  )}
                </div>
              </div>

              {/* Debts & Installments */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm text-zinc-900">
                  Rincian Fasilitas Utang ({selectedUser.debts.length})
                </h4>

                {selectedUser.debts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.debts.map((d) => (
                      <div key={d.id} className="border border-stone-200/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-zinc-900">{d.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Total: {formatCurrency(d.totalAmount || 0)} · Status: <span className="font-medium text-rose-600 uppercase">{d.status}</span>
                            </p>
                          </div>
                        </div>

                        {/* Installments table */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-100">
                          {d.installments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-stone-50 rounded-lg">
                              <span>Cicilan #{inst.installmentNumber} (Jatuh tempo: {formatDate(inst.dueDate)})</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold tabular-nums">{formatCurrency(inst.amount)}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${inst.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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
                  <div className="border border-stone-200/80 rounded-xl p-4 text-center text-xs text-zinc-400">
                    Tidak ada utang tercatat
                  </div>
                )}
              </div>

              {/* Savings Goals */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm text-zinc-900">
                  Target Tabungan
                </h4>

                {selectedUser.savingsGoals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.savingsGoals.map((g) => (
                      <div key={g.id} className="border border-stone-200/80 rounded-xl p-3.5 bg-stone-50/50">
                        <p className="font-semibold text-xs text-zinc-900">{g.name}</p>
                        <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                          Terkumpul: <strong className="text-emerald-600">{formatCurrency(g.currentAmount)}</strong> / {formatCurrency(g.targetAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-stone-200/80 rounded-xl p-4 text-center text-xs text-zinc-400">
                    Belum ada target tabungan
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Tutup Lembar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
