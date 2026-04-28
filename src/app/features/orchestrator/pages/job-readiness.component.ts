import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { DataPipelineTargetCriticality, Pipeline } from '../../../core/models';
import { SensorState } from '../../../core/orchestrator/sensor.model';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { UiBadgeComponent, UiCardComponent, UiFarolComponent, UiStatComponent } from '../../../shared/ui';

interface ReadinessRow {
  pipeline: Pipeline;
  sensorId: string;
  sensorName: string;
  sourceTable: string;
  query: string;
  targetCriticality: DataPipelineTargetCriticality;
  state: SensorState;
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
            <th>Liberação</th><th>Job</th><th>Tipo</th><th>Sigla</th><th>Tabela destino</th><th>Criticidade destino</th><th>Query / origem</th><th>Verificado em</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows()">
            <td class="status">
              <ui-farol [status]="readinessFarol(row.state)" [label]="readinessLabel(row.state)" [tooltip]="readinessTooltip(row.state)" />
            </td>
            <td class="tbl__name">{{ row.pipeline.name }}</td>
            <td>{{ row.pipeline.type }}</td>
            <td><ui-badge tone="brand">{{ row.pipeline.sigla }}</ui-badge></td>
            <td><code>{{ row.pipeline.target }}</code></td>
            <td>{{ criticalityLabel(row.targetCriticality) }}</td>
            <td>
              <div class="query">
                <strong>{{ row.sensorName }}</strong>
                <span>{{ row.sourceTable }}</span>
                <code>{{ row.query }}</code>
              </div>
            </td>
            <td>{{ row.state.lastRunAt ? (row.state.lastRunAt | date:'dd/MM HH:mm') : '—' }}</td>
          </tr>
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
    .tbl__name { color: var(--text-primary) !important; font-weight: 700; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .query { display: flex; flex-direction: column; gap: 4px; max-width: 420px; }
    .query strong { color: var(--text-primary); }
    .query span { color: var(--text-muted); }
    .query code { white-space: normal; line-height: 1.45; }
    .status { min-width: 150px; }
  `],
})
export class JobReadinessComponent {
  private readonly sensors = inject(SensorService);
  private readonly platform = inject(PlatformDataService);

  criticalityFilter: 'all' | DataPipelineTargetCriticality = 'all';
  jobTypeFilter: 'all' | Pipeline['type'] = 'all';
  siglaFilter = 'all';
  resultFilter: 'all' | 'ok' | 'pending' | 'failed' = 'all';
  jobSearchTerm = '';
  tableSearchTerm = '';
  querySearchTerm = '';

  readonly siglas = computed(() => Array.from(new Set(this.platform.pipelines().map(pipeline => pipeline.sigla))).sort());

  readonly allRows = computed<ReadinessRow[]>(() => this.sensors.bindings().flatMap(binding => {
    const pipeline = this.platform.pipelines().find(item => item.id === binding.pipelineId);
    if (!pipeline) return [];
    return binding.sensorIds.flatMap(sensorId => {
      const sensor = this.sensors.sensors().find(item => item.id === sensorId);
      if (!sensor) return [];
      return [{
        pipeline,
        sensorId,
        sensorName: sensor.name,
        sourceTable: sensor.sourceQualifiedName,
        query: sensor.query,
        targetCriticality: pipeline.targetCriticality ?? 'media',
        state: this.sensors.state(sensorId),
      }];
    });
  }));

  rows(): ReadinessRow[] {
    const jobTerm = this.jobSearchTerm.trim().toLowerCase();
    const tableTerm = this.tableSearchTerm.trim().toLowerCase();
    const queryTerm = this.querySearchTerm.trim().toLowerCase();
    return this.allRows().filter(row =>
      (this.criticalityFilter === 'all' || row.targetCriticality === this.criticalityFilter)
      && (this.jobTypeFilter === 'all' || row.pipeline.type === this.jobTypeFilter)
      && (this.siglaFilter === 'all' || row.pipeline.sigla === this.siglaFilter)
      && (this.resultFilter === 'all' || this.resultKey(row.state) === this.resultFilter)
      && (!jobTerm || row.pipeline.name.toLowerCase().includes(jobTerm))
      && (!tableTerm
        || row.pipeline.target.toLowerCase().includes(tableTerm)
        || row.sourceTable.toLowerCase().includes(tableTerm))
      && (!queryTerm || row.query.toLowerCase().includes(queryTerm))
    );
  }

  readonly failedQueries = computed(() => this.allRows().filter(row => row.state.status === 'red').length);

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

  private boundPipelines(): Pipeline[] {
    const ids = new Set(this.sensors.bindings().map(binding => binding.pipelineId));
    return this.platform.pipelines().filter(pipeline => ids.has(pipeline.id));
  }
}
