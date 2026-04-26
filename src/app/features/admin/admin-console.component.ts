import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UiBadgeComponent,
  UiCardComponent,
  UiFarolComponent,
  UiPageHeaderComponent,
  UiStatComponent,
} from '../../shared/ui';
import { AccessService } from '../../core/access/access.service';
import { ALL_CAPABILITIES, CAPABILITY_LABELS, DEFAULT_ROLE_CAPABILITIES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../core/access/naming.config';
import { Role } from '../../core/access/access.types';
import { AuditService } from '../../core/audit/audit.service';
import { OrgService } from '../../core/org/org.service';

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiStatComponent, UiFarolComponent],
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
      <ui-card eyebrow="RBAC" title="Matriz default role -> capability">
        <div class="role-list">
          <div class="role-row" *ngFor="let role of roles">
            <div class="role-row__head">
              <strong>{{ roleLabel(role) }}</strong>
              <span>{{ roleDescription(role) }}</span>
            </div>
            <div class="chips">
              <ui-badge *ngFor="let capability of capabilitiesFor(role)" tone="neutral">{{ capabilityLabel(capability) }}</ui-badge>
            </div>
          </div>
        </div>
      </ui-card>

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
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .tbl td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 32px !important; }
    @media (max-width: 1100px) { .grid, .grid--wide { grid-template-columns: 1fr; } }
  `],
})
export class AdminConsoleComponent {
  readonly access = inject(AccessService);
  readonly audit = inject(AuditService);
  readonly org = inject(OrgService);

  readonly roles = Object.keys(ROLE_LABELS) as Role[];
  readonly capabilities = ALL_CAPABILITIES;
  readonly visibleProjects = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org.projectsForScopes(context.activeScope ? [context.activeScope] : context.scopes, this.access.can('executive.viewGlobal'));
  });

  roleLabel(role: Role): string { return ROLE_LABELS[role]; }
  roleDescription(role: Role): string { return ROLE_DESCRIPTIONS[role]; }
  capabilitiesFor(role: Role) { return DEFAULT_ROLE_CAPABILITIES[role]; }
  capabilityLabel(capability: string): string { return CAPABILITY_LABELS[capability as keyof typeof CAPABILITY_LABELS] ?? capability; }
}
