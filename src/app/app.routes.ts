import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dev', pathMatch: 'full' },

      /* ===== Persona: Desenvolvedor ===== */
      {
        path: 'dev',
        loadChildren: () => import('./features/dev/dev.routes').then(m => m.DEV_ROUTES),
      },

      /* ===== Persona: Sustentação (Bombeiro) ===== */
      {
        path: 'ops',
        loadChildren: () => import('./features/ops/ops.routes').then(m => m.OPS_ROUTES),
      },

      /* ===== Persona: Gestão ===== */
      {
        path: 'executive',
        loadChildren: () => import('./features/executive/executive.routes').then(m => m.EXECUTIVE_ROUTES),
      },

      /* ===== Páginas transversais (usadas por mais de uma persona) ===== */
      { path: 'dashboard', redirectTo: 'dev', pathMatch: 'full' },
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
  { path: '**', redirectTo: 'dev' },
];
