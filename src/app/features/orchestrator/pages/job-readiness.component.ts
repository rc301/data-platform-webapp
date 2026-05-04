import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { DataPipelineTargetCriticality, Pipeline } from '../../../core/models';
import { SensorState } from '../../../core/orchestrator/sensor.model';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { UiBadgeComponent, UiCardComponent, UiFarolComponent, UiStatComponent } from '../../../shared/ui';

interface ReadinessQuery {
  sensorId: string;
  sensorName: string;
  sourceTable: string;
  query: string;
  state: SensorState;
}

interface ReadinessJobRow {
  pipeline: Pipeline;
  queries: ReadinessQuery[];
  targetCriticality: DataPipelineTargetCriticality;
  approvedQueries: number;
  totalQueries: number;
  readiness: 'ok' | 'pending' | 'failed';
  lastCheckedAt?: string;
}

@Component({
  selector: 'app-orch-job-readiness',
  standalone: true,
  imports: [CommonModule, FormsModule, UiBadgeComponent, UiCardComponent, UiFarolComponent, UiStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpis">
      <ui-stat label="Rodando" [value]="jobSummary().runningPct + '%'" [hint]="jobSummary().running + ' jobs'" />
      <ui-stat label="Já rodaram" [value]="jobSummary().completedPct + '%'" [hint]="jobSummary().completed + ' jobs'" />
      <ui-stat label="Ainda não rodaram" [value]="jobSummary().notStartedPct + '%'" [hint]="jobSummary().notStarted + ' jobs'" />
      <ui-stat label="Queries em falha" [value]="failedQueries()" hint="sensors vermelhos" />
    </div>

    <ui-card eyebrow="Prontidão" title="Jobs x queries de liberação" [padded]="false">
      <div card-actions>
        <select class="select" [(ngModel)]="criticalityFilter">
          <option value="all">Todas as criticidades do destino</option>
          <option value="altissima">Altíssima</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <input class="select" type="search" [(ngModel)]="jobSearchTerm" placeholder="Filtrar job…">
        <input class="select" type="search" [(ngModel)]="tableSearchTerm" placeholder="Filtrar tabela origem ou destino…">
        <select class="select" [(ngModel)]="jobTypeFilter">
          <option value="all">Todos os tipos</option>
          <option value="GlueJob">GlueJob</option>
          <option value="Munin">Munin</option>
          <option value="CDP">CDP</option>
          <option value="Phoenix">Phoenix</option>
          <option value="Outros">Outros</option>
        </select>
        <select class="select" [(ngModel)]="siglaFilter">
          <option value="all">Todas as siglas</option>
          <option *ngFor="let sigla of siglas()" [value]="sigla">{{ sigla }}</option>
        </select>
        <select class="select" [(ngModel)]="resultFilter">
          <option value="all">Todos os resultados</option>
          <option value="ok">OK</option>
          <option value="pending">Pendente</option>
          <option value="failed">Falha</option>
        </select>
        <input class="select" type="search" [(ngModel)]="querySearchTerm" placeholder="Filtrar query…">
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th>Queries liberadas</th><th>Job</th><th>Tipo</th><th>Sigla</th><th>Tabela destino</th><th>Criticidade destino</th><th>Status</th><th>Última verificação</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let row of rows()">
            <tr class="job-row"
                tabindex="0"
                [class.job-row--expanded]="isExpanded(row.pipeline.id)"
                (keydown.enter)="toggleRow(row.pipeline.id)">
              <td class="score" (click)="toggleRow(row.pipeline.id)">
                <button class="score__button"
                        type="button"
                        [attr.aria-expanded]="isExpanded(row.pipeline.id)"
                        [attr.aria-label]="(isExpanded(row.pipeline.id) ? 'Ocultar' : 'Mostrar') + ' queries de ' + row.pipeline.name"
                        (click)="toggleRow(row.pipeline.id); $event.stopPropagation()">
                  <ui-farol [status]="jobFarol(row)" />
                  <span class="score__text">
                    <strong>{{ row.approvedQueries }}/{{ row.totalQueries }}</strong>
                    <span>queries OK</span>
                  </span>
                </button>
              </td>
              <td class="tbl__name" (click)="toggleRow(row.pipeline.id)">{{ row.pipeline.name }}</td>
              <td (click)="toggleRow(row.pipeline.id)">{{ row.pipeline.type }}</td>
              <td (click)="toggleRow(row.pipeline.id)"><ui-badge tone="brand">{{ row.pipeline.sigla }}</ui-badge></td>
              <td (click)="toggleRow(row.pipeline.id)"><code>{{ row.pipeline.target }}</code></td>
              <td (click)="toggleRow(row.pipeline.id)">{{ criticalityLabel(row.targetCriticality) }}</td>
              <td (click)="toggleRow(row.pipeline.id)"><ui-badge [tone]="jobTone(row)">{{ jobStatusLabel(row) }}</ui-badge></td>
              <td (click)="toggleRow(row.pipeline.id)">{{ row.lastCheckedAt ? (row.lastCheckedAt | date:'dd/MM HH:mm') : '—' }}</td>
            </tr>
            <tr class="detail-row" *ngIf="isExpanded(row.pipeline.id)">
              <td colspan="8">
                <div class="query-list" aria-label="Queries de liberação do job">
                  <article class="query" *ngFor="let query of row.queries">
                    <ui-farol [status]="readinessFarol(query.state)" [label]="readinessLabel(query.state)" [tooltip]="readinessTooltip(query.state)" />
                    <div class="query__body">
                      <strong>{{ query.sensorName }}</strong>
                      <span>{{ query.sourceTable }}</span>
                      <code>{{ query.query }}</code>
                    </div>
                    <span class="query__time">{{ query.state.lastRunAt ? (query.state.lastRunAt | date:'dd/MM HH:mm') : 'sem verificação' }}</span>
                  </article>
                </div>
              </td>
            </tr>
          </ng-container>
          <tr *ngIf="!rows().length"><td colspan="8" class="tbl__empty">Nenhuma relação job-query para os filtros atuais.</td></tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .select { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 6px 10px; color: var(--text-primary); font: inherit; font-size: 12px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); vertical-align: top; }
    .job-row { cursor: pointer; }
    .job-row:hover, .job-row--expanded { background: rgba(76,141,255,0.04); }
    .tbl__name { color: var(--text-primary) !important; font-weight: 700; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .score { min-width: 140px; }
    .score__button { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; width: 100%; padding: 0; background: transparent; border: 0; color: inherit; text-align: left; cursor: pointer; font: inherit; }
    .score__text { display: flex; flex-direction: column; gap: 1px; }
    .score__text strong { color: var(--text-primary); font-size: 16px; font-variant-numeric: tabular-nums; line-height: 1; }
    .score__text span { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
    .detail-row td { padding: 0 14px 14px 14px; background: rgba(76,141,255,0.03); }
    .query-list { display: grid; gap: 8px; padding: 12px; border-radius: var(--radius-md); background: var(--bg-app); }
    .query { display: grid; grid-template-columns: 150px minmax(0, 1fr) 110px; gap: 12px; align-items: start; padding: 10px; border-radius: var(--radius-md); background: var(--bg-surface); }
    .query__body { display: flex; flex-direction: column; gap: 4px; max-width: 640px; min-width: 0; }
    .query__body strong { color: var(--text-primary); }
    .query__body span, .query__time { color: var(--text-muted); font-size: 11px; }
    .query__body code { white-space: normal; line-height: 1.45; }
    @media (max-width: 1100px) { .query { grid-template-columns: 1fr; } }
  `],
})
export class JobReadinessComponent {
  private readonly sensors = inject(SensorService);
  private readonly platform = inject(PlatformDataService);
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set());

  criticalityFilter: 'all' | DataPipelineTargetCriticality = 'all';
  jobTypeFilter: 'all' | Pipeline['type'] = 'all';
  siglaFilter = 'all';
  resultFilter: 'all' | 'ok' | 'pending' | 'failed' = 'all';
  jobSearchTerm = '';
  tableSearchTerm = '';
  querySearchTerm = '';

  readonly siglas = computed(() => Array.from(new Set(this.platform.pipelines().map(pipeline => pipeline.sigla))).sort());

  readonly allRows = computed<ReadinessJobRow[]>(() => this.sensors.bindings().flatMap(binding => {
    const pipeline = this.platform.pipelines().find(item => item.id === binding.pipelineId);
    if (!pipeline) return [];
    const queries = binding.sensorIds.flatMap(sensorId => {
      const sensor = this.sensors.sensors().find(item => item.id === sensorId);
      if (!sensor) return [];
      return [{
        sensorId,
        sensorName: sensor.name,
        sourceTable: sensor.sourceQualifiedName,
        query: sensor.query,
        state: this.sensors.state(sensorId),
      }];
    });
    if (!queries.length) return [];
    const approvedQueries = queries.filter(query => this.resultKey(query.state) === 'ok').length;
    const readiness = queries.some(query => this.resultKey(query.state) === 'failed')
      ? 'failed'
      : approvedQueries === queries.length ? 'ok' : 'pending';
    return [{
      pipeline,
      queries,
      targetCriticality: pipeline.targetCriticality ?? 'media',
      approvedQueries,
      totalQueries: queries.length,
      readiness,
      lastCheckedAt: this.latestRunAt(queries),
    }];
  }));

  rows(): ReadinessJobRow[] {
    const jobTerm = this.jobSearchTerm.trim().toLowerCase();
    const tableTerm = this.tableSearchTerm.trim().toLowerCase();
    const queryTerm = this.querySearchTerm.trim().toLowerCase();
    return this.allRows().filter(row =>
      (this.criticalityFilter === 'all' || row.targetCriticality === this.criticalityFilter)
      && (this.jobTypeFilter === 'all' || row.pipeline.type === this.jobTypeFilter)
      && (this.siglaFilter === 'all' || row.pipeline.sigla === this.siglaFilter)
      && (this.resultFilter === 'all' || row.readiness === this.resultFilter)
      && (!jobTerm || row.pipeline.name.toLowerCase().includes(jobTerm))
      && (!tableTerm
        || row.pipeline.target.toLowerCase().includes(tableTerm)
        || row.queries.some(query => query.sourceTable.toLowerCase().includes(tableTerm)))
      && (!queryTerm || row.queries.some(query =>
        query.query.toLowerCase().includes(queryTerm) || query.sensorName.toLowerCase().includes(queryTerm)))
    );
  }

  readonly failedQueries = computed(() => this.allRows().reduce(
    (sum, row) => sum + row.queries.filter(query => query.state.status === 'red').length,
    0,
  ));

  readonly jobSummary = computed(() => {
    const pipelines = this.boundPipelines();
    const total = pipelines.length || 1;
    const running = pipelines.filter(pipeline => pipeline.status === 'running').length;
    const completed = pipelines.filter(pipeline => pipeline.status === 'completed').length;
    const notStarted = pipelines.length - running - completed;
    return {
      running,
      completed,
      notStarted,
      runningPct: Math.round((running / total) * 100),
      completedPct: Math.round((completed / total) * 100),
      notStartedPct: Math.round((notStarted / total) * 100),
    };
  });

  criticalityLabel(value: DataPipelineTargetCriticality): string {
    return ({ altissima: 'Altíssima', alta: 'Alta', media: 'Média', baixa: 'Baixa' } as Record<DataPipelineTargetCriticality, string>)[value];
  }

  isExpanded(pipelineId: string): boolean {
    return this.expandedIds().has(pipelineId);
  }

  toggleRow(pipelineId: string): void {
    this.expandedIds.update(current => {
      const next = new Set(current);
      next.has(pipelineId) ? next.delete(pipelineId) : next.add(pipelineId);
      return next;
    });
  }

  jobFarol(row: ReadinessJobRow): 'green' | 'red' | 'gray' {
    if (row.readiness === 'failed') return 'red';
    return row.readiness === 'ok' ? 'green' : 'gray';
  }

  jobTone(row: ReadinessJobRow): 'success' | 'warning' | 'danger' {
    return ({ ok: 'success', pending: 'warning', failed: 'danger' } as const)[row.readiness];
  }

  jobStatusLabel(row: ReadinessJobRow): string {
    return ({ ok: 'Liberado', pending: 'Aguardando', failed: 'Falha em query' } as const)[row.readiness];
  }

  resultLabel(state: SensorState): string {
    if (state.status === 'red') return 'Falha';
    return state.lastResult === 1 ? 'OK' : 'Pendente';
  }

  readinessFarol(state: SensorState): 'green' | 'red' | 'gray' {
    if (state.status === 'red') return 'red';
    return state.lastResult === 1 ? 'green' : 'gray';
  }

  readinessLabel(state: SensorState): string {
    if (state.status === 'red') return 'Query em falha';
    return state.lastResult === 1 ? 'Pode executar' : 'Aguardando query';
  }

  readinessTooltip(state: SensorState): string {
    if (state.status === 'red') return state.errorMessage || 'A query falhou na última verificação.';
    return state.lastResult === 1
      ? 'A query retornou 1. O pré-requisito deste job está liberado.'
      : 'A query ainda não retornou linhas para a data/condição esperada.';
  }

  private resultKey(state: SensorState): 'ok' | 'pending' | 'failed' {
    if (state.status === 'red') return 'failed';
    return state.lastResult === 1 ? 'ok' : 'pending';
  }

  private latestRunAt(queries: ReadinessQuery[]): string | undefined {
    return queries
      .map(query => query.state.lastRunAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  }

  private boundPipelines(): Pipeline[] {
    const ids = new Set(this.sensors.bindings().map(binding => binding.pipelineId));
    return this.platform.pipelines().filter(pipeline => ids.has(pipeline.id));
  }
}
