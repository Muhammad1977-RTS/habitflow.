import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/login/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    canActivate: [authGuard],
  },
  {
    path: 'today',
    loadComponent: () => import('./features/today/today.component').then((m) => m.TodayComponent),
    canActivate: [authGuard],
  },
  {
    path: 'habit/new',
    loadComponent: () => import('./features/habit-form/habit-form.component').then((m) => m.HabitFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'habit/:id/edit',
    loadComponent: () => import('./features/habit-form/habit-form.component').then((m) => m.HabitFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'habit/:id',
    loadComponent: () => import('./features/habit-detail/habit-detail.component').then((m) => m.HabitDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'today' },
];
