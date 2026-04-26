import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiButtonComponent,
  UiBadgeComponent,
  UiStatComponent,
} from '../../../shared/ui';
import { DEFAULT_TEMPLATE_ID, JOURNEY_TEMPLATES, JourneyTemplateId, getStagesForTemplate } from '../pipeline-builder/journey-config';
import { AccessService } from '../../../core/access/access.service';
import { OrgService } from '../../../core/org/org.service';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-dev-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    UiPageHeaderComponent, UiCardComponent, UiButtonComponent, UiBadgeComponent, UiStatComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Construir, revisar e publicar jornadas de projeto"
      subtitle="Inicie uma nova jornada guiada por agentes ou continue uma jornada em andamento.">
      <div page-actions>
        <ui-button variant="primary" icon="+" link="/dev/journeys/new">Nova Jornada</ui-button>
      </div>
    </ui-page-header>

    <div class="stats-row">
      <ui-stat label="Jornadas em andamento" [value]="activeJourneys().length" hint="projetos fora de produção" trend="flat" delta="ver" deltaPeriod="fila atual" />
      <ui-stat label="Pendências de aprovação" [value]="pendingApprovalCount()" hint="etapas aguardando decisão" trend="flat" delta="hoje" deltaPeriod="workflow" />
      <ui-stat label="Jobs quebrados" [value]="brokenJobs().length" hint="jobs do seu escopo" trend="down" delta="priorizar" deltaPeriod="SLA" />
      <ui-stat label="Incidentes em tabelas" [value]="tableIncidents().length" hint="falhas e DQ não reconhecidas" trend="down" delta="revisar" deltaPeriod="produção" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Início rápido" title="Templates liberados para você" subtitle="Selecione o tipo de jornada de projeto para visualizar a sequência de etapas.">
        <div card-actions>
          <ui-button
            variant="primary"
            icon="+"
            link="/dev/journeys/new"
            [queryParams]="quickStartQueryParams()">
            Nova jornada vazia
          </ui-button>
        </div>
        <div class="template-grid" *ngIf="availableTemplates().length; else noTemplates">
          <button
            type="button"
            class="template-summary"
            *ngFor="let template of availableTemplates()"
            [class.template-summary--selected]="template.id === selectedTemplateId()"
            (click)="selectTemplate(template.id)">
            <span class="template-summary__badge">{{ template.badge }}</span>
            <span class="template-summary__body">
              <strong>{{ template.title }}</strong>
              <span>{{ template.description }}</span>
            </span>
            <span class="template-summary__count">{{ template.stageIds.length }} etapas</span>
          </button>
        </div>

        <ng-template #noTemplates>
          <div class="empty-permission">
            Nenhum template de jornada de projeto está liberado para o seu perfil atual.
          </div>
        </ng-template>

        <div class="stage-flow" *ngIf="selectedTemplate() as template">
          <div class="stage-flow__head">
            <strong>{{ template.shortTitle }}</strong>
            <span>{{ template.recommendedFor }}</span>
          </div>
          <ng-container *ngFor="let s of previewStages(); let i = index; let last = last">
            <div class="stage-pill">
              <span class="stage-pill__num">{{ i + 1 }}</span>
              <span class="stage-pill__title">{{ s.title }}</span>
              <ui-badge tone="brand">{{ s.badge }}</ui-badge>
            </div>
            <span class="stage-flow__arrow" *ngIf="!last" aria-hidden="true">↓</span>
          </ng-container>
        </div>
      </ui-card>

      <ui-card eyebrow="Continue de onde parou" title="Jornadas ativas">
        <div class="journey-row" *ngFor="let j of activeJourneys()">
          <div class="journey-row__main">
            <span class="journey-row__name">{{ j.name }}</span>
            <span class="journey-row__meta">{{ j.domain }} · {{ j.squad }}</span>
          </div>
          <div class="journey-row__progress">
            <div class="journey-row__bar"><div [style.width.%]="j.progress"></div></div>
            <span class="journey-row__pct">{{ j.progress }}%</span>
          </div>
          <ui-button variant="secondary" size="sm" link="/dev/journeys/new">Continuar</ui-button>
        </div>
      </ui-card>

      <ui-card eyebrow="Operação do seu escopo" title="Jobs e incidentes para avaliar">
        <div class="ops-list">
          <div class="ops-row" *ngFor="let job of brokenJobs().slice(0, 3)">
            <span class="ops-row__severity ops-row__severity--red"></span>
            <div>
              <strong>{{ job.name }}</strong>
              <span>{{ job.squad }} · {{ job.notes || 'Falha sem detalhe informado no mock.' }}</span>
            </div>
          </div>
          <div class="ops-row" *ngFor="let alert of tableIncidents().slice(0, 3)">
            <span class="ops-row__severity ops-row__severity--warn"></span>
            <div>
              <strong>{{ alert.pipelineName }}</strong>
              <span>{{ alert.message }}</span>
            </div>
          </div>
          <div class="empty-permission" *ngIf="!brokenJobs().length && !tableIncidents().length">
            Nenhum job quebrado ou incidente aberto no seu escopo.
          </div>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: start; }

    .template-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .template-summary {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px 12px;
      align-items: start;
      padding: 14px;
      width: 100%;
      background: var(--bg-app);
      border: 0;
      border-radius: var(--radius-md);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
    }
    .template-summary:hover, .template-summary--selected { background: var(--bg-elevated); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .template-summary__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      height: 24px;
      padding: 0 8px;
      border-radius: 6px;
      background: var(--bg-overlay);
      color: var(--brand-300);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .template-summary__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .template-summary__body strong { color: var(--text-primary); font-size: 14px; line-height: 1.3; }
    .template-summary__body span { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
    .template-summary__count {
      grid-column: 2;
      color: var(--success-500);
      font-size: 12px;
      font-weight: 700;
    }

    .stage-flow { display: flex; flex-direction: column; gap: 8px; }
    .stage-flow__head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
    .stage-flow__head strong { color: var(--text-primary); font-size: 14px; }
    .stage-flow__head span { color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .stage-flow__arrow {
      align-self: flex-start;
      margin-left: 22px;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1;
      opacity: .55;
    }
    .stage-pill {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: var(--bg-app);
      border-radius: var(--radius-md);
    }
    .stage-pill__num {
      width: 22px; height: 22px; border-radius: 6px;
      background: var(--bg-overlay); color: var(--brand-300);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }
    .stage-pill__title { flex: 1; font-size: 13px; color: var(--text-primary); }

    .journey-row { display: grid; grid-template-columns: 1fr 200px auto; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); }
    .journey-row:last-child { border-bottom: 0; }
    .journey-row__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .journey-row__name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .journey-row__meta { font-size: 12px; color: var(--text-muted); }
    .journey-row__progress { display: flex; align-items: center; gap: 8px; }
    .journey-row__bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
    .journey-row__bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .journey-row__pct { font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

    .ops-list { display: flex; flex-direction: column; gap: 10px; }
    .ops-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); }
    .ops-row:last-child { border-bottom: 0; }
    .ops-row__severity { width: 8px; height: 8px; border-radius: 999px; margin-top: 6px; }
    .ops-row__severity--red { background: var(--danger-500); }
    .ops-row__severity--warn { background: var(--warning-500); }
    .ops-row div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .ops-row strong { color: var(--text-primary); font-size: 13px; }
    .ops-row span:not(.ops-row__severity) { color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .empty-permission { padding: 14px; border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-secondary); font-size: 13px; }

    @media (max-width: 1100px) {
      .grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 620px) {
      .template-summary { grid-template-columns: 1fr; }
      .template-summary__count { grid-column: 1; }
    }
  `],
})
export class DevHomeComponent {
  private readonly access = inject(AccessService);
  private readonly org = inject(OrgService);
  private readonly data = inject(PlatformDataService);

  readonly selectedTemplateId = signal<JourneyTemplateId>(DEFAULT_TEMPLATE_ID);
  readonly availableTemplates = computed(() => {
    if (!this.access.can('pipeline.create')) return [];
    return JOURNEY_TEMPLATES;
  });
  readonly selectedTemplate = computed(() =>
    this.availableTemplates().find(template => template.id === this.selectedTemplateId())
    ?? this.availableTemplates()[0]
    ?? null,
  );
  readonly previewStages = computed(() => {
    const template = this.selectedTemplate();
    return template ? getStagesForTemplate(template.id) : [];
  });
  readonly quickStartQueryParams = computed(() => ({
    template: this.selectedTemplate()?.id ?? DEFAULT_TEMPLATE_ID,
    autoCreate: true,
  }));
  activeJourneys = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org
      .projectsForScopes(context.activeScope ? [context.activeScope] : context.scopes, this.access.can('executive.viewGlobal'))
      .filter(project => project.status !== 'in_production' && project.status !== 'completed')
      .slice(0, 3)
      .map(project => ({
        name: project.name,
        domain: project.type,
        squad: this.org.labelForUnit(project.squadId),
        progress: project.progress,
      }));
  });
  pendingApprovalCount = computed(() => this.activeJourneys().filter(project => project.progress > 30 && project.progress < 90).length);
  brokenJobs = computed(() => this.accessibleJobs().filter(job => job.status === 'red' || job.lastRunStatus === 'failed'));
  tableIncidents = computed(() => {
    const accessiblePipelineIds = new Set(this.accessiblePipelines().map(pipeline => pipeline.id));
    return this.data.pipelineAlerts().filter(alert =>
      !alert.acknowledged
      && accessiblePipelineIds.has(alert.pipelineId)
      && (alert.type === 'data_quality' || alert.type === 'failure' || alert.type === 'sla_breach'),
    );
  });

  selectTemplate(id: JourneyTemplateId): void {
    if (this.availableTemplates().some(template => template.id === id)) {
      this.selectedTemplateId.set(id);
    }
  }

  private accessibleJobs() {
    if (this.access.can('executive.viewGlobal')) return this.data.jobs();
    const squadLabels = new Set(this.access.activeSquadIds().map(id => this.org.labelForUnit(id)));
    return this.data.jobs().filter(job => squadLabels.has(job.squad));
  }

  private accessiblePipelines() {
    if (this.access.can('executive.viewGlobal')) return this.data.pipelines();
    const squadLabels = new Set(this.access.activeSquadIds().map(id => this.org.labelForUnit(id)));
    return this.data.pipelines().filter(pipeline => squadLabels.has(pipeline.team));
  }
}
