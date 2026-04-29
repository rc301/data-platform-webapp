import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiPageHeaderComponent } from '../../shared/ui';

interface OpsTab {
  label: string;
  description: string;
  route: string;
}

/**
 * Shell da seção Sustentação. Cabeçalho fixo + barra de tabs + outlet.
 * Mesmo padrão usado em Admin e Orquestrador.
 */
@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Sustentação"
      title="Saúde & Faróis"
      subtitle="Visão consolidada da operação. Use os tabs para alternar entre o painel de faróis e o andamento diário acumulado." />

    <nav class="tabs" aria-label="Visões de Sustentação">
      <a *ngFor="let tab of tabs"
         class="tabs__item"
         routerLinkActive="tabs__item--active"
         [routerLinkActiveOptions]="{ exact: tab.route === 'overview' }"
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
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
export class OpsShellComponent {
  readonly tabs: OpsTab[] = [
    { label: 'Painel de Faróis',     description: 'Estado por job, com filtros por status e squad.',                  route: 'overview' },
    { label: 'Andamento Diário',     description: 'Curva acumulada de finalizações vs. expectativa histórica (7d).', route: 'daily-progress' },
  ];
}
