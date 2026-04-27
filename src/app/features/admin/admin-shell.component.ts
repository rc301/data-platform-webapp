import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiPageHeaderComponent } from '../../shared/ui';
import { AccessService } from '../../core/access/access.service';
import { Capability } from '../../core/access/access.types';

interface AdminTab {
  label: string;
  description: string;
  route: string;
  /** Capability para controlar visibilidade do tab. OR semântico (qualquer uma habilita). */
  requiredCapabilities: Capability[];
}

/**
 * Shell da seção de Administração.
 * Tem o cabeçalho fixo e uma barra de tabs internos. Cada tab é uma sub-rota
 * standalone, governada por sua própria capability via {@link capabilityGuard}.
 *
 * O usuário enxerga apenas os tabs para os quais tem permissão.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Governança"
      title="Administração da plataforma"
      subtitle="Políticas de acesso, hierarquia organizacional, assuntos & domínios e trilha de auditoria." />

    <nav class="admin-tabs" aria-label="Seções de administração">
      <a *ngFor="let tab of visibleTabs()"
         class="admin-tabs__item"
         routerLinkActive="admin-tabs__item--active"
         [routerLink]="tab.route">
        <strong>{{ tab.label }}</strong>
        <span>{{ tab.description }}</span>
      </a>
    </nav>

    <main class="admin-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .admin-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px;
      padding: 6px;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      margin-bottom: 18px;
    }
    .admin-tabs__item {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      transition: background .15s ease, color .15s ease;
    }
    .admin-tabs__item:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .admin-tabs__item--active { background: var(--bg-elevated); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .admin-tabs__item strong { font-size: 13px; font-weight: 600; }
    .admin-tabs__item span   { font-size: 11px; color: var(--text-muted); line-height: 1.35; }
    .admin-content { display: block; }
  `],
})
export class AdminShellComponent {
  private readonly access = inject(AccessService);

  private readonly tabs: AdminTab[] = [
    { label: 'Visão geral',              description: 'Contexto efetivo, política de auditoria, atalhos.',                       route: 'overview',  requiredCapabilities: ['admin.manageAccess', 'admin.manageOrg', 'admin.manageStages', 'admin.viewAudit'] },
    { label: 'Políticas de Acesso',      description: 'Matriz de papel → capabilities; mapeamento AD.',                          route: 'policies',  requiredCapabilities: ['admin.manageAccess'] },
    { label: 'Estrutura organizacional', description: 'Árvore Squad → Coord → Gerência → Sup → Diretoria.',                       route: 'org',       requiredCapabilities: ['admin.manageOrg'] },
    { label: 'Assuntos & Domínios',      description: 'Classificação corporativa de tabelas (1 tabela = 1 assunto + 1 domínio).', route: 'subjects',  requiredCapabilities: ['admin.manageOrg'] },
    { label: 'Catálogo de Etapas',       description: 'Plugins de jornada — habilitar, desabilitar e ajustar metadados.',         route: 'stages',    requiredCapabilities: ['admin.manageStages'] },
    { label: 'Auditoria',                description: 'Trilha de eventos com retenção de 5 anos.',                                 route: 'audit',     requiredCapabilities: ['admin.viewAudit'] },
  ];

  readonly visibleTabs = computed(() =>
    this.tabs.filter(tab => tab.requiredCapabilities.some(cap => this.access.can(cap)))
  );
}
