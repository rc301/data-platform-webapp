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
        path: 'rfcs',
        redirectTo: 'demands',
        pathMatch: 'full',
      },
      {
        path: 'demands',
        canMatch: [capabilityGuard],
        // PublicViewer acessa via demand.viewOwn; demais perfis via dev.viewProjects.
        data: { capability: ['demand.viewOwn', 'dev.viewProjects'] },
        loadComponent: () => import('./features/rfc/rfc-list.component').then(m => m.RfcListComponent),
      },
      {
        path: 'projects',
        canMatch: [capabilityGuard],
        data: { capability: 'dev.viewProjects' },
        loadComponent: () => import('./features/projects/projects-history.component').then(m => m.ProjectsHistoryComponent),
      },
      {
        path: 'lups',
        canMatch: [capabilityGuard],
        data: { capability: 'dev.viewProjects' },
        loadComponent: () => import('./features/lups/lup-registry.component').then(m => m.LupRegistryComponent),
      },
      {
        path: 'term-abbreviations',
        canMatch: [capabilityGuard],
        data: { capability: 'catalog.viewBasic' },
        loadComponent: () => import('./features/terms/term-abbreviation.component').then(m => m.TermAbbreviationComponent),
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
        path: 'orchestrator',
        loadChildren: () => import('./features/orchestrator/orchestrator.routes').then(m => m.ORCHESTRATOR_ROUTES),
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
        // Qualquer capability administrativa abre a área. Sub-rotas têm seus
        // próprios guards (admin.manageAccess / admin.manageOrg /
        // admin.manageStages / admin.viewAudit).
        data: { capability: ['admin.manageAccess', 'admin.manageOrg', 'admin.manageStages', 'admin.viewAudit'] },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dev' },
];
