import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { DataPipelineTargetCriticality, Pipeline } from '../../../core/models';
import { SensorState } from '../../../core/orchestrator/sensor.model';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { UiBadgeComponent, UiCardComponent, UiFarolComponent, UiStatComponent } from '../../../shared/ui';

interface SelfHealingQuery {
  sensorName: string;
  sourceTable: string;
  query: string;
  state: SensorState;
}

interface SelfHealingJob {
  pipeline: Pipeline;
  queries: SelfHealingQuery[];
}

@Component({
  selector: 'app-orch-self-healing',
  standalone: true,
  imports: [CommonModule, FormsModule, UiBadgeComponent, UiCardComponent, UiFarolComponent, UiStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <label class="field">
        <span>Data de referência</span>
        <input class="input" type="date" [(ngModel)]="referenceDate">
      </label>
      <label class="field">
        <span>Job</span>
        <input class="input" type="search" [(ngModel)]="jobSearchTerm" placeholder="Filtrar job">
      </label>
      <label class="field">
        <span>Tabela</span>
        <input class="input" type="search" [(ngModel)]="tableSearchTerm" placeholder="Origem ou destino">
      </label>
      <label class="field">
        <span>Sigla</span>
        <select class="input" [(ngModel)]="siglaFilter">
          <option value="all">Todas</option>
          <option *ngFor="let sigla of siglas()" [value]="sigla">{{ sigla }}</option>
        </select>
      </label>
      <label class="field">
        <span>Tipo</span>
        <select class="input" [(ngModel)]="jobTypeFilter">
          <option value="all">Todos</option>
          <option value="GlueJob">GlueJob</option>
          <option value="Munin">Munin</option>
          <option value="CDP">CDP</option>
          <option value="Phoenix">Phoenix</option>
          <option value="Outros">Outros</option>
        </select>
      </label>
      <label class="field">
        <span>Resultado</span>
        <select class="input" [(ngModel)]="resultFilter">
          <option value="all">Todos</option>
          <option value="ok">OK</option>
          <option value="pending">Pendente</option>
          <option value="failed">Falha</option>
        </select>
      </label>
    </div>

    <div class="kpis">
      <ui-stat label="Jobs monitorados hoje" [value]="filteredJobs().length" [hint]="referenceDateLabel()" />
      <ui-stat label="Queries OK" [value]="summary().ok" hint="retornaram 1" />
      <ui-stat label="Queries pendentes" [value]="summary().pending" hint="ainda sem retorno" />
      <ui-stat label="Queries em falha" [value]="summary().failed" hint="erro na verificação" />
    </div>

    <ui-card eyebrow="Self Healing" title="Jobs monitorados e condições de liberação" [padded]="false">
      <div class="job-list">
        <article class="job" *ngFor="let item of filteredJobs()">
          <header class="job__head">
            <div>
              <strong>{{ item.pipeline.name }}</strong>
              <span>{{ item.pipeline.sigla }} · {{ item.pipeline.type }} · destino <code>{{ item.pipeline.target }}</code></span>
            </div>
            <ui-badge [tone]="jobTone(item)">{{ jobLabel(item) }}</ui-badge>
          </header>

          <div class="queries">
            <div class="query" *ngFor="let query of item.queries">
              <ui-farol [status]="queryFarol(query.state)" [label]="queryLabel(query.state)" [tooltip]="queryTooltip(query.state)" />
              <div class="query__body">
                <strong>{{ query.sensorName }}</strong>
                <span>{{ query.sourceTable }}</span>
                <code>{{ query.query }}</code>
              </div>
              <span class="query__time">{{ query.state.lastRunAt ? (query.state.lastRunAt | date:'dd/MM HH:mm') : 'sem verificação' }}</span>
            </div>
          </div>
        </article>
        <div class="empty" *ngIf="!filteredJobs().length">Nenhum job monitorado para os filtros atuais.</div>
      </div>
    </ui-card>
  `,
  styles: [`
    .toolbar { display: grid; grid-template-columns: repeat(6, minmax(150px, 1fr)); gap: 10px; padding: 12px; margin-bottom: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field span { color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .input { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 7px 10px; color: var(--text-primary); font: inherit; font-size: 12px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .job-list { display: flex; flex-direction: column; }
    .job { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
    .job:last-child { border-bottom: 0; }
    .job__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .job__head div { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .job__head strong { color: var(--text-primary); font-size: 14px; }
    .job__head span { color: var(--text-secondary); font-size: 12px; }
    .queries { display: grid; gap: 8px; }
    .query { display: grid; grid-template-columns: 150px minmax(0, 1fr) 110px; gap: 12px; align-items: start; padding: 10px; border-radius: var(--radius-md); background: var(--bg-app); }
    .query__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .query__body strong { color: var(--text-primary); font-size: 12px; }
    .query__body span, .query__time { color: var(--text-muted); font-size: 11px; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-overlay); color: var(--text-primary); font-size: 11px; white-space: normal; line-height: 1.45; }
    .empty { padding: 28px 16px; color: var(--text-muted); text-align: center; font-size: 13px; }
    @media (max-width: 1100px) { .toolbar { grid-template-columns: repeat(2, 1fr); } .query { grid-template-columns: 1fr; } }
  `],
})
export class SelfHealingComponent {
  private readonly sensors = inject(SensorService);
  private readonly platform = inject(PlatformDataService);

  referenceDate = '2026-04-27';
  jobSearchTerm = '';
  tableSearchTerm = '';
  siglaFilter = 'all';
  jobTypeFilter: 'all' | Pipeline['type'] = 'all';
  resultFilter: 'all' | 'ok' | 'pending' | 'failed' = 'all';

  readonly siglas = computed(() => Array.from(new Set(this.platform.pipelines().map(pipeline => pipeline.sigla))).sort());

  readonly monitoredJobs = computed<SelfHealingJob[]>(() => this.sensors.bindings().flatMap(binding => {
    const pipeline = this.platform.pipelines().find(item => item.id === binding.pipelineId);
    if (!pipeline) return [];
    const queries = binding.sensorIds.flatMap(sensorId => {
      const sensor = this.sensors.sensors().find(item => item.id === sensorId);
      if (!sensor) return [];
      return [{
        sensorName: sensor.name,
        sourceTable: sensor.sourceQualifiedName,
        query: sensor.query,
        state: this.sensors.state(sensorId),
      }];
    });
    return [{ pipeline, queries }];
  }));

  filteredJobs(): SelfHealingJob[] {
    const jobTerm = this.jobSearchTerm.trim().toLowerCase();
    const tableTerm = this.tableSearchTerm.trim().toLowerCase();
    return this.monitoredJobs().filter(item =>
      (!jobTerm || item.pipeline.name.toLowerCase().includes(jobTerm))
      && (this.siglaFilter === 'all' || item.pipeline.sigla === this.siglaFilter)
      && (this.jobTypeFilter === 'all' || item.pipeline.type === this.jobTypeFilter)
      && (!tableTerm
        || item.pipeline.target.toLowerCase().includes(tableTerm)
        || item.queries.some(query => query.sourceTable.toLowerCase().includes(tableTerm)))
      && (this.resultFilter === 'all' || item.queries.some(query => this.resultKey(query.state) === this.resultFilter))
    );
  }

  summary(): { ok: number; pending: number; failed: number } {
    const states = this.filteredJobs().flatMap(item => item.queries.map(query => query.state));
    return {
      ok: states.filter(state => this.resultKey(state) === 'ok').length,
      pending: states.filter(state => this.resultKey(state) === 'pending').length,
      failed: states.filter(state => this.resultKey(state) === 'failed').length,
    };
  }

  referenceDateLabel(): string {
    return this.referenceDate ? `referência ${this.referenceDate}` : 'sem data definida';
  }

  jobLabel(item: SelfHealingJob): string {
    if (item.queries.some(query => this.resultKey(query.state) === 'failed')) return 'Atenção';
    return item.queries.every(query => this.resultKey(query.state) === 'ok') ? 'Liberado' : 'Aguardando';
  }

  jobTone(item: SelfHealingJob): 'success' | 'warning' | 'danger' {
    if (item.queries.some(query => this.resultKey(query.state) === 'failed')) return 'danger';
    return item.queries.every(query => this.resultKey(query.state) === 'ok') ? 'success' : 'warning';
  }

  queryFarol(state: SensorState): 'green' | 'red' | 'gray' {
    if (state.status === 'red') return 'red';
    return state.lastResult === 1 ? 'green' : 'gray';
  }

  queryLabel(state: SensorState): string {
    if (state.status === 'red') return 'Falha';
    return state.lastResult === 1 ? 'OK' : 'Pendente';
  }

  queryTooltip(state: SensorState): string {
    if (state.status === 'red') return state.errorMessage || 'Falha na verificação da query.';
    return state.lastResult === 1 ? 'Query retornou 1.' : 'Query ainda não retornou dados para a referência.';
  }

  private resultKey(state: SensorState): 'ok' | 'pending' | 'failed' {
    if (state.status === 'red') return 'failed';
    return state.lastResult === 1 ? 'ok' : 'pending';
  }
}
