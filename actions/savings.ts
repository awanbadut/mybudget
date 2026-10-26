'use server';

import { db } from '@/db';
import { savingsGoals, savingsTransactions, transactions, categories, accounts } from '@/db/schema';
import { SavingsGoalSchema, SavingsTransactionSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { ensureAccountsTable, getAccounts } from '@/actions/accounts';
import { eq, and, or, like, ne } from 'drizzle-orm';

export async function ensureSavingsCategory(userId: string) {
  await ensureAccountsTable();

  let savingsCat = await db.query.categories.findFirst({
    where: (c, { and: a, eq: e }) => a(e(c.userId, userId), e(c.name, 'Tabungan'), e(c.type, 'expense')),
  });

  if (!savingsCat) {
    const [inserted] = await db.insert(categories).values({
      userId,
      name: 'Tabungan',
      type: 'expense',
      color: '#10b981',
      icon: 'PiggyBank',
    }).returning();
    savingsCat = inserted;
  }

  // Auto-detect any wallet named "Tabungan" / "Simpanan" / "Celengan" and mark its type as 'savings'
  try {
    const userAccs = await db.query.accounts.findMany({
      where: (a, { eq: e }) => e(a.userId, userId),
    });

    let savingsAcc = userAccs.find(a => a.type === 'savings');
    if (!savingsAcc) {
      const matched = userAccs.find(a => /tabungan|simpanan|celengan|saving/i.test(a.name));
      if (matched) {
        await db.update(accounts)
          .set({ type: 'savings', icon: 'PiggyBank', color: '#10b981', updatedAt: new Date() })
          .where(eq(accounts.id, matched.id));
        savingsAcc = { ...matched, type: 'savings' };
      }
    }

    // Auto-repair: find any past savings transactions that were mistakenly linked to Kos or marked as expense
    const brokenTxs = await db.query.transactions.findMany({
      where: (t, { and: a, eq: e, or: o, like: l }) => a(
        e(t.userId, userId),
        o(
          l(t.name, 'Setor Tabungan%'),
          l(t.note, '%[Tabungan]%'),
          l(t.note, '%Sweeping Sisa Uang Siklus%')
        )
      ),
    });

    if (brokenTxs.length > 0) {
      for (const bTx of brokenTxs) {
        // If user selected the savings wallet itself as source account, don't let it deduct from the savings wallet!
        if (savingsAcc && bTx.accountId === savingsAcc.id && !bTx.toAccountId) {
          await db.update(transactions)
            .set({
              categoryId: savingsCat.id,
              type: 'transfer',
              accountId: null,
              toAccountId: null,
              updatedAt: new Date(),
            })
            .where(eq(transactions.id, bTx.id));
        } else {
          const targetToAccId = savingsAcc && bTx.accountId && bTx.accountId !== savingsAcc.id
            ? savingsAcc.id
            : bTx.toAccountId;
          if (bTx.categoryId !== savingsCat.id || bTx.type !== 'transfer' || bTx.toAccountId !== targetToAccId) {
            await db.update(transactions)
              .set({
                categoryId: savingsCat.id,
                type: 'transfer',
                toAccountId: targetToAccId,
                updatedAt: new Date(),
              })
              .where(eq(transactions.id, bTx.id));
          }
        }
      }
    }

    // If user has a dedicated savings wallet, keep single savings goal balance automatically in sync with live wallet balance
    if (savingsAcc) {
      const allTx = await db.query.transactions.findMany({
        where: (t, { eq: e }) => e(t.userId, userId),
      });
      let liveSavingsBal = savingsAcc.initialBalance;
      for (const tx of allTx) {
        if (tx.accountId === savingsAcc.id) {
          if (tx.type === 'income') liveSavingsBal += tx.amount;
          else if (tx.type === 'expense' || tx.type === 'transfer') liveSavingsBal -= tx.amount;
        }
        if (tx.type === 'transfer' && tx.toAccountId === savingsAcc.id) {
          liveSavingsBal += tx.amount;
        }
      }
      liveSavingsBal = Math.max(0, liveSavingsBal);

      const userGoals = await db.query.savingsGoals.findMany({
        where: (g, { eq: e }) => e(g.userId, userId),
      });

      if (userGoals.length === 1 && userGoals[0].currentAmount !== liveSavingsBal && liveSavingsBal > 0) {
        await db.update(savingsGoals)
          .set({ currentAmount: liveSavingsBal, updatedAt: new Date() })
          .where(eq(savingsGoals.id, userGoals[0].id));
      }
    }
  } catch (repairErr) {
    console.warn('Auto-repair savings transactions note:', repairErr);
  }

  return savingsCat;
}

export async function repairSavingsCategoryAction() {
  try {
    const userId = await getUserId();
    const cat = await ensureSavingsCategory(userId);
    safeRevalidate('/budget');
    safeRevalidate('/');
    safeRevalidate('/savings');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true, categoryId: cat.id };
  } catch (err) {
    console.error('repairSavingsCategoryAction error:', err);
    return { success: false, error: 'Gagal memperbaiki kategori tabungan.' };
  }
}

