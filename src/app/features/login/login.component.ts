import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

const COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div class="w-full max-w-app">
        <!-- Logo -->
        <div class="mb-10 text-center">
          <div class="text-3xl font-semibold tracking-tight text-gray-900">HabitFlow</div>
          <p class="mt-2 text-sm text-gray-500">build the life you want, one habit at a time</p>
        </div>

        @if (!sent()) {
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">email</label>
              <input
                id="email"
                type="email"
                class="input"
                placeholder="you@example.com"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
              />
            </div>
            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="loading()"
            >
              {{ loading() ? 'sending…' : 'send magic link' }}
            </button>
          </form>

          @if (error()) {
            <p class="mt-4 text-sm text-red-600 text-center">{{ error() }}</p>
          }
        } @else {
          <div class="text-center space-y-3">
            <div class="text-4xl">✉️</div>
            <h2 class="text-lg font-medium text-gray-900">check your email</h2>
            <p class="text-sm text-gray-500">
              we sent a magic link to <strong>{{ email }}</strong>.<br>
              click it to sign in — no password needed.
            </p>
            <button (click)="resend()" class="btn-primary text-sm mt-4" [disabled]="loading() || cooldown() > 0">
              @if (loading()) { sending… }
              @else if (cooldown() > 0) { resend in {{ cooldown() }}s }
              @else { resend link }
            </button>
            @if (error()) {
              <p class="mt-2 text-sm text-red-600 text-center">{{ error() }}</p>
            }
            <button (click)="sent.set(false); error.set('')" class="btn-ghost text-sm">
              use a different email
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class LoginComponent implements OnDestroy {
  private auth = inject(AuthService);

  email = '';
  sent = signal(false);
  loading = signal(false);
  error = signal('');
  cooldown = signal(0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startCooldown(): void {
    this.cooldown.set(COOLDOWN_SECONDS);
    this.cooldownTimer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(next);
      if (next <= 0) this.clearTimer();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  async resend(): Promise<void> {
    if (this.cooldown() > 0) return;
    this.sent.set(false);
    await this.submit();
  }

  async submit(): Promise<void> {
    if (!this.email.trim()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.sendMagicLink(this.email.trim());
      this.sent.set(true);
      this.clearTimer();
      this.startCooldown();
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.toLowerCase().includes('rate limit')) {
        this.error.set('too many requests — please wait a minute before trying again');
      } else {
        this.error.set(msg || 'something went wrong');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
