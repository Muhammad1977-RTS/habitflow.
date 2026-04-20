import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Habit, CheckIn, GracePeriod, HabitWithStatus } from '../models/habit.model';
import { toISODate, getMondayOfWeek, getDayOfWeek } from '../utils/date.utils';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private supabase = inject(SupabaseService);

  readonly habits = signal<Habit[]>([]);
  readonly loading = signal(false);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async loadHabits(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('habits')
      .select('*')
      .is('archived_at', null)
      .order('sort_order');
    if (error) throw error;
    this.habits.set(data ?? []);
    this.loading.set(false);
  }

  async createHabit(payload: Omit<Habit, 'id' | 'user_id' | 'archived_at' | 'created_at'>): Promise<Habit> {
    const user = await this.supabase.getUser();
    const { data, error } = await this.supabase.client
      .from('habits')
      .insert({ ...payload, user_id: user!.id })
      .select()
      .single();
    if (error) throw error;
    this.habits.update((h) => [...h, data]);
    return data;
  }

  async updateHabit(id: string, patch: Partial<Habit>): Promise<void> {
    const { error } = await this.supabase.client
      .from('habits')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
    this.habits.update((h) => h.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async archiveHabit(id: string): Promise<void> {
    await this.updateHabit(id, { archived_at: new Date().toISOString() });
    this.habits.update((h) => h.filter((x) => x.id !== id));
  }

  async getHabitById(id: string): Promise<Habit | null> {
    const cached = this.habits().find((h) => h.id === id);
    if (cached) return cached;
    const { data } = await this.supabase.client.from('habits').select('*').eq('id', id).single();
    return data ?? null;
  }

  // ── CHECK-INS ─────────────────────────────────────────────────────────────

  async getCheckInsForRange(habitId: string, from: string, to: string): Promise<CheckIn[]> {
    const { data, error } = await this.supabase.client
      .from('check_ins')
      .select('*')
      .eq('habit_id', habitId)
      .gte('date', from)
      .lte('date', to)
      .order('date');
    if (error) throw error;
    return data ?? [];
  }

  async upsertCheckIn(habitId: string, date: string, value: number | null): Promise<CheckIn> {
    const user = await this.supabase.getUser();
    const { data, error } = await this.supabase.client
      .from('check_ins')
      .upsert({ habit_id: habitId, user_id: user!.id, date, value }, { onConflict: 'habit_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCheckIn(habitId: string, date: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('check_ins')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date);
    if (error) throw error;
  }

  // ── TODAY VIEW ────────────────────────────────────────────────────────────

  async getTodayHabits(): Promise<HabitWithStatus[]> {
    const today = toISODate(new Date());
    const dayOfWeek = getDayOfWeek(new Date()); // 1=Mon..7=Sun
    const weekStart = getMondayOfWeek(new Date());

    // Fetch all today's check-ins and grace periods in one go
    const [checkInsRes, graceRes] = await Promise.all([
      this.supabase.client.from('check_ins').select('*').eq('date', today),
      this.supabase.client.from('grace_periods').select('*').eq('week_start', weekStart),
    ]);

    const checkIns: CheckIn[] = checkInsRes.data ?? [];
    const graceMap = new Map<string, GracePeriod>(
      (graceRes.data ?? []).map((g: GracePeriod) => [g.habit_id, g])
    );

    // Filter habits scheduled for today
    const todayHabits = this.habits().filter((h) => this.isScheduledToday(h, dayOfWeek));

    // Compute streaks in batch (last 90 days)
    const ninetyDaysAgo = toISODate(new Date(Date.now() - 90 * 86400_000));
    const streakData = await this.computeStreaks(todayHabits.map((h) => h.id), ninetyDaysAgo, today);

    return todayHabits.map((h) => {
      const checkIn = checkIns.find((c) => c.habit_id === h.id) ?? null;
      const grace = graceMap.get(h.id);
      return {
        ...h,
        todayCheckIn: checkIn,
        completed: this.isCompleted(h, checkIn),
        currentStreak: streakData.get(h.id) ?? 0,
        graceUsedThisWeek: grace?.used ?? false,
        graceAvailable: !grace || !grace.used,
      };
    });
  }

  isScheduledToday(habit: Habit, dayOfWeek: number): boolean {
    switch (habit.freq_type) {
      case 'daily':
        return true;
      case 'weekdays':
        return (habit.freq_days ?? []).includes(dayOfWeek);
      case 'x_per_week':
        // For x_per_week we always show it; completion tracking differs
        return true;
    }
  }

  isCompleted(habit: Habit, checkIn: CheckIn | null): boolean {
    if (!checkIn) return false;
    if (habit.type === 'boolean') return true;
    if (habit.type === 'rating') return (checkIn.value ?? 0) > 0;
    // count / time: completed if value >= target
    return (checkIn.value ?? 0) >= (habit.target ?? 1);
  }

  // ── STREAK ───────────────────────────────────────────────────────────────

  private async computeStreaks(habitIds: string[], from: string, today: string): Promise<Map<string, number>> {
    if (habitIds.length === 0) return new Map();

    const { data } = await this.supabase.client
      .from('check_ins')
      .select('habit_id, date, value')
      .in('habit_id', habitIds)
      .gte('date', from)
      .lte('date', today)
      .order('date', { ascending: false });

    const byHabit = new Map<string, string[]>();
    for (const row of (data ?? [])) {
      if (!byHabit.has(row.habit_id)) byHabit.set(row.habit_id, []);
      byHabit.get(row.habit_id)!.push(row.date);
    }

    const result = new Map<string, number>();
    const habitMap = new Map(this.habits().map((h) => [h.id, h]));

    for (const id of habitIds) {
      const dates = new Set(byHabit.get(id) ?? []);
      const habit = habitMap.get(id);
      if (!habit) { result.set(id, 0); continue; }

      let streak = 0;
      const cursor = new Date(today);

      // Don't penalise if today not yet checked in
      if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);

      while (true) {
        const d = toISODate(cursor);
        if (d < from) break;
        const dayNum = getDayOfWeek(cursor);
        if (!this.isScheduledToday(habit, dayNum)) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        if (dates.has(d)) {
          streak++;
        } else {
          break;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      result.set(id, streak);
    }
    return result;
  }

  // ── GRACE PERIOD ──────────────────────────────────────────────────────────

  async consumeGrace(habitId: string): Promise<void> {
    const user = await this.supabase.getUser();
    const weekStart = getMondayOfWeek(new Date());
    await this.supabase.client
      .from('grace_periods')
      .upsert({ habit_id: habitId, user_id: user!.id, week_start: weekStart, used: true },
               { onConflict: 'habit_id,week_start' });
  }
}
