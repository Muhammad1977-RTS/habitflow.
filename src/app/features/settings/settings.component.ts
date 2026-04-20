import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, BottomNavComponent],
  template: `
    <div class="min-h-screen bg-white pb-20">
      <div class="max-w-app mx-auto px-4 pt-10 pb-10">
        <h1 class="text-xl font-semibold text-gray-900 mb-8">settings</h1>

        <!-- Notifications -->
        <section class="mb-8">
          <h2 class="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">notifications</h2>
          <div class="rounded-xl bg-gray-50 divide-y divide-gray-100">
            <div class="flex items-center justify-between px-4 py-3.5">
              <div>
                <div class="text-sm font-medium text-gray-900">daily reminder</div>
                <div class="text-xs text-gray-500 mt-0.5">get a nudge if you haven't checked in</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="notifEnabled" (change)="onNotifToggle()" />
                <div class="w-10 h-6 bg-gray-200 peer-checked:bg-gray-900 rounded-full peer transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </label>
            </div>
            @if (notifEnabled) {
              <div class="flex items-center justify-between px-4 py-3.5">
                <span class="text-sm text-gray-700">remind me at</span>
                <input
                  type="time"
                  class="text-sm font-medium text-gray-900 bg-transparent focus:outline-none"
                  [(ngModel)]="notifTime"
                  (change)="saveNotifTime()"
                />
              </div>
            }
          </div>
        </section>

        <!-- Account -->
        <section class="mb-8">
          <h2 class="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">account</h2>
          <div class="rounded-xl bg-gray-50 divide-y divide-gray-100">
            <div class="px-4 py-3.5">
              <div class="text-xs text-gray-500">signed in as</div>
              <div class="text-sm font-medium text-gray-900 mt-0.5">{{ userEmail() }}</div>
            </div>
            <button
              class="w-full text-left px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-b-xl"
              (click)="signOut()"
            >sign out</button>
          </div>
        </section>

        <!-- App info -->
        <p class="text-xs text-gray-300 text-center">HabitFlow v0.1</p>
      </div>
    </div>
    <app-bottom-nav />
  `,
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  notifEnabled = false;
  notifTime = '20:00';

  userEmail = signal('');

  ngOnInit(): void {
    const u = this.auth.user();
    this.userEmail.set(u?.email ?? '');
    this.notifEnabled = localStorage.getItem('hf:notif_enabled') === '1';
    this.notifTime = localStorage.getItem('hf:notif_time') ?? '20:00';
  }

  onNotifToggle(): void {
    localStorage.setItem('hf:notif_enabled', this.notifEnabled ? '1' : '0');
    if (this.notifEnabled) this.requestPermission();
  }

  saveNotifTime(): void {
    localStorage.setItem('hf:notif_time', this.notifTime);
  }

  private async requestPermission(): Promise<void> {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
