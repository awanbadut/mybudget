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
  code,
  icon: Icon,
  children,
}: {
  title: string;
  code: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#FAF7F2] border-2 border-[#24201D] shadow-[3px_3px_0px_#24201D] overflow-hidden">
      <div className="flex items-center justify-between p-3.5 bg-[#EDE6DC] border-b border-[#24201D]">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-[#24201D]" />
          <h2 className="font-display font-bold text-base text-[#24201D] uppercase leading-none">{title}</h2>
        </div>
        <span className="font-mono text-[10px] font-bold text-[#D9381E]">[{code}]</span>
      </div>
      <div className="p-4 space-y-3.5 font-mono text-xs">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block font-bold text-[#24201D] uppercase text-[11px]">{label}</label>
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
        toast({ title: 'Pengaturan berhasil diperbarui ✓' });
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
        toast({ title: 'Data berhasil diexport ✓' });
      } else {
        toast({ title: 'Export gagal', variant: 'destructive' });
      }
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b-2 border-[#24201D] pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase">LEDGER Nº 07</span>
          <span className="text-[#24201D]/30">/</span>
          <span className="font-mono text-[10px] text-[#706860] uppercase">Konfigurasi Parameter Akun</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#24201D] uppercase leading-none">
          PENGATURAN AKUN
        </h1>
      </div>

      <Section title="Profil Pengguna" code="SEC 01" icon={User}>
        <Field label="Nama Lengkap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
          />
        </Field>
      </Section>

      <Section title="Parameter Penghasilan & Siklus Gaji" code="SEC 02" icon={Wallet}>
        <Field label="Gaji Pokok Bulanan (Rp)">
          <input
            value={salary}
            onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="0"
            className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-base text-[#24201D] outline-none tabular-nums"
          />
        </Field>
        <Field label="Tanggal Gajian Siklus (1 - 31)">
          <input
            value={salaryDate}
            onChange={e => setSalaryDate(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="25"
            min="1"
            max="31"
            className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums"
          />
        </Field>
        <Field label="Tanggal Mulai Kerja">
          <input
            type="date"
            value={startWorkDate}
            onChange={e => setStartWorkDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] text-[#24201D] outline-none"
          />
        </Field>
        <div className="flex items-center justify-between pt-2 border-t border-[#24201D]/20">
          <div>
            <p className="font-bold text-[#24201D] uppercase text-xs">Prorata Gaji</p>
            <p className="text-[11px] text-[#706860]">Hitung gaji bulan pertama secara prorata hari</p>
          </div>
          <Switch checked={prorateEnabled} onCheckedChange={setProrateEnabled} />
        </div>
        {prorateEnabled && (
          <Field label="Metode Prorata">
            <Select value={prorateMethod} onValueChange={setProrateMethod}>
              <SelectTrigger className="w-full bg-[#EDE6DC] border border-[#24201D] text-[#24201D]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#FAF7F2] border-2 border-[#24201D]">
                <SelectItem value="calendar_days">Prorata Hari Kalender (30 hari)</SelectItem>
                <SelectItem value="working_days">Prorata Hari Kerja (Senin - Jumat)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </Section>

      <Section title="Pagu Anggaran Baku (Default Budgets)" code="SEC 03" icon={Calendar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Budget Kos / Sewa (Rp)">
            <input value={rentBudget} onChange={e => setRentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums" />
          </Field>
          <Field label="Budget Makan (Rp)">
            <input value={foodBudget} onChange={e => setFoodBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums" />
          </Field>
          <Field label="Budget Hiburan (Rp)">
            <input value={entertainmentBudget} onChange={e => setEntertainmentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums" />
          </Field>
          <Field label="Budget Toiletries (Rp)">
            <input value={toiletries_budget} onChange={e => setToiletries_budget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums" />
          </Field>
          <Field label="Budget Transport (Rp)">
            <input value={transportBudget} onChange={e => setTransportBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="w-full px-3 py-2 bg-[#EDE6DC] border border-[#24201D] font-bold text-[#24201D] outline-none tabular-nums" />
          </Field>
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#24201D] active:translate-x-[1px] active:translate-y-[1px] transition-all"
      >
        {isPending ? 'MENYIMPAN...' : 'SIMPAN SEMUA PERUBAHAN'}
      </button>

      {/* Backup Data */}
      <div className="bg-[#FAF7F2] border-2 border-[#24201D] p-4 shadow-[3px_3px_0px_#24201D] space-y-2">
        <h2 className="font-display font-bold text-base text-[#24201D] uppercase">Cadangan Berkas (Backup)</h2>
        <p className="font-mono text-xs text-[#706860]">Unduh seluruh berkas transaksi, anggaran, dan cicilan dalam format JSON.</p>
        <button
          onClick={handleExport}
          disabled={isPending}
          className="w-full py-2.5 bg-[#EDE6DC] hover:bg-[#24201D] hover:text-[#F4F0EA] border border-[#24201D] font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>UNDUH BERKAS JSON</span>
        </button>
      </div>

      {/* Logout */}
      <div className="bg-[#FAF7F2] border-2 border-[#D9381E] p-4 shadow-[3px_3px_0px_#24201D] space-y-2">
        <h2 className="font-display font-bold text-base text-[#D9381E] uppercase">Sesi Pengguna</h2>
        <button
          onClick={() => logoutAction()}
          className="w-full py-2.5 bg-[#FBEBE8] hover:bg-[#D9381E] hover:text-[#F4F0EA] border border-[#D9381E] font-mono text-xs font-bold text-[#D9381E] uppercase transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>KELUAR DARI AKUN</span>
        </button>
      </div>
    </div>
  );
}
