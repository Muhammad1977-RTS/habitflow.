/** Returns "YYYY-MM-DD" for a given Date */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns ISO day of week: 1=Monday … 7=Sunday */
export function getDayOfWeek(d: Date): number {
  const day = d.getDay(); // 0=Sun
  return day === 0 ? 7 : day;
}

/** Returns the Monday of the week containing d, as "YYYY-MM-DD" */
export function getMondayOfWeek(d: Date): string {
  const copy = new Date(d);
  const dayOfWeek = getDayOfWeek(copy);
  copy.setDate(copy.getDate() - (dayOfWeek - 1));
  return toISODate(copy);
}

/** Generates an array of the last N days as "YYYY-MM-DD" strings, oldest first */
export function lastNDays(n: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(toISODate(d));
  }
  return result;
}

/** Returns "YYYY-MM-DD" for today */
export function today(): string {
  return toISODate(new Date());
}

/** Short day label for display: "Mon", "Tue", etc. */
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
