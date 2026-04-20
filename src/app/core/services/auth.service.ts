import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);

  constructor() {
    // Restore session on boot
    this.supabase.getUser().then((user) => {
      this.user.set(user);
      this.loading.set(false);
    });

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      this.loading.set(false);

      if (_event === 'SIGNED_IN') {
        const isNew = this.isNewUser(session?.user ?? null);
        this.router.navigate([isNew ? '/onboarding' : '/today']);
      }
      if (_event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  get isLoggedIn(): boolean {
    return !!this.user();
  }

  async sendMagicLink(email: string): Promise<void> {
    await this.supabase.signInWithMagicLink(email);
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
  }

  private isNewUser(user: User | null): boolean {
    if (!user) return false;
    const created = new Date(user.created_at).getTime();
    const now = Date.now();
    return now - created < 60_000; // created less than 60s ago
  }
}
