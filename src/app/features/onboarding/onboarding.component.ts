import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-onboarding',
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div class="w-full max-w-app">
        <!-- Slide -->
        <div class="text-center space-y-4 mb-12">
          <div class="text-6xl">{{ slides[current()].emoji }}</div>
          <h2 class="text-2xl font-semibold tracking-tight text-gray-900">
            {{ slides[current()].title }}
          </h2>
          <p class="text-gray-500 text-sm leading-relaxed">{{ slides[current()].body }}</p>
        </div>

        <!-- Dots -->
        <div class="flex justify-center gap-2 mb-10">
          @for (s of slides; track $index) {
            <div
              class="h-1.5 rounded-full transition-all duration-300"
              [class.w-6]="$index === current()"
              [class.w-1.5]="$index !== current()"
              [class.bg-gray-900]="$index === current()"
              [class.bg-gray-200]="$index !== current()"
            ></div>
          }
        </div>

        <!-- Actions -->
        @if (current() < slides.length - 1) {
          <button class="btn-primary w-full" (click)="next()">next</button>
          <button class="btn-ghost w-full mt-2 text-sm" (click)="skip()">skip</button>
        } @else {
          <button class="btn-primary w-full" (click)="done()">create my first habit →</button>
        }
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private router = inject(Router);

  current = signal(0);

  slides: Slide[] = [
    {
      emoji: '🌱',
      title: 'small habits, big change',
      body: 'HabitFlow helps you build routines without the noise. Add habits, check them off, watch your streaks grow.',
    },
    {
      emoji: '✅',
      title: 'one tap is all it takes',
      body: 'open the app, tap your habit, done. the card lights up so you know it worked. that\'s the whole flow.',
    },
    {
      emoji: '🔥',
      title: 'keep the chain going',
      body: 'every day you complete your habits, your streak grows. miss a day? you get one free pass per week — because life happens.',
    },
  ];

  next(): void {
    this.current.update((v) => v + 1);
  }

  skip(): void {
    this.done();
  }

  done(): void {
    localStorage.setItem('hf:onboarding_done', '1');
    this.router.navigate(['/habit/new']);
  }
}
