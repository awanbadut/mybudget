'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  Key,
  UserCog,
  Trash2,
  Eye,
  Megaphone,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  RefreshCw,
  Send,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import {
  adminResetUserPassword,
  adminUpdateUserRole,
  adminUpdateUserProfile,
  adminDeleteUser,
  adminImpersonateUser,
  adminSetBroadcast,
} from '@/actions/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AccountDetailItem {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  balance: number;
  initialBalance: number;
  isDefault: boolean;
}

interface TransactionItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  transactionDate: string;
  note: string | null;
  accountName?: string | null;
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
  role: 'user' | 'admin';
  createdAt: string;
  latestTransactionDate?: string | null;
  settings: SettingsItem | null;
  accounts?: AccountDetailItem[];
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
  adminId: string;
  adminName: string;
  users: UserDetail[];
  initialBroadcast?: { message: string; isActive: boolean };
}

export function AdminDashboardClient({
  adminId,
  adminName,
  users,
  initialBroadcast = { message: '', isActive: false },
}: AdminDashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [txSearch, setTxSearch] = useState('');

  // Admin Actions Modals State
  const [resetPassUser, setResetPassUser] = useState<UserDetail | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [editProfileUser, setEditProfileUser] = useState<UserDetail | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');

  const [deleteTargetUser, setDeleteTargetUser] = useState<UserDetail | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');

  // Broadcast state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState(initialBroadcast.message || '');
  const [broadcastActive, setBroadcastActive] = useState(initialBroadcast.isActive || false);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const totalTransactions = users.reduce((sum, u) => sum + u.transactions.length, 0);
  const totalIncome = users.reduce((sum, u) => sum + u.income, 0);
  const totalExpense = users.reduce((sum, u) => sum + u.expense, 0);
  const totalSystemBalance = users.reduce((sum, u) => sum + u.balance, 0);

  // 1. Handle Impersonation
  function handleImpersonate(user: UserDetail) {
    if (!confirm(`Login sebagai "${user.name}" (@${user.username})? Anda akan masuk langsung ke dashboard pengguna ini.`)) return;

    startTransition(async () => {
      const res = await adminImpersonateUser(user.id);
      if (res.success) {
        toast({
          title: `Mode Impersonasi Aktif ✓`,
          description: `Sedang melihat akun sebagai ${user.name}. Klik 'Kembali ke Admin' di bar atas jika sudah selesai.`,
        });
        router.push('/');
        router.refresh();
      } else {
        toast({ title: res.error || 'Gagal login sebagai pengguna', variant: 'destructive' });
      }
    });
  }

  // 2. Handle Password Reset
  function handleResetPassword() {
    if (!resetPassUser) return;
    if (newPassword.length < 6) {
      toast({ title: 'Password baru minimal 6 karakter', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const res = await adminResetUserPassword(resetPassUser.id, newPassword);
      if (res.success) {
        toast({
          title: 'Password Berhasil Direset! ✓',
          description: `Password untuk @${resetPassUser.username} telah diperbarui.`,
        });
        setResetPassUser(null);
        setNewPassword('');
        router.refresh();
      } else {
        toast({ title: res.error || 'Gagal mereset password', variant: 'destructive' });
      }
    });
  }

  // 3. Handle Edit Profile & Role
  function handleSaveProfile() {
    if (!editProfileUser) return;

    startTransition(async () => {
      const resProfile = await adminUpdateUserProfile(editProfileUser.id, {
        name: editName,
        username: editUsername,
      });

      if (!resProfile.success) {
        toast({ title: resProfile.error || 'Gagal memperbarui profil', variant: 'destructive' });
        return;
      }

      if (editRole !== editProfileUser.role) {
        const resRole = await adminUpdateUserRole(editProfileUser.id, editRole);
        if (!resRole.success) {
          toast({ title: resRole.error || 'Gagal memperbarui role', variant: 'destructive' });
          return;
        }
      }

      toast({
        title: 'Profil & Hak Akses Diperbarui! ✓',
        description: `Akun @${editUsername} berhasil diupdate.`,
      });
      setEditProfileUser(null);
      if (selectedUser?.id === editProfileUser.id) {
        setSelectedUser(prev => prev ? { ...prev, name: editName, username: editUsername, role: editRole } : null);
      }
      router.refresh();
    });
  }

  // 4. Handle Delete User
  function handleDeleteUser() {
    if (!deleteTargetUser) return;
    if (confirmDeleteInput.trim().toLowerCase() !== deleteTargetUser.username.toLowerCase()) {
      toast({ title: `Ketik username "${deleteTargetUser.username}" untuk konfirmasi`, variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const res = await adminDeleteUser(deleteTargetUser.id);
      if (res.success) {
        toast({
          title: 'Pengguna Berhasil Dihapus Permanen! ✓',
          description: `Akun ${deleteTargetUser.name} dan seluruh data transaksinya telah dibersihkan.`,
        });
        setDeleteTargetUser(null);
        setConfirmDeleteInput('');
        if (selectedUser?.id === deleteTargetUser.id) setSelectedUser(null);
        router.refresh();
      } else {
        toast({ title: res.error || 'Gagal menghapus pengguna', variant: 'destructive' });
      }
    });
  }

  // 5. Handle Save Broadcast
  function handleSaveBroadcast() {
    startTransition(async () => {
      const res = await adminSetBroadcast(broadcastMsg, broadcastActive);
      if (res.success) {
        toast({
          title: broadcastActive ? 'Pengumuman Aktif Disiarkan! 📢' : 'Pengumuman Dinonaktifkan ✓',
          description: broadcastActive
            ? 'Pesan ini akan tampil di bagian atas layar seluruh pengguna aplikasi.'
            : 'Pesan pengumuman telah ditarik dari layar pengguna.',
        });
        setShowBroadcastModal(false);
        router.refresh();
      } else {
        toast({ title: res.error || 'Gagal menyimpan pengumuman', variant: 'destructive' });
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 pb-20 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Real Admin Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-stone-200/80 dark:border-zinc-800 sticky top-0 z-30 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white leading-tight">
                  Pusat Kendali Administrator
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Real Admin Access
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Masuk sebagai <strong>{adminName}</strong> · Hak penuh kelola akun, reset password, impersonasi & broadcast
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              id="broadcast"
              onClick={() => setShowBroadcastModal(true)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs touch-manipulation',
                broadcastActive
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-stone-200'
              )}
              title="Broadcast Pengumuman Global ke Seluruh Pengguna"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{broadcastActive ? 'Broadcast Aktif' : 'Broadcast Pesan'}</span>
            </button>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 bg-stone-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3.5 py-2 rounded-xl transition-colors touch-manipulation"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Real Ecosystem Metric Cards */}
        <div id="metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 scroll-mt-20">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Pengguna</span>
              <Users className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white tabular-nums">{totalUsers}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {adminCount} Administrator · {totalUsers - adminCount} Pengguna Biasa
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Transaksi</span>
              <Wallet className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white tabular-nums">{totalTransactions}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Tercatat di seluruh buku kas database
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Arus Masuk Sistem</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-extrabold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Keluar: {formatCurrency(totalExpense)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Saldo Riil Beredar</span>
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-extrabold text-xl sm:text-2xl text-blue-600 dark:text-blue-400 tabular-nums truncate">
              {formatCurrency(totalSystemBalance)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Total kas di seluruh dompet pengguna
            </p>
          </div>
        </div>

        {/* Search Bar & Quick Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-3 shadow-xs flex items-center gap-3 transition-colors">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 ml-1 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama lengkap atau @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-white touch-manipulation"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 touch-manipulation">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Real User Management Table */}
        <div id="users" className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-colors scroll-mt-20">
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Daftar &amp; Manajemen Pengguna ({filteredUsers.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Kelola hak akses, reset password, impersonasi login atau hapus akun pengguna
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50/70 dark:bg-zinc-800/60 border-b border-stone-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Pengguna &amp; Role</th>
                  <th className="px-5 py-3">Gaji Pokok</th>
                  <th className="px-5 py-3">Pemasukan</th>
                  <th className="px-5 py-3">Pengeluaran</th>
                  <th className="px-5 py-3">Saldo Dompet</th>
                  <th className="px-5 py-3">Tabungan</th>
                  <th className="px-5 py-3 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === adminId;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-zinc-900 dark:text-white">
                              {u.name}
                            </p>
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                                <ShieldCheck className="w-3 h-3" />
                                Administrator
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                Pengguna Biasa
                              </span>
                            )}
                            {isCurrentAdmin && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">@{u.username} · Terdaftar {formatDate(u.createdAt)}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-200 tabular-nums">
                        {formatCurrency(u.settings?.salary || 0)}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(u.income)}
                      </td>

                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-200 tabular-nums">
                        {formatCurrency(u.expense)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={cn('font-bold tabular-nums', u.balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400')}>
                          {formatCurrency(u.balance)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {formatCurrency(u.savings)}
                      </td>

                      {/* Real Action Buttons Column */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          {/* Impersonate Button */}
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => handleImpersonate(u)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all shadow-2xs active:scale-95 touch-manipulation"
                              title={`Login Sebagai ${u.name}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Login Sebagai</span>
                            </button>
                          )}

                          {/* Detail Button */}
                          <button
                            type="button"
                            onClick={() => { setSelectedUser(u); setTxSearch(''); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-bold transition-all shadow-2xs active:scale-95 touch-manipulation"
                            title="Audit Data Lengkap"
                          >
                            <span>Audit</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Admin Actions Popover / Buttons */}
                          <button
                            type="button"
                            onClick={() => { setResetPassUser(u); setNewPassword(''); }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Reset Password Pengguna"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditProfileUser(u);
                              setEditName(u.name);
                              setEditUsername(u.username);
                              setEditRole(u.role);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Edit Profil & Role"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => { setDeleteTargetUser(u); setConfirmDeleteInput(''); }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                      Tidak ada pengguna yang cocok dengan pencarian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ════════════════ MODAL 1: RESET PASSWORD PENGGUNA ════════════════ */}
      <Dialog open={!!resetPassUser} onOpenChange={(open) => { if (!open) setResetPassUser(null); }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Reset Password: {resetPassUser?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <p className="text-zinc-500 dark:text-zinc-400">
              Sebagai Administrator, Anda dapat mengganti password untuk akun <strong>@{resetPassUser?.username}</strong> secara langsung tanpa membutuhkan password lama.
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Password Baru</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik password baru (min. 6 karakter)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl font-mono text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setNewPassword('Pass_' + Math.random().toString(36).slice(-6))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-stone-200 dark:bg-zinc-700 text-[10px] font-bold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-stone-300"
                >
                  Acak Password
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setResetPassUser(null)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 6}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm hover:bg-zinc-800 disabled:opacity-40 transition-all touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ MODAL 2: EDIT PROFIL & ROLE ════════════════ */}
      <Dialog open={!!editProfileUser} onOpenChange={(open) => { if (!open) setEditProfileUser(null); }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCog className="w-4 h-4 text-indigo-500" />
              <span>Kelola Akun &amp; Role Pengguna</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Username (@)</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tingkat Hak Akses (Role)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={editProfileUser?.id === adminId}
                  onClick={() => setEditRole('user')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all touch-manipulation',
                    editRole === 'user'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs font-bold'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                  )}
                >
                  <p className="font-bold text-xs">Pengguna Biasa</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Hanya kelola keuangan pribadi</p>
                </button>

                <button
                  type="button"
                  disabled={editProfileUser?.id === adminId}
                  onClick={() => setEditRole('admin')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all touch-manipulation',
                    editRole === 'admin'
                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-xs font-bold'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <p className="font-bold text-xs">Administrator</p>
                  </div>
                  <p className="text-[10px] opacity-75 mt-0.5">Hak penuh konsol sistem</p>
                </button>
              </div>
              {editProfileUser?.id === adminId && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                  *Anda tidak dapat mengubah role akun admin Anda sendiri demi keamanan.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setEditProfileUser(null)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isPending || !editName || !editUsername}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm hover:bg-zinc-800 disabled:opacity-40 transition-all touch-manipulation"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ MODAL 3: HAPUS PENGGUNA PERMANEN ════════════════ */}
      <Dialog open={!!deleteTargetUser} onOpenChange={(open) => { if (!open) setDeleteTargetUser(null); }}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Hapus Akun Pengguna Permanen</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Anda akan menghapus akun <strong>{deleteTargetUser?.name}</strong> (<strong>@{deleteTargetUser?.username}</strong>).
              Seluruh transaksi, pos anggaran, dompet, dan target tabungan milik akun ini akan <strong>dibersihkan total dan tidak dapat dipulihkan</strong>.
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 space-y-1.5">
              <p className="font-semibold">Konfirmasi Keamanan:</p>
              <p className="text-[11px]">
                Ketik username <strong>{deleteTargetUser?.username}</strong> di bawah untuk melanjutkan:
              </p>
              <input
                type="text"
                placeholder={deleteTargetUser?.username}
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 rounded-lg font-mono text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteTargetUser(null)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isPending || confirmDeleteInput.trim().toLowerCase() !== deleteTargetUser?.username.toLowerCase()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-40 transition-all touch-manipulation"
            >
              {isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ MODAL 4: BROADCAST PENGUMUMAN SISTEM ════════════════ */}
      <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-500" />
              <span>Broadcast Pengumuman Global</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs pt-2">
            <p className="text-zinc-500 dark:text-zinc-400">
              Pesan ini akan disiarkan ke bagian paling atas layar aplikasi seluruh pengguna (di HP &amp; laptop).
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Isi Pesan Pengumuman</label>
              <textarea
                rows={3}
                placeholder="Contoh: Pembaruan fitur baru telah rilis! Nikmati performa 5x lebih cepat."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white resize-none"
              />
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-100/70 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/70">
              <input
                type="checkbox"
                id="activeBroadcastCheck"
                checked={broadcastActive}
                onChange={(e) => setBroadcastActive(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              />
              <label htmlFor="activeBroadcastCheck" className="font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                Aktifkan &amp; Tayangkan Pengumuman ke Pengguna
              </label>
            </div>
          </div>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-stone-50 text-xs touch-manipulation"
            >
              Batal
            </button>
            <button
              onClick={handleSaveBroadcast}
              disabled={isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all touch-manipulation flex items-center gap-1.5"
            >
              {isPending ? 'Menyimpan...' : 'Simpan & Siarkan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ MODAL 5: DETAIL AUDIT PENGGUNA LENGKAP ════════════════ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 max-w-3xl w-full my-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
            {/* Modal Header with Action Buttons */}
            <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-zinc-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">
                    Audit Data Pengguna
                  </span>
                  {selectedUser.role === 'admin' && (
                    <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl sm:text-2xl mt-1 text-zinc-900 dark:text-white">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  @{selectedUser.username} · Siklus Gaji: Tanggal {selectedUser.settings?.salaryDate || 25}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedUser.id !== adminId && (
                  <button
                    type="button"
                    onClick={() => handleImpersonate(selectedUser)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 touch-manipulation"
                    title="Login Sebagai Pengguna Ini"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Login Sebagai User</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50/70 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block mb-1">Pemasukan</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(selectedUser.income)}</p>
                </div>
                <div className="bg-stone-50/70 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block mb-1">Pengeluaran</span>
                  <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(selectedUser.expense)}</p>
                </div>
                <div className="bg-stone-50/70 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Saldo Bersih</span>
                  <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div className="bg-stone-50/70 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 rounded-xl p-3.5">
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 block mb-1">Tabungan</span>
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(selectedUser.savings)}</p>
                </div>
              </div>

              {/* Wallets & Accounts */}
              {selectedUser.accounts && selectedUser.accounts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Dompet & Rekening ({selectedUser.accounts.length})
                    </h4>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Total Kas: <strong className="text-zinc-900 dark:text-white tabular-nums">{formatCurrency(selectedUser.balance)}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedUser.accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="bg-stone-50/80 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/70 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                            {acc.name}
                          </span>
                          {acc.isDefault && (
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold px-1.5 py-0.5 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                          {formatCurrency(acc.balance)}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 capitalize">
                          {acc.type === 'bank' ? 'Bank Rekening' : acc.type === 'cash' ? 'Uang Tunai' : acc.type === 'ewallet' ? 'E-Wallet' : acc.type}
                          {acc.accountNumber ? ` · ${acc.accountNumber}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions List */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                    Daftar Transaksi ({selectedUser.transactions.length})
                  </h4>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari transaksi / akun / catatan..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 rounded-lg outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                    {txSearch && (
                      <button
                        onClick={() => setTxSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl divide-y divide-stone-100 dark:divide-zinc-800 max-h-80 sm:max-h-96 overflow-y-auto">
                  {selectedUser.transactions.filter((t) => {
                    if (!txSearch.trim()) return true;
                    const q = txSearch.toLowerCase();
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.transactionDate.includes(q) ||
                      (t.note && t.note.toLowerCase().includes(q)) ||
                      (t.accountName && t.accountName.toLowerCase().includes(q))
                    );
                  }).length > 0 ? (
                    selectedUser.transactions
                      .filter((t) => {
                        if (!txSearch.trim()) return true;
                        const q = txSearch.toLowerCase();
                        return (
                          t.name.toLowerCase().includes(q) ||
                          t.transactionDate.includes(q) ||
                          (t.note && t.note.toLowerCase().includes(q)) ||
                          (t.accountName && t.accountName.toLowerCase().includes(q))
                        );
                      })
                      .map((t) => (
                        <div key={t.id} className="p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-zinc-900 dark:text-white">{t.name}</p>
                              {t.accountName && (
                                <span className="text-[10px] font-medium bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-stone-200/70 dark:border-zinc-700/70">
                                  {t.accountName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                              {formatDate(t.transactionDate)}
                              {t.note ? ` · ${t.note}` : ''}
                            </p>
                          </div>
                          <span className={cn('font-semibold tabular-nums', t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white')}>
                            {t.type === 'income' ? '+' : t.type === 'transfer' ? '⇄ ' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="p-5 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                      {txSearch ? 'Tidak ada transaksi yang cocok dengan pencarian' : 'Belum ada transaksi tercatat'}
                    </div>
                  )}
                </div>
              </div>

              {/* Debts & Installments */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  Rincian Fasilitas Utang ({selectedUser.debts.length})
                </h4>

                {selectedUser.debts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.debts.map((d) => (
                      <div key={d.id} className="border border-stone-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-zinc-900 dark:text-white">{d.name}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                              Total: {formatCurrency(d.totalAmount || 0)} · Status: <span className="font-medium text-rose-600 dark:text-rose-400 uppercase">{d.status}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-zinc-800">
                          {d.installments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-stone-50 dark:bg-zinc-800/60 rounded-lg">
                              <span>Cicilan #{inst.installmentNumber} (Jatuh tempo: {formatDate(inst.dueDate)})</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">{formatCurrency(inst.amount)}</span>
                                <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full', inst.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400')}>
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
                  <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    Tidak ada utang tercatat
                  </div>
                )}
              </div>

              {/* Savings Goals */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  Target Tabungan
                </h4>

                {selectedUser.savingsGoals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.savingsGoals.map((g) => (
                      <div key={g.id} className="border border-stone-200/80 dark:border-zinc-800 rounded-xl p-3.5 bg-stone-50/50 dark:bg-zinc-800/40">
                        <p className="font-semibold text-xs text-zinc-900 dark:text-white">{g.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">
                          Terkumpul: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(g.currentAmount)}</strong> / {formatCurrency(g.targetAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    Belum ada target tabungan
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-800/60 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setResetPassUser(selectedUser); setNewPassword(''); }}
                  className="px-3 py-1.5 bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditProfileUser(selectedUser);
                    setEditName(selectedUser.name);
                    setEditUsername(selectedUser.username);
                    setEditRole(selectedUser.role);
                  }}
                  className="px-3 py-1.5 bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all"
                >
                  Edit Akun &amp; Role
                </button>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-sm transition-all"
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
