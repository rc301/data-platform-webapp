import { Routes } from '@angular/router';

/**
 * Sustentação. Wrapper `OpsShellComponent` carrega o cabeçalho fixo
 * e os tabs internos. Cada sub-rota é standalone, lazy-loaded.
 */
export const OPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./ops-shell.component').then(m => m.OpsShellComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./jobs-board/jobs-board.component').then(m => m.JobsBoardComponent),
      },
      {
        path: 'daily-progress',
        loadComponent: () => import('./daily-progress/daily-progress.component').then(m => m.DailyProgressComponent),
      },
    ],
  },
];
