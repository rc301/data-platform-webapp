import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiPageHeaderComponent } from '../../shared/ui';

interface OpsTab {
  label: string;
  description: string;
  route: string;
}

/**
 * Shell da seção Sustentação.
 *
 * Cabeçalho fixo (compartilhado entre os tabs) com indicador de
 * "Última atualização": para sustentação 24x7, saber a freshness do dado
 * em tela é tão importante quanto o próprio dado. O timestamp é atualizado
 * a cada segundo enquanto a aba estiver visível; o ícone serve de affordance
 * para "atualizar agora" (futuro: dispara refetch ao backend).
 */
@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Sustentação"
      title="Saúde & Faróis"
      subtitle="Visão consolidada da operação. Use os tabs para alternar entre o painel de faróis e o andamento diário acumulado.">
      <div page-actions>
        <button class="freshness" type="button" (click)="refresh()" [attr.aria-label]="'Atualizar dados, última atualização ' + (lastUpdatedAt() | date:'HH:mm:ss')">
          <span class="freshness__pulse" aria-hidden="true"></span>
          <span class="freshness__text">
            <small>Atualizado às</small>
            <strong>{{ lastUpdatedAt() | date:'HH:mm:ss' }}</strong>
          </span>
          <span class="freshness__icon" aria-hidden="true">↻</span>
        </button>
      </div>
    </ui-page-header>

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

    /* ===== Indicador de freshness ===== */
    .freshness {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 6px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font: inherit;
      cursor: pointer;
      transition: border-color .15s ease, background .15s ease;
    }
    .freshness:hover { background: var(--bg-elevated); border-color: var(--border-default); color: var(--text-primary); }
    .freshness__pulse {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--success-500);
      box-shadow: 0 0 0 0 rgba(43,182,115,0.5);
      animation: freshness-pulse 2s infinite;
    }
    @keyframes freshness-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(43,182,115,0.45); }
      70%  { box-shadow: 0 0 0 6px rgba(43,182,115,0);  }
      100% { box-shadow: 0 0 0 0 rgba(43,182,115,0);    }
    }
    .freshness__text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
    .freshness__text small  { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .freshness__text strong { font-size: 13px; color: var(--text-primary); font-weight: 600; font-variant-numeric: tabular-nums; }
    .freshness__icon { font-size: 14px; color: var(--text-muted); }

    /* ===== Tabs ===== */
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
export class OpsShellComponent implements OnInit, OnDestroy {
  readonly tabs: OpsTab[] = [
    { label: 'Painel de Faróis',     description: 'Estado por job, com filtros por status e squad.',                  route: 'overview' },
    { label: 'Andamento Diário',     description: 'Curva acumulada de finalizações vs. expectativa histórica (7d).', route: 'daily-progress' },
  ];

  /**
   * Timestamp da última atualização visível. No mock representa o tick do
   * relógio em tempo real; com backend real, será o timestamp do snapshot
   * mais recente recebido (e o `refresh()` dispara um refetch).
   */
  readonly lastUpdatedAt = signal<Date>(new Date());
  private timerId?: number;

  ngOnInit(): void {
    // Tick por segundo. Em produção: reduzir para 5–10s ou amarrar a um
    // observable de freshness do backend.
    this.timerId = window.setInterval(() => this.lastUpdatedAt.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  refresh(): void {
    this.lastUpdatedAt.set(new Date());
  }
}
