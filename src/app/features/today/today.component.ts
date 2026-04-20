import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../core/services/habit.service';
import { HabitWithStatus } from '../../core/models/habit.model';
import { HabitCardComponent } from '../../shared/components/habit-card/habit-card.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { today } from '../../core/utils/date.utils';

@Component({
  selector: 'app-today',
  imports: [RouterLink, HabitCardComponent, BottomNavComponent],
  template: `
    <div class="min-h-screen bg-white pb-20">
      <div class="max-w-app mx-auto px-4 pt-10">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">{{ greeting() }}</h1>
            <p class="text-sm text-gray-400 mt-0.5">{{ todayLabel() }}</p>
          </div>
          <a routerLink="/habit/new"
            class="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl leading-none hover:bg-gray-700 transition-colors"
            aria-label="add habit"
          >+</a>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="space-y-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!loading() && habits().length === 0) {
          <div class="text-center py-16 space-y-3">
            <div class="text-4xl">🌱</div>
            <p class="text-gray-500 text-sm">no habits yet</p>
            <a routerLink="/habit/new" class="btn-primary inline-flex mt-2">add your first habit</a>
          </div>
        }

        <!-- Habit list -->
        @if (!loading() && habits().length > 0) {
          <div>
            <!-- Progress summary -->
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs text-gray-400">
                {{ completedCount() }} / {{ habits().length }} done
              </span>
              @if (completedCount() === habits().length && habits().length > 0) {
                <span class="text-xs text-green-600 font-medium">all done 🎉</span>
              }
            </div>

            @for (habit of habits(); track habit.id) {
              <app-habit-card
                [habit]="habit"
                (toggleBoolean)="toggleBoolean(habit)"
                (valueChange)="onValueChange(habit, $event)"
              />
            }
          </div>
        }
      </div>
    </div>
    <app-bottom-nav />
  `,
})
export class TodayComponent implements OnInit {
  private habitService = inject(HabitService);

  habits = signal<HabitWithStatus[]>([]);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.habitService.loadHabits();
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.habitService.getTodayHabits();
      this.habits.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'good morning';
    if (h < 18) return 'good afternoon';
    return 'good evening';
  }

  todayLabel(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  completedCount(): number {
    return this.habits().filter((h) => h.completed).length;
  }

  async toggleBoolean(habit: HabitWithStatus): Promise<void> {
    const date = today();
    if (habit.completed) {
      await this.habitService.deleteCheckIn(habit.id, date);
    } else {
      await this.habitService.upsertCheckIn(habit.id, date, null);
    }
    await this.reload();
  }

  // Debounced save for count/time/rating
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  onValueChange(habit: HabitWithStatus, value: number): void {
    clearTimeout(this.debounceTimers.get(habit.id));
    const timer = setTimeout(async () => {
      const date = today();
      if (value === 0) {
        await this.habitService.deleteCheckIn(habit.id, date);
      } else {
        await this.habitService.upsertCheckIn(habit.id, date, value);
      }
      await this.reload();
    }, 500);
    this.debounceTimers.set(habit.id, timer);
  }
}
