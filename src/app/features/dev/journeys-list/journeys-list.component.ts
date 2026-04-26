import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent,
} from '../../../shared/ui';
import { AccessService } from '../../../core/access/access.service';
import { OrgService } from '../../../core/org/org.service';
import { LupProject, LupStatus } from '../../../core/org/org.model';
import { ProjectJourney, ProjectJourneyStore } from '../project-journey.store';
import { getJourneyTemplate } from '../pipeline-builder/journey-config';

interface JourneyRow {
  id: string;
  name: string;
  domain: string;
  squad: string;
  currentStage: string;
  progress: number;
  status: 'active' | 'review' | 'blocked' | 'done' | 'deleted';
  updatedAt: string;
  deletedBy?: string;
  deletedAt?: string;
}

@Component({
  selector: 'app-journeys-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Meus projetos"
      subtitle="Acompanhe jornadas de projeto em curso e projetos LUP do seu escopo.">
      <div page-actions>
        <ui-button variant="primary" icon="+" link="/dev/journeys/new">Nova jornada</ui-button>
      </div>
    </ui-page-header>

    <ui-card [padded]="false">
      <table class="tbl">
        <thead>
          <tr>
            <th>Projeto</th><th>Domínio</th><th>Squad</th>
            <th>Etapa atual</th><th>Progresso</th><th>Status</th>
            <th>Atualizado</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows()">
            <td class="tbl__name">{{ r.name }}</td>
            <td>{{ r.domain }}</td>
            <td>{{ r.squad }}</td>
            <td class="tbl__stage">{{ r.currentStage }}</td>
            <td class="tbl__progress">
              <div class="bar"><div [style.width.%]="r.progress"></div></div>
              <span>{{ r.progress }}%</span>
            </td>
            <td><ui-badge [tone]="toneFor(r.status)">{{ labelFor(r.status) }}</ui-badge></td>
            <td class="tbl__muted">
              <ng-container *ngIf="r.status === 'deleted'; else updatedAt">
                {{ r.deletedBy }} · {{ r.deletedAt }}
              </ng-container>
              <ng-template #updatedAt>{{ r.updatedAt }}</ng-template>
            </td>
            <td><ui-button size="sm" variant="secondary" link="/dev/journeys/new" [disabled]="r.status === 'deleted'">Abrir</ui-button></td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl thead th {
      text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);
    }
    .tbl tbody td { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl tbody tr:hover { background: rgba(76,141,255,0.04); }
    .tbl__name { color: var(--text-primary); font-weight: 600; }
    .tbl__stage { color: var(--text-primary); }
    .tbl__muted { color: var(--text-muted); font-size: 12px; }
    .tbl__progress { display: flex; align-items: center; gap: 10px; min-width: 160px; }
    .bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
    .bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .tbl__progress > span { font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; font-size: 12px; }
  `],
})
export class JourneysListComponent {
  private readonly access = inject(AccessService);
  private readonly org = inject(OrgService);
  private readonly projectJourneys = inject(ProjectJourneyStore);

  rows = computed<JourneyRow[]>(() => {
    const context = this.access.context();
    if (!context) return [];
    const orgRows = this.org
      .projectsForScopes(context.activeScope ? [context.activeScope] : context.scopes, this.access.can('executive.viewGlobal'))
      .map(project => this.toRow(project));
    const projectJourneyRows = this.projectJourneys.journeys().map(journey => this.toProjectJourneyRow(journey));
    return [...projectJourneyRows, ...orgRows];
  });

  toneFor(s: JourneyRow['status']) {
    return ({ active: 'info', review: 'warning', blocked: 'danger', done: 'success', deleted: 'danger' } as const)[s];
  }
  labelFor(s: JourneyRow['status']) {
    return ({ active: 'Em andamento', review: 'Aguarda aprovação', blocked: 'Bloqueada', done: 'Concluída', deleted: 'Deletada' } as const)[s];
  }

  private toRow(project: LupProject): JourneyRow {
    return {
      id: project.id,
      name: `${project.code} · ${project.name}`,
      domain: project.type,
      squad: this.org.labelForUnit(project.squadId),
      currentStage: this.stageFor(project.status),
      progress: project.progress,
      status: this.statusFor(project.status),
      updatedAt: new Date(project.updatedAt).toLocaleDateString('pt-BR'),
    };
  }

  private toProjectJourneyRow(journey: ProjectJourney): JourneyRow {
    const template = getJourneyTemplate(journey.templateId);
    return {
      id: journey.id,
      name: `${journey.name} · ${template.shortTitle}`,
      domain: template.shortTitle,
      squad: journey.createdBy,
      currentStage: journey.status === 'deleted' ? 'Jornada deletada' : journey.currentStage,
      progress: journey.status === 'deleted' ? 0 : journey.progress,
      status: journey.status === 'deleted' ? 'deleted' : 'active',
      updatedAt: this.formatDate(journey.updatedAt),
      deletedBy: journey.deletedBy,
      deletedAt: this.formatDateTime(journey.deletedAt),
    };
  }

  private statusFor(status: LupStatus): JourneyRow['status'] {
    return ({
      draft: 'active',
      in_progress: 'active',
      waiting_approval: 'review',
      in_production: 'done',
      completed: 'done',
      blocked: 'blocked',
    } as const)[status];
  }

  private stageFor(status: LupStatus): string {
    return ({
      draft: 'RFC',
      in_progress: 'Deploy Dev/Hml',
      waiting_approval: 'Infra de sandbox',
      in_production: 'Produção',
      completed: 'Concluído',
      blocked: 'Documentação',
    } as const)[status];
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR');
  }

  private formatDateTime(value?: string): string {
    return value ? new Date(value).toLocaleString('pt-BR') : '-';
  }
}
