'use client';
import { useState, useTransition } from 'react';
import { updateSettings, getExportData } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { Settings, Download, User, Wallet, Calendar } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-50">
        <Icon className="w-5 h-5 text-gray-400" />
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-gray-600">{label}</Label>
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
        toast({ title: 'Settings berhasil disimpan ✓' });
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Section title="Profil" icon={User}>
        <Field label="Nama">
          <Input value={name} onChange={e => setName(e.target.value)} />
        </Field>
      </Section>

      <Section title="Gaji" icon={Wallet}>
        <Field label="Gaji Bulanan (Rp)">
          <Input
            value={salary}
            onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="0"
          />
        </Field>
        <Field label="Tanggal Gajian">
          <Input
            value={salaryDate}
            onChange={e => setSalaryDate(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="25"
            min="1"
            max="31"
          />
        </Field>
        <Field label="Tanggal Mulai Kerja">
          <Input
            type="date"
            value={startWorkDate}
            onChange={e => setStartWorkDate(e.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Prorata Gaji</p>
            <p className="text-xs text-gray-400">Hitung gaji bulan pertama secara prorata</p>
          </div>
          <Switch checked={prorateEnabled} onCheckedChange={setProrateEnabled} />
        </div>
        {prorateEnabled && (
          <Field label="Metode Prorata">
            <Select value={prorateMethod} onValueChange={setProrateMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar_days">Prorata Hari Kalender</SelectItem>
                <SelectItem value="working_days">Prorata Hari Kerja</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </Section>

      <Section title="Budget Default" icon={Calendar}>
        <Field label="Budget Kos (Rp)">
          <Input value={rentBudget} onChange={e => setRentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </Field>
        <Field label="Budget Makan (Rp)">
          <Input value={foodBudget} onChange={e => setFoodBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </Field>
        <Field label="Budget Hiburan (Rp)">
          <Input value={entertainmentBudget} onChange={e => setEntertainmentBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </Field>
        <Field label="Budget Toiletries (Rp)">
          <Input value={toiletries_budget} onChange={e => setToiletries_budget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </Field>
        <Field label="Budget Transport (Rp)">
          <Input value={transportBudget} onChange={e => setTransportBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        </Field>
      </Section>

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? 'Menyimpan...' : 'Simpan Settings'}
      </Button>

      {/* Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Data</h2>
        <Button variant="outline" onClick={handleExport} disabled={isPending} className="w-full gap-2">
          <Download className="w-4 h-4" /> Export Data (JSON)
        </Button>
      </div>
    </div>
  );
}
