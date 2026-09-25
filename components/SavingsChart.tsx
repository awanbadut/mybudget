import { db } from '@/db';
import { savingsTransactions, savingsGoals } from '@/db/schema';
import { SavingsChartClient } from './SavingsChartClient';
import { getMonthDateRange } from '@/lib/dates';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface SavingsChartProps {
  userId: string;
}

export async function SavingsChart({ userId }: SavingsChartProps) {
  // Build last 6 months
  const currentYear = 2026;
  const currentMonth = 9; // September
  
  const months: { month: number; year: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) { m += 12; y -= 1; }
    months.push({ month: m, year: y, label: MONTH_NAMES[m - 1] });
  }

  // Get all savings transactions safely
  let allGoals: any[] = [];
  try {
    allGoals = await db.query.savingsGoals.findMany({
      where: (g, { eq: eqFn }) => eqFn(g.userId, userId),
      with: { transactions: true },
    });
  } catch (err) {
    console.error('SavingsChart error:', err);
  }

  // Build cumulative savings per month
  let cumulative = 0;
  const chartData = months.map(({ month, year, label }) => {
    const { startDate, endDate } = getMonthDateRange(month, year);
    
    const monthSavings = allGoals.flatMap(g => g.transactions || [])
      .filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate)
      .reduce((sum, t) => sum + t.amount, 0);
    
    cumulative += monthSavings;
    return { label, amount: cumulative, monthly: monthSavings };
  });

  return <SavingsChartClient data={chartData} />;
}
