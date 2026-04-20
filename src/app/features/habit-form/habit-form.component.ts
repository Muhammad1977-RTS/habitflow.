import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HabitService } from '../../core/services/habit.service';
import { Habit, HabitType, FreqType, HABIT_COLORS } from '../../core/models/habit.model';

@Component({
  selector: 'app-habit-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-white">
      <div class="max-w-app mx-auto px-4 pt-6 pb-10">

        <!-- Header -->
        <div class="flex items-center gap-3 mb-8">
          <a routerLink="/today" class="text-gray-400 hover:text-gray-700 p-1 -ml-1">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">
            {{ isEdit() ? 'edit habit' : 'new habit' }}
          </h1>
        </div>

        <form (ngSubmit)="save()" class="space-y-6">

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">name</label>
            <input type="text" class="input" [(ngModel)]="form.name" name="name"
              placeholder="e.g. meditate, drink water" maxlength="60" required />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">type</label>
            <div class="grid grid-cols-2 gap-2">
              @for (t of types; track t.value) {
                <button
                  type="button"
                  class="px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left"
                  [class.border-gray-900]="form.type === t.value"
                  [class.bg-gray-50]="form.type === t.value"
                  [class.border-gray-200]="form.type !== t.value"
                  [class.text-gray-500]="form.type !== t.value"
                  (click)="form.type = t.value"
                >
                  {{ t.emoji }} {{ t.label }}
                </button>
              }
            </div>
          </div>

          <!-- Target (count / time) -->
          @if (form.type === 'count' || form.type === 'time') {
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">target</label>
                <input type="number" class="input" [(ngModel)]="form.target" name="target"
                  min="1" placeholder="{{ form.type === 'time' ? '30' : '8' }}" />
              </div>
              @if (form.type === 'count') {
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">unit</label>
                  <input type="text" class="input" [(ngModel)]="form.unit" name="unit"
                    placeholder="glasses, steps…" maxlength="20" />
                </div>
              }
              @if (form.type === 'time') {
                <div class="flex-1 flex items-end pb-2.5">
                  <span class="text-sm text-gray-500">minutes</span>
                </div>
              }
            </div>
          }

          <!-- Frequency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">frequency</label>
            <div class="space-y-2">
              @for (f of freqTypes; track f.value) {
                <button
                  type="button"
                  class="w-full px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left"
                  [class.border-gray-900]="form.freq_type === f.value"
                  [class.bg-gray-50]="form.freq_type === f.value"
                  [class.border-gray-200]="form.freq_type !== f.value"
                  [class.text-gray-500]="form.freq_type !== f.value"
                  (click)="form.freq_type = f.value"
                >{{ f.label }}</button>
              }
            </div>

            @if (form.freq_type === 'weekdays') {
              <div class="flex gap-1.5 mt-3 flex-wrap">
                @for (day of dayLabels; track $index) {
                  <button
                    type="button"
                    class="w-9 h-9 rounded-full text-xs font-medium border transition-colors"
                    [class.bg-gray-900]="isDaySelected($index + 1)"
                    [class.text-white]="isDaySelected($index + 1)"
                    [class.border-gray-900]="isDaySelected($index + 1)"
                    [class.border-gray-200]="!isDaySelected($index + 1)"
                    [class.text-gray-500]="!isDaySelected($index + 1)"
                    (click)="toggleDay($index + 1)"
                  >{{ day }}</button>
                }
              </div>
            }

            @if (form.freq_type === 'x_per_week') {
              <div class="flex items-center gap-3 mt-3">
                <span class="text-sm text-gray-600">times per week:</span>
                <div class="flex items-center gap-2">
                  <button type="button"
                    class="w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-sm flex items-center justify-center"
                    (click)="form.freq_x = Math.max(1, form.freq_x - 1)">−</button>
                  <span class="text-sm font-medium w-4 text-center">{{ form.freq_x }}</span>
                  <button type="button"
                    class="w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-sm flex items-center justify-center"
                    (click)="form.freq_x = Math.min(7, form.freq_x + 1)">+</button>
                </div>
              </div>
            }
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">color</label>
            <div class="flex flex-wrap gap-2">
              @for (c of colors; track c) {
                <button
                  type="button"
                  class="w-8 h-8 rounded-full transition-transform"
                  [class.scale-125]="form.color === c"
                  [class.ring-2]="form.color === c"
                  [class.ring-offset-2]="form.color === c"
                  [class.ring-gray-900]="form.color === c"
                  [style.background-color]="c"
                  (click)="form.color = c"
                ></button>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary flex-1" [disabled]="saving()">
              {{ saving() ? 'saving…' : (isEdit() ? 'save changes' : 'create habit') }}
            </button>
          </div>

          @if (isEdit()) {
            <button
              type="button"
              class="w-full text-sm text-red-500 hover:text-red-700 py-2 transition-colors"
              (click)="archive()"
            >archive this habit</button>
          }

          @if (error()) {
            <p class="text-sm text-red-600 text-center">{{ error() }}</p>
          }
        </form>
      </div>
    </div>
  `,
})
export class HabitFormComponent implements OnInit {
  private habitService = inject(HabitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  Math = Math;
  colors = HABIT_COLORS;
  saving = signal(false);
  error = signal('');
  isEdit = signal(false);
  private habitId = '';

  form: {
    name: string;
    type: HabitType;
    color: string;
    target: number | null;
    unit: string | null;
    freq_type: FreqType;
    freq_days: number[];
    freq_x: number;
    sort_order: number;
  } = {
    name: '',
    type: 'boolean',
    color: HABIT_COLORS[0],
    target: null,
    unit: null,
    freq_type: 'daily',
    freq_days: [],
    freq_x: 3,
    sort_order: 0,
  };

  types = [
    { value: 'boolean' as HabitType, emoji: '✅', label: 'yes / no' },
    { value: 'count' as HabitType, emoji: '🔢', label: 'count' },
    { value: 'time' as HabitType, emoji: '⏱', label: 'time' },
    { value: 'rating' as HabitType, emoji: '⭐', label: 'rating' },
  ];

  freqTypes = [
    { value: 'daily' as FreqType, label: 'every day' },
    { value: 'weekdays' as FreqType, label: 'specific days of the week' },
    { value: 'x_per_week' as FreqType, label: 'x times per week' },
  ];

  dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.habitId = id;
      await this.habitService.loadHabits();
      const habit = await this.habitService.getHabitById(id);
      if (habit) this.populateForm(habit);
    }
  }

  private populateForm(h: Habit): void {
    this.form.name = h.name;
    this.form.type = h.type;
    this.form.color = h.color;
    this.form.target = h.target;
    this.form.unit = h.unit;
    this.form.freq_type = h.freq_type;
    this.form.freq_days = h.freq_days ?? [];
    this.form.freq_x = h.freq_x ?? 3;
    this.form.sort_order = h.sort_order;
  }

  isDaySelected(day: number): boolean {
    return this.form.freq_days.includes(day);
  }

  toggleDay(day: number): void {
    const idx = this.form.freq_days.indexOf(day);
    if (idx > -1) this.form.freq_days.splice(idx, 1);
    else this.form.freq_days.push(day);
  }

  async save(): Promise<void> {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const payload = {
        name: this.form.name.trim(),
        type: this.form.type,
        color: this.form.color,
        target: this.form.target,
        unit: this.form.unit,
        freq_type: this.form.freq_type,
        freq_days: this.form.freq_type === 'weekdays' ? this.form.freq_days : null,
        freq_x: this.form.freq_type === 'x_per_week' ? this.form.freq_x : null,
        sort_order: this.form.sort_order,
      };
      if (this.isEdit()) {
        await this.habitService.updateHabit(this.habitId, payload);
      } else {
        await this.habitService.createHabit(payload);
      }
      this.router.navigate(['/today']);
    } catch (e: any) {
      this.error.set(e.message ?? 'failed to save');
    } finally {
      this.saving.set(false);
    }
  }

  async archive(): Promise<void> {
    if (!confirm('archive this habit? your check-in history is preserved.')) return;
    await this.habitService.archiveHabit(this.habitId);
    this.router.navigate(['/today']);
  }
}
