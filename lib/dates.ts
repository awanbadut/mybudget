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

export interface PayrollCycle {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
  elapsedDays: number;
  daysRemaining: number;
  label: string;
}

export function getPayrollCycle(salaryDate: number = 25, refDate: Date = new Date()): PayrollCycle {
  const currentDay = refDate.getDate();
  const currentMonth = refDate.getMonth();
  const currentYear = refDate.getFullYear();

  let startDate: Date;
  let endDate: Date;

  if (salaryDate <= 1) {
    // 1st of month to end of month
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 0);
  } else if (currentDay >= salaryDate) {
    // Current cycle started on salaryDate this month, ends on salaryDate of next month
    startDate = new Date(currentYear, currentMonth, salaryDate);
    endDate = new Date(currentYear, currentMonth + 1, salaryDate);
  } else {
    // Current cycle started on salaryDate of previous month, ends on salaryDate of this month
    startDate = new Date(currentYear, currentMonth - 1, salaryDate);
    endDate = new Date(currentYear, currentMonth, salaryDate);
  }

  const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endMid = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const refMid = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const totalDays = Math.round((endMid.getTime() - startMid.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(1, Math.round((refMid.getTime() - startMid.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(0, Math.round((endMid.getTime() - refMid.getTime()) / (1000 * 60 * 60 * 24)));

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const label = `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;

  return {
    startDate,
    endDate,
    startDateStr: formatDateStr(startDate),
    endDateStr: formatDateStr(endDate),
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
