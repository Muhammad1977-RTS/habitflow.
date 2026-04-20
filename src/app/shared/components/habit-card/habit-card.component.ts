import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HabitWithStatus } from '../../../core/models/habit.model';
import { hexToRgba } from '../../../core/utils/color.utils';

@Component({
  selector: 'app-habit-card',
  imports: [FormsModule, RouterLink],
  template: `
    <div
      class="habit-card rounded-xl p-4 mb-3"
      [style.background-color]="cardBg()"
      (click)="onCardClick()"
    >
      <div class="flex items-center gap-3">
        <!-- Color dot + completion indicator -->
        <div
          class="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-400"
          [style.background-color]="habit.completed ? habit.color : '#d1d5db'"
        ></div>

        <!-- Name + meta -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="text-sm font-medium truncate"
              [class.text-gray-900]="!habit.completed"
              [class.line-through]="habit.completed"
              [class.text-gray-400]="habit.completed"
            >{{ habit.name }}</span>

            <!-- Grace warning -->
            @if (habit.graceUsedThisWeek && !habit.completed) {
              <span class="text-xs">⚠️</span>
            }
          </div>

          <!-- Streak -->
          @if (habit.currentStreak > 0) {
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-xs text-gray-400">
                🔥 {{ habit.currentStreak }}
                @if (habit.graceUsedThisWeek) { <span>⚠️</span> }
              </span>
              <!-- Grace life indicator -->
              <span class="text-xs ml-1">
                {{ habit.graceAvailable ? '♡' : '' }}
              </span>
            </div>
          }
        </div>

        <!-- Value input for count/time -->
        @if (habit.type === 'count' || habit.type === 'time') {
          <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
            <button
              class="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium active:bg-gray-200"
              (click)="decrement()"
            >−</button>
            <input
              type="number"
              class="w-14 text-center text-sm font-medium bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-400 py-0.5"
              [value]="currentValue()"
              (change)="onValueChange($event)"
              min="0"
            />
            <button
              class="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium active:bg-gray-200"
              (click)="increment()"
            >+</button>
            @if (habit.unit) {
              <span class="text-xs text-gray-400 ml-1">{{ habit.unit }}</span>
            }
            @if (habit.type === 'time') {
              <span class="text-xs text-gray-400 ml-1">min</span>
            }
          </div>
        }

        <!-- Rating (stars) -->
        @if (habit.type === 'rating') {
          <div class="flex gap-0.5" (click)="$event.stopPropagation()">
            @for (star of stars; track star) {
              <button
                class="text-lg leading-none transition-transform active:scale-125"
                (click)="setRating(star)"
              >{{ star <= currentValue() ? '★' : '☆' }}</button>
            }
          </div>
        }

        <!-- Detail arrow -->
        <a
          [routerLink]="['/habit', habit.id]"
          class="text-gray-300 hover:text-gray-500 flex-shrink-0 p-1"
          (click)="$event.stopPropagation()"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  `,
})
export class HabitCardComponent implements OnChanges {
  @Input({ required: true }) habit!: HabitWithStatus;
  @Output() toggleBoolean = new EventEmitter<void>();
  @Output() valueChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  currentValue = signal(0);

  ngOnChanges(): void {
    this.currentValue.set(this.habit.todayCheckIn?.value ?? 0);
  }

  cardBg(): string {
    return this.habit.completed
      ? hexToRgba(this.habit.color, 0.13)
      : 'var(--card-default)';
  }

  onCardClick(): void {
    if (this.habit.type === 'boolean') {
      this.toggleBoolean.emit();
    }
  }

  increment(): void {
    const next = this.currentValue() + 1;
    this.currentValue.set(next);
    this.valueChange.emit(next);
  }

  decrement(): void {
    const next = Math.max(0, this.currentValue() - 1);
    this.currentValue.set(next);
    this.valueChange.emit(next);
  }

  onValueChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.currentValue.set(val);
    this.valueChange.emit(val);
  }

  setRating(star: number): void {
    this.currentValue.set(star);
    this.valueChange.emit(star);
  }
}
