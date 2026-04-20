import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

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

        <!-- Toggle -->
        <div class="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            type="button"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            [class.bg-white]="!isRegister()"
            [class.text-gray-900]="!isRegister()"
            [class.shadow-sm]="!isRegister()"
            [class.text-gray-500]="isRegister()"
            (click)="isRegister.set(false); error.set('')"
          >sign in</button>
          <button
            type="button"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            [class.bg-white]="isRegister()"
            [class.text-gray-900]="isRegister()"
            [class.shadow-sm]="isRegister()"
            [class.text-gray-500]="!isRegister()"
            (click)="isRegister.set(true); error.set('')"
          >create account</button>
        </div>

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
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">password</label>
            <input
              id="password"
              type="password"
              class="input"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="{{ isRegister() ? 'new-password' : 'current-password' }}"
            />
          </div>
          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="loading()"
          >
            @if (loading()) { loading… }
            @else if (isRegister()) { create account }
            @else { sign in }
          </button>
        </form>

        @if (error()) {
          <p class="mt-4 text-sm text-red-600 text-center">{{ error() }}</p>
        }

        @if (success()) {
          <p class="mt-4 text-sm text-green-600 text-center">{{ success() }}</p>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);

  email = '';
  password = '';
  isRegister = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal('');

  async submit(): Promise<void> {
    if (!this.email.trim() || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    try {
      if (this.isRegister()) {
        await this.auth.signUp(this.email.trim(), this.password);
        this.success.set('account created — check your email to confirm, then sign in');
        this.isRegister.set(false);
        this.password = '';
      } else {
        await this.auth.signIn(this.email.trim(), this.password);
      }
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.toLowerCase().includes('invalid login')) {
        this.error.set('incorrect email or password');
      } else if (msg.toLowerCase().includes('already registered')) {
        this.error.set('this email is already registered — try signing in');
      } else {
        this.error.set(msg || 'something went wrong');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
