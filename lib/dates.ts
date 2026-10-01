import { format, parseISO, startOfMonth, endOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMMM yyyy', { locale: id });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy', { locale: id });
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: id });
}

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthDateRange(month: number, year: number): { startDate: string; endDate: string } {
  const d = new Date(year, month - 1, 1);
  const days = getDaysInMonth(d);
  const m = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${m}-01`,
    endDate: `${year}-${m}-${String(days).padStart(2, '0')}`,
  };
}

function createClampedDate(year: number, monthIndex: number, desiredDay: number): Date {
  const norm = new Date(year, monthIndex, 1);
  const y = norm.getFullYear();
  const m = norm.getMonth();
  const maxDays = new Date(y, m + 1, 0).getDate();
  const d = Math.min(Math.max(1, desiredDay), maxDays);
  return new Date(y, m, d);
}

export interface PayrollCycle {
  startDate: Date;
  endDate: Date;
  nextPayDate: Date;
  startDateStr: string;
  endDateStr: string;
  nextPayDateStr: string;
  totalDays: number;
  elapsedDays: number;
  daysRemaining: number;
  label: string;
}

export function getPayrollCycle(salaryDate: number = 25, refDate: Date = new Date()): PayrollCycle {
  const safeSalaryDate = Math.min(Math.max(1, salaryDate), 31);
  const currentDay = refDate.getDate();
  const currentMonth = refDate.getMonth();
  const currentYear = refDate.getFullYear();

  let startYear = currentYear;
  let startMonth = currentMonth;
  let nextYear = currentYear;
  let nextMonth = currentMonth + 1;

  if (safeSalaryDate <= 1) {
    // 1st of month: cycle starts on 1st of current month, next salary is 1st of next month
    startYear = currentYear;
    startMonth = currentMonth;
    nextYear = currentYear;
    nextMonth = currentMonth + 1;
  } else if (currentDay >= safeSalaryDate) {
    // Current cycle started on salaryDate this month, ends on day before next month's salaryDate
    startYear = currentYear;
    startMonth = currentMonth;
    nextYear = currentYear;
    nextMonth = currentMonth + 1;
  } else {
    // Current cycle started on salaryDate of previous month, ends on day before this month's salaryDate
    startYear = currentYear;
    startMonth = currentMonth - 1;
    nextYear = currentYear;
    nextMonth = currentMonth;
  }

  const startDate = createClampedDate(startYear, startMonth, safeSalaryDate);
  const nextPayDate = createClampedDate(nextYear, nextMonth, safeSalaryDate);
  const endDate = new Date(nextPayDate.getFullYear(), nextPayDate.getMonth(), nextPayDate.getDate() - 1);

  const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const nextMid = new Date(nextPayDate.getFullYear(), nextPayDate.getMonth(), nextPayDate.getDate());
  const refMid = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const totalDays = Math.max(1, Math.round((nextMid.getTime() - startMid.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((refMid.getTime() - startMid.getTime()) / (1000 * 60 * 60 * 24)) + 1));
  const daysRemaining = Math.max(0, Math.round((nextMid.getTime() - refMid.getTime()) / (1000 * 60 * 60 * 24)));

  const label = `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;

  return {
    startDate,
    endDate,
    nextPayDate,
    startDateStr: toDateString(startDate),
    endDateStr: toDateString(endDate),
    nextPayDateStr: toDateString(nextPayDate),
    totalDays,
    elapsedDays,
    daysRemaining,
    label,
  };
}

export function toJakartaDate(dateString: string): Date {
  // Parse date string as local date (Jakarta timezone context)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateProratedSalary(
  salary: number,
  startDate: string,
  method: 'calendar_days' | 'working_days'
): number {
  const start = parseISO(startDate);
  const year = start.getFullYear();
  const month = start.getMonth();
  const monthStart = startOfMonth(start);
  const monthEnd = endOfMonth(start);
  const daysInMonth = getDaysInMonth(start);

  if (method === 'calendar_days') {
    const startDay = start.getDate();
    const workedDays = daysInMonth - startDay + 1;
    return Math.round((salary / daysInMonth) * workedDays);
  } else {
    // Working days (Mon-Fri)
    let totalWorkingDays = 0;
    let workedWorkingDays = 0;
    const current = new Date(monthStart);
    while (current <= monthEnd) {
      const dayOfWeek = getDay(current);
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++;
        if (current >= start) {
          workedWorkingDays++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    if (totalWorkingDays === 0) return 0;
    return Math.round((salary / totalWorkingDays) * workedWorkingDays);
  }
}
