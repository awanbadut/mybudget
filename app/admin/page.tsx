export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboardClient, UserDetail } from '@/components/AdminDashboardClient';
import { adminGetAllBroadcasts, getMaintenanceStatus } from '@/actions/admin';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/');
  }

  // Fetch all users (including admins) with full related data, broadcasts & maintenance state
  const [allUsers, broadcastList, maintenance] = await Promise.all([
    db.query.users.findMany({
      with: {
        settings: true,
        accounts: true,
        transactions: {
          orderBy: (t, { desc }) => [desc(t.transactionDate), desc(t.createdAt)],
        },
        savingsGoals: true,
        debts: {
          with: { installments: true },
        },
      },
      orderBy: (u, { asc }) => asc(u.createdAt),
    }),
    adminGetAllBroadcasts(),
    getMaintenanceStatus(),
  ]);

  const formattedUsers: UserDetail[] = allUsers.map((u) => {
    // 1. Sort transactions strictly by date DESC, then createdAt DESC
    const sortedTransactions = [...(u.transactions || [])].sort((a, b) => {
      const cmp = b.transactionDate.localeCompare(a.transactionDate);
      if (cmp !== 0) return cmp;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    // 2. Calculate live balances for each account / wallet
    const userAccounts = (u.accounts || []).map((acc) => {
      let balance = acc.initialBalance;
      for (const tx of sortedTransactions) {
        if (tx.accountId === acc.id) {
          if (tx.type === 'income') balance += tx.amount;
          else if (tx.type === 'expense') balance -= tx.amount;
          else if (tx.type === 'transfer') balance -= tx.amount;
        }
        if (tx.toAccountId === acc.id && tx.type === 'transfer') {
          balance += tx.amount;
        }
      }
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        accountNumber: acc.accountNumber,
        balance,
        initialBalance: acc.initialBalance,
        isDefault: acc.isDefault,
      };
    });

    const accMap = new Map(userAccounts.map((a) => [a.id, a.name]));

    const income = sortedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = sortedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWalletsBalance = userAccounts.reduce((sum, a) => sum + a.balance, 0);
    const realAvailableBalance = userAccounts.length > 0 ? totalWalletsBalance : (income - expense);

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
      role: (u.role as 'user' | 'admin') || 'user',
      createdAt: u.createdAt.toISOString(),
      latestTransactionDate: sortedTransactions[0]?.transactionDate || null,
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
      accounts: userAccounts,
      transactions: sortedTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        amount: t.amount,
        transactionDate: t.transactionDate,
        note: t.note,
        accountName: t.accountId ? accMap.get(t.accountId) || null : null,
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
      balance: realAvailableBalance,
      savings,
      activeDebtsCount: activeDebts.length,
      pendingDebtAmount,
    };
  });

  return (
    <AdminDashboardClient
      adminId={session.userId}
      adminName={session.name}
      users={formattedUsers}
      initialBroadcasts={broadcastList}
      initialMaintenance={maintenance}
    />
  );
}
