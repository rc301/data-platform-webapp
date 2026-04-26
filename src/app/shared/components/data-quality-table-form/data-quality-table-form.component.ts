import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataQualityTableColumn, DataQualityTableRegistrationDraft } from '../../../core/models';

@Component({
  selector: 'app-data-quality-table-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="quality-form" (ngSubmit)="submit()">
      <div class="quality-form__head">
        <div>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
        </div>
        <button type="button" class="btn btn--ghost" (click)="metadataRequested.emit()">Consultar metadata</button>
      </div>

      <div class="quality-form__grid">
        <label class="field">
          <span>Database</span>
          <input name="database" [(ngModel)]="draft.database" placeholder="ex: spec" required />
        </label>
        <label class="field">
          <span>Tabela</span>
          <input name="tableName" [(ngModel)]="draft.tableName" placeholder="ex: customer_360" required />
        </label>
        <label class="field">
          <span>Role do motor</span>
          <input name="engineRole" [(ngModel)]="draft.engineRole" placeholder="ex: role_data_quality_engine_prod" required />
        </label>
        <label class="field">
          <span>Owner</span>
          <input name="owner" [(ngModel)]="draft.owner" placeholder="ex: Squad B" required />
        </label>
        <label class="field">
          <span>Linhas estimadas</span>
          <input name="rowCount" type="number" min="0" [(ngModel)]="draft.rowCount" />
        </label>
        <label class="field">
          <span>Tamanho GB</span>
          <input name="sizeGb" type="number" min="0" step="0.1" [(ngModel)]="draft.sizeGb" />
        </label>

        <section class="metadata field--full">
          <div class="metadata__head">
            <span>Campos consultados</span>
            <strong>{{ draft.columns.length }} colunas</strong>
          </div>
          <div class="columns-table" *ngIf="draft.columns.length; else emptyColumns">
            <div class="columns-table__row columns-table__row--head">
              <span>Campo</span><span>Tipo</span><span>Nulo</span><span>Descrição</span>
            </div>
            <div class="columns-table__row" *ngFor="let column of draft.columns">
              <span>{{ column.name }}</span>
              <code>{{ column.type }}</code>
              <span>{{ column.nullable ? 'Sim' : 'Não' }}</span>
              <span>{{ column.description || '-' }}</span>
            </div>
          </div>
          <ng-template #emptyColumns>
            <p>Nenhuma metadata carregada. O cadastro pode ser salvo como rascunho ou preenchido após a role consultar a tabela.</p>
          </ng-template>
        </section>

        <label class="field field--full">
          <span>Campos da chave primária</span>
          <input name="primaryKeyColumns" [(ngModel)]="primaryKeyText" placeholder="customer_id, source_system" />
        </label>

        <label class="field field--full">
          <span>Validações qualitativas genéricas</span>
          <textarea name="qualitativeValidations" rows="3" [(ngModel)]="draft.qualitativeValidations" placeholder="Descreva critérios de consistência semântica, domínio funcional, preenchimento esperado e coerência de negócio."></textarea>
        </label>

        <label class="field field--full">
          <span>Validações quantitativas genéricas</span>
          <textarea name="quantitativeValidations" rows="3" [(ngModel)]="draft.quantitativeValidations" placeholder="Descreva regras de volume, freshness, distribuição, variação aceitável e reconciliação."></textarea>
        </label>

        <label class="field field--full">
          <span>Regras customizadas</span>
          <textarea name="customRulesText" rows="4" [(ngModel)]="draft.customRulesText" placeholder="Uma regra por linha. Ex: email | nulos <= 5% | 95 | high"></textarea>
        </label>
      </div>

      <div class="quality-form__actions">
        <button type="button" class="btn btn--ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn btn--primary" [disabled]="!isValid()">{{ submitLabel }}</button>
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; }
    .quality-form { padding: 16px; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
    .quality-form__head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .quality-form__head h3 { margin: 0; color: var(--text-primary); font-size: 16px; line-height: 1.3; }
    .quality-form__head p { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
    .quality-form__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .field--full { grid-column: 1 / -1; }
    .field span, .metadata__head span { color: var(--text-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .field input, .field textarea { min-width: 0; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary); font: inherit; font-size: 13px; outline: none; }
    .field textarea { resize: vertical; }
    .field input:focus, .field textarea:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }
    .metadata { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface); }
    .metadata__head { display: flex; justify-content: space-between; }
    .metadata__head strong, .metadata p { color: var(--text-secondary); font-size: 12px; margin: 0; }
    .columns-table { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
    .columns-table__row { display: grid; grid-template-columns: 1.2fr .8fr 70px 2fr; gap: 10px; padding: 8px 10px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 12px; }
    .columns-table__row:last-child { border-bottom: 0; }
    .columns-table__row--head { color: var(--text-muted); font-weight: 800; text-transform: uppercase; background: var(--bg-app); }
    code { color: var(--text-primary); }
    .quality-form__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .btn { min-height: 36px; padding: 0 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn--ghost { background: transparent; color: var(--text-secondary); }
    .btn--primary { background: var(--brand-500); color: #fff; border-color: var(--brand-500); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    @media (max-width: 900px) {
      .quality-form__grid, .columns-table__row { grid-template-columns: 1fr; }
      .quality-form__head { flex-direction: column; }
    }
  `],
})
export class DataQualityTableFormComponent implements OnChanges {
  @Input() value: Partial<DataQualityTableRegistrationDraft> | null = null;
  @Input() title = 'Cadastrar qualidade da tabela';
  @Input() description = 'Consulte a tabela com a role do motor de qualidade e complete as definições de validação.';
  @Input() submitLabel = 'Salvar cadastro';
  @Output() saved = new EventEmitter<DataQualityTableRegistrationDraft>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() metadataRequested = new EventEmitter<void>();

  draft: DataQualityTableRegistrationDraft = this.defaultDraft();
  primaryKeyText = '';

  ngOnChanges(): void {
    this.draft = {
      ...this.defaultDraft(),
      ...this.value,
      columns: this.value?.columns ? [...this.value.columns] : [],
    };
    this.primaryKeyText = this.draft.primaryKeyColumns.join(', ');
  }

  isValid(): boolean {
    return Boolean(this.draft.database.trim() && this.draft.tableName.trim() && this.draft.owner.trim() && this.draft.engineRole.trim());
  }

  submit(): void {
    if (!this.isValid()) return;
    this.saved.emit({
      ...this.draft,
      database: this.draft.database.trim(),
      tableName: this.draft.tableName.trim(),
      qualifiedName: `${this.draft.database.trim()}.${this.draft.tableName.trim()}`,
      owner: this.draft.owner.trim(),
      engineRole: this.draft.engineRole.trim(),
      primaryKeyColumns: this.primaryKeyText.split(',').map(field => field.trim()).filter(Boolean),
    });
  }

  private defaultDraft(): DataQualityTableRegistrationDraft {
    return {
      database: '',
      tableName: '',
      qualifiedName: '',
      owner: '',
      engineRole: 'role_data_quality_engine_prod',
      columns: [] as DataQualityTableColumn[],
      primaryKeyColumns: [],
      qualitativeValidations: '',
      quantitativeValidations: '',
      customRulesText: '',
    };
  }
}
