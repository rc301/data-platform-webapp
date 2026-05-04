import { Routes } from '@angular/router';
import { capabilityGuard } from '../../core/guards/access.guard';

/**
 * Sub-rotas do Admin. O wrapper `AdminShellComponent` carrega o cabeçalho
 * + barra de tabs e oferece um <router-outlet> para a sub-rota ativa.
 *
 * Cada sub-rota tem sua capability mínima — o usuário só vê os tabs (e
 * acessa as URLs) cujas capabilities ele possui.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        canMatch: [capabilityGuard],
        data: { capability: ['admin.manageAccess', 'admin.manageOrg', 'admin.viewAudit'] },
        loadComponent: () => import('./pages/admin-overview.component').then(m => m.AdminOverviewComponent),
      },
      {
        path: 'policies',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.manageAccess' },
        loadComponent: () => import('./pages/admin-policies.component').then(m => m.AdminPoliciesComponent),
      },
      {
        path: 'org',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.manageOrg' },
        loadComponent: () => import('./pages/admin-org.component').then(m => m.AdminOrgComponent),
      },
      {
        path: 'subjects',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.manageOrg' },
        loadComponent: () => import('./pages/admin-subjects.component').then(m => m.AdminSubjectsComponent),
      },
      {
        path: 'stages',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.manageStages' },
        loadComponent: () => import('./pages/admin-stages.component').then(m => m.AdminStagesComponent),
      },
      {
        path: 'audit',
        canMatch: [capabilityGuard],
        data: { capability: 'admin.viewAudit' },
        loadComponent: () => import('./pages/admin-audit.component').then(m => m.AdminAuditComponent),
      },
    ],
  },
];
