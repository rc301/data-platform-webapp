import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiBadgeComponent, UiCardComponent, UiStatComponent } from '../../../shared/ui';
import { AccessService } from '../../../core/access/access.service';
import { ALL_CAPABILITIES, ALL_ROLES, ROLE_LABELS } from '../../../core/access/naming.config';
import { Role } from '../../../core/access/access.types';
import { AuditService } from '../../../core/audit/audit.service';
import { OrgService } from '../../../core/org/org.service';

/**
 * Visão geral do admin: contadores, contexto efetivo do usuário e política
 * de auditoria. Não permite editar nada — é a "home" da seção.
 */
@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-row">
      <ui-stat label="Roles configurados"           [value]="roles.length" />
      <ui-stat label="Capabilities"                  [value]="capabilities.length" />
      <ui-stat label="Unidades organizacionais"      [value]="org.orgUnits().length" />
      <ui-stat label="Projetos LUP cadastrados"      [value]="org.projects().length" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Sessão" title="Contexto efetivo de acesso">
        <div class="context">
          <div><span>Usuário</span>     <strong>{{ access.context()?.userPrincipal }}</strong></div>
          <div><span>Escopo ativo</span><strong>{{ access.context()?.activeScope?.label || 'Sem escopo' }}</strong></div>
          <div class="chips">
            <ui-badge *ngFor="let role of access.context()?.roles" tone="brand">{{ roleLabel(role) }}</ui-badge>
          </div>
        </div>
      </ui-card>

      <ui-card eyebrow="Auditoria" title="Retenção e destino">
        <div class="audit-policy">
          <div><span>Pipeline</span>          <strong>CloudWatch Logs → Firehose → S3 Object Lock</strong></div>
          <div><span>Eventos sensíveis</span> <strong>{{ audit.sinkConfig.retention.sensitiveEventsYears }} anos</strong></div>
          <div><span>Visualizações</span>     <strong>{{ audit.sinkConfig.retention.viewEventsYears }} ano</strong></div>
          <div><span>PII logada</span>        <strong>{{ audit.sinkConfig.piiPolicy }}</strong></div>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .context, .audit-policy { display: flex; flex-direction: column; gap: 12px; }
    .context > div, .audit-policy > div { display: flex; flex-direction: column; gap: 2px; }
    .context span, .audit-policy span { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .context strong, .audit-policy strong { color: var(--text-primary); font-size: 13px; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminOverviewComponent {
  readonly access = inject(AccessService);
  readonly audit = inject(AuditService);
  readonly org = inject(OrgService);

  readonly roles = ALL_ROLES;
  readonly capabilities = ALL_CAPABILITIES;

  roleLabel(role: Role): string { return ROLE_LABELS[role]; }
}
