export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { getCycleByOffset, getRecentCycles, getCurrentMonth, calculateProratedSalary } from '@/lib/dates';
import { calculateSavingRate } from '@/lib/calculations';
import { getUserId, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrInitializeBudgets } from '@/lib/budget-utils';
import { formatCurrency } from '@/lib/currency';
import { DashboardSummary } from '@/components/DashboardSummary';
import { RecentTransactions } from '@/components/RecentTransactions';
import { QuickActions } from '@/components/QuickActions';
import { InsightCard } from '@/components/InsightCard';
import { DailyBudget } from '@/components/DailyBudget';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { DashboardCharts } from '@/components/DashboardCharts';
import { OnboardingModal } from '@/components/OnboardingModal';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { FinancialHealthScore } from '@/components/FinancialHealthScore';
import { NetWorthCard } from '@/components/NetWorthCard';
import { ForecastCard } from '@/components/ForecastCard';
import { WalletCards } from '@/components/WalletCards';
import { CycleSelector } from '@/components/CycleSelector';
import { CycleHistoryRecap } from '@/components/CycleHistoryRecap';
import { DashboardTabsClient } from '@/components/DashboardTabsClient';
import { CycleCalendarHeatmap } from '@/components/CycleCalendarHeatmap';
import { getAccounts } from '@/actions/accounts';
import { postRecurringTransactions } from '@/actions/recurring';
import { ensureSavingsCategory } from '@/actions/savings';
import Link from 'next/link';
import { Plus, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ cycle?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawOffset = parseInt(params?.cycle || '0', 10);
  const cycleOffset = Number.isNaN(rawOffset) ? 0 : Math.min(0, rawOffset);

  const session = await getSession();
  if (session?.role === 'admin' && !session?.impersonatorAdminId) {
    redirect('/admin');
  }

  const DEV_USER_ID = await getUserId();
  const { month: currentMonth, year: currentYear } = getCurrentMonth();

  // Auto-post due recurring transactions asynchronously without blocking critical path
  postRecurringTransactions(currentMonth, currentYear).catch(err => {
    console.error('Auto post recurring error:', err);
  });

  type UserSettingsType = typeof import('@/db/schema').settings.$inferSelect;
  type UserType = typeof import('@/db/schema').users.$inferSelect;

  let userSettings: UserSettingsType | null | undefined = null;
  let user: UserType | null | undefined = null;
  let allTransactions: Array<any> = [];
  let userCategories: Array<any> = [];
  let monthBudgets: Array<any> = [];
  let savingsGoalsList: Array<any> = [];
  let activeDebts: Array<any> = [];
  let userAccounts: Array<any> = [];
  let fetchError: string | null = null;

  try {
    await ensureSavingsCategory(DEV_USER_ID);
    const data = await Promise.all([
      db.query.settings.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.userId, DEV_USER_ID),
      }),
      db.query.users.findFirst({
        where: (u, { eq: eqFn }) => eqFn(u.id, DEV_USER_ID),
      }),
      db.query.transactions.findMany({
        where: (t, { eq: eqFn }) => eqFn(t.userId, DEV_USER_ID),
        with: { category: true, account: true, toAccount: true },
        orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
      }),
      db.query.categories.findMany({
        where: (c, { eq: eqFn }) => eqFn(c.userId, DEV_USER_ID),
      }),
      db.query.savingsGoals.findMany({
        where: (g, { eq: eqFn }) => eqFn(g.userId, DEV_USER_ID),
        with: { transactions: true },
      }),
      db.query.debts.findMany({
        where: (d, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(d.userId, DEV_USER_ID), eqFn(d.status, 'active')),
        with: { installments: true },
      }),
      getAccounts(),
    ]);
    const [s, u, tx, cats, g, d, accRes] = data;
    userSettings = s;
    user = u;
    allTransactions = tx;
    userCategories = cats;
    savingsGoalsList = g;
    activeDebts = d;
    userAccounts = accRes.data || [];
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

  // 1. User cycle configuration — otomatis pilih mode berdasarkan salary
  // Mahasiswa/kiriman (salary=0): pakai bulan kalender biasa (1 s/d akhir bulan)
  // Karyawan (salary>0): pakai siklus tanggal gajian (misal 25 Sep - 24 Okt)
  const salary = userSettings?.salary || 0;
  const salaryDate = userSettings?.salaryDate || 25;
  const isStudentMode = salary === 0;

  const payrollCycle = getCycleByOffset(salaryDate, isStudentMode, cycleOffset);
  const prevPayrollCycle = getCycleByOffset(salaryDate, isStudentMode, cycleOffset - 1);
  const recentCycles = getRecentCycles(salaryDate, isStudentMode, 12).map(c => ({
    offset: c.offset || 0,
    label: c.label,
    startDateStr: c.startDateStr,
    endDateStr: c.endDateStr,
    isHistorical: c.isHistorical,
  }));

  const targetBudgetMonth = payrollCycle.budgetMonth || currentMonth;
  const targetBudgetYear = payrollCycle.budgetYear || currentYear;
  try {
    monthBudgets = await getOrInitializeBudgets(DEV_USER_ID, targetBudgetMonth, targetBudgetYear);
  } catch (err) {
    console.error('Error loading cycle budgets:', err);
  }

  // 2. Separate operational wallets vs savings wallets (prevent double counting between Dompet & Menu Tabungan)
  const savingsWallets = userAccounts.filter(
    a => a.type === 'savings' || /tabungan|simpanan|celengan|saving/i.test(a.name)
  );
  const operationalWallets = userAccounts.filter(
    a => !savingsWallets.some(s => s.id === a.id)
  );

  const totalWalletsBalance = userAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const operationalWalletsBalance = operationalWallets.reduce((sum, a) => sum + (a.balance || 0), 0);
  const savingsWalletsBalance = savingsWallets.reduce((sum, a) => sum + Math.max(0, a.balance || 0), 0);

  const totalLifetimeIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLifetimeExpense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Total savings (synced between savings wallet and savings goals, never double counted)
  const goalsSavingsTotal = savingsGoalsList.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalSavings = savingsWallets.length > 0
    ? Math.max(savingsWalletsBalance, goalsSavingsTotal)
    : goalsSavingsTotal;

  // Operational available cash (never double counts: if savings sit inside bank wallets, it does not inflate assets)
  const realAvailableBalance = userAccounts.length > 0
    ? (savingsWallets.length > 0 ? operationalWalletsBalance : Math.max(0, totalWalletsBalance - totalSavings))
    : (totalLifetimeIncome - totalLifetimeExpense);

  // 3. Transactions inside selected payroll cycle (e.g., 25 Sep - 24 Okt) & previous cycle for comparison
  const cycleTransactions = allTransactions.filter(
    t => t.transactionDate >= payrollCycle.startDateStr && t.transactionDate <= payrollCycle.endDateStr
  );

  const prevCycleTransactions = allTransactions.filter(
    t => t.transactionDate >= prevPayrollCycle.startDateStr && t.transactionDate <= prevPayrollCycle.endDateStr
  );

  const cycleIncome = cycleTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const cycleExpense = cycleTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevCycleIncome = prevCycleTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevCycleExpense = prevCycleTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const cycleNetFlow = cycleIncome - cycleExpense;
  const savingRate = calculateSavingRate(cycleIncome, cycleNetFlow);

  // 5. Effective income calculation
  // - Karyawan: pakai gaji dari settings (dengan prorata jika aktif)
  // - Mahasiswa/kiriman: pakai total pemasukan aktual dalam siklus bulan ini
  let effectiveIncome: number;
  if (isStudentMode) {
    // Uang yang sudah masuk bulan ini (kiriman, freelance, dll)
    effectiveIncome = cycleIncome;
  } else {
    effectiveIncome = userSettings?.salary || 0;
    if (userSettings?.salaryProrateEnabled && userSettings.startWorkDate) {
      const sDate = userSettings.startWorkDate;
      const [sy, sm] = sDate.split('-').map(Number);
      if (sm === targetBudgetMonth && sy === targetBudgetYear) {
        effectiveIncome = calculateProratedSalary(
          effectiveIncome,
          sDate,
          (userSettings.salaryProrateMethod as 'calendar_days' | 'working_days') || 'calendar_days'
        );
      }
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

  // 7. Budget with spending (spent during selected cycle)
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

  // 8. Recent transactions (top 6 inside selected cycle, or overall if active cycle has none yet)
  const recentTransactions = cycleTransactions.slice(0, 6);

  // 9. Food budget for daily widget (spent in selected cycle)
  const foodBudgetTotal = userSettings?.foodBudget || 0;
  const foodSpent = cycleTransactions
    .filter(t => t.type === 'expense' && t.category?.name === 'Makan')
    .reduce((sum, t) => sum + t.amount, 0);

  const hasFoodInBudgets = budgetWithSpending.some(
    b => b.category?.name?.toLowerCase() === 'makan' || b.category?.name?.toLowerCase() === 'makanan'
  );
  const totalBudgetRemaining =
    budgetWithSpending.reduce((sum, b) => sum + b.remaining, 0) +
    (!hasFoodInBudgets && foodBudgetTotal > 0 ? foodBudgetTotal - foodSpent : 0);

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
    <div className="space-y-3.5 sm:space-y-5 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ═══════════ Compact Mobile-First Header ═══════════ */}
      <header className="flex items-center justify-between gap-3 min-w-0 pt-1 reveal-up reveal-up-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="truncate">
              {payrollCycle.isHistorical
                ? `Riwayat Selesai (${payrollCycle.totalDays} hari)`
                : isStudentMode
                ? `Bulan Kalender · ${payrollCycle.daysRemaining}h lagi`
                : `Siklus Tgl ${salaryDate} · ${payrollCycle.daysRemaining}h lagi`}
            </span>
          </div>
          <h1 className="font-extrabold text-lg sm:text-2xl text-zinc-900 dark:text-white tracking-tight leading-tight mt-0.5">
            Halo, {user?.name || 'Pengguna'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <OnboardingModal
            initialSalary={userSettings?.salary || 0}
            initialSalaryDate={salaryDate}
            initialName={user?.name || ''}
            hasTransactions={allTransactions.length > 0}
            isStudentMode={isStudentMode}
          />
          <Link
            href="/transactions?action=new"
            className="press group inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 pl-3.5 pr-1.5 py-1.5 sm:pl-4 sm:pr-2 sm:py-2 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <span>Catat</span>
            <span className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      </header>

      {/* ═══════════ Pemilih Siklus (Bottom Sheet Mobile Picker) ═══════════ */}
      <div className="reveal-up reveal-up-1">
        <CycleSelector
          cycles={recentCycles}
          currentOffset={cycleOffset}
          salaryDate={salaryDate}
          isStudentMode={isStudentMode}
        />
      </div>

      {/* ═══════════ Panduan Memulai (hilang otomatis jika semua langkah selesai) ═══════════ */}
      {!payrollCycle.isHistorical && (
        <div className="reveal-up reveal-up-2">
          <OnboardingChecklist
            hasSalary={(userSettings?.salary || 0) > 0}
            hasTransaction={allTransactions.length > 0}
            hasSavingsGoal={savingsGoalsList.length > 0}
          />
        </div>
      )}

      {/* ═══════════ 3-Tab Mobile-First Dashboard ═══════════ */}
      <DashboardTabsClient
        isHistorical={Boolean(payrollCycle.isHistorical)}
        cycleLabel={payrollCycle.label}
        txCount={cycleTransactions.length}
        summaryContent={
          <div className="space-y-4">
            {/* 1. Saldo Utama / Uang Sisa Siklus */}
            <DashboardSummary
              balance={realAvailableBalance}
              totalIncome={cycleIncome}
              totalExpense={cycleExpense}
              totalSavings={totalSavings}
              savingRate={savingRate}
              effectiveIncome={effectiveIncome}
              cycleLabel={payrollCycle.label}
              isHistorical={payrollCycle.isHistorical}
              budgetRemainingTotal={totalBudgetRemaining}
            />

            {/* 2. Dompet & Rekening (Horizontal Swipe Carousel di HP + Ketuk untuk Mutasi Saldo) */}
            <WalletCards
              accounts={userAccounts}
              transactions={allTransactions}
              categories={userCategories}
              cycles={recentCycles}
              currentCycleOffset={cycleOffset}
            />

            {/* 3. Jatah Makan Harian */}
            <DailyBudget
              foodBudgetTotal={foodBudgetTotal}
              foodSpent={foodSpent}
              salaryDate={salaryDate}
              isStudentMode={isStudentMode}
              cycleOffset={cycleOffset}
            />

            {/* 4. Aksi Cepat */}
            <QuickActions />

            {/* 5. Transaksi Terbaru di Siklus Ini */}
            <section className="space-y-2.5 w-full min-w-0">
              <SectionHeader
                title="Transaksi Siklus Ini"
                desc={`5 aktivitas terakhir pada ${payrollCycle.label}`}
                href="/transactions"
                linkLabel="Semua"
              />
              <RecentTransactions transactions={recentTransactions} />
            </section>
          </div>
        }
        cycleContent={
          <div className="space-y-4">
            {/* Evaluasi Lengkap Siklus: Uang Sisa, Sisa Pos Budget, Vs Siklus Lalu, & Filter Transaksi */}
            <CycleHistoryRecap
              cycleLabel={payrollCycle.label}
              isHistorical={Boolean(payrollCycle.isHistorical)}
              cycleIncome={cycleIncome}
              cycleExpense={cycleExpense}
              effectiveIncome={effectiveIncome}
              prevCycleLabel={prevPayrollCycle.label}
              prevCycleIncome={prevCycleIncome}
              prevCycleExpense={prevCycleExpense}
              budgets={budgetWithSpending}
              foodBudgetTotal={foodBudgetTotal}
              foodSpent={foodSpent}
              transactions={cycleTransactions}
              accounts={userAccounts}
              categories={userCategories}
              savingsGoals={savingsGoalsList}
            />

            {/* Cicilan Jatuh Tempo di Siklus Ini */}
            {pendingInstallments.length > 0 && (
              <section className="space-y-2.5 w-full min-w-0">
                <SectionHeader title="Cicilan Siklus Ini" desc="Tagihan jatuh tempo" href="/debts" linkLabel="Kelola" />
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-300 dark:border-amber-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden transition-colors">
                  {pendingInstallments.map((inst: any, i: number) => (
                    <div key={inst.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">Cicilan ke-{inst.installmentNumber}</p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Jatuh tempo: {inst.dueDate}</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs sm:text-sm tabular-nums text-amber-600 dark:text-amber-400">{formatCurrency(inst.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        }
        analyticsContent={
          <div className="space-y-4">
            {/* 1. Skor Kesehatan & Prediksi Saldo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 w-full min-w-0">
              <FinancialHealthScore
                savingRate={savingRate}
                totalIncome={cycleIncome}
                totalExpense={cycleExpense}
                monthlyDebtAmount={monthlyDebtAmount}
                budgets={budgetWithSpending}
                balance={realAvailableBalance}
                daysRemaining={payrollCycle.daysRemaining}
              />
              <ForecastCard
                balance={realAvailableBalance}
                totalExpense={cycleExpense}
                effectiveIncome={effectiveIncome}
                elapsedDays={payrollCycle.elapsedDays}
                daysRemaining={payrollCycle.daysRemaining}
                salaryDate={salaryDate}
                isStudentMode={isStudentMode}
              />
            </div>

            {/* 2. Kalender Disiplin Harian & Streak Sesuai Target */}
            <CycleCalendarHeatmap
              startDateStr={payrollCycle.startDateStr}
              endDateStr={payrollCycle.endDateStr}
              cycleLabel={payrollCycle.label}
              transactions={cycleTransactions}
              dailyIdealBudget={(() => {
                const totalAllocatedBudget =
                  budgetWithSpending.reduce((sum, b) => sum + b.amount, 0) +
                  (!hasFoodInBudgets && foodBudgetTotal > 0 ? foodBudgetTotal : 0);
                if (totalAllocatedBudget > 0 && payrollCycle.totalDays > 0) {
                  return Math.round(totalAllocatedBudget / payrollCycle.totalDays);
                }
                if (payrollCycle.totalDays > 0 && effectiveIncome > 0) {
                  return Math.round((effectiveIncome * 0.7) / payrollCycle.totalDays);
                }
                return 100000;
              })()}
            />

            {/* 3. Kekayaan Bersih */}
            <NetWorthCard
              totalSavings={totalSavings}
              currentBalance={realAvailableBalance}
              totalPendingDebt={totalPendingDebtAmount}
            />

            {/* 3. Grafik Pengeluaran & Tabungan */}
            <DashboardCharts
              expenseByCategory={expenseByCategory}
              totalExpense={cycleExpense}
              savingsChartData={savingsChartData}
            />

            {/* 4. Target Tabungan */}
            {savingsGoalsList.length > 0 && (
              <section className="space-y-2.5 w-full min-w-0">
                <SectionHeader title="Target Tabungan" desc="Progres simpanan dana" href="/savings" linkLabel="Lihat Semua" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                  {savingsGoalsList.slice(0, 2).map(goal => (
                    <SavingsGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}

            {/* 5. Insight & Evaluasi Finansial */}
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
          </div>
        }
      />

      {/* Footer */}
      <footer className="pt-4 pb-2 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-600">
        <p>My Budget · {isStudentMode ? 'Bulanan' : `Siklus ${salaryDate}`}</p>
        <p>Privat &amp; Aman</p>
      </footer>
    </div>
  );
}

/* ─── Section Header Component (premium) ─── */
function SectionHeader({
  title,
  desc,
  href,
  linkLabel,
}: {
  title: string;
  desc?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-0.5">
        <h2 className="font-bold text-[15.5px] sm:text-[17px] text-zinc-900 dark:text-white leading-tight tracking-[-0.025em]">
          {title}
        </h2>
        {desc && (
          <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500">{desc}</p>
        )}
      </div>
      <Link
        href={href}
        className="group press flex-shrink-0 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap"
      >
        <span>{linkLabel}</span>
        <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
          <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
        </span>
      </Link>
    </div>
  );
}
