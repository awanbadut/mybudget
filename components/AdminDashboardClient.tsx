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
    <div className="min-h-screen bg-[#F4F0EA] pb-16 font-sans">
      {/* Admin Header */}
      <header className="bg-[#EDE6DC] border-b-2 border-[#24201D] shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#24201D] text-[#F4F0EA] border border-[#24201D] flex items-center justify-center font-mono font-bold text-xs shadow-[2px_2px_0px_#D9381E]">
              AD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER AUDIT</span>
                <span className="text-[#24201D]/30">/</span>
                <span className="font-mono text-[10px] text-[#706860] uppercase">Admin Console</span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-[#24201D] uppercase leading-none">
                MY BUDGET AUDIT REGISTRY
              </h1>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#D9381E] hover:text-[#24201D] bg-[#FAF7F2] border border-[#24201D] px-3 py-1.5 shadow-[2px_2px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>KELUAR</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 shadow-[3px_3px_0px_#24201D]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-[#706860] uppercase tracking-wider">Total Operator</span>
              <Users className="w-4 h-4 text-[#24201D]" />
            </div>
            <p className="font-display font-extrabold text-3xl text-[#24201D] tabular-nums">{totalUsers}</p>
          </div>

          <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 shadow-[3px_3px_0px_#24201D]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-[#706860] uppercase tracking-wider">Total Transaksi</span>
              <Wallet className="w-4 h-4 text-[#24201D]" />
            </div>
            <p className="font-display font-extrabold text-3xl text-[#24201D] tabular-nums">{totalTransactions}</p>
          </div>

          <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 shadow-[3px_3px_0px_#24201D]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-[#2A7B88] uppercase tracking-wider">Total Pemasukan</span>
              <TrendingUp className="w-4 h-4 text-[#2A7B88]" />
            </div>
            <p className="font-mono font-bold text-lg text-[#2A7B88] tabular-nums truncate">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 shadow-[3px_3px_0px_#24201D]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase tracking-wider">Total Pengeluaran</span>
              <TrendingDown className="w-4 h-4 text-[#D9381E]" />
            </div>
            <p className="font-mono font-bold text-lg text-[#D9381E] tabular-nums truncate">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-3 shadow-[2px_2px_0px_#24201D] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#706860]" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 font-mono text-xs bg-transparent outline-none placeholder:text-[#706860]/60 text-[#24201D]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#706860] hover:text-[#24201D]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#24201D] bg-[#EDE6DC] flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-xl text-[#24201D] uppercase">
                Daftar Buku Pengguna ({filteredUsers.length})
              </h2>
              <p className="font-mono text-xs text-[#706860] mt-0.5">
                Klik baris pengguna untuk audit mendalam rincian kas & cicilan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-[#EDE6DC]/70 border-b border-[#24201D]/20 text-[10px] font-bold text-[#706860] uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#24201D]/15">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-[#EDE6DC]/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-display font-bold text-base text-[#24201D] uppercase group-hover:text-[#D9381E] transition-colors leading-tight">
                          {u.name}
                        </p>
                        <p className="font-mono text-[11px] text-[#706860]">@{u.username}</p>
                        <p className="font-mono text-[10px] text-[#706860]/80">Daftar: {formatDate(u.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#24201D] tabular-nums">
                      {formatCurrency(u.settings?.salary || 0)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#2A7B88] tabular-nums">
                      {formatCurrency(u.income)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#D9381E] tabular-nums">
                      {formatCurrency(u.expense)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold tabular-nums ${u.balance >= 0 ? 'text-[#2A7B88]' : 'text-[#D9381E]'}`}>
                        {formatCurrency(u.balance)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#24201D] tabular-nums">
                      {formatCurrency(u.savings)}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.activeDebtsCount > 0 ? (
                        <div>
                          <span className="font-bold text-[#D9381E] text-[10px] bg-[#FBEBE8] border border-[#D9381E]/40 px-1.5 py-0.5">
                            {u.activeDebtsCount} utang aktif
                          </span>
                          <p className="text-[10px] text-[#706860] mt-1 tabular-nums">
                            Sisa: {formatCurrency(u.pendingDebtAmount)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#706860] text-[11px]">Nihil</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#F4F0EA] bg-[#24201D] hover:bg-[#D9381E] border border-[#24201D] px-2.5 py-1 shadow-[1px_1px_0px_#24201D] transition-all"
                      >
                        Detail <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#706860] font-mono text-xs">
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
        <div className="fixed inset-0 z-50 bg-[#24201D]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] border-2 border-[#24201D] max-w-3xl w-full my-6 shadow-[6px_6px_0px_#24201D] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#EDE6DC] border-b-2 border-[#24201D] text-[#24201D] flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold bg-[#FAF7F2] border border-[#24201D] px-2 py-0.5 text-[#D9381E] uppercase">
                  AUDIT LEMBAR PENGGUNA
                </span>
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight mt-1 text-[#24201D]">
                  {selectedUser.name}
                </h3>
                <p className="font-mono text-xs text-[#706860] mt-0.5">
                  @{selectedUser.username} · Siklus Gaji: Tanggal {selectedUser.settings?.salaryDate || 25}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 bg-[#FAF7F2] border border-[#24201D] text-[#24201D] hover:bg-[#D9381E] hover:text-[#F4F0EA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 font-mono text-xs">
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#EDE6DC] border border-[#24201D]/30 p-3">
                  <span className="text-[10px] font-bold text-[#2A7B88] uppercase">Pemasukan</span>
                  <p className="text-sm sm:text-base font-bold text-[#2A7B88] tabular-nums mt-0.5">{formatCurrency(selectedUser.income)}</p>
                </div>
                <div className="bg-[#EDE6DC] border border-[#24201D]/30 p-3">
                  <span className="text-[10px] font-bold text-[#D9381E] uppercase">Pengeluaran</span>
                  <p className="text-sm sm:text-base font-bold text-[#D9381E] tabular-nums mt-0.5">{formatCurrency(selectedUser.expense)}</p>
                </div>
                <div className="bg-[#EDE6DC] border border-[#24201D]/30 p-3">
                  <span className="text-[10px] font-bold text-[#24201D] uppercase">Saldo Operasional</span>
                  <p className="text-sm sm:text-base font-bold text-[#24201D] tabular-nums mt-0.5">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div className="bg-[#EDE6DC] border border-[#24201D]/30 p-3">
                  <span className="text-[10px] font-bold text-[#706860] uppercase">Dana Tabungan</span>
                  <p className="text-sm sm:text-base font-bold text-[#24201D] tabular-nums mt-0.5">{formatCurrency(selectedUser.savings)}</p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#24201D]/20 pb-1.5">
                  <h4 className="font-display font-bold text-base text-[#24201D] uppercase">
                    Buku Catatan Transaksi ({selectedUser.transactions.length})
                  </h4>
                </div>

                <div className="border border-[#24201D] bg-[#EDE6DC]/40 divide-y divide-[#24201D]/20 max-h-56 overflow-y-auto">
                  {selectedUser.transactions.length > 0 ? (
                    selectedUser.transactions.map((t) => (
                      <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-[#EDE6DC] text-xs">
                        <div>
                          <p className="font-bold text-[#24201D] uppercase">{t.name}</p>
                          <p className="text-[10px] text-[#706860]">{formatDate(t.transactionDate)}</p>
                        </div>
                        <span className={`font-bold tabular-nums ${t.type === 'income' ? 'text-[#2A7B88]' : 'text-[#24201D]'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-[#706860] text-xs">Belum ada transaksi tercatat</div>
                  )}
                </div>
              </div>

              {/* Debts & Installments */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-base text-[#24201D] uppercase border-b border-[#24201D]/20 pb-1.5">
                  Rincian Fasilitas Utang ({selectedUser.debts.length})
                </h4>

                {selectedUser.debts.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedUser.debts.map((d) => (
                      <div key={d.id} className="border border-[#24201D] p-3 bg-[#EDE6DC]/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[#24201D] uppercase">{d.name}</p>
                            <p className="text-[11px] text-[#706860] tabular-nums">
                              Total: {formatCurrency(d.totalAmount || 0)} · Status: <span className="font-bold uppercase text-[#D9381E]">{d.status}</span>
                            </p>
                          </div>
                        </div>

                        {/* Installments table */}
                        <div className="space-y-1 pt-1.5 border-t border-[#24201D]/20">
                          {d.installments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between text-[11px] py-1 px-2 bg-[#FAF7F2] border border-[#24201D]/20">
                              <span>Cicilan #{inst.installmentNumber} (Jatuh tempo: {formatDate(inst.dueDate)})</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold tabular-nums">{formatCurrency(inst.amount)}</span>
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase border ${inst.status === 'paid' ? 'bg-[#EAF4F5] border-[#2A7B88] text-[#2A7B88]' : 'bg-[#FBEBE8] border-[#D9381E] text-[#D9381E]'}`}>
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
                  <div className="border border-[#24201D] p-4 text-center text-xs text-[#706860]">
                    Tidak ada utang tercatat
                  </div>
                )}
              </div>

              {/* Savings Goals */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-base text-[#24201D] uppercase border-b border-[#24201D]/20 pb-1.5">
                  Target Tabungan
                </h4>

                {selectedUser.savingsGoals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedUser.savingsGoals.map((g) => (
                      <div key={g.id} className="border border-[#24201D] p-3 bg-[#EDE6DC]/50">
                        <p className="font-bold text-xs text-[#24201D] uppercase">{g.name}</p>
                        <p className="text-[11px] text-[#706860] mt-0.5 tabular-nums">
                          Terkumpul: <strong className="text-[#2A7B88]">{formatCurrency(g.currentAmount)}</strong> / {formatCurrency(g.targetAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-[#24201D] p-4 text-center text-xs text-[#706860]">
                    Belum ada target tabungan
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#EDE6DC] border-t-2 border-[#24201D] flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-[#24201D] hover:bg-[#D9381E] text-[#F4F0EA] font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_#24201D] transition-all"
              >
                TUTUP LEMBAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
