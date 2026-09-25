export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { transactions, budgets, categories, settings, users, savingsGoals, debts, debtInstallments } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { formatCurrency } from '@/lib/currency';
import { formatMonth, getCurrentMonth, calculateProratedSalary, getPayrollCycle } from '@/lib/dates';
import { calculateSavingRate } from '@/lib/calculations';
import { getDevUserId } from '@/lib/server-utils';
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
  const DEV_USER_ID = getDevUserId();
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan Saya</h1>
          <p className="text-gray-500 text-sm mt-1">Pantau keuanganmu dengan lebih mudah.</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-blue-600 text-sm font-semibold">{formatMonth(currentMonth, currentYear)}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
              Siklus: {payrollCycle.label} ({payrollCycle.daysRemaining} hari lagi)
            </span>
          </div>
        </div>
        <Link
          href="/transactions?action=new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Transaksi</span>
          <span className="sm:hidden">Tambah</span>
        </Link>
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
