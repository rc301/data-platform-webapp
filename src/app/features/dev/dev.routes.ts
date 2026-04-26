import { Routes } from '@angular/router';

export const DEV_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dev-home/dev-home.component').then(m => m.DevHomeComponent),
  },
  {
    path: 'journeys/new',
    loadComponent: () => import('./pipeline-builder/pipeline-builder.component').then(m => m.PipelineBuilderComponent),
  },
  { path: 'new-pipeline', redirectTo: 'journeys/new', pathMatch: 'full' },
  {
    path: 'journeys',
    loadComponent: () => import('./journeys-list/journeys-list.component').then(m => m.JourneysListComponent),
  },
];
