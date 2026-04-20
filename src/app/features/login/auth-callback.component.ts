import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <p class="text-sm text-gray-500">signing you in…</p>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Supabase exchanges the token from the URL hash automatically
    const { data, error } = await this.supabase.client.auth.exchangeCodeForSession(
      window.location.href
    );
    if (error || !data.session) {
      this.router.navigate(['/login']);
    }
    // onAuthStateChange in AuthService handles redirect
  }
}
