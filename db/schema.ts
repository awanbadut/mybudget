import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  boolean,
  date,
  text,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  salary: bigint('salary', { mode: 'number' }).notNull().default(0),
  salaryDate: integer('salary_date').notNull().default(25),
  rentBudget: bigint('rent_budget', { mode: 'number' }).notNull().default(0),
  foodBudget: bigint('food_budget', { mode: 'number' }).notNull().default(0),
  entertainmentBudget: bigint('entertainment_budget', { mode: 'number' }).notNull().default(0),
  toiletries_budget: bigint('toiletries_budget', { mode: 'number' }).notNull().default(0),
  transportBudget: bigint('transport_budget', { mode: 'number' }).notNull().default(0),
  startWorkDate: date('start_work_date'),
  salaryProrateEnabled: boolean('salary_prorate_enabled').notNull().default(false),
  salaryProrateMethod: varchar('salary_prorate_method', { length: 50 }).notNull().default('calendar_days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'income' | 'expense'
  color: varchar('color', { length: 50 }),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  type: varchar('type', { length: 20 }).notNull(), // 'income' | 'expense'
  name: varchar('name', { length: 255 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  dateIdx: index('transactions_date_idx').on(table.transactionDate),
  userDateIdx: index('transactions_user_date_idx').on(table.userId, table.transactionDate),
  categoryIdx: index('transactions_category_idx').on(table.categoryId),
}));

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueConstraint: unique().on(table.userId, table.categoryId, table.month, table.year),
  userYearMonthIdx: index('budgets_user_year_month_idx').on(table.userId, table.year, table.month),
}));

export const debts = pgTable('debts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  totalAmount: bigint('total_amount', { mode: 'number' }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'paid'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('debts_user_id_idx').on(table.userId),
}));

export const debtInstallments = pgTable('debt_installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  debtId: uuid('debt_id').notNull().references(() => debts.id),
  installmentNumber: integer('installment_number').notNull(),
  dueDate: date('due_date').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'paid'
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  debtStatusIdx: index('debt_installments_debt_status_idx').on(table.debtId, table.status),
}));

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: bigint('target_amount', { mode: 'number' }).notNull(),
  currentAmount: bigint('current_amount', { mode: 'number' }).notNull().default(0),
  deadline: date('deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('savings_goals_user_id_idx').on(table.userId),
}));

export const savingsTransactions = pgTable('savings_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  savingsGoalId: uuid('savings_goal_id').notNull().references(() => savingsGoals.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  goalIdIdx: index('savings_transactions_goal_id_idx').on(table.savingsGoalId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(settings),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  debts: many(debts),
  savingsGoals: many(savingsGoals),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
  user: one(users, { fields: [debts.userId], references: [users.id] }),
  installments: many(debtInstallments),
}));

export const debtInstallmentsRelations = relations(debtInstallments, ({ one }) => ({
  debt: one(debts, { fields: [debtInstallments.debtId], references: [debts.id] }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user: one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  transactions: many(savingsTransactions),
}));

export const savingsTransactionsRelations = relations(savingsTransactions, ({ one }) => ({
  savingsGoal: one(savingsGoals, { fields: [savingsTransactions.savingsGoalId], references: [savingsGoals.id] }),
}));
