'use client';

import { useState, useTransition } from 'react';
import { updateSettings, getExportData } from '@/actions/settings';
import { logoutAction } from '@/actions/auth';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Download, User, Wallet, Calendar, LogOut } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string | null;
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
}: {
  user?: UserData | null;
  settings?: SettingsData | null;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

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
        toast({ title: 'Pengaturan berhasil disimpan ✓' });
      } else {
        toast({ title: result.error || 'Terjadi kesalahan', variant: 'destructive' });
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
        toast({ title: 'Data berhasil diekspor ✓' });
      } else {
        toast({ title: 'Ekspor gagal', variant: 'destructive' });
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Atur profil, siklus penggajian tanggal 25, dan pagu baku operasional
        </p>
      </div>

      <Section title="Profil Pengguna" icon={User}>
        <Field label="Nama Lengkap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-base text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
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
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-sans font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
          />
        </Field>
        <Field label="Tanggal Mulai Kerja">
          <input
            type="date"
            value={startWorkDate}
            onChange={e => setStartWorkDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </Field>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div>
            <p className="font-semibold text-zinc-900 text-xs">Prorata Gaji</p>
            <p className="text-[11px] text-zinc-400">Hitung gaji bulan pertama secara prorata hari kerja/kalender</p>
          </div>
          <Switch checked={prorateEnabled} onCheckedChange={setProrateEnabled} />
        </div>
        {prorateEnabled && (
          <Field label="Metode Prorata">
            <Select value={prorateMethod} onValueChange={setProrateMethod}>
              <SelectTrigger className="w-full bg-white border border-stone-200/80 rounded-xl text-xs text-zinc-900">
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

      <Section title="Pagu Anggaran Baku (Default Budgets)" icon={Calendar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Budget Kos / Sewa (Rp)">
            <input value={rentBudget} onChange={e => setRentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums" />
          </Field>
          <Field label="Budget Makan (Rp)">
            <input value={foodBudget} onChange={e => setFoodBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums" />
          </Field>
          <Field label="Budget Hiburan (Rp)">
            <input value={entertainmentBudget} onChange={e => setEntertainmentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums" />
          </Field>
          <Field label="Budget Toiletries (Rp)">
            <input value={toiletries_budget} onChange={e => setToiletries_budget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums" />
          </Field>
          <Field label="Budget Transport (Rp)">
            <input value={transportBudget} onChange={e => setTransportBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums" />
          </Field>
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs shadow-sm active:scale-[0.99] transition-all"
      >
        {isPending ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
      </button>

      {/* Backup Data */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
        <h2 className="font-semibold text-sm text-zinc-900">Cadangan Data (Backup)</h2>
        <p className="text-xs text-zinc-500">Unduh seluruh catatan transaksi, anggaran, dan cicilan dalam berkas JSON.</p>
        <button
          onClick={handleExport}
          disabled={isPending}
          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Berkas JSON</span>
        </button>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
        <h2 className="font-semibold text-sm text-rose-600">Sesi Pengguna</h2>
        <button
          onClick={() => logoutAction()}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
}
