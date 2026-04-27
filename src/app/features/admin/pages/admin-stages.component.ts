import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiBadgeComponent, UiCardComponent } from '../../../shared/ui';
import { StageConfigService } from '../../../core/journey-stages/stage-config.service';
import { StageRegistry } from '../../../features/journey-stages';
import {
  JOURNEY_STAGE_IDS_BY_CATALOG,
  JourneyStageId,
  STAGE_CATALOG,
} from '../../../features/dev/pipeline-builder/journey-config';

/**
 * Admin · Catálogo de Etapas (plugins de jornada).
 *
 * Lista todas as etapas do STAGE_CATALOG e, por linha, permite ao admin:
 *   • Habilitar/desabilitar para uso em novos templates.
 *   • Editar metadados (title/description/approvalGate) sem alterar código.
 *
 * O admin NÃO cria etapas aqui — etapas são plugins (componente + runtime)
 * registrados em build time. Mas pode habilitar/desabilitar e ajustar copy.
 */
@Component({
  selector: 'app-admin-stages',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Catálogo de etapas" title="Plugins disponíveis para templates de jornada" [padded]="false">
      <table class="tbl">
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Plugin</th>
            <th>Templates que usam</th>
            <th>Aprovação</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows()">
            <td class="tbl__name">
              <strong>{{ row.title }}</strong>
              <span>{{ row.description }}</span>
            </td>
            <td>
              <ui-badge [tone]="row.hasRuntime ? 'success' : 'neutral'">
                {{ row.hasRuntime ? 'Plugin registrado' : 'Sem plugin' }}
              </ui-badge>
            </td>
            <td>
              <span class="chips">
                <ui-badge tone="brand" *ngFor="let template of row.templates">{{ template }}</ui-badge>
                <span *ngIf="!row.templates.length" class="muted">não usado</span>
              </span>
            </td>
            <td>{{ row.approvalGate || '—' }}</td>
            <td>
              <ui-badge [tone]="row.enabled ? 'success' : 'danger'">
                {{ row.enabled ? 'Habilitado' : 'Desabilitado' }}
              </ui-badge>
            </td>
            <td class="tbl__actions">
              <button class="btn btn--ghost" type="button" (click)="edit(row.id)">Editar</button>
              <button class="btn btn--ghost" type="button" (click)="toggle(row.id)">{{ row.enabled ? 'Desabilitar' : 'Habilitar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </ui-card>

    <ui-card *ngIf="editingId() as id"
             [eyebrow]="'Etapa ' + id"
             [title]="STAGE_CATALOG[id].title">
      <div card-actions>
        <button class="btn btn--ghost" type="button" (click)="resetStage(id)">Restaurar padrão</button>
      </div>

      <div class="form">
        <label class="field field--full">
          <span>Título exibido</span>
          <input class="input" [(ngModel)]="draft.title" [placeholder]="STAGE_CATALOG[id].title">
        </label>
        <label class="field field--full">
          <span>Descrição</span>
          <textarea class="input" rows="2" [(ngModel)]="draft.description" [placeholder]="STAGE_CATALOG[id].description"></textarea>
        </label>
        <label class="field field--full">
          <span>Texto do gate de aprovação</span>
          <input class="input" [(ngModel)]="draft.approvalGate" [placeholder]="STAGE_CATALOG[id].approvalGate">
        </label>
      </div>

      <div class="form__actions">
        <button class="btn" type="button" (click)="cancel()">Cancelar</button>
        <button class="btn btn--primary" type="button" (click)="save(id)">Salvar overrides</button>
      </div>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); vertical-align: top; }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary); }
    .tbl__name strong { font-size: 13px; font-weight: 600; display: block; }
    .tbl__name span { color: var(--text-muted); font-size: 11px; display: block; max-width: 360px; }
    .tbl__actions { text-align: right; white-space: nowrap; }
    .chips { display: inline-flex; flex-wrap: wrap; gap: 4px; }
    .muted { color: var(--text-muted); font-size: 11px; }

    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }
    .field span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .input { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 8px 10px; color: var(--text-primary); font: inherit; font-size: 13px; outline: none; }
    .input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }

    .form__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .btn { height: 30px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn:hover:not([disabled]) { background: var(--bg-elevated); }
    .btn--primary { background: var(--brand-500); border-color: var(--brand-500); color: var(--text-on-brand); }
    .btn--primary:hover:not([disabled]) { background: var(--brand-400); }
    .btn--ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
    .btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }
  `],
})
export class AdminStagesComponent {
  private readonly config = inject(StageConfigService);
  private readonly registry = inject(StageRegistry);

  readonly STAGE_CATALOG = STAGE_CATALOG;

  /** Linhas da tabela: efetivo + diagnóstico de plugin/templates. */
  readonly rows = computed(() => {
    const usage = this.config.stageUsage();
    return JOURNEY_STAGE_IDS_BY_CATALOG.map(id => {
      const eff = this.config.effective(id);
      return {
        id,
        title: eff.title,
        description: eff.description,
        approvalGate: eff.approvalGate,
        enabled: this.config.isEnabled(id),
        hasRuntime: this.registry.has(id),
        templates: usage.get(id) ?? [],
      };
    });
  });

  /* ---- Editor ---- */
  editingId = signal<JourneyStageId | null>(null);
  draft: { title: string; description: string; approvalGate: string } = { title: '', description: '', approvalGate: '' };

  edit(id: JourneyStageId): void {
    const eff = this.config.effective(id);
    this.draft = {
      title:        eff.title,
      description:  eff.description,
      approvalGate: eff.approvalGate,
    };
    this.editingId.set(id);
  }

  cancel(): void { this.editingId.set(null); }

  save(id: JourneyStageId): void {
    // Apenas grava overrides para os campos que diferem do catálogo base —
    // mantém a config enxuta e fácil de inspecionar na auditoria.
    const base = STAGE_CATALOG[id];
    const overrides: Record<string, string> = {};
    if (this.draft.title.trim()        && this.draft.title.trim()        !== base.title)        overrides['title']        = this.draft.title.trim();
    if (this.draft.description.trim()  && this.draft.description.trim()  !== base.description)  overrides['description']  = this.draft.description.trim();
    if (this.draft.approvalGate.trim() && this.draft.approvalGate.trim() !== base.approvalGate) overrides['approvalGate'] = this.draft.approvalGate.trim();

    this.config.setOverrides(id, Object.keys(overrides).length ? overrides : undefined);
    this.editingId.set(null);
  }

  toggle(id: JourneyStageId): void {
    this.config.setEnabled(id, !this.config.isEnabled(id));
  }

  resetStage(id: JourneyStageId): void {
    this.config.resetStage(id);
    this.editingId.set(null);
  }
}
