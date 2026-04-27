import { format, isSameDay, isSameMonth, isToday, isWeekend, startOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DayOfWeek_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;
export const DayOfWeek_FULL_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDayNames(length: 'short' | 'long'): string[] {
  if (length === 'long') return [...DayOfWeek_FULL_VI];
  return [...DayOfWeek_VI];
}

export function getMonthName(date: Date, length: 'short' | 'long' = 'short'): string {
  if (length === 'long') {
    return format(date, 'MMMM', { locale: vi });
  }
  return format(date, 'MMM', { locale: vi });
}

export function getMonthDays(month: Date): (Date | null)[][] {
  const start = startOfMonth(month);
  const firstDayOfWeek = start.getDay() as DayOfWeek;
  const weeks: (Date | null)[][] = [];
  let current = new Date(start);

  const firstWeek: (Date | null)[] = Array(firstDayOfWeek).fill(null);
  for (let i = firstDayOfWeek; i < 7; i++) {
    firstWeek.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  weeks.push(firstWeek);

  while (current.getMonth() === month.getMonth()) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (current.getMonth() !== month.getMonth()) {
        week.push(null);
      } else {
        week.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export { isSameDay, isSameMonth, isToday, isWeekend, startOfMonth };
