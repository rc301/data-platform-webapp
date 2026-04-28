import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiBadgeComponent, UiCardComponent } from '../../../shared/ui';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { OrgService } from '../../../core/org/org.service';
import { Sensor, SensorDraft } from '../../../core/orchestrator/sensor.model';

/**
 * CRUD do cadastro de Sensors. Editor por linha (sem modal): clicar em
 * "Editar" abre o sensor no painel à direita; "Novo" abre vazio. Salvar
 * persiste via SensorService (auditado).
 */
@Component({
  selector: 'app-orch-sensors-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      <ui-card eyebrow="Cadastro" title="Sensors" [padded]="false">
        <div card-actions>
          <button class="btn btn--primary" type="button" (click)="startNew()">+ Novo sensor</button>
        </div>
        <div class="filters">
          <input class="input" type="search" [(ngModel)]="searchTerm" placeholder="Buscar sensor, origem ou query…">
        </div>
        <table class="tbl">
          <thead>
            <tr><th>Sensor</th><th>Origem</th><th>Query</th><th>Squad</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let sensor of visibleSensors()">
              <td class="tbl__name">{{ sensor.name }}</td>
              <td><code>{{ sensor.sourceQualifiedName }}</code></td>
              <td><code class="query">{{ sensor.query }}</code></td>
              <td>{{ org.labelForUnit(sensor.ownerSquadId) }}</td>
              <td>
                <ui-badge [tone]="sensor.enabled ? 'success' : 'neutral'">
                  {{ sensor.enabled ? 'Ativo' : 'Pausado' }}
                </ui-badge>
              </td>
              <td class="tbl__actions">
                <button class="btn btn--ghost" type="button" (click)="edit(sensor)">Editar</button>
                <button class="btn btn--ghost" type="button" (click)="toggle(sensor)">{{ sensor.enabled ? 'Pausar' : 'Ativar' }}</button>
              </td>
            </tr>
            <tr *ngIf="!visibleSensors().length">
              <td colspan="6" class="tbl__empty">Nenhum sensor para os filtros atuais.</td>
            </tr>
          </tbody>
        </table>
      </ui-card>

      <ui-card [eyebrow]="editorMode() === 'create' ? 'Novo sensor' : 'Editar sensor'" [title]="editing()?.name || 'Cadastro'">
        <ng-container *ngIf="editing(); else hint">
          <div class="form">
            <label class="field"><span>Nome</span><input class="input" [(ngModel)]="draft.name"></label>
            <label class="field"><span>Origem (qualifiedName)</span><input class="input" [(ngModel)]="draft.sourceQualifiedName" placeholder="ex: rds.orders_db.orders"></label>
            <label class="field field--full"><span>Descrição</span><input class="input" [(ngModel)]="draft.description"></label>
            <label class="field field--full"><span>Query de prontidão</span><textarea class="input" rows="4" [(ngModel)]="draft.query" placeholder="SELECT 1 FROM tabela_origem WHERE ... LIMIT 1"></textarea></label>
            <label class="field"><span>Frequência (min)</span><input class="input" type="number" min="1" [(ngModel)]="draft.intervalMinutes"></label>
            <label class="field"><span>Threshold de freshness (min)</span><input class="input" type="number" min="1" [(ngModel)]="draft.freshnessThresholdMinutes"></label>
            <label class="field">
              <span>Squad responsável</span>
              <select class="input" [(ngModel)]="draft.ownerSquadId">
                <option *ngFor="let squad of org.squads()" [value]="squad.id">{{ squad.name }}</option>
              </select>
            </label>
            <label class="field field--toggle">
              <input type="checkbox" [(ngModel)]="draft.enabled"> Sensor ativo
            </label>
          </div>
          <div class="form__actions">
            <button class="btn" type="button" (click)="cancel()">Cancelar</button>
            <button class="btn btn--primary" type="button" [disabled]="!canSave()" (click)="save()">Salvar</button>
          </div>
        </ng-container>
        <ng-template #hint>
          <p class="hint">Selecione um sensor à esquerda para editar, ou crie um novo.</p>
        </ng-template>
      </ui-card>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; align-items: flex-start; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }

    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__actions { text-align: right; white-space: nowrap; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .query { display: block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .filters { display: grid; grid-template-columns: minmax(220px, 1fr); gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); }

    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }
    .field--toggle { flex-direction: row; align-items: center; gap: 8px; grid-column: 1 / -1; color: var(--text-secondary); font-size: 12px; }
    .field span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .input { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 8px 10px; color: var(--text-primary); font: inherit; font-size: 13px; outline: none; }
    .input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }

    .form__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .btn { height: 30px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn:hover:not([disabled]) { background: var(--bg-elevated); }
    .btn[disabled] { opacity: .45; cursor: not-allowed; }
    .btn--primary { background: var(--brand-500); border-color: var(--brand-500); color: var(--text-on-brand); }
    .btn--primary:hover:not([disabled]) { background: var(--brand-400); }
    .btn--ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
    .btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }

    .hint { color: var(--text-muted); font-size: 12px; margin: 0; }
  `],
})
export class SensorsCrudComponent {
  readonly sensors = inject(SensorService);
  readonly org = inject(OrgService);

  /** Sensor em edição (null = nada selecionado). */
  editing = signal<Sensor | null>(null);
  editorMode = signal<'create' | 'update'>('create');
  searchTerm = '';
  visibleSensors() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.sensors.sensors().filter(sensor =>
      (!term
        || sensor.name.toLowerCase().includes(term)
        || sensor.sourceQualifiedName.toLowerCase().includes(term)
        || sensor.query.toLowerCase().includes(term))
    );
  }

  /* Draft mutável vinculado ao formulário (não usamos signal aqui para
     simplificar binding com [(ngModel)] dos campos). */
  draft: SensorDraft = this.emptyDraft();

  startNew(): void {
    const synthetic: Sensor = {
      ...this.emptyDraft(),
      id: '',
      enabled: true,
      ownerSquadId: this.org.squads()[0]?.id ?? '',
      createdAt: '',
      updatedAt: '',
    } as Sensor;
    this.editing.set(synthetic);
    this.editorMode.set('create');
    this.draft = this.emptyDraft();
  }

  edit(sensor: Sensor): void {
    this.editing.set(sensor);
    this.editorMode.set('update');
    this.draft = {
      name: sensor.name,
      description: sensor.description,
      sourceQualifiedName: sensor.sourceQualifiedName,
      query: sensor.query,
      intervalMinutes: sensor.intervalMinutes,
      freshnessThresholdMinutes: sensor.freshnessThresholdMinutes,
      ownerSquadId: sensor.ownerSquadId,
      enabled: sensor.enabled,
    };
  }

  cancel(): void {
    this.editing.set(null);
  }

  toggle(sensor: Sensor): void {
    this.sensors.toggleSensor(sensor.id);
  }

  canSave(): boolean {
    return !!(
      this.draft.name.trim()
      && this.draft.sourceQualifiedName.trim()
      && this.draft.query.trim()
      && this.draft.intervalMinutes > 0
      && this.draft.freshnessThresholdMinutes > 0
      && this.draft.ownerSquadId
    );
  }

  save(): void {
    if (!this.canSave()) return;
    if (this.editorMode() === 'create') {
      const created = this.sensors.createSensor({ ...this.draft });
      this.editing.set(created);
      this.editorMode.set('update');
    } else {
      const current = this.editing();
      if (!current?.id) return;
      const updated = this.sensors.updateSensor(current.id, { ...this.draft });
      if (updated) this.editing.set(updated);
    }
  }

  private emptyDraft(): SensorDraft {
    return {
      name: '',
      description: '',
      sourceQualifiedName: '',
      query: '',
      intervalMinutes: 15,
      freshnessThresholdMinutes: 30,
      ownerSquadId: this.org?.squads?.()[0]?.id ?? '',
      enabled: true,
    };
  }

}
