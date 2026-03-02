import { format } from 'date-fns';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const toSafeDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  if (DATE_ONLY_REGEX.test(value)) {
    // Keep date-only values anchored in local time to avoid timezone boundary shifts.
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
};

export const toYearMonthKey = (value: string | Date): string => {
  return format(toSafeDate(value), 'yyyy-MM');
};
