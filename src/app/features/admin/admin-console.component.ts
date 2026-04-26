import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UiBadgeComponent,
  UiCardComponent,
  UiFarolComponent,
  UiPageHeaderComponent,
  UiStatComponent,
} from '../../shared/ui';
import { AccessService } from '../../core/access/access.service';
import { AccessPolicyService } from '../../core/access/access-policy.service';
import { AD_GROUP_PATTERNS, ALL_CAPABILITIES, CAPABILITY_LABELS, DEFAULT_ROLE_CAPABILITIES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../core/access/naming.config';
import { Capability, Role } from '../../core/access/access.types';
import { AuditService } from '../../core/audit/audit.service';
import { OrgService } from '../../core/org/org.service';

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, FormsModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiStatComponent, UiFarolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Admin"
      title="Acessos, Escopos & Auditoria"
      subtitle="Base editavel para grupos AD, hierarquia organizacional, projetos LUP e trilha de auditoria." />

    <div class="stats-row">
      <ui-stat label="Roles configurados" [value]="roles.length" />
      <ui-stat label="Capabilities" [value]="capabilities.length" />
      <ui-stat label="Unidades organizacionais" [value]="org.orgUnits().length" />
      <ui-stat label="Projetos LUP visiveis" [value]="visibleProjects().length" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Sessao" title="Contexto efetivo de acesso">
        <div class="context">
          <div><span>Usuario</span><strong>{{ access.context()?.userPrincipal }}</strong></div>
          <div><span>Escopo ativo</span><strong>{{ access.context()?.activeScope?.label || 'Sem escopo' }}</strong></div>
          <div class="chips">
            <ui-badge *ngFor="let role of access.context()?.roles" tone="brand">{{ roleLabel(role) }}</ui-badge>
          </div>
        </div>
      </ui-card>

      <ui-card eyebrow="Auditoria" title="Retencao e destino">
        <div class="audit-policy">
          <div><span>Pipeline</span><strong>CloudWatch Logs -> Firehose -> S3 Object Lock</strong></div>
          <div><span>Eventos sensiveis</span><strong>{{ audit.sinkConfig.retention.sensitiveEventsYears }} anos</strong></div>
          <div><span>Visualizacoes</span><strong>{{ audit.sinkConfig.retention.viewEventsYears }} ano</strong></div>
          <div><span>PII logada</span><strong>{{ audit.sinkConfig.piiPolicy }}</strong></div>
        </div>
      </ui-card>
    </div>

    <div class="grid grid--wide">
      <ui-card eyebrow="Políticas de acesso" title="Matriz grupo -> capabilities">
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

      <ui-card eyebrow="Preview" title="Telas liberadas para o grupo">
        <div class="screen-preview">
          <div class="screen-preview__head">
            <span>Grupo</span>
            <strong>{{ adGroupFor(selectedRole) }}</strong>
          </div>
          <div class="screen-row" *ngFor="let screen of previewScreens()">
            <span>{{ screen.label }}</span>
            <ui-badge tone="neutral">{{ screen.capability }}</ui-badge>
          </div>
          <div class="screen-empty" *ngIf="previewScreens().length === 0">Nenhuma tela liberada para a política atual.</div>
        </div>
      </ui-card>
    </div>

    <div class="grid grid--wide">
      <ui-card eyebrow="Organizacao" title="Arvore organizacional configurada">
        <table class="tbl">
          <thead><tr><th>Unidade</th><th>Nivel</th><th>Ramo</th><th>Pai</th></tr></thead>
          <tbody>
            <tr *ngFor="let unit of org.orgUnits()">
              <td class="tbl__name">{{ unit.name }}</td>
              <td>{{ unit.level }}</td>
              <td>{{ unit.branch }}</td>
              <td>{{ org.labelForUnit(unit.parentId || '') || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </ui-card>
    </div>

    <ui-card eyebrow="LUP" title="Projetos visiveis no escopo ativo" [padded]="false">
      <table class="tbl">
        <thead><tr><th>Codigo</th><th>Projeto</th><th>Squad</th><th>Status</th><th>Farol</th><th>Custo mensal</th><th>Progresso</th></tr></thead>
        <tbody>
          <tr *ngFor="let project of visibleProjects()">
            <td class="tbl__name">{{ project.code }}</td>
            <td>{{ project.name }}</td>
            <td>{{ org.labelForUnit(project.squadId) }}</td>
            <td><ui-badge tone="info">{{ project.status }}</ui-badge></td>
            <td><ui-farol [status]="project.health" /></td>
            <td>R$ {{ project.monthlyCost | number:'1.0-0' }}</td>
            <td>{{ project.progress }}%</td>
          </tr>
        </tbody>
      </table>
    </ui-card>

    <ui-card eyebrow="Trilha" title="Eventos recentes de auditoria" [padded]="false">
      <table class="tbl">
        <thead><tr><th>Quando</th><th>Acao</th><th>Usuario</th><th>Recurso</th><th>Escopo</th></tr></thead>
        <tbody>
          <tr *ngFor="let event of audit.latestEvents()">
            <td>{{ event.timestamp | date:'short' }}</td>
            <td class="tbl__name">{{ event.action }}</td>
            <td>{{ event.userPrincipal }}</td>
            <td>{{ event.resourceType || '-' }} {{ event.resourceId || '' }}</td>
            <td>{{ event.scopeId || '-' }}</td>
          </tr>
          <tr *ngIf="audit.latestEvents().length === 0">
            <td colspan="5" class="tbl__empty">Nenhum evento registrado nesta sessao.</td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .grid--wide { grid-template-columns: 1.25fr 1fr; }
    .context, .audit-policy { display: flex; flex-direction: column; gap: 12px; }
    .context > div, .audit-policy > div { display: flex; flex-direction: column; gap: 2px; }
    .context span, .audit-policy span { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .context strong, .audit-policy strong { color: var(--text-primary); font-size: 13px; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .role-list { display: flex; flex-direction: column; gap: 16px; }
    .role-row { display: flex; flex-direction: column; gap: 8px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
    .role-row:last-child { border-bottom: 0; padding-bottom: 0; }
    .role-row__head { display: flex; flex-direction: column; gap: 2px; }
    .role-row__head strong { color: var(--text-primary); }
    .role-row__head span { color: var(--text-secondary); font-size: 12px; }
    .access-editor { display: grid; grid-template-columns: 220px 1fr; gap: 18px; }
    .role-tabs { display: flex; flex-direction: column; gap: 6px; }
    .role-tabs button { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 0; border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-secondary); font: inherit; text-align: left; cursor: pointer; }
    .role-tabs button:hover, .role-tab--active { background: var(--bg-elevated) !important; color: var(--text-primary) !important; box-shadow: inset 0 0 0 1px var(--brand-400); }
    .role-tabs strong { font-size: 13px; }
    .role-tabs span { font-size: 11px; color: var(--text-muted); }
    .role-detail { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
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
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .tbl td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 32px !important; }
    @media (max-width: 1100px) { .grid, .grid--wide, .access-editor { grid-template-columns: 1fr; } }
  `],
})
export class AdminConsoleComponent {
  readonly access = inject(AccessService);
  readonly policy = inject(AccessPolicyService);
  readonly audit = inject(AuditService);
  readonly org = inject(OrgService);

  readonly roles = Object.keys(ROLE_LABELS) as Role[];
  readonly capabilities = ALL_CAPABILITIES;
  selectedRole: Role = 'developer';
  draftCapabilities = new Set<Capability>(this.policy.capabilitiesFor(this.selectedRole));
  readonly criticalCapabilities = new Set<Capability>([
    'admin.manageAccess',
    'admin.viewAudit',
    'executive.viewGlobal',
    'pipeline.manageRegistry',
  ]);
  readonly screenCatalog: Array<{ label: string; capability: Capability }> = [
    { label: 'Visão do Desenvolvedor', capability: 'dev.viewProjects' },
    { label: 'Nova Jornada', capability: 'pipeline.create' },
    { label: 'Meus Projetos', capability: 'dev.viewProjects' },
    { label: 'Central de Demandas', capability: 'dev.viewProjects' },
    { label: 'Cadastro de LUPs', capability: 'dev.manageLups' },
    { label: 'Histórico de Projetos', capability: 'dev.viewProjects' },
    { label: 'Pipelines', capability: 'pipeline.view' },
    { label: 'Cadastro manual de pipelines', capability: 'pipeline.manageRegistry' },
    { label: 'Orquestrador', capability: 'ops.viewBoard' },
    { label: 'Padrões de Nomes', capability: 'catalog.viewBasic' },
    { label: 'Custos de Execução', capability: 'pipeline.viewCosts' },
    { label: 'Catálogo', capability: 'catalog.viewBasic' },
    { label: 'Linhagem', capability: 'lineage.view' },
    { label: 'Qualidade', capability: 'dataQuality.view' },
    { label: 'KPIs da Plataforma', capability: 'executive.viewOwnScope' },
    { label: 'Acessos & Auditoria', capability: 'admin.manageAccess' },
  ];
  readonly visibleProjects = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org.projectsForScopes(context.activeScope ? [context.activeScope] : context.scopes, this.access.can('executive.viewGlobal'));
  });

  roleLabel(role: Role): string { return ROLE_LABELS[role]; }
  roleDescription(role: Role): string { return ROLE_DESCRIPTIONS[role]; }
  capabilitiesFor(role: Role) { return this.policy.capabilitiesFor(role); }
  capabilityLabel(capability: string): string { return CAPABILITY_LABELS[capability as keyof typeof CAPABILITY_LABELS] ?? capability; }
  adGroupFor(role: Role): string { return AD_GROUP_PATTERNS.role(role); }
  isCritical(capability: Capability): boolean { return this.criticalCapabilities.has(capability); }
  isDraftEnabled(capability: Capability): boolean { return this.draftCapabilities.has(capability); }
  isLocked(capability: Capability): boolean { return this.selectedRole === 'platform-admin' && capability === 'admin.manageAccess'; }

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
