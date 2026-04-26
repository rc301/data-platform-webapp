import { Routes } from '@angular/router';

export const EXECUTIVE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./executive-overview/executive-overview.component').then(m => m.ExecutiveOverviewComponent),
  },
  {
    path: 'capacity',
    loadComponent: () => import('./capacity/capacity.component').then(m => m.CapacityComponent),
  },
];
