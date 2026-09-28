'use client';

import { useState, useTransition } from 'react';
import { updateSettings, getExportData } from '@/actions/settings';
import { changePassword } from '@/actions/user';
import { importData } from '@/actions/import';
import { logoutAction } from '@/actions/auth';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CategoryManager } from '@/components/CategoryManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Settings, Download, Upload, User, Wallet, Calendar, LogOut, KeyRound, Tag, Palette } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  createdAt?: Date;
}

interface SettingsData {
  salary: number;
  salaryDate: number;
  rentBudget: number;
  foodBudget: number;
  entertainmentBudget: number;
  toiletries_budget: number;
  transportBudget: number;
  startWorkDate: string | null;
  salaryProrateEnabled: boolean;
  salaryProrateMethod: string;
}

interface CategoryType {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
        <div className="w-8 h-8 rounded-xl bg-stone-100 text-zinc-700 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold text-base text-zinc-900">{title}</h2>
      </div>
      <div className="space-y-4 text-xs">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-semibold text-zinc-700 text-xs">{label}</label>
      {children}
    </div>
  );
}

export function SettingsClient({
  user,
  settings,
  categories,
}: {
  user?: UserData | null;
  settings?: SettingsData | null;
  categories?: CategoryType[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Settings form
  const [name, setName] = useState(user?.name || '');
  const [salary, setSalary] = useState(String(settings?.salary || 0));
  const [salaryDate, setSalaryDate] = useState(String(settings?.salaryDate || 25));
  const [rentBudget, setRentBudget] = useState(String(settings?.rentBudget || 0));
  const [foodBudget, setFoodBudget] = useState(String(settings?.foodBudget || 0));
  const [entertainmentBudget, setEntertainmentBudget] = useState(String(settings?.entertainmentBudget || 0));
  const [toiletries_budget, setToiletries_budget] = useState(String(settings?.toiletries_budget || 0));
  const [transportBudget, setTransportBudget] = useState(String(settings?.transportBudget || 0));
  const [startWorkDate, setStartWorkDate] = useState(settings?.startWorkDate || '');
  const [prorateEnabled, setProrateEnabled] = useState(settings?.salaryProrateEnabled || false);
  const [prorateMethod, setProrateMethod] = useState(settings?.salaryProrateMethod || 'calendar_days');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  async function handleSave() {
    startTransition(async () => {
      const result = await updateSettings({
        name,
        salary: parseInt(salary, 10) || 0,
        salaryDate: parseInt(salaryDate, 10) || 25,
        rentBudget: parseInt(rentBudget, 10) || 0,
        foodBudget: parseInt(foodBudget, 10) || 0,
        entertainmentBudget: parseInt(entertainmentBudget, 10) || 0,
        toiletries_budget: parseInt(toiletries_budget, 10) || 0,
        transportBudget: parseInt(transportBudget, 10) || 0,
        startWorkDate: startWorkDate || null,
        salaryProrateEnabled: prorateEnabled,
        salaryProrateMethod: prorateMethod as 'calendar_days' | 'working_days',
      });
      if (result.success) {
        toast({ title: 'Pengaturan berhasil disimpan' });
      } else {
        toast({ title: result.error || 'Terjadi kesalahan', variant: 'destructive' });
      }
    });
  }

  async function handleChangePassword() {
    setPasswordError('');
    startTransition(async () => {
      const result = await changePassword({ currentPassword, newPassword, confirmPassword });
      if (result.success) {
        toast({ title: 'Password berhasil diganti' });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Terjadi kesalahan');
      }
    });
  }

  async function handleExport() {
    startTransition(async () => {
      const result = await getExportData();
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mybudget-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Data berhasil diekspor' });
      } else {
        toast({ title: 'Ekspor gagal', variant: 'destructive' });
      }
    });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      startTransition(async () => {
        const result = await importData(json);
        if (result.success) {
          toast({ title: `Import berhasil: ${result.imported} transaksi diimpor` });
        } else {
          toast({ title: result.error || 'Import gagal', variant: 'destructive' });
        }
      });
    } catch {
      toast({ title: 'File tidak valid. Pastikan format JSON benar.', variant: 'destructive' });
    }
    e.target.value = '';
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            Pengaturan Akun
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atur profil, siklus penggajian, dan preferensi aplikasi
          </p>
        </div>
        <ThemeToggle showLabel className="px-3 py-2 text-xs" />
      </div>

      {/* Info Akun */}
      <Section title="Info Akun" icon={User}>
        <div className="flex items-center justify-between py-1">
          <span className="text-zinc-500 font-medium">Username</span>
          <span className="font-semibold text-zinc-900">{user?.username || '-'}</span>
        </div>
        {user?.email && (
          <div className="flex items-center justify-between py-1">
            <span className="text-zinc-500 font-medium">Email</span>
            <span className="font-semibold text-zinc-900 truncate max-w-[180px]">{user.email}</span>
          </div>
        )}
        <Field label="Nama Lengkap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
          />
        </Field>
      </Section>

      <Section title="Parameter Penghasilan & Siklus Gaji" icon={Wallet}>
        <Field label="Gaji Pokok Bulanan (Rp)">
          <input
            value={salary}
            onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="0"
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation"
          />
        </Field>
        <Field label="Tanggal Gajian Siklus (1 sampai 31)">
          <input
            value={salaryDate}
            onChange={e => setSalaryDate(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="25"
            min="1"
            max="31"
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation"
          />
        </Field>
        <Field label="Tanggal Mulai Kerja">
          <input
            type="date"
            value={startWorkDate}
            onChange={e => setStartWorkDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
          />
        </Field>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div>
            <p className="font-semibold text-zinc-900 text-xs">Prorata Gaji</p>
            <p className="text-[11px] text-zinc-400">Hitung gaji bulan pertama secara prorata</p>
          </div>
          <Switch checked={prorateEnabled} onCheckedChange={setProrateEnabled} />
        </div>
        {prorateEnabled && (
          <Field label="Metode Prorata">
            <Select value={prorateMethod} onValueChange={setProrateMethod}>
              <SelectTrigger className="w-full bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-stone-200/80 rounded-xl">
                <SelectItem value="calendar_days">Prorata Hari Kalender (30 hari)</SelectItem>
                <SelectItem value="working_days">Prorata Hari Kerja (Senin - Jumat)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </Section>

      <Section title="Pagu Anggaran Baku" icon={Calendar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Budget Kos / Sewa (Rp)">
            <input value={rentBudget} onChange={e => setRentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation" />
          </Field>
          <Field label="Budget Makan (Rp)">
            <input value={foodBudget} onChange={e => setFoodBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation" />
          </Field>
          <Field label="Budget Hiburan (Rp)">
            <input value={entertainmentBudget} onChange={e => setEntertainmentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation" />
          </Field>
          <Field label="Budget Toiletries (Rp)">
            <input value={toiletries_budget} onChange={e => setToiletries_budget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation" />
          </Field>
          <Field label="Budget Transport (Rp)">
            <input value={transportBudget} onChange={e => setTransportBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base sm:text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums touch-manipulation" />
          </Field>
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-[0.99] touch-manipulation"
      >
        {isPending ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
      </button>

      {/* Kategori */}
      {categories && <CategoryManager categories={categories} />}

      {/* Ganti Password */}
      <Section title="Ganti Password" icon={KeyRound}>
        <Field label="Password Saat Ini">
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
          />
        </Field>
        <Field label="Password Baru">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
          />
        </Field>
        <Field label="Konfirmasi Password Baru">
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-base sm:text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 touch-manipulation"
          />
        </Field>
        {passwordError && <p className="text-xs font-semibold text-rose-600">{passwordError}</p>}
        <button
          onClick={handleChangePassword}
          disabled={isPending}
          className="mt-2 w-full py-2 bg-stone-100 hover:bg-stone-200 text-zinc-900 rounded-xl text-xs font-semibold transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Perbarui Password'}
        </button>
      </Section>

      {/* Ekspor & Impor Data */}
      <Section title="Manajemen Data" icon={Download}>
        <p className="text-xs text-zinc-500 leading-relaxed pb-2 border-b border-stone-100">
          Ekspor semua datamu (transaksi, tabungan, utang) ke dalam file JSON untuk cadangan, atau impor dari file cadangan yang sudah ada.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleExport}
            disabled={isPending}
            className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Data (JSON)</span>
          </button>
          
          <label className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Impor Data</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={isPending} />
          </label>
        </div>
      </Section>

      <div className="pt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-sm bg-white border border-stone-200/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-base text-zinc-900">Keluar dari Akun</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500">Apakah kamu yakin ingin keluar? Sesi aktif akan dihapus.</p>
          <DialogFooter className="pt-3 flex gap-2 sm:justify-end">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 border border-stone-200 text-zinc-600 rounded-xl font-medium hover:bg-stone-50 text-xs"
            >
              Batal
            </button>
            <button
              onClick={() => logoutAction()}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Ya, Keluar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
