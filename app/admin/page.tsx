export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboardClient, UserDetail } from '@/components/AdminDashboardClient';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/');
  }

  // Fetch all users with their full data
  const allUsers = await db.query.users.findMany({
    where: (u, { ne }) => ne(u.role, 'admin'),
    with: {
      settings: true,
      transactions: true,
      savingsGoals: true,
      debts: {
        with: { installments: true },
      },
    },
    orderBy: (u, { asc }) => asc(u.createdAt),
  });

  const formattedUsers: UserDetail[] = allUsers.map((u) => {
    const income = u.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = u.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = u.savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const activeDebts = u.debts.filter((d) => d.status === 'active');
    const pendingDebtAmount = activeDebts.reduce((sum, d) => {
      return (
        sum +
        d.installments
          .filter((i) => i.status === 'pending')
          .reduce((s, i) => s + i.amount, 0)
      );
    }, 0);

    return {
      id: u.id,
      name: u.name,
      username: u.username || '-',
      createdAt: u.createdAt.toISOString(),
      settings: u.settings ? {
        salary: u.settings.salary,
        salaryDate: u.settings.salaryDate,
        rentBudget: u.settings.rentBudget,
        foodBudget: u.settings.foodBudget,
        entertainmentBudget: u.settings.entertainmentBudget,
        toiletries_budget: u.settings.toiletries_budget,
        transportBudget: u.settings.transportBudget,
        startWorkDate: u.settings.startWorkDate,
      } : null,
      transactions: u.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        amount: t.amount,
        transactionDate: t.transactionDate,
        note: t.note,
      })),
      savingsGoals: u.savingsGoals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline,
      })),
      debts: u.debts.map((d) => ({
        id: d.id,
        name: d.name,
        totalAmount: d.totalAmount,
        status: d.status,
        installments: d.installments.map((i) => ({
          id: i.id,
          installmentNumber: i.installmentNumber,
          dueDate: i.dueDate,
          amount: i.amount,
          status: i.status,
          paidAt: i.paidAt ? i.paidAt.toISOString() : null,
        })),
      })),
      income,
      expense,
      balance: income - expense,
      savings,
      activeDebtsCount: activeDebts.length,
      pendingDebtAmount,
    };
  });

  return <AdminDashboardClient adminName={session.name} users={formattedUsers} />;
}
