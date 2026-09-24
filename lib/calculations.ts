export function calculateSavingRate(income: number, savings: number): number {
  if (income === 0) return 0;
  return Math.round((savings / income) * 100);
}

export function calculateBalance(income: number, expense: number): number {
  return income - expense;
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getBudgetColor(percentage: number): string {
  if (percentage < 70) return 'bg-green-500';
  if (percentage <= 90) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getBudgetStatus(percentage: number): 'safe' | 'warning' | 'danger' {
  if (percentage < 70) return 'safe';
  if (percentage <= 90) return 'warning';
  return 'danger';
}
