import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HabitService } from '../../core/services/habit.service';
import { Habit, CheckIn } from '../../core/models/habit.model';
import { HeatmapComponent } from '../../shared/components/heatmap/heatmap.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { toISODate, lastNDays } from '../../core/utils/date.utils';

@Component({
  selector: 'app-habit-detail',
  imports: [RouterLink, HeatmapComponent, BottomNavComponent],
  template: `
    <div class="min-h-screen bg-white pb-20">
      <div class="max-w-app mx-auto px-4 pt-6 pb-10">

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <a routerLink="/today" class="text-gray-400 hover:text-gray-700 p-1 -ml-1">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            @if (habit()) {
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" [style.background-color]="habit()!.color"></div>
                <h1 class="text-lg font-semibold text-gray-900">{{ habit()!.name }}</h1>
              </div>
            }
          </div>
          @if (habit()) {
            <a [routerLink]="['/habit', habit()!.id, 'edit']"
              class="text-sm text-gray-400 hover:text-gray-700 transition-colors">edit</a>
          }
        </div>

        @if (loading()) {
          <div class="space-y-4">
            <div class="h-20 rounded-xl bg-gray-100 animate-pulse"></div>
            <div class="h-32 rounded-xl bg-gray-100 animate-pulse"></div>
          </div>
        }

        @if (!loading() && habit()) {
          <!-- Streak card -->
          <div class="rounded-xl bg-gray-50 p-5 mb-6 flex items-center justify-between">
            <div>
              <div class="text-3xl font-bold text-gray-900">🔥 {{ streak() }}</div>
              <div class="text-xs text-gray-500 mt-1">current streak</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-semibold text-gray-900">{{ completionRate() }}%</div>
              <div class="text-xs text-gray-500 mt-1">last 30 days</div>
            </div>
          </div>

          <!-- Heatmap -->
          <div class="mb-6">
            <h2 class="text-sm font-medium text-gray-700 mb-3">last 3 months</h2>
            <app-heatmap [habit]="habit()!" [checkIns]="checkIns()" />
          </div>
        }
      </div>
    </div>
    <app-bottom-nav />
  `,
})
export class HabitDetailComponent implements OnInit {
  private habitService = inject(HabitService);
  private route = inject(ActivatedRoute);

  habit = signal<Habit | null>(null);
  checkIns = signal<CheckIn[]>([]);
  streak = signal(0);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    await this.habitService.loadHabits();
    const h = await this.habitService.getHabitById(id);
    this.habit.set(h);

    if (h) {
      const today = toISODate(new Date());
      const from = toISODate(new Date(Date.now() - 90 * 86400_000));
      const cis = await this.habitService.getCheckInsForRange(id, from, today);
      this.checkIns.set(cis);

      // Get streak from today's list if loaded, otherwise compute roughly
      const todayHabits = await this.habitService.getTodayHabits();
      const found = todayHabits.find((x) => x.id === id);
      this.streak.set(found?.currentStreak ?? 0);
    }
    this.loading.set(false);
  }

  completionRate(): number {
    const days = lastNDays(30);
    if (!this.habit()) return 0;
    const scheduled = days.filter((d) => {
      const dow = new Date(d).getDay() === 0 ? 7 : new Date(d).getDay();
      return this.habitService.isScheduledToday(this.habit()!, dow);
    });
    if (scheduled.length === 0) return 0;
    const done = scheduled.filter((d) => this.checkIns().some((c) => c.date === d)).length;
    return Math.round((done / scheduled.length) * 100);
  }
}
