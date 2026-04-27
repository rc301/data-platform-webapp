import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiPageHeaderComponent } from '../../shared/ui';

interface OrchestratorTab {
  label: string;
  description: string;
  route: string;
}

/**
 * Shell do Orquestrador — quatro visões coordenadas com contexto compartilhado.
 *
 *   1. Estado agora           → /orchestrator/state
 *   2. Pipelines aguardando   → /orchestrator/waiting
 *   3. Sensors (CRUD)         → /orchestrator/sensors
 *   4. Pipelines & Origens    → /orchestrator/bindings
 *
 * Tabs internos seguem o padrão da seção Admin: cabeçalho fixo + nav de
 * tabs + <router-outlet>. Cada sub-rota é um componente standalone.
 */
@Component({
  selector: 'app-orchestrator-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Plataforma"
      title="Orquestrador"
      subtitle="Sensores de prontidão de origens, pipelines aguardando e cadastros de orquestração." />

    <nav class="tabs" aria-label="Visões do orquestrador">
      <a *ngFor="let tab of tabs"
         class="tabs__item"
         routerLinkActive="tabs__item--active"
         [routerLink]="tab.route">
        <strong>{{ tab.label }}</strong>
        <span>{{ tab.description }}</span>
      </a>
    </nav>

    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px;
      padding: 6px;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      margin-bottom: 18px;
    }
    .tabs__item {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      transition: background .15s ease, color .15s ease;
    }
    .tabs__item:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .tabs__item--active { background: var(--bg-elevated); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .tabs__item strong { font-size: 13px; font-weight: 600; }
    .tabs__item span   { font-size: 11px; color: var(--text-muted); line-height: 1.35; }
  `],
})
export class OrchestratorShellComponent {
  readonly tabs: OrchestratorTab[] = [
    { label: 'Estado agora',         description: 'Sensors com farol e próxima execução.',                route: 'state' },
    { label: 'Pipelines aguardando', description: 'Quem está em fila esperando qual origem liberar.',     route: 'waiting' },
    { label: 'Sensors',              description: 'Cadastro das queries de prontidão (CRUD).',            route: 'sensors' },
    { label: 'Pipelines & Origens',  description: 'Vínculo M:N: pipeline ↔ sensors + política de falha.', route: 'bindings' },
  ];
}
