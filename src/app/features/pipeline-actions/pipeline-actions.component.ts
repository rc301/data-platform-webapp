import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDataService } from '../../core/services/platform-data.service';
import { Pipeline, PipelineExecutionAction, PipelineExecutionRequestDraft, PipelineExecutionResource } from '../../core/models';
import { UiBadgeComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-pipeline-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Plataforma"
      title="Acionamentos"
      subtitle="Solicitações pontuais e auditadas para executar, reexecutar ou ajustar pipelines de dados." />

    <div class="layout">
      <ui-card eyebrow="Solicitação" title="Novo acionamento">
        <div class="form">
          <label class="field">
            <span>Sigla</span>
            <select class="input" [(ngModel)]="siglaFilter" (ngModelChange)="onSiglaChanged()">
              <option value="">Selecione…</option>
              <option *ngFor="let sigla of siglas()" [value]="sigla">{{ sigla }}</option>
            </select>
          </label>

          <label class="field">
            <span>Pipeline</span>
            <select class="input" [(ngModel)]="draft.pipelineId" (ngModelChange)="onPipelineChanged($event)">
              <option value="">Selecione…</option>
              <option *ngFor="let pipeline of pipelinesForSigla()" [value]="pipeline.id">{{ pipeline.name }} · {{ pipeline.type }}</option>
            </select>
          </label>

          <label class="field">
            <span>Recurso</span>
            <select class="input" [(ngModel)]="draft.resource">
              <option value="GlueJob">Glue Job</option>
              <option value="StepFunction">Step Function</option>
            </select>
          </label>

          <label class="field">
            <span>Ação</span>
            <select class="input" [(ngModel)]="draft.action" (ngModelChange)="onActionChanged()">
              <option value="run_job">Run Job</option>
              <option value="rerun_failed">Re-run failed run</option>
              <option value="add_partition">Add Partition</option>
              <option value="drop_partition">Drop Partition</option>
              <option value="run_historical">Run Histórico</option>
            </select>
          </label>

          <label class="field">
            <span>{{ draft.resource === 'StepFunction' ? 'State machine / execução' : 'Nome do job' }}</span>
            <input class="input" [(ngModel)]="draft.jobName" placeholder="ex: raw_orders_etl">
          </label>

          <label class="field" *ngIf="needsPartition()">
            <span>Partição</span>
            <input class="input" [(ngModel)]="draft.partitionSpec" placeholder="dt=2026-04-27/country=BR">
          </label>

          <label class="field" *ngIf="draft.action === 'run_historical'">
            <span>Janela histórica</span>
            <input class="input" [(ngModel)]="draft.historicalWindow" placeholder="2026-01-01 até 2026-03-31">
          </label>

          <label class="field field--full">
            <span>Payload / parâmetros</span>
            <textarea class="input input--code" rows="7" [(ngModel)]="draft.payload"></textarea>
          </label>

          <label class="field field--full">
            <span>Motivo</span>
            <input class="input" [(ngModel)]="draft.reason" placeholder="Explique o contexto operacional do acionamento">
          </label>
        </div>

        <div class="selected" *ngIf="selectedPipeline() as pipeline">
          <div><span>Destino</span><strong>{{ pipeline.target }}</strong></div>
          <div><span>Status atual</span><strong>{{ statusLabel(pipeline.status) }}</strong></div>
          <div><span>Último run</span><strong>{{ pipeline.lastRun.id }} · {{ statusLabel(pipeline.lastRun.status) }}</strong></div>
        </div>

        <div class="actions">
          <button class="btn" type="button" (click)="reset()">Limpar</button>
          <button class="btn btn--primary" type="button" [disabled]="!canSubmit()" (click)="submit()">Solicitar acionamento</button>
        </div>
      </ui-card>

      <ui-card eyebrow="Fila" title="Últimas solicitações" [padded]="false">
        <table class="tbl">
          <thead><tr><th>Quando</th><th>Pipeline</th><th>Ação</th><th>Status</th><th>Solicitante</th></tr></thead>
          <tbody>
            <tr *ngFor="let request of data.pipelineExecutionRequests()">
              <td>{{ request.requestedAt | date:'dd/MM HH:mm' }}</td>
              <td class="tbl__name">{{ request.sigla }} · {{ request.pipelineName }}</td>
              <td>{{ actionLabel(request.action) }}</td>
              <td><ui-badge tone="warning">{{ request.status === 'queued' ? 'Na fila' : request.status }}</ui-badge></td>
              <td>{{ request.requestedBy }}</td>
            </tr>
            <tr *ngIf="!data.pipelineExecutionRequests().length"><td colspan="5" class="tbl__empty">Nenhum acionamento solicitado nesta sessão.</td></tr>
          </tbody>
        </table>
      </ui-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, .8fr); gap: 18px; align-items: flex-start; }
    .form { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }
    .field span { color: var(--text-muted); font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .input { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font: inherit; font-size: 13px; padding: 8px 10px; outline: none; }
    .input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,.16); }
    .input--code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; resize: vertical; }
    .selected { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
    .selected div { background: var(--bg-app); border-radius: var(--radius-md); padding: 10px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .selected span { color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 700; }
    .selected strong { color: var(--text-primary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .btn { height: 32px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
    .btn[disabled] { opacity: .45; cursor: not-allowed; }
    .btn--primary { background: var(--brand-500); border-color: var(--brand-500); color: var(--text-on-brand); }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; font-size: 10px; font-weight: 700; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl__name { color: var(--text-primary) !important; font-weight: 700; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    @media (max-width: 1100px) { .layout, .form, .selected { grid-template-columns: 1fr; } }
  `],
})
export class PipelineActionsComponent {
  readonly data = inject(PlatformDataService);

  siglaFilter = '';
  draft: PipelineExecutionRequestDraft = this.emptyDraft();

  readonly siglas = computed(() => Array.from(new Set(this.data.pipelines().map(pipeline => pipeline.sigla))).sort());
  pipelinesForSigla(): Pipeline[] {
    return this.data.pipelines().filter(pipeline => !this.siglaFilter || pipeline.sigla === this.siglaFilter);
  }

  selectedPipeline(): Pipeline | null {
    return this.data.pipelines().find(pipeline => pipeline.id === this.draft.pipelineId) ?? null;
  }

  onSiglaChanged(): void {
    this.draft.pipelineId = '';
    this.draft.jobName = '';
    this.draft.payload = this.defaultPayload();
  }

  onPipelineChanged(pipelineId: string): void {
    const pipeline = this.data.pipelines().find(item => item.id === pipelineId);
    if (!pipeline) return;
    this.draft.jobName = pipeline.glueJobNames?.[0] ?? pipeline.stepFunctionArn?.split(':').pop() ?? pipeline.name;
    this.draft.resource = pipeline.stepFunctionArn && !pipeline.glueJobNames?.length ? 'StepFunction' : 'GlueJob';
    this.draft.payload = this.defaultPayload(pipeline);
  }

  onActionChanged(): void {
    this.draft.payload = this.defaultPayload(this.selectedPipeline() ?? undefined);
  }

  needsPartition(): boolean {
    return this.draft.action === 'add_partition' || this.draft.action === 'drop_partition';
  }

  canSubmit(): boolean {
    return Boolean(
      this.draft.pipelineId
      && this.draft.jobName.trim()
      && this.draft.reason.trim()
      && this.draft.payload.trim()
      && (!this.needsPartition() || this.draft.partitionSpec?.trim())
      && (this.draft.action !== 'run_historical' || this.draft.historicalWindow?.trim())
    );
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.data.submitPipelineExecutionRequest({ ...this.draft });
    this.reset();
  }

  reset(): void {
    this.siglaFilter = '';
    this.draft = this.emptyDraft();
  }

  statusLabel(status: Pipeline['status']): string {
    return ({
      pending: 'Pendente',
      running: 'Rodando',
      completed: 'Concluído',
      failed: 'Falhou',
      delayed: 'Atrasado',
      offline: 'Offline',
    } as Record<Pipeline['status'], string>)[status];
  }

  actionLabel(action: PipelineExecutionAction): string {
    return ({
      run_job: 'Run Job',
      rerun_failed: 'Re-run failed run',
      add_partition: 'Add Partition',
      drop_partition: 'Drop Partition',
      run_historical: 'Run Histórico',
    } as Record<PipelineExecutionAction, string>)[action];
  }

  private emptyDraft(): PipelineExecutionRequestDraft {
    return {
      pipelineId: '',
      resource: 'GlueJob' as PipelineExecutionResource,
      action: 'run_job',
      jobName: '',
      payload: this.defaultPayload(),
      partitionSpec: '',
      historicalWindow: '',
      reason: '',
    };
  }

  private defaultPayload(pipeline?: Pipeline): string {
    const action = this.draft?.action ?? 'run_job';
    const base = {
      pipeline: pipeline?.name ?? '',
      target: pipeline?.target ?? '',
      action,
      parameters: {},
    };
    if (action === 'run_historical') {
      return JSON.stringify({ ...base, parameters: { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' } }, null, 2);
    }
    if (action === 'add_partition' || action === 'drop_partition') {
      return JSON.stringify({ ...base, parameters: { partition: this.draft.partitionSpec || 'dt=YYYY-MM-DD' } }, null, 2);
    }
    return JSON.stringify(base, null, 2);
  }
}
