import { Routes } from '@angular/router';

export const OPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./jobs-board/jobs-board.component').then(m => m.JobsBoardComponent),
  },
];
