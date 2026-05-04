import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiBadgeComponent, UiCardComponent } from '../../../shared/ui';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { Pipeline } from '../../../core/models';
import {
  FailureAction,
  PipelineSensorBinding,
  Sensor,
} from '../../../core/orchestrator/sensor.model';

/**
 * Pipelines & Origens — vínculo M:N entre pipelines e sensors, com a
 * política de falha de cada vínculo. Quando o wizard de jornada chega na
 * etapa "Cadastro no orquestrador", deep-linka para esta tela
 * pré-selecionando a pipeline, fechando o ciclo: a mesma UI atende
 * criação no wizard e manutenção em /orchestrator/bindings.
 */
@Component({
  selector: 'app-orch-pipeline-bindings',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Vínculos" title="Pipelines ↔ Sensors" [padded]="false">
      <div card-actions>
        <button class="btn btn--primary" type="button" (click)="startNew()">+ Vincular pipeline</button>
      </div>
      <div class="filters">
        <select class="input" [(ngModel)]="jobTypeFilter">
          <option value="all">Todos os tipos</option>
          <option value="GlueJob">GlueJob</option>
          <option value="Munin">Munin</option>
          <option value="CDP">CDP</option>
          <option value="Phoenix">Phoenix</option>
          <option value="Outros">Outros</option>
        </select>
        <select class="input" [(ngModel)]="siglaFilter">
          <option value="all">Todas as siglas</option>
          <option *ngFor="let sigla of siglas()" [value]="sigla">{{ sigla }}</option>
        </select>
        <input class="input" type="search" [(ngModel)]="searchTerm" placeholder="Buscar pipeline, destino ou sensor…">
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th>Pipeline</th>
            <th>Tipo</th>
            <th>Sigla</th>
            <th>Tabela destino</th>
            <th>Sensors aguardados</th>
            <th>Em falha</th>
            <th>Espera máxima</th>
            <th>Atualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let binding of visibleBindings()">
            <td class="tbl__name">{{ binding.pipelineName }}</td>
            <td>{{ pipelineFor(binding.pipelineId)?.type ?? '—' }}</td>
            <td>{{ pipelineFor(binding.pipelineId)?.sigla ?? '—' }}</td>
            <td><code>{{ pipelineFor(binding.pipelineId)?.target ?? '—' }}</code></td>
            <td>
              <span class="chips">
                <ui-badge tone="brand" *ngFor="let id of binding.sensorIds">{{ sensorName(id) }}</ui-badge>
                <span *ngIf="!binding.sensorIds.length" class="muted">sem sensors</span>
              </span>
            </td>
            <td><ui-badge [tone]="failureTone(binding.failureAction)">{{ failureLabel(binding.failureAction) }}</ui-badge></td>
            <td>{{ binding.maxWaitMinutes }} min</td>
            <td>{{ binding.updatedAt | date:'short' }} · {{ binding.updatedBy }}</td>
            <td class="tbl__actions">
              <button class="btn btn--ghost" type="button" (click)="edit(binding)">Editar</button>
              <button class="btn btn--ghost" type="button" (click)="remove(binding)">Remover</button>
            </td>
          </tr>
          <tr *ngIf="!visibleBindings().length"><td colspan="9" class="tbl__empty">Nenhuma pipeline vinculada a sensors para os filtros atuais.</td></tr>
        </tbody>
      </table>
    </ui-card>

    <ui-card *ngIf="editor()" [eyebrow]="editorMode() === 'create' ? 'Novo vínculo' : 'Editar vínculo'" [title]="draft.pipelineName || 'Vínculo'">
      <div class="form">
        <label class="field">
          <span>Pipeline</span>
          <select class="input" [(ngModel)]="draft.pipelineId" (ngModelChange)="onPipelineChanged($event)">
            <option value="">Selecione…</option>
            <option *ngFor="let p of pipelines()" [value]="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Espera máxima (min)</span>
          <input class="input" type="number" min="1" [(ngModel)]="draft.maxWaitMinutes">
        </label>
        <label class="field field--full">
          <span>Sensors aguardados</span>
          <div class="checkboxes">
            <label *ngFor="let s of sensors.sensors()" class="cb">
              <input type="checkbox"
                     [checked]="hasSensor(s.id)"
                     (change)="toggleSensor(s.id, $any($event.target).checked)">
              <span>{{ s.name }}<small> · {{ s.sourceQualifiedName }}</small></span>
            </label>
          </div>
        </label>
        <label class="field field--full">
          <span>Em falha</span>
          <div class="radios">
            <label class="radio"><input type="radio" name="failure" value="alert"    [(ngModel)]="draft.failureAction"> Alertar e seguir</label>
            <label class="radio"><input type="radio" name="failure" value="stop"     [(ngModel)]="draft.failureAction"> Parar pipeline</label>
            <label class="radio"><input type="radio" name="failure" value="proceed"  [(ngModel)]="draft.failureAction"> Seguir sem alerta</label>
          </div>
        </label>
      </div>

      <div class="form__actions">
        <button class="btn" type="button" (click)="cancel()">Cancelar</button>
        <button class="btn btn--primary" type="button" [disabled]="!canSave()" (click)="save()">Salvar</button>
      </div>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 18px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); vertical-align: top; }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__actions { text-align: right; white-space: nowrap; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    .chips { display: inline-flex; flex-wrap: wrap; gap: 4px; }
    .muted { color: var(--text-muted); font-size: 11px; }
    .filters { display: grid; grid-template-columns: 180px 160px minmax(240px, 1fr); gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); }

    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }
    .field span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .input { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 8px 10px; color: var(--text-primary); font: inherit; font-size: 13px; outline: none; }
    .input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }
    .checkboxes { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 6px 12px; padding: 8px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-app); }
    .cb { display: inline-flex; align-items: flex-start; gap: 8px; color: var(--text-secondary); font-size: 12px; }
    .cb small { color: var(--text-muted); display: block; }
    .radios { display: flex; gap: 14px; flex-wrap: wrap; }
    .radio { color: var(--text-secondary); font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }

    .form__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .btn { height: 30px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn:hover:not([disabled]) { background: var(--bg-elevated); }
    .btn[disabled] { opacity: .45; cursor: not-allowed; }
    .btn--primary { background: var(--brand-500); border-color: var(--brand-500); color: var(--text-on-brand); }
    .btn--primary:hover:not([disabled]) { background: var(--brand-400); }
    .btn--ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
    .btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
  `],
})
export class PipelineBindingsComponent {
  readonly sensors = inject(SensorService);
  private readonly platform = inject(PlatformDataService);

  readonly pipelines = computed(() => this.platform.pipelines());
  readonly siglas = computed(() => Array.from(new Set(this.platform.pipelines().map(pipeline => pipeline.sigla))).sort());
  jobTypeFilter: 'all' | Pipeline['type'] = 'all';
  siglaFilter = 'all';
  searchTerm = '';
  visibleBindings() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.sensors.bindings().filter(binding => {
      const pipeline = this.pipelineFor(binding.pipelineId);
      const sensorNames = binding.sensorIds.map(id => this.sensorName(id)).join(' ').toLowerCase();
      return (!pipeline || (
        (this.jobTypeFilter === 'all' || pipeline.type === this.jobTypeFilter)
        && (this.siglaFilter === 'all' || pipeline.sigla === this.siglaFilter)
      ))
        && (!term
          || binding.pipelineName.toLowerCase().includes(term)
          || pipeline?.target.toLowerCase().includes(term)
          || sensorNames.includes(term));
    });
  }

  editor = signal(false);
  editorMode = signal<'create' | 'update'>('create');

  draft = {
    pipelineId: '',
    pipelineName: '',
    sensorIds: [] as string[],
    failureAction: 'alert' as FailureAction,
    maxWaitMinutes: 60,
  };

  startNew(): void {
    this.draft = { pipelineId: '', pipelineName: '', sensorIds: [], failureAction: 'alert', maxWaitMinutes: 60 };
    this.editor.set(true);
    this.editorMode.set('create');
  }

  edit(binding: PipelineSensorBinding): void {
    this.draft = {
      pipelineId: binding.pipelineId,
      pipelineName: binding.pipelineName,
      sensorIds: [...binding.sensorIds],
      failureAction: binding.failureAction,
      maxWaitMinutes: binding.maxWaitMinutes,
    };
    this.editor.set(true);
    this.editorMode.set('update');
  }

  cancel(): void {
    this.editor.set(false);
  }

  remove(binding: PipelineSensorBinding): void {
    this.sensors.removeBinding(binding.pipelineId);
  }

  hasSensor(id: Sensor['id']): boolean {
    return this.draft.sensorIds.includes(id);
  }

  toggleSensor(id: Sensor['id'], on: boolean): void {
    this.draft.sensorIds = on
      ? Array.from(new Set([...this.draft.sensorIds, id]))
      : this.draft.sensorIds.filter(item => item !== id);
  }

  onPipelineChanged(pipelineId: string): void {
    const p = this.pipelines().find(item => item.id === pipelineId);
    this.draft.pipelineName = p?.name ?? '';
  }

  canSave(): boolean {
    return !!(
      this.draft.pipelineId
      && this.draft.pipelineName
      && this.draft.maxWaitMinutes > 0
    );
  }

  save(): void {
    if (!this.canSave()) return;
    this.sensors.upsertBinding({
      pipelineId: this.draft.pipelineId,
      pipelineName: this.draft.pipelineName,
      sensorIds: [...this.draft.sensorIds],
      failureAction: this.draft.failureAction,
      maxWaitMinutes: this.draft.maxWaitMinutes,
    });
    this.editor.set(false);
  }

  sensorName(id: Sensor['id']): string {
    return this.sensors.sensors().find(s => s.id === id)?.name ?? id;
  }

  pipelineFor(id: string) {
    return this.platform.pipelines().find(pipeline => pipeline.id === id);
  }

  failureLabel(action: FailureAction): string {
    return ({ alert: 'Alertar', stop: 'Parar', proceed: 'Seguir' } as Record<FailureAction, string>)[action];
  }

  failureTone(action: FailureAction): 'warning' | 'danger' | 'neutral' {
    return ({ alert: 'warning', stop: 'danger', proceed: 'neutral' } as const)[action];
  }
}
