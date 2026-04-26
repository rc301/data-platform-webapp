import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { capabilityGuard } from './core/guards/access.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dev', pathMatch: 'full' },

      /* ===== Persona: Desenvolvedor ===== */
      {
        path: 'dev',
        canMatch: [capabilityGuard],
        data: { capability: 'dev.viewProjects' },
        loadChildren: () => import('./features/dev/dev.routes').then(m => m.DEV_ROUTES),
      },

      /* ===== Persona: Sustentação (Bombeiro) ===== */
      {
        path: 'ops',
        canMatch: [capabilityGuard],
        data: { capability: 'ops.viewBoard' },
        loadChildren: () => import('./features/ops/ops.routes').then(m => m.OPS_ROUTES),
      },

      /* ===== Persona: Gestão ===== */
      {
        path: 'executive',
        canMatch: [capabilityGuard],
        data: { capability: 'executive.viewOwnScope' },
        loadChildren: () => import('./features/executive/executive.routes').then(m => m.EXECUTIVE_ROUTES),
      },

      /* ===== Páginas transversais (usadas por mais de uma persona) ===== */
      { path: 'dashboard', redirectTo: 'dev', pathMatch: 'full' },
      {
        path: 'pipelines',
        canMatch: [capabilityGuard],
        data: { capability: 'pipeline.view' },
        loadChildren: () => import('./features/pipelines/pipelines.routes').then(m => m.PIPELINES_ROUTES),
      },
      {
        path: 'data-quality',
        canMatch: [capabilityGuard],
        data: { capability: 'dataQuality.view' },
        loadChildren: () => import('./features/data-quality/data-quality.routes').then(m => m.DATA_QUALITY_ROUTES),
      },
      {
        path: 'catalog',
        canMatch: [capabilityGuard],
        data: { capability: 'catalog.viewBasic' },
        loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
      {
        path: 'infrastructure',
        canMatch: [capabilityGuard],
        data: { capability: 'ops.viewBoard' },
        loadChildren: () => import('./features/infrastructure/infrastructure.routes').then(m => m.INFRASTRUCTURE_ROUTES),
      },
      {
        path: 'monitoring',
        canMatch: [capabilityGuard],
        data: { capability: 'ops.viewBoard' },
        loadChildren: () => import('./features/monitoring/monitoring.routes').then(m => m.MONITORING_ROUTES),
      },
      {
        path: 'lineage',
        canMatch: [capabilityGuard],
        data: { capability: 'lineage.view' },
        loadChildren: () => import('./features/lineage/lineage.routes').then(m => m.LINEAGE_ROUTES),
      },
      {
        path: 'admin',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.manageAccess' },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dev' },
];
