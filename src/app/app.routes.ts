import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'pipelines',
        loadChildren: () => import('./features/pipelines/pipelines.routes').then(m => m.PIPELINES_ROUTES),
      },
      {
        path: 'data-quality',
        loadChildren: () => import('./features/data-quality/data-quality.routes').then(m => m.DATA_QUALITY_ROUTES),
      },
      {
        path: 'catalog',
        loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
      {
        path: 'infrastructure',
        loadChildren: () => import('./features/infrastructure/infrastructure.routes').then(m => m.INFRASTRUCTURE_ROUTES),
      },
      {
        path: 'monitoring',
        loadChildren: () => import('./features/monitoring/monitoring.routes').then(m => m.MONITORING_ROUTES),
      },
      {
        path: 'lineage',
        loadChildren: () => import('./features/lineage/lineage.routes').then(m => m.LINEAGE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
