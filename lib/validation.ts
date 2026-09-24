import { z } from 'zod';

export const TransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  name: z.string().min(1, 'Nama harus diisi').max(255),
  categoryId: z.string().uuid('Kategori tidak valid'),
  amount: z.number().int().positive('Nominal harus lebih dari 0'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  note: z.string().max(1000).optional().nullable(),
});

export const BudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  amount: z.number().int().min(0),
});

export const DebtSchema = z.object({
  name: z.string().min(1).max(255),
  totalAmount: z.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'paid']),
});

export const InstallmentSchema = z.object({
  debtId: z.string().uuid(),
  installmentNumber: z.number().int().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().int().positive(),
  status: z.enum(['pending', 'paid']),
});

export const SavingsGoalSchema = z.object({
  name: z.string().min(1).max(255),
  targetAmount: z.number().int().positive(),
  currentAmount: z.number().int().min(0).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const SavingsTransactionSchema = z.object({
  savingsGoalId: z.string().uuid(),
  amount: z.number().int().positive(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(1000).optional().nullable(),
});

export const SettingsSchema = z.object({
  name: z.string().min(1).max(255),
  salary: z.number().int().min(0),
  salaryDate: z.number().int().min(1).max(31),
  rentBudget: z.number().int().min(0),
  foodBudget: z.number().int().min(0),
  entertainmentBudget: z.number().int().min(0),
  toiletries_budget: z.number().int().min(0),
  transportBudget: z.number().int().min(0),
  startWorkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  salaryProrateEnabled: z.boolean(),
  salaryProrateMethod: z.enum(['calendar_days', 'working_days']),
});

export const ExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  settings: z.any(),
  categories: z.array(z.any()),
  transactions: z.array(z.any()),
  budgets: z.array(z.any()),
  debts: z.array(z.any()),
  debtInstallments: z.array(z.any()),
  savingsGoals: z.array(z.any()),
  savingsTransactions: z.array(z.any()),
});
