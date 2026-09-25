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
import { Plus, ChevronRight, AlertTriangle } from 'lucide-react';

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
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-lg mx-auto text-center space-y-4 my-8">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Koneksi Database Gagal</h2>
        <p className="text-sm text-gray-500">
          Server Next.js tidak dapat menghubungi database PostgreSQL:
        </p>
        <div className="bg-red-50 text-red-800 p-3 rounded-xl text-xs font-mono text-left break-all">
          {fetchError}
        </div>
        <p className="text-xs text-gray-500">
          Pastikan <strong>DATABASE_URL</strong> sudah diatur dengan benar di tab Settings &rarr; Environment Variables di Vercel.
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

  // Calculate total savings (from all savings goals)
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
    <div className="space-y-6">
      {/* Architectural Mobile App Header */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono font-bold text-sm flex items-center justify-center shadow-sm">
            {(user?.name || 'Zikry').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Account</p>
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
              {user?.name || 'Zikry Kurniawan'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 border border-zinc-200/90 text-zinc-700 px-3 py-1.5 rounded-full text-xs font-mono font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] sm:text-xs">
              Gajian {salaryDate} ({payrollCycle.daysRemaining}h lagi)
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <DashboardSummary
        balance={balance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        totalSavings={totalSavings}
        savingRate={savingRate}
        effectiveIncome={effectiveIncome}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Budget Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Budget Bulanan</h2>
          <Link href="/budget" className="text-sm text-blue-600 flex items-center gap-1">
            Kelola <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <BudgetProgress budgets={budgetWithSpending} />
      </div>

      {/* Daily Food Budget */}
      <DailyBudget
        foodBudgetTotal={foodBudgetTotal}
        foodSpent={foodSpent}
        salaryDate={salaryDate}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={expenseByCategory} total={totalExpense} />
        <SavingsChart userId={DEV_USER_ID} />
      </div>

      {/* Savings Goal */}
      {savingsGoalsList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Target Tabungan</h2>
            <Link href="/savings" className="text-sm text-blue-600 flex items-center gap-1">
              Lihat semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savingsGoalsList.slice(0, 2).map(goal => (
              <SavingsGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
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

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-sm text-blue-600 flex items-center gap-1">
            Lihat semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}
