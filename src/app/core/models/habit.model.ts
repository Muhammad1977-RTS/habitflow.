export type HabitType = 'boolean' | 'count' | 'time' | 'rating';
export type FreqType = 'daily' | 'weekdays' | 'x_per_week';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  color: string;         // hex, e.g. "#6366f1"
  target: number | null; // null for boolean; minutes for time; max for count
  unit: string | null;   // "glasses", "steps", etc.
  freq_type: FreqType;
  freq_days: number[] | null;  // [1..7], 1=Mon; for weekdays type
  freq_x: number | null;       // for x_per_week type
  sort_order: number;
  archived_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;          // YYYY-MM-DD
  value: number | null;  // null for boolean; number for count/time/rating
  created_at: string;
}

export interface GracePeriod {
  id: string;
  habit_id: string;
  user_id: string;
  week_start: string;   // YYYY-MM-DD (Monday)
  used: boolean;
  created_at: string;
}

// Derived / view model used in the Today screen
export interface HabitWithStatus extends Habit {
  todayCheckIn: CheckIn | null;
  completed: boolean;
  currentStreak: number;
  graceUsedThisWeek: boolean;
  graceAvailable: boolean;
}

export const HABIT_COLORS: string[] = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#84cc16', // lime
];
