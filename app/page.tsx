export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { transactions, budgets, categories, settings, users, savingsGoals, debts, debtInstallments } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { formatCurrency } from '@/lib/currency';
import { formatMonth, getCurrentMonth, calculateProratedSalary, getPayrollCycle } from '@/lib/dates';
import { calculateSavingRate } from '@/lib/calculations';
import { getUserId } from '@/lib/auth';
import { DashboardSummary } from '@/components/DashboardSummary';
import { BudgetProgress } from '@/components/BudgetProgress';
import { ExpenseChart } from '@/components/ExpenseChart';
import { SavingsChart } from '@/components/SavingsChart';
import { RecentTransactions } from '@/components/RecentTransactions';
import { QuickActions } from '@/components/QuickActions';
import { InsightCard } from '@/components/InsightCard';
import { DailyBudget } from '@/components/DailyBudget';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import Link from 'next/link';
import { Plus, ChevronRight, AlertTriangle, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const DEV_USER_ID = await getUserId();
  const { month, year } = getCurrentMonth();
  // Use September 2026 as current month since that's the app context
  const currentMonth = 9;
  const currentYear = 2026;

  const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-30`;

  let userSettings: any = null;
  let user: any = null;
  let monthTransactions: any[] = [];
  let monthBudgets: any[] = [];
  let savingsGoalsList: any[] = [];
  let activeDebts: any[] = [];
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
        where: (t, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn }) =>
          andFn(
            eqFn(t.userId, DEV_USER_ID),
            gteFn(t.transactionDate, startDate),
            lteFn(t.transactionDate, endDate)
          ),
        with: { category: true },
        orderBy: (t, { desc }) => desc(t.transactionDate),
      }),
      db.query.budgets.findMany({
        where: (b, { and: andFn, eq: eqFn }) =>
          andFn(
            eqFn(b.userId, DEV_USER_ID),
            eqFn(b.month, currentMonth),
            eqFn(b.year, currentYear)
          ),
        with: { category: true },
      }),
      db.query.savingsGoals.findMany({
        where: (g, { eq: eqFn }) => eqFn(g.userId, DEV_USER_ID),
      }),
      db.query.debts.findMany({
        where: (d, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(d.userId, DEV_USER_ID), eqFn(d.status, 'active')),
        with: { installments: true },
      }),
    ]);
    [userSettings, user, monthTransactions, monthBudgets, savingsGoalsList, activeDebts] = data;
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    fetchError = err?.message || String(err);
  }

  if (fetchError) {
    return (
      <div className="bg-[#FAF7F2] border-2 border-[#D9381E] p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4 my-8 shadow-[4px_4px_0px_#24201D]">
        <div className="w-12 h-12 bg-[#FBEBE8] border border-[#D9381E] text-[#D9381E] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-[#24201D] uppercase">Koneksi Database Gagal</h2>
        <p className="font-sans text-xs text-[#706860]">
          Server Next.js tidak dapat menghubungi database PostgreSQL:
        </p>
        <div className="bg-[#EDE6DC] border border-[#24201D]/30 text-[#24201D] p-3 text-xs font-mono text-left break-all">
          {fetchError}
        </div>
        <p className="font-mono text-[11px] text-[#706860]">
          Pastikan DATABASE_URL sudah diatur di dashboard Vercel.
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingRate = calculateSavingRate(totalIncome, balance);

  // Calculate total savings
  const totalSavings = savingsGoalsList.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  // Calculate effective income (with prorate if applicable)
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

  // Expense by category for chart
  const expenseByCategory = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catName = t.category?.name || 'Lainnya';
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Budget with spending
  const budgetWithSpending = monthBudgets.map(budget => {
    const spent = monthTransactions
      .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
    };
  });

  // Recent transactions (last 5)
  const recentTransactions = monthTransactions.slice(0, 5);

  // Food budget for daily widget
  const foodBudgetTotal = userSettings?.foodBudget || 0;
  const foodSpent = monthTransactions
    .filter(t => t.type === 'expense' && t.category?.name === 'Makan')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending installments this month
  const pendingInstallments = activeDebts.flatMap(d =>
    (d.installments || []).filter((i: any) =>
      i.status === 'pending' &&
      i.dueDate >= startDate &&
      i.dueDate <= endDate
    )
  );

  const salaryDate = userSettings?.salaryDate || 25;
  const payrollCycle = getPayrollCycle(salaryDate, new Date());

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══════════ Broadsheet Masthead ═══════════ */}
      <header className="border-b-2 border-[#24201D] pb-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-[#D9381E] uppercase tracking-widest">
                BUKU BESAR KEUANGAN · FIX Nº 25-25
              </span>
              <span className="text-[#24201D]/30 font-mono text-[10px]">·</span>
              <span className="font-mono text-[10px] text-[#706860] uppercase">
                {formatMonth(currentMonth, currentYear)}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#24201D] uppercase leading-none tracking-tight">
              MY BUDGET BROADSHEET
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:text-right font-mono text-xs">
            <div className="bg-[#EDE6DC] border border-[#24201D] px-3 py-1 text-[#24201D]">
              <span className="text-[10px] text-[#706860] block uppercase">Akun Terverifikasi</span>
              <span className="font-bold text-[#24201D]">{user?.name || 'Zikry Kurniawan'}</span>
            </div>

            <Link
              href="/transactions?action=new"
              className="bg-[#D9381E] hover:bg-[#24201D] text-[#F4F0EA] border border-[#B82C15] px-3.5 py-2 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#24201D] transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CATAT BARU</span>
            </Link>
          </div>
        </div>

        {/* Masthead rule line & Strapline */}
        <div className="border-t border-[#24201D]/20 pt-2 flex flex-wrap items-center justify-between font-mono text-[11px] text-[#706860]">
          <span>SIKLUS GAJIAN: SETIAP TANGGAL {salaryDate} ({payrollCycle.daysRemaining} HARI LAGI)</span>
          <span className="hidden sm:inline">DIBUKUKAN TERCATAT HINGGA RUPIAH TERAKHIR</span>
        </div>
      </header>

      {/* ═══════════ The Fold - Hero Slogan ═══════════ */}
      <section className="relative overflow-hidden bg-[#EDE6DC] border-2 border-[#24201D] p-5 sm:p-7 shadow-[4px_4px_0px_#24201D]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold text-[#D9381E] uppercase tracking-widest mb-1">
              MANIFESTO KEUANGAN PRIBADI
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#24201D] uppercase leading-none tracking-tight">
              DISIPLIN KAS.<br />
              <span className="text-[#D9381E]">CATAT. ATUR. SIMPAN.</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="font-sans text-xs sm:text-sm text-[#3D3834] leading-relaxed">
              Uang yang tidak tercatat adalah uang yang hilang perlahan. Setiap rupiah pemasukan, pos belanja makan, dan cicilan terjaga dalam siklus gaji 25 ke 25.
            </p>
            <div className="flex items-center gap-3 mt-3 font-mono text-[11px] font-bold text-[#24201D]">
              <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#24201D]">NO BOCOR ALUS</span>
              <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#24201D]">SIKLUS 25-25</span>
              <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#24201D]">TERKONTROL</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Tape Marquee - The Count Strip ═══════════ */}
      <section className="tape-band py-2 px-3 overflow-hidden shadow-[2px_2px_0px_#24201D]">
        <div className="flex gap-8 whitespace-nowrap animate-tape-scroll font-mono text-xs font-bold uppercase tracking-wider text-[#24201D]">
          <span>/ SALDO: {formatCurrency(balance)} /</span>
          <span className="text-[#D9381E]">/ GAJIAN: TGL {salaryDate} ({payrollCycle.daysRemaining} HARI LAGI) /</span>
          <span>/ PACING MAKAN: {foodBudgetTotal > 0 ? formatCurrency(Math.round(foodBudgetTotal / payrollCycle.totalDays)) : 'Rp 0'}/HARI /</span>
          <span className="text-[#2A7B88]">/ TABUNGAN: {formatCurrency(totalSavings)} /</span>
          <span>/ CICILAN AKTIF: {activeDebts.length} FASILITAS /</span>
          <span className="text-[#D9381E]">/ SAVING RATE: {savingRate}% /</span>
          {/* Loop repeat */}
          <span>/ SALDO: {formatCurrency(balance)} /</span>
          <span className="text-[#D9381E]">/ GAJIAN: TGL {salaryDate} ({payrollCycle.daysRemaining} HARI LAGI) /</span>
          <span>/ PACING MAKAN: {foodBudgetTotal > 0 ? formatCurrency(Math.round(foodBudgetTotal / payrollCycle.totalDays)) : 'Rp 0'}/HARI /</span>
          <span className="text-[#2A7B88]">/ TABUNGAN: {formatCurrency(totalSavings)} /</span>
        </div>
      </section>

      {/* ═══════════ PLANK 01: Summary Cards ═══════════ */}
      <DashboardSummary
        balance={balance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        totalSavings={totalSavings}
        savingRate={savingRate}
        effectiveIncome={effectiveIncome}
      />

      {/* ═══════════ PLANK 02: Daily Food Budget Pacing ═══════════ */}
      <DailyBudget
        foodBudgetTotal={foodBudgetTotal}
        foodSpent={foodSpent}
        salaryDate={salaryDate}
      />

      {/* ═══════════ PLANK 03: Quick Actions ═══════════ */}
      <QuickActions />

      {/* ═══════════ PLANK 04: Budget Progress ═══════════ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between border-b border-[#24201D]/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D9381E] uppercase">PLANK 04</span>
            <span className="text-[#24201D]/30">/</span>
            <h2 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
              Pagu Anggaran Kategori
            </h2>
          </div>
          <Link
            href="/budget"
            className="font-mono text-xs font-bold text-[#D9381E] hover:text-[#24201D] flex items-center gap-1"
          >
            <span>KELOLA ANGGARAN</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <BudgetProgress budgets={budgetWithSpending} />
      </section>

      {/* ═══════════ Visualisations (Charts) ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ExpenseChart data={expenseByCategory} total={totalExpense} />
        <SavingsChart userId={DEV_USER_ID} />
      </div>

      {/* ═══════════ Target Tabungan (Savings Goals) ═══════════ */}
      {savingsGoalsList.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#24201D]/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#D9381E] uppercase">PLANK 05</span>
              <span className="text-[#24201D]/30">/</span>
              <h2 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
                Target Dana & Tabungan
              </h2>
            </div>
            <Link
              href="/savings"
              className="font-mono text-xs font-bold text-[#D9381E] hover:text-[#24201D] flex items-center gap-1"
            >
              <span>LIHAT SEMUA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {savingsGoalsList.slice(0, 2).map(goal => (
              <SavingsGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ Financial Insights ═══════════ */}
      <InsightCard
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        budgets={budgetWithSpending}
        effectiveIncome={effectiveIncome}
        foodSpent={foodSpent}
        foodBudgetTotal={foodBudgetTotal}
        month={currentMonth}
        year={currentYear}
        pendingInstallmentsCount={pendingInstallments.length}
      />

      {/* ═══════════ PLANK 06: Recent Transactions ═══════════ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between border-b border-[#24201D]/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D9381E] uppercase">PLANK 06</span>
            <span className="text-[#24201D]/30">/</span>
            <h2 className="font-mono text-xs font-bold text-[#24201D] uppercase tracking-wider">
              Buku Catatan Transaksi Terkini
            </h2>
          </div>
          <Link
            href="/transactions"
            className="font-mono text-xs font-bold text-[#D9381E] hover:text-[#24201D] flex items-center gap-1"
          >
            <span>LIHAT BUKU LENGKAP</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <RecentTransactions transactions={recentTransactions} />
      </section>

      {/* ═══════════ Broadsheet Colophon ═══════════ */}
      <footer className="border-t-2 border-[#24201D] pt-6 pb-12 mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-[#706860]">
        <div>
          <p className="font-display font-extrabold text-base text-[#24201D] uppercase">
            MY BUDGET · BROADSHEET LEDGER
          </p>
          <p className="mt-1 leading-relaxed">
            Sistem pencatatan keuangan pribadi presisi untuk Zikry Kurniawan. Dikelola dengan siklus penggajian tanggal 25 ke 25, berbasis Neon PostgreSQL dan Next.js Server Components.
          </p>
        </div>

        <div className="md:text-right space-y-1">
          <p className="uppercase text-[#24201D] font-bold">Cetakan Siklus: 25 Agt - 25 Sep 2026</p>
          <p>Bebas pelacak analitik pihak ketiga · 100% data terenkripsi</p>
          <p className="text-[10px] text-[#706860]/80">HALLMARK CUSTOM-04 NEWSPRINT THEME · ZERO AI SLOP</p>
        </div>
      </footer>
    </div>
  );
}