export async function createSavingsGoal(data: unknown) {
  try {
    const validated = SavingsGoalSchema.parse(data);
    const userId = await getUserId();
    const [goal] = await db.insert(savingsGoals).values({ userId, ...validated }).returning();
    safeRevalidate('/savings');
    return { success: true, data: goal };
  } catch (error) {
    console.error('createSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function updateSavingsGoal(id: string, data: unknown) {
  try {
    const validated = SavingsGoalSchema.parse(data);
    const userId = await getUserId();
    await db.update(savingsGoals)
      .set({ ...validated, updatedAt: new Date() })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    safeRevalidate('/savings');
    return { success: true };
  } catch (error) {
    console.error('updateSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteSavingsGoal(id: string) {
  try {
    const userId = await getUserId();
    await db.delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    safeRevalidate('/savings');
    return { success: true };
  } catch (error) {
    console.error('deleteSavingsGoal error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function addSavings(data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = SavingsTransactionSchema.parse(data);
    const userId = await getUserId();
    
    // Verify the goal belongs to user
    const goal = await db.query.savingsGoals.findFirst({
      where: (g, { and: andFn, eq: eqFn }) => andFn(
        eqFn(g.id, validated.savingsGoalId),
        eqFn(g.userId, userId)
      ),
    });
    
    if (!goal) {
      return { success: false, error: 'Target tabungan tidak ditemukan.' };
    }

    let linkedCashTxId: string | null = null;

    // Check if user has a dedicated savings wallet
    const userAccs = await db.query.accounts.findMany({
      where: (a, { eq: e }) => e(a.userId, userId),
    });
    const savingsAcc = userAccs.find(a => a.type === 'savings' || /tabungan|simpanan|celengan|saving/i.test(a.name));

    // If deductFromCash is true, record matching asset transfer in cash ledger
    // However, if the selected account IS the savings wallet itself, do not deduct from it (money is already in savings wallet)
    if (validated.deductFromCash && (!savingsAcc || validated.accountId !== savingsAcc.id)) {
      const savingsCat = await ensureSavingsCategory(userId);

      const [cashTx] = await db.insert(transactions).values({
        userId,
        categoryId: savingsCat.id,
        accountId: validated.accountId || null,
        toAccountId: savingsAcc ? savingsAcc.id : null,
        type: 'transfer',
        name: `Setor Tabungan: ${goal.name}`,
        amount: validated.amount,
        transactionDate: validated.transactionDate,
        note: validated.note ? `[Tabungan] ${validated.note}` : `[Alokasi ke target: ${goal.name}]`,
      }).returning();

      linkedCashTxId = cashTx.id;
    }
    
    await db.insert(savingsTransactions).values({
      savingsGoalId: validated.savingsGoalId,
      amount: validated.amount,
      transactionDate: validated.transactionDate,
      note: validated.note,
      accountId: validated.accountId || null,
      transactionId: linkedCashTxId,
    });
    
    // Update current amount
    await db.update(savingsGoals)
      .set({ 
        currentAmount: goal.currentAmount + validated.amount,
        updatedAt: new Date()
      })
      .where(eq(savingsGoals.id, validated.savingsGoalId));
    
    safeRevalidate('/savings');
    safeRevalidate('/');
    safeRevalidate('/budget');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error) {
    console.error('addSavings error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function deleteSavingsTransaction(id: string, goalId: string) {
  try {
    await ensureAccountsTable();
    const userId = await getUserId();
    
    // Verify goal belongs to user
    const goal = await db.query.savingsGoals.findFirst({
      where: (g, { and: a, eq: e }) => a(e(g.id, goalId), e(g.userId, userId)),
    });
    if (!goal) return { success: false, error: 'Target tabungan tidak ditemukan.' };

    // Get the transaction before deleting
    const tx = await db.query.savingsTransactions.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!tx) return { success: false, error: 'Setoran tidak ditemukan.' };

    // If there is a linked cash expense transaction, delete it to refund the wallet balance
    if (tx.transactionId) {
      await db.delete(transactions)
        .where(and(eq(transactions.id, tx.transactionId), eq(transactions.userId, userId)));
    }

    // Delete savings transaction
    await db.delete(savingsTransactions).where(eq(savingsTransactions.id, id));

    // Update currentAmount
    const newAmount = Math.max(0, goal.currentAmount - tx.amount);
    await db.update(savingsGoals)
      .set({ currentAmount: newAmount, updatedAt: new Date() })
      .where(eq(savingsGoals.id, goalId));

    safeRevalidate('/savings');
    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteSavingsTransaction error:', error);
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}

export async function syncSavingsWithWallet(accountId: string) {
  try {
    await ensureAccountsTable();
    const userId = await getUserId();

    const targetAcc = await db.query.accounts.findFirst({
      where: (a, { and: aFn, eq: eFn }) => aFn(eFn(a.id, accountId), eFn(a.userId, userId)),
    });

    if (!targetAcc) {
      return { success: false, error: 'Dompet tidak ditemukan.' };
    }

    // Set this account as the dedicated savings wallet
    await db.update(accounts)
      .set({
        type: 'savings',
        icon: 'PiggyBank',
        color: '#10b981',
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));

    // Re-run repair so any self-deduction on this savings wallet is neutralized
    await ensureSavingsCategory(userId);

    // Get live balance of this savings wallet
    const accsRes = await getAccounts();
    const liveSavingsAcc = accsRes.data.find(a => a.id === accountId);
    const walletBalance = Math.max(0, liveSavingsAcc?.balance || 0);

    // Sync user's savings goals with this wallet's balance
    const userGoals = await db.query.savingsGoals.findMany({
      where: (g, { eq: eFn }) => eFn(g.userId, userId),
    });

    if (userGoals.length === 0) {
      await db.insert(savingsGoals).values({
        userId,
        name: targetAcc.name || 'Tabungan Utama',
        targetAmount: Math.max(10000000, walletBalance * 2 || 5000000),
        currentAmount: walletBalance,
      });
    } else if (userGoals.length === 1) {
      await db.update(savingsGoals)
        .set({ currentAmount: walletBalance, updatedAt: new Date() })
        .where(eq(savingsGoals.id, userGoals[0].id));
    } else {
      // Distribute or adjust the primary goal so total goals match the savings wallet balance
      const otherGoalsSum = userGoals.slice(1).reduce((s, g) => s + (g.currentAmount || 0), 0);
      const firstGoalAmount = Math.max(0, walletBalance - otherGoalsSum);
      await db.update(savingsGoals)
        .set({ currentAmount: firstGoalAmount, updatedAt: new Date() })
        .where(eq(savingsGoals.id, userGoals[0].id));
    }

    safeRevalidate('/savings');
    safeRevalidate('/');
    safeRevalidate('/budget');
    safeRevalidate('/transactions');
    safeRevalidate('/reports');
    safeRevalidate('/admin');

    return { success: true, syncedBalance: walletBalance };
  } catch (error) {
    console.error('syncSavingsWithWallet error:', error);
    return { success: false, error: 'Gagal menyinkronkan dompet tabungan.' };
  }
}
