import { Component, Input, OnChanges } from '@angular/core';
import { CheckIn, Habit } from '../../../core/models/habit.model';
import { hexToRgba } from '../../../core/utils/color.utils';
import { toISODate } from '../../../core/utils/date.utils';

interface HeatCell {
  date: string;
  level: 0 | 1 | 2 | 3; // 0=empty, 1=low, 2=mid, 3=full
  tooltip: string;
}

@Component({
  selector: 'app-heatmap',
  template: `
    <div class="overflow-x-auto">
      <div class="flex gap-0.5" style="min-width: max-content;">
        @for (week of weeks; track $index) {
          <div class="flex flex-col gap-0.5">
            @for (cell of week; track cell.date) {
              <div
                class="w-3 h-3 rounded-sm"
                [style.background-color]="cellColor(cell)"
                [title]="cell.tooltip"
              ></div>
            }
          </div>
        }
      </div>
    </div>
    <div class="flex items-center gap-2 mt-3 text-xs text-gray-400">
      <span>less</span>
      @for (level of [0,1,2,3]; track level) {
        <div
          class="w-3 h-3 rounded-sm"
          [style.background-color]="levelColor(level)"
        ></div>
      }
      <span>more</span>
    </div>
  `,
})
export class HeatmapComponent implements OnChanges {
  @Input({ required: true }) habit!: Habit;
  @Input({ required: true }) checkIns!: CheckIn[];

  weeks: HeatCell[][] = [];

  ngOnChanges(): void {
    this.buildGrid();
  }

  private buildGrid(): void {
    const today = new Date();
    const checkInMap = new Map(this.checkIns.map((c) => [c.date, c]));

    // Start from 90 days ago, aligned to Monday
    const start = new Date(today);
    start.setDate(start.getDate() - 89);
    const dayOfWeek = start.getDay() === 0 ? 7 : start.getDay();
    start.setDate(start.getDate() - (dayOfWeek - 1)); // align to Monday

    const cells: HeatCell[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const dateStr = toISODate(cursor);
      const checkIn = checkInMap.get(dateStr);
      cells.push({
        date: dateStr,
        level: this.computeLevel(checkIn),
        tooltip: this.buildTooltip(dateStr, checkIn),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Group by weeks (7 cells per column)
    this.weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.weeks.push(cells.slice(i, i + 7));
    }
  }

  private computeLevel(checkIn: CheckIn | undefined): 0 | 1 | 2 | 3 {
    if (!checkIn) return 0;
    if (this.habit.type === 'boolean') return 3;
    if (this.habit.type === 'rating') {
      const pct = (checkIn.value ?? 0) / 5;
      if (pct === 0) return 0;
      if (pct < 0.4) return 1;
      if (pct < 0.8) return 2;
      return 3;
    }
    // count / time
    const target = this.habit.target ?? 1;
    const pct = (checkIn.value ?? 0) / target;
    if (pct === 0) return 0;
    if (pct < 0.5) return 1;
    if (pct < 1) return 2;
    return 3;
  }

  private buildTooltip(date: string, checkIn: CheckIn | undefined): string {
    if (!checkIn) return date + ': not done';
    if (this.habit.type === 'boolean') return date + ': done ✓';
    const unit = this.habit.unit ?? (this.habit.type === 'time' ? 'min' : '');
    return `${date}: ${checkIn.value} ${unit}`;
  }

  cellColor(cell: HeatCell): string {
    return this.levelColor(cell.level);
  }

  levelColor(level: number): string {
    if (level === 0) return '#e5e7eb'; // gray-200
    const alphas = [0, 0.3, 0.6, 1];
    return hexToRgba(this.habit.color, alphas[level]);
  }
}
