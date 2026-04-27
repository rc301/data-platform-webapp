import { Routes } from '@angular/router';
import { capabilityGuard } from '../../core/guards/access.guard';

/**
 * Orquestrador é uma área coesa com 4 visões. Cada sub-rota é um
 * componente standalone, lazy-loaded.
 *
 * Cap mínima `ops.viewBoard`: quem opera/sustenta vê tudo. CRUD de
 * sensors e bindings exige ações na tela mas a navegação inicial não
 * depende de uma capability adicional — será refinado quando
 * `pipeline.manageRegistry` se tornar pré-requisito de escrita real.
 */
export const ORCHESTRATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./orchestrator-shell.component').then(m => m.OrchestratorShellComponent),
    canMatch: [capabilityGuard],
    data: { capability: 'ops.viewBoard' },
    children: [
      { path: '', redirectTo: 'state', pathMatch: 'full' },
      { path: 'state',    loadComponent: () => import('./pages/state-now.component').then(m => m.StateNowComponent) },
      { path: 'waiting',  loadComponent: () => import('./pages/pipelines-waiting.component').then(m => m.PipelinesWaitingComponent) },
      { path: 'sensors',  loadComponent: () => import('./pages/sensors-crud.component').then(m => m.SensorsCrudComponent) },
      { path: 'bindings', loadComponent: () => import('./pages/pipeline-bindings.component').then(m => m.PipelineBindingsComponent) },
    ],
  },
];
