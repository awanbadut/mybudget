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
