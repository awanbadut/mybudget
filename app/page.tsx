export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { getPayrollCycle, formatMonth, getCurrentMonth, calculateProratedSalary } from '@/lib/dates';
import { calculateSavingRate } from '@/lib/calculations';
import { getUserId } from '@/lib/auth';
import { getOrInitializeBudgets } from '@/lib/budget-utils';
import { formatCurrency } from '@/lib/currency';
import { DashboardSummary } from '@/components/DashboardSummary';
import { BudgetProgress } from '@/components/BudgetProgress';
import { RecentTransactions } from '@/components/RecentTransactions';
import { QuickActions } from '@/components/QuickActions';
import { InsightCard } from '@/components/InsightCard';
import { DailyBudget } from '@/components/DailyBudget';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { DashboardCharts } from '@/components/DashboardCharts';
import { OnboardingModal } from '@/components/OnboardingModal';
import { FinancialHealthScore } from '@/components/FinancialHealthScore';
import { NetWorthCard } from '@/components/NetWorthCard';
import { ForecastCard } from '@/components/ForecastCard';
import Link from 'next/link';
import { Plus, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';

export default async function DashboardPage() {
  const DEV_USER_ID = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  type UserSettingsType = typeof import('@/db/schema').settings.$inferSelect;
  type UserType = typeof import('@/db/schema').users.$inferSelect;

  let userSettings: UserSettingsType | null | undefined = null;
  let user: UserType | null | undefined = null;
  let allTransactions: Array<any> = [];
  let monthBudgets: Array<any> = [];
  let savingsGoalsList: Array<any> = [];
  let activeDebts: Array<any> = [];
  let fetchError: string | null = null;

  try {
    const data = await Promise.all([
      db.query.settings.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.userId, DEV_USER_ID),
      }),
      db.query.users.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.id, DEV_USER_ID),
      }),
      db.query.transactions.findMany({
        where: (t, { eq: eqFn }) => eqFn(t.userId, DEV_USER_ID),
        with: { category: true },
        orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
      }),
      getOrInitializeBudgets(DEV_USER_ID, currentMonth, currentYear),
      db.query.savingsGoals.findMany({
        where: (g, { eq: eqFn }) => eqFn(g.userId, DEV_USER_ID),
        with: { transactions: true },
      }),
      db.query.debts.findMany({
        where: (d, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(d.userId, DEV_USER_ID), eqFn(d.status, 'active')),
        with: { installments: true },
      }),
    ]);
    [userSettings, user, allTransactions, monthBudgets, savingsGoalsList, activeDebts] = data;
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    fetchError = err?.message || String(err);
  }

  if (fetchError) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4 my-8 shadow-sm w-full transition-colors">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-bold text-xl text-zinc-900 dark:text-white">Koneksi Database Gagal</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Server tidak dapat menghubungi database PostgreSQL:
        </p>
        <div className="bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 p-3 rounded-xl text-xs font-mono text-left break-all">
          {fetchError}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Pastikan DATABASE_URL sudah diatur di environment Vercel Anda.
        </p>
      </div>
    );
  }

  // 1. User cycle configuration (Disiplin siklus gaji)
  const salaryDate = userSettings?.salaryDate || 25;
  const payrollCycle = getPayrollCycle(salaryDate, new Date());

  // 2. Real Lifetime Cash Balance (Saldo Kas Bersih Riil Sepanjang Masa)
  const totalLifetimeIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLifetimeExpense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const realAvailableBalance = totalLifetimeIncome - totalLifetimeExpense;

  // 3. Transactions inside active payroll cycle (25 Sep - 25 Okt)
  const cycleTransactions = allTransactions.filter(
    t => t.transactionDate >= payrollCycle.startDateStr && t.transactionDate <= payrollCycle.endDateStr
  );

  const cycleIncome = cycleTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const cycleExpense = cycleTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const cycleNetFlow = cycleIncome - cycleExpense;
  const savingRate = calculateSavingRate(cycleIncome, cycleNetFlow);

  // 4. Total savings across all goals
  const totalSavings = savingsGoalsList.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  // 5. Effective income calculation (with prorate if applicable)
  let effectiveIncome = userSettings?.salary || 0;
  if (userSettings?.salaryProrateEnabled && userSettings.startWorkDate) {
    const sDate = userSettings.startWorkDate;
    const [sy, sm] = sDate.split('-').map(Number);
    if (sm === currentMonth && sy === currentYear) {
      effectiveIncome = calculateProratedSalary(
        effectiveIncome,
        sDate,
        (userSettings.salaryProrateMethod as 'calendar_days' | 'working_days') || 'calendar_days'
      );
    }
  }

  // 6. Expense by category for chart (active cycle distribution)
  const expenseByCategory = cycleTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catName = t.category?.name || 'Lainnya';
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // 7. Budget with spending (spent during active cycle)
  const budgetWithSpending = monthBudgets.map(budget => {
    const spent = cycleTransactions
      .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
    };
  });

  // 8. Recent transactions (always top 6 latest across all transactions)
  const recentTransactions = allTransactions.slice(0, 6);

  // 9. Food budget for daily widget (spent in active cycle)
  const foodBudgetTotal = userSettings?.foodBudget || 0;
  const foodSpent = cycleTransactions
    .filter(t => t.type === 'expense' && t.category?.name === 'Makan')
    .reduce((sum, t) => sum + t.amount, 0);

  // 10. Pending installments in active cycle
  const pendingInstallments = activeDebts.flatMap(d =>
    (d.installments || []).filter((i: any) =>
      i.status === 'pending' &&
      i.dueDate >= payrollCycle.startDateStr &&
      i.dueDate <= payrollCycle.endDateStr
    )
  );

  const monthlyDebtAmount = pendingInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const totalPendingDebtAmount = activeDebts
    .flatMap((d: any) => d.installments || [])
    .filter((i: any) => i.status === 'pending')
    .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

  // Pre-calculate last 6 months savings chart data
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const months: { month: number; year: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) { m += 12; y -= 1; }
    months.push({ month: m, year: y, label: MONTH_NAMES[m - 1] });
  }

  let cumulativeSavings = 0;
  const savingsChartData = months.map(({ month, year, label }) => {
    const sDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const eDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const monthSavings = savingsGoalsList.flatMap((g: any) => g.transactions || [])
      .filter((t: any) => t.transactionDate >= sDate && t.transactionDate <= eDate)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    cumulativeSavings += monthSavings;
    return { label, amount: cumulativeSavings, monthly: monthSavings };
  });

  return (
    <div className="space-y-5 sm:space-y-7 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ═══════════ Header ═══════════ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 min-w-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {formatMonth(currentMonth, currentYear)}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-full truncate">
              <Calendar className="w-3 h-3 text-zinc-400 flex-shrink-0" />
              <span className="truncate">Siklus Gajian tgl {salaryDate} ({payrollCycle.daysRemaining} hari lagi)</span>
            </div>
          </div>

          <h1 className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight leading-tight">
            Halo, {user?.name || 'Pengguna'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Berikut ringkasan dan status kesehatan finansial pribadimu.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <OnboardingModal
            initialSalary={userSettings?.salary || 0}
            initialSalaryDate={salaryDate}
            initialName={user?.name || ''}
            hasTransactions={allTransactions.length > 0}
          />
          <Link
            href="/transactions?action=new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </header>

      {/* ═══════════ Saldo Utama (Dashboard Summary) ═══════════ */}
      <DashboardSummary
        balance={realAvailableBalance}
        totalIncome={cycleIncome}
        totalExpense={cycleExpense}
        totalSavings={totalSavings}
        savingRate={savingRate}
        effectiveIncome={effectiveIncome}
        cycleLabel={payrollCycle.label}
      />

      {/* ═══════════ Jatah Makan Harian & Prediksi Saldo ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
        <DailyBudget
          foodBudgetTotal={foodBudgetTotal}
          foodSpent={foodSpent}
          salaryDate={salaryDate}
        />
        <ForecastCard
          balance={realAvailableBalance}
          totalExpense={cycleExpense}
          effectiveIncome={effectiveIncome}
          elapsedDays={payrollCycle.elapsedDays}
          daysRemaining={payrollCycle.daysRemaining}
          salaryDate={salaryDate}
        />
      </div>

      {/* ═══════════ Analisis Kekayaan & Skor Kesehatan ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
        <NetWorthCard
          totalSavings={totalSavings}
          currentBalance={realAvailableBalance}
          totalPendingDebt={totalPendingDebtAmount}
        />
        <FinancialHealthScore
          savingRate={savingRate}
          totalIncome={cycleIncome}
          totalExpense={cycleExpense}
          monthlyDebtAmount={monthlyDebtAmount}
          budgets={budgetWithSpending}
          balance={realAvailableBalance}
          daysRemaining={payrollCycle.daysRemaining}
        />
      </div>

      {/* ═══════════ Aksi Cepat ═══════════ */}
      <QuickActions />

      {/* ═══════════ Cicilan Jatuh Tempo ═══════════ */}
      {pendingInstallments.length > 0 && (
        <section className="space-y-2.5 sm:space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">Cicilan Bulan Ini</h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Tagihan yang jatuh tempo siklus ini</p>
            </div>
            <Link href="/debts" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors">
              <span>Kelola</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200/70 dark:border-amber-900/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-colors">
            {pendingInstallments.map((inst: any, i: number) => (
              <div key={inst.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-stone-100 dark:border-zinc-800' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">Cicilan ke-{inst.installmentNumber}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Jatuh tempo: {inst.dueDate}</p>
                  </div>
                </div>
                <span className="font-sans font-bold text-xs tabular-nums text-amber-700 dark:text-amber-400">{formatCurrency(inst.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ Anggaran Bulanan Kategori ═══════════ */}
      <section className="space-y-2.5 sm:space-y-3 w-full min-w-0">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">
              Anggaran Pos Pengeluaran
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Batas pengeluaran per pos belanja periode ini</p>
          </div>
          <Link
            href="/budget"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Kelola</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <BudgetProgress budgets={budgetWithSpending} />
      </section>

      {/* ═══════════ Visualisations (Charts) ═══════════ */}
      <DashboardCharts
        expenseByCategory={expenseByCategory}
        totalExpense={cycleExpense}
        savingsChartData={savingsChartData}
      />

      {/* ═══════════ Target Tabungan ═══════════ */}
      {savingsGoalsList.length > 0 && (
        <section className="space-y-2.5 sm:space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">
                Target Tabungan
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Progres pencapaian simpanan dana</p>
            </div>
            <Link
              href="/savings"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
            {savingsGoalsList.slice(0, 2).map(goal => (
              <SavingsGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ Insight & Evaluasi Finansial ═══════════ */}
      <InsightCard
        totalIncome={cycleIncome}
        totalExpense={cycleExpense}
        budgets={budgetWithSpending}
        effectiveIncome={effectiveIncome}
        foodSpent={foodSpent}
        foodBudgetTotal={foodBudgetTotal}
        month={currentMonth}
        year={currentYear}
        pendingInstallmentsCount={pendingInstallments.length}
      />

      {/* ═══════════ Transaksi Terbaru ═══════════ */}
      <section className="space-y-2.5 sm:space-y-3 w-full min-w-0">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">
              Transaksi Terbaru
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Riwayat transaksi terakhir Anda</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Buku Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <RecentTransactions transactions={recentTransactions} />
      </section>

      {/* ═══════════ Clean Minimal Footer ═══════════ */}
      <footer className="pt-6 pb-4 border-t border-stone-200/60 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 text-center sm:text-left">
        <p>My Budget · Disiplin Finansial Siklus {salaryDate} ke {salaryDate}</p>
        <p>Data tersimpan privat & aman</p>
      </footer>
    </div>
  );
}
