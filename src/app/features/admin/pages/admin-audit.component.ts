import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../../shared/ui';
import { AuditService } from '../../../core/audit/audit.service';

/**
 * Trilha de auditoria recente. A retenção real (5 anos / 1 ano) é
 * responsabilidade do sink (CloudWatch → Firehose → S3 Object Lock); aqui
 * mostramos os eventos da sessão atual + últimos persistidos.
 */
@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, UiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Trilha" title="Eventos recentes de auditoria" [padded]="false">
      <table class="tbl">
        <thead>
          <tr><th>Quando</th><th>Ação</th><th>Usuário</th><th>Recurso</th><th>Escopo</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of audit.latestEvents()">
            <td>{{ event.timestamp | date:'short' }}</td>
            <td class="tbl__name">{{ event.action }}</td>
            <td>{{ event.userPrincipal }}</td>
            <td>{{ event.resourceType || '—' }} {{ event.resourceId || '' }}</td>
            <td>{{ event.scopeId || '—' }}</td>
          </tr>
          <tr *ngIf="audit.latestEvents().length === 0">
            <td colspan="5" class="tbl__empty">Nenhum evento registrado nesta sessão.</td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .tbl td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 32px !important; }
  `],
})
export class AdminAuditComponent {
  readonly audit = inject(AuditService);
}
