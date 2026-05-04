import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiBadgeComponent, UiCardComponent } from '../../../shared/ui';
import { AccessPolicyService } from '../../../core/access/access-policy.service';
import {
  AD_GROUP_PATTERNS,
  ALL_CAPABILITIES,
  ALL_ROLES,
  CAPABILITY_LABELS,
  DEFAULT_ROLE_CAPABILITIES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from '../../../core/access/naming.config';
import { Capability, Role } from '../../../core/access/access.types';

/**
 * Edição da matriz papel × capabilities + mapeamento ↔ grupo AD.
 * Cada papel tem um conjunto de capabilities que pode ser editado e
 * persistido via {@link AccessPolicyService}. Capabilities críticas são
 * destacadas; algumas ficam locked (ex.: admin.manageAccess no platform-admin).
 */
@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Políticas de acesso" title="Matriz papel → capabilities">
      <div class="access-editor">
        <div class="role-tabs">
          <button
            type="button"
            *ngFor="let role of roles"
            [class.role-tab--active]="role === selectedRole"
            (click)="selectRole(role)">
            <strong>{{ roleLabel(role) }}</strong>
            <span>{{ adGroupFor(role) }}</span>
          </button>
        </div>

        <div class="role-detail">
          <div class="role-row__head">
            <strong>{{ roleLabel(selectedRole) }}</strong>
            <span>{{ roleDescription(selectedRole) }}</span>
          </div>

          <div class="capability-grid">
            <label
              class="capability-toggle"
              *ngFor="let capability of capabilities"
              [class.capability-toggle--critical]="isCritical(capability)">
              <input
                type="checkbox"
                [disabled]="isLocked(capability)"
                [checked]="isDraftEnabled(capability)"
                (change)="toggleCapability(capability, $any($event.target).checked)">
              <span>
                <strong>{{ capabilityLabel(capability) }}</strong>
                <small>{{ capability }}</small>
              </span>
            </label>
          </div>

          <div class="policy-actions">
            <span>Capabilities críticas exigem atenção: admin, auditoria e visão global.</span>
            <button type="button" class="policy-btn" (click)="resetSelectedRole()">Restaurar padrão</button>
            <button type="button" class="policy-btn policy-btn--primary" (click)="saveSelectedRole()">Salvar política</button>
          </div>
        </div>
      </div>
    </ui-card>

    <ui-card eyebrow="Preview" title="Telas liberadas para o papel">
      <div class="screen-preview">
        <div class="screen-preview__head">
          <span>Grupo AD</span>
          <strong>{{ adGroupFor(selectedRole) }}</strong>
        </div>
        <div class="screen-row" *ngFor="let screen of previewScreens()">
          <span>{{ screen.label }}</span>
          <ui-badge tone="neutral">{{ screen.capability }}</ui-badge>
        </div>
        <div class="screen-empty" *ngIf="previewScreens().length === 0">
          Nenhuma tela liberada para a política atual.
        </div>
      </div>
    </ui-card>
  `,
  styles: [`
    .access-editor { display: grid; grid-template-columns: 220px 1fr; gap: 18px; margin-bottom: 18px; }
    .role-tabs { display: flex; flex-direction: column; gap: 6px; }
    .role-tabs button { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 0; border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-secondary); font: inherit; text-align: left; cursor: pointer; }
    .role-tabs button:hover, .role-tab--active { background: var(--bg-elevated) !important; color: var(--text-primary) !important; box-shadow: inset 0 0 0 1px var(--brand-400); }
    .role-tabs strong { font-size: 13px; }
    .role-tabs span { font-size: 11px; color: var(--text-muted); }
    .role-detail { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .role-row__head { display: flex; flex-direction: column; gap: 2px; }
    .role-row__head strong { color: var(--text-primary); font-size: 14px; }
    .role-row__head span { color: var(--text-secondary); font-size: 12px; }
    .capability-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px; }
    .capability-toggle { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; padding: 10px; border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-secondary); }
    .capability-toggle input { margin-top: 3px; }
    .capability-toggle input:disabled { cursor: not-allowed; }
    .capability-toggle span { display: flex; flex-direction: column; gap: 2px; }
    .capability-toggle strong { color: var(--text-primary); font-size: 12px; }
    .capability-toggle small { color: var(--text-muted); font-size: 11px; }
    .capability-toggle--critical { box-shadow: inset 3px 0 0 var(--warning-500); }
    .policy-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
    .policy-actions span { margin-right: auto; color: var(--text-muted); font-size: 12px; }
    .policy-btn { height: 34px; padding: 0 12px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
    .policy-btn--primary { border-color: var(--brand-500); background: var(--brand-500); color: var(--text-on-brand); }
    .screen-preview { display: flex; flex-direction: column; gap: 10px; }
    .screen-preview__head { display: flex; flex-direction: column; gap: 3px; padding: 12px; border-radius: var(--radius-md); background: var(--bg-app); }
    .screen-preview__head span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .screen-preview__head strong { color: var(--text-primary); font-size: 13px; }
    .screen-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 13px; }
    .screen-row:last-child { border-bottom: 0; }
    .screen-empty { color: var(--text-muted); font-size: 13px; padding: 14px; border-radius: var(--radius-md); background: var(--bg-app); }
    @media (max-width: 1100px) { .access-editor { grid-template-columns: 1fr; } }
  `],
})
export class AdminPoliciesComponent {
  private readonly policy = inject(AccessPolicyService);

  readonly roles = ALL_ROLES;
  readonly capabilities = ALL_CAPABILITIES;

  /** Capabilities cuja edição merece destaque visual (segurança/governança). */
  private readonly criticalCapabilities = new Set<Capability>([
    'admin.manageAccess',
    'admin.viewAudit',
    'executive.viewGlobal',
    'pipeline.manageRegistry',
  ]);

  /** Catálogo de telas usado para o "preview" de quem vê o quê. */
  private readonly screenCatalog: Array<{ label: string; capability: Capability }> = [
    { label: 'Visão do Desenvolvedor', capability: 'dev.viewProjects' },
    { label: 'Nova Jornada',           capability: 'pipeline.create' },
    { label: 'Demandas',               capability: 'demand.viewOwn' },
    { label: 'Projetos',               capability: 'dev.manageLups' },
    { label: 'Jornadas',               capability: 'dev.viewProjects' },
    { label: 'Pipelines',              capability: 'pipeline.view' },
    { label: 'Registro manual de pipelines', capability: 'pipeline.manageRegistry' },
    { label: 'Orquestrador',           capability: 'ops.viewBoard' },
    { label: 'Saúde & Faróis (Ops)',   capability: 'ops.viewBoard' },
    { label: 'Catálogo',               capability: 'catalog.viewBasic' },
    { label: 'Linhagem',               capability: 'lineage.view' },
    { label: 'Qualidade',              capability: 'dataQuality.view' },
    { label: 'Custos',                 capability: 'pipeline.viewCosts' },
    { label: 'KPIs da Plataforma',     capability: 'executive.viewOwnScope' },
    { label: 'Padrões de Nomes',       capability: 'catalog.viewBasic' },
    { label: 'Governança · Acessos',   capability: 'admin.manageAccess' },
    { label: 'Governança · Estrutura', capability: 'admin.manageOrg' },
    { label: 'Governança · Auditoria', capability: 'admin.viewAudit' },
  ];

  selectedRole: Role = 'developer';
  draftCapabilities = new Set<Capability>(this.policy.capabilitiesFor(this.selectedRole));

  /** Controla as capabilities que são obrigatórias e não podem ser desligadas. */
  isLocked(capability: Capability): boolean {
    return this.selectedRole === 'platform-admin' && capability === 'admin.manageAccess';
  }

  isCritical(capability: Capability): boolean { return this.criticalCapabilities.has(capability); }
  isDraftEnabled(capability: Capability): boolean { return this.draftCapabilities.has(capability); }
  roleLabel(role: Role): string { return ROLE_LABELS[role]; }
  roleDescription(role: Role): string { return ROLE_DESCRIPTIONS[role]; }
  capabilityLabel(capability: string): string { return CAPABILITY_LABELS[capability as keyof typeof CAPABILITY_LABELS] ?? capability; }
  adGroupFor(role: Role): string { return AD_GROUP_PATTERNS.role(role); }

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.draftCapabilities = new Set(this.policy.capabilitiesFor(role));
  }

  toggleCapability(capability: Capability, enabled: boolean): void {
    if (this.isLocked(capability)) return;
    const next = new Set(this.draftCapabilities);
    enabled ? next.add(capability) : next.delete(capability);
    this.draftCapabilities = next;
  }

  saveSelectedRole(): void {
    // platform-admin nunca perde admin.manageAccess: é o cinto de segurança
    // contra um admin se trancar fora do próprio editor.
    if (this.selectedRole === 'platform-admin') this.draftCapabilities.add('admin.manageAccess');
    this.policy.setCapabilities(this.selectedRole, Array.from(this.draftCapabilities));
  }

  resetSelectedRole(): void {
    this.draftCapabilities = new Set(DEFAULT_ROLE_CAPABILITIES[this.selectedRole]);
    this.policy.resetRole(this.selectedRole);
  }

  previewScreens(): Array<{ label: string; capability: Capability }> {
    return this.screenCatalog.filter(screen => this.draftCapabilities.has(screen.capability));
  }
}
