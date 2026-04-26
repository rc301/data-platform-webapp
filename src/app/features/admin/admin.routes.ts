import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-console.component').then(m => m.AdminConsoleComponent),
  },
];
