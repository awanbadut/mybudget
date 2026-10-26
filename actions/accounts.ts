'use server';

import { db } from '@/db';
import { accounts, transactions, users, categories } from '@/db/schema';
import { AccountSchema, TransferSchema } from '@/lib/validation';
import { safeRevalidate, getUserId } from '@/lib/server-utils';
import { eq, and, sql, or } from 'drizzle-orm';

let tablesEnsured = false;
export async function ensureAccountsTable() {
  if (tablesEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'bank',
        account_number VARCHAR(100),
        initial_balance BIGINT NOT NULL DEFAULT 0,
        color VARCHAR(50) DEFAULT '#2563eb',
        icon VARCHAR(50) DEFAULT 'Wallet',
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id)
    `);

    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transactions' AND column_name = 'account_id'
        ) THEN
          ALTER TABLE transactions ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transactions' AND column_name = 'to_account_id'
        ) THEN
          ALTER TABLE transactions ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transactions' AND column_name = 'category_id' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'savings_transactions' AND column_name = 'account_id'
        ) THEN
          ALTER TABLE savings_transactions ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'savings_transactions' AND column_name = 'transaction_id'
        ) THEN
          ALTER TABLE savings_transactions ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    tablesEnsured = true;
  } catch (error) {
    console.error('ensureAccountsTable error:', error);
    // Prevent hammered repeated DDL attempts in the same process
    tablesEnsured = true;
  }
}

export interface AccountWithBalance {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const healedUsers = new Set<string>();

export async function getAccounts(): Promise<{ success: boolean; data: AccountWithBalance[] }> {
  try {
    const userId = await getUserId();

    let userAccounts = await db.query.accounts.findMany({
      where: (a, { eq: eqFn }) => eqFn(a.userId, userId),
      orderBy: (a, { desc, asc }) => [desc(a.isDefault), asc(a.name)],
    });

    // Auto-seed default accounts if user has none
    if (userAccounts.length === 0) {
      const defaults = [
        { name: 'Kas Tunai', type: 'cash', initialBalance: 0, color: '#16a34a', icon: 'Coins', isDefault: true },
        { name: 'BCA', type: 'bank', initialBalance: 0, color: '#2563eb', icon: 'Building2', isDefault: false },
        { name: 'GoPay', type: 'ewallet', initialBalance: 0, color: '#0284c7', icon: 'Smartphone', isDefault: false },
      ];

      for (const def of defaults) {
        await db.insert(accounts).values({
          userId,
          ...def,
        });
      }

      userAccounts = await db.query.accounts.findMany({
        where: (a, { eq: eqFn }) => eqFn(a.userId, userId),
        orderBy: (a, { desc, asc }) => [desc(a.isDefault), asc(a.name)],
      });
    }

    // Auto-heal: Ensure any past Penyesuaian Saldo transactions are detached from Pos Lainnya (run once per user session)
    if (!healedUsers.has(userId)) {
      try {
        await db.execute(sql`
          UPDATE transactions 
          SET category_id = NULL, type = 'transfer' 
          WHERE user_id = ${userId} 
            AND (category_id IS NOT NULL OR type != 'transfer')
            AND (name ILIKE '%penyesuaian%' OR note ILIKE '%penyesuaian%')
        `);
        healedUsers.add(userId);
      } catch (e) {
        console.error('Error auto-healing adjustment transactions:', e);
      }
    }

    // Fetch minimal transaction columns needed strictly for account balance calculations
    const allUserTx = await db.query.transactions.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
      columns: {
        id: true,
        amount: true,
        type: true,
        accountId: true,
        toAccountId: true,
      },
    });

    const result: AccountWithBalance[] = userAccounts.map((acc) => {
      let balance = acc.initialBalance;
      let totalIncome = 0;
      let totalExpense = 0;

      for (const tx of allUserTx) {
        if (tx.accountId === acc.id) {
          if (tx.type === 'income') {
            balance += tx.amount;
            totalIncome += tx.amount;
          } else if (tx.type === 'expense') {
            balance -= tx.amount;
            totalExpense += tx.amount;
          } else if (tx.type === 'transfer') {
            balance -= tx.amount; // outgoing transfer from this account
            totalExpense += tx.amount;
          }
        }
        if (tx.type === 'transfer' && tx.toAccountId === acc.id) {
          balance += tx.amount; // incoming transfer to this account
          totalIncome += tx.amount;
        }
      }

      return {
        ...acc,
        balance,
        totalIncome,
        totalExpense,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('getAccounts error:', error);
    return { success: false, data: [] };
  }
}

export async function createAccount(data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = AccountSchema.parse(data);
    const userId = await getUserId();

    if (validated.isDefault) {
      await db.update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(accounts.userId, userId));
    }

    const [created] = await db.insert(accounts).values({
      userId,
      ...validated,
    }).returning();

    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/savings');
    safeRevalidate('/reports');
    safeRevalidate('/admin');

    return { success: true, data: created };
  } catch (error: any) {
    console.error('createAccount error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal membuat dompet / rekening baru.' };
  }
}

export async function updateAccount(id: string, data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = AccountSchema.parse(data);
    const userId = await getUserId();

    if (validated.isDefault) {
      await db.update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(accounts.userId, userId));
    }

    await db.update(accounts)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/savings');
    safeRevalidate('/reports');
    safeRevalidate('/admin');

    return { success: true };
  } catch (error: any) {
    console.error('updateAccount error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data tidak valid.' };
    }
    return { success: false, error: 'Gagal memperbarui dompet / rekening.' };
  }
}

export async function deleteAccount(id: string) {
  try {
    await ensureAccountsTable();
    const userId = await getUserId();

    const acc = await db.query.accounts.findFirst({
      where: (a, { and: andFn, eq: eqFn }) => andFn(eqFn(a.id, id), eqFn(a.userId, userId)),
    });

    if (!acc) {
      return { success: false, error: 'Dompet tidak ditemukan.' };
    }

    if (acc.isDefault) {
      return { success: false, error: 'Dompet default utama tidak dapat dihapus. Jadikan dompet lain default terlebih dahulu.' };
    }

    await db.delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/savings');
    safeRevalidate('/reports');
    safeRevalidate('/admin');

    return { success: true };
  } catch (error) {
    console.error('deleteAccount error:', error);
    return { success: false, error: 'Gagal menghapus dompet.' };
  }
}

export async function transferBetweenAccounts(data: unknown) {
  try {
    await ensureAccountsTable();
    const validated = TransferSchema.parse(data);
    const userId = await getUserId();

    if (validated.fromAccountId === validated.toAccountId) {
      return { success: false, error: 'Dompet asal dan dompet tujuan tidak boleh sama.' };
    }

    const [fromAcc, toAcc] = await Promise.all([
      db.query.accounts.findFirst({
        where: (a, { and: andFn, eq: eqFn }) => andFn(eqFn(a.id, validated.fromAccountId), eqFn(a.userId, userId)),
      }),
      db.query.accounts.findFirst({
        where: (a, { and: andFn, eq: eqFn }) => andFn(eqFn(a.id, validated.toAccountId), eqFn(a.userId, userId)),
      }),
    ]);

    if (!fromAcc || !toAcc) {
      return { success: false, error: 'Dompet asal atau dompet tujuan tidak ditemukan.' };
    }

    // Determine intuitive transaction name
    let defaultTxName = `Transfer: ${fromAcc.name} → ${toAcc.name}`;
    if (fromAcc.type === 'bank' && toAcc.type === 'cash') {
      defaultTxName = `Tarik Tunai: ${fromAcc.name} → Tunai`;
    } else if (fromAcc.type === 'cash' && toAcc.type === 'bank') {
      defaultTxName = `Setor Tunai: Tunai → ${toAcc.name}`;
    }

    const txName = validated.name?.trim() || defaultTxName;

    // Insert inter-wallet transfer transaction
    const [tx] = await db.insert(transactions).values({
      userId,
      type: 'transfer',
      name: txName,
      amount: validated.amount,
      accountId: validated.fromAccountId,
      toAccountId: validated.toAccountId,
      transactionDate: validated.transactionDate,
      note: validated.note || txName,
    }).returning();

    safeRevalidate('/');
    safeRevalidate('/transactions');
    safeRevalidate('/budget');
    safeRevalidate('/reports');
    safeRevalidate('/admin');

    return { success: true, data: tx };
  } catch (error: any) {
    console.error('transferBetweenAccounts error:', error);
    if (error?.name === 'ZodError') {
      return { success: false, error: error.errors?.[0]?.message || 'Data transfer tidak valid.' };
    }
    return { success: false, error: 'Gagal melakukan transfer saldo.' };
  }
}
