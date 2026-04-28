import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataLayer, IngestionFlowKind, Pipeline, PipelineRegistryDraft } from '../../core/models';
import { AccessService } from '../../core/access/access.service';
import { OrgService } from '../../core/org/org.service';
import { PlatformDataService } from '../../core/services/platform-data.service';

type GoldenFilter = 'all' | 'yes' | 'no';
type RegistryPanelMode = 'closed' | 'manual' | 'json';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    PageHeaderComponent, StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Pipelines" subtitle="Cadastro e gerenciamento das referências de pipelines de dados da plataforma" icon="account_tree">
      <button mat-stroked-button color="primary" *ngIf="canManageRegistry()" (click)="openJsonImport()">
        <mat-icon>upload_file</mat-icon> Importar JSON
      </button>
      <button mat-flat-button color="primary" *ngIf="canManageRegistry()" (click)="openManualForm()">
        <mat-icon>add</mat-icon> Cadastrar fluxo
      </button>
    </app-page-header>

    <section class="registry-panel" *ngIf="registryPanel() !== 'closed'">
      <div class="registry-panel__head">
        <div>
          <strong>{{ editingPipelineId() ? 'Editar fluxo de ingestão' : registryPanel() === 'json' ? 'Importar fluxos por JSON' : 'Cadastrar fluxo de ingestão' }}</strong>
          <span>Use para registrar processos legados ou fluxos não descobertos automaticamente.</span>
        </div>
        <button mat-icon-button type="button" matTooltip="Fechar" (click)="closeRegistryPanel()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="json-import" *ngIf="registryPanel() === 'json'; else manualRegistryForm">
        <textarea [(ngModel)]="jsonImportText" rows="10" placeholder='Cole um objeto ou array JSON. Ex: [{"name":"legacy_daily","sigla":"ab1","ingestionKind":"munin_sql","team":"Squad A","target":"sor.legacy"}]'></textarea>
        <div class="registry-panel__footer">
          <span>{{ jsonImportError || 'Campos ausentes recebem defaults seguros para mock e podem ser editados depois.' }}</span>
          <button mat-flat-button color="primary" type="button" (click)="importFromJson()">
            <mat-icon>playlist_add</mat-icon> Importar lote
          </button>
        </div>
      </div>

      <ng-template #manualRegistryForm>
        <div class="registry-grid">
          <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput [(ngModel)]="draft.name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sigla</mat-label><input matInput [(ngModel)]="draft.sigla"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de ingestão</mat-label>
            <mat-select [(ngModel)]="draft.ingestionKind">
              <mat-option value="glue_job">Glue Job</mat-option>
              <mat-option value="munin_sql">Munin SQL</mat-option>
              <mat-option value="phoenix">Phoenix</mat-option>
              <mat-option value="cdp">CDP</mat-option>
              <mat-option value="other">Outro legado</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status cadastral</mat-label>
            <mat-select [(ngModel)]="draft.status">
              <mat-option value="pending">Pendente</mat-option>
              <mat-option value="completed">Ativo</mat-option>
              <mat-option value="offline">Desativado</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Squad</mat-label><input matInput [(ngModel)]="draft.team"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Responsável</mat-label><input matInput [(ngModel)]="draft.owner"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Schedule</mat-label><input matInput [(ngModel)]="draft.schedule"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>SLA</mat-label><input matInput [(ngModel)]="draft.sla"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Target</mat-label><input matInput [(ngModel)]="draft.target"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Camada alvo</mat-label>
            <mat-select [(ngModel)]="draft.targetLayer">
              <mat-option [value]="undefined">Não catalogável</mat-option>
              <mat-option value="sor">SOR</mat-option>
              <mat-option value="sot">SOT</mat-option>
              <mat-option value="spec">SPEC</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Origens (vírgula)</mat-label><input matInput [ngModel]="draft.sources.join(', ')" (ngModelChange)="draft.sources = splitCsv($event)"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Tags (vírgula)</mat-label><input matInput [ngModel]="draft.tags.join(', ')" (ngModelChange)="draft.tags = splitCsv($event)"></mat-form-field>
          <mat-form-field appearance="outline" class="registry-grid__wide"><mat-label>Descrição</mat-label><textarea matInput rows="3" [(ngModel)]="draft.description"></textarea></mat-form-field>
        </div>
        <label class="manual-source">
          <input type="checkbox" [(ngModel)]="draft.targetGoldenSource"> Tabela alvo é golden source
        </label>
        <div class="registry-panel__footer">
          <span>Referências criadas por essa tela ficam marcadas como cadastro manual.</span>
          <button mat-flat-button color="primary" type="button" (click)="saveDraft()">
            <mat-icon>{{ editingPipelineId() ? 'save' : 'add' }}</mat-icon>
            {{ editingPipelineId() ? 'Salvar alterações' : 'Cadastrar fluxo' }}
          </button>
        </div>
      </ng-template>
    </section>

    <section class="summary-strip">
      <div class="summary-item" *ngFor="let s of summaries()">
        <span class="summary-value" [style.color]="s.color">{{ s.count }}</span>
        <span class="summary-label">{{ s.label }}</span>
      </div>
    </section>

    <section class="filters-panel" aria-label="Filtros de pipelines">
      <mat-form-field appearance="outline" class="filter-field search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Buscar por nome, descrição, alvo ou sigla" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Status cadastral</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="pending">Pendente</mat-option>
          <mat-option value="active">Ativo</mat-option>
          <mat-option value="offline">Desativado</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="GlueJob">GlueJob</mat-option>
          <mat-option value="Munin">Munin</mat-option>
          <mat-option value="Phoenix">Phoenix</mat-option>
          <mat-option value="CDP">CDP</mat-option>
          <mat-option value="Outros">Outros</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Sigla</mat-label>
        <mat-select [(ngModel)]="siglaFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todas</mat-option>
          <mat-option *ngFor="let sigla of siglas" [value]="sigla">{{ sigla }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Camada alvo</mat-label>
        <mat-select [(ngModel)]="layerFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todas</mat-option>
          <mat-option value="sor">SOR</mat-option>
          <mat-option value="sot">SOT</mat-option>
          <mat-option value="spec">SPEC</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Golden source alvo</mat-label>
        <mat-select [(ngModel)]="goldenFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="yes">Sim</mat-option>
          <mat-option value="no">Não</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Squad</mat-label>
        <mat-select [(ngModel)]="squadFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todas</mat-option>
          <mat-option value="Squad A">Squad A</mat-option>
          <mat-option value="Squad B">Squad B</mat-option>
          <mat-option value="Squad C">Squad C</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-button color="primary" class="clear-button" (click)="clearFilters()">
        <mat-icon>filter_alt_off</mat-icon> Limpar filtros
      </button>
    </section>

    <section class="list-shell">
      <div class="list-toolbar">
        <strong>{{ filteredPipelines().length }} pipelines</strong>
        <span>Golden source e camada consideram apenas tabelas alvo catalogáveis.</span>
      </div>

      <div class="pipeline-grid pipeline-grid--head">
        <span>Pipeline</span>
        <span>Sigla</span>
        <span>Tipo</span>
        <span>Tabela alvo</span>
        <span>Squad</span>
        <span>Schedule</span>
        <span>Responsável</span>
        <span>Cadastro</span>
        <span></span>
      </div>

      <article class="pipeline-row" *ngFor="let pipeline of filteredPipelines()" [class.pipeline-row--open]="expandedPipelineId() === pipeline.id">
        <div class="pipeline-grid">
          <div class="pipeline-main">
            <app-status-badge [status]="cadastralStatus(pipeline)" [label]="statusLabel(cadastralStatus(pipeline))"></app-status-badge>
            <div>
              <strong>{{ pipeline.name }}</strong>
              <span>{{ pipeline.description }}</span>
            </div>
          </div>
          <span class="sigla">{{ pipeline.sigla }}</span>
          <span class="type-pill">{{ pipeline.type }}</span>
          <div class="target-cell">
            <code>{{ pipeline.target }}</code>
            <span *ngIf="pipeline.targetLayer" class="layer-pill">{{ pipeline.targetLayer | uppercase }}</span>
            <span *ngIf="pipeline.targetGoldenSource" class="golden-pill">Golden</span>
          </div>
          <span>{{ pipeline.team }}</span>
          <span>{{ pipeline.schedule }}</span>
          <span>{{ pipeline.owner }}</span>
          <span class="manual-pill" [class.manual-pill--manual]="pipeline.registrationSource === 'manual'">
            {{ pipeline.registrationSource === 'manual' ? 'Manual' : 'Auto' }}
          </span>
          <div class="row-actions">
            <button mat-icon-button type="button" matTooltip="Editar referência" *ngIf="canManageRegistry()" (click)="editPipeline(pipeline)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button type="button" matTooltip="Excluir referência" *ngIf="canManageRegistry()" (click)="deletePipeline(pipeline)">
              <mat-icon>delete</mat-icon>
            </button>
            <button mat-icon-button type="button" matTooltip="Ver detalhes" (click)="togglePipeline(pipeline.id)">
              <mat-icon>{{ expandedPipelineId() === pipeline.id ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </div>
        </div>

        <div class="pipeline-detail" *ngIf="expandedPipelineId() === pipeline.id">
          <div class="detail-item">
            <span>Origens</span>
            <div class="sources-list"><code *ngFor="let source of pipeline.sources">{{ source }}</code></div>
          </div>
          <div class="detail-item"><span>SLA</span><strong>{{ pipeline.sla || '-' }}</strong></div>
          <div class="detail-item"><span>Criado por</span><strong>{{ pipeline.createdBy || '-' }}</strong></div>
          <div class="detail-item"><span>Responsável</span><strong>{{ pipeline.owner }}</strong></div>
          <div class="detail-item detail-item--wide">
            <span>Tags</span>
            <mat-chip-set><mat-chip *ngFor="let tag of pipeline.tags">{{ tag }}</mat-chip></mat-chip-set>
          </div>
        </div>
      </article>
    </section>
  `,
  styles: [`
    :host { display: block; font-size: 13px; }
    .registry-panel { margin-bottom: 18px; padding: 16px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .registry-panel__head, .registry-panel__footer { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
    .registry-panel__head { margin-bottom: 14px; }
    .registry-panel__head div { display: flex; flex-direction: column; gap: 4px; }
    .registry-panel__head strong { color: var(--text-primary); font-size: 15px; }
    .registry-panel__head span, .registry-panel__footer span { color: var(--text-secondary); font-size: 12px; }
    .registry-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 12px; }
    .registry-grid__wide { grid-column: 1 / -1; }
    .json-import textarea { width: 100%; box-sizing: border-box; resize: vertical; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-app); color: var(--text-primary); font: inherit; font-family: var(--font-mono); font-size: 12px; }
    .manual-source { display: inline-flex; align-items: center; gap: 8px; margin: 2px 0 14px; color: var(--text-secondary); font-size: 13px; }

    .summary-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 1px; margin-bottom: 18px; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-overlay); }
    .summary-item { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; background: var(--bg-surface); }
    .summary-value { font-size: 26px; font-weight: 800; line-height: 1; }
    .summary-label { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }

    .filters-panel { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filter-field { width: 168px; margin-bottom: -20px; }
    .search-field { flex: 1 1 280px; min-width: 260px; }
    .clear-button { margin-left: auto; }

    .list-shell { border-radius: var(--radius-lg); overflow-x: auto; background: var(--bg-surface); }
    .list-toolbar { display: flex; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
    .list-toolbar span { color: var(--text-secondary); font-size: 12px; }
    .pipeline-grid { display: grid; grid-template-columns: minmax(260px, 2.2fr) 70px 86px minmax(210px, 1.4fr) 92px 140px minmax(130px, 1fr) 74px 124px; gap: 12px; align-items: center; padding: 11px 16px; font-size: 12px; }
    .pipeline-grid--head { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; background: var(--bg-app); border-bottom: 1px solid var(--border-subtle); }
    .pipeline-row { border-bottom: 1px solid var(--border-subtle); }
    .pipeline-row:last-child { border-bottom: 0; }
    .pipeline-row--open { background: var(--bg-elevated); }
    .pipeline-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .pipeline-main div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .pipeline-main strong { color: var(--text-primary); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pipeline-main span { color: var(--text-secondary); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sigla, .type-pill, .layer-pill, .golden-pill { display: inline-flex; width: fit-content; align-items: center; border-radius: 6px; padding: 3px 7px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .sigla { color: var(--brand-300); background: var(--bg-overlay); border: 1px solid var(--border-subtle); }
    .type-pill { color: var(--text-secondary); background: var(--bg-app); border: 1px solid var(--border-subtle); }
    .layer-pill { color: var(--info-500); background: var(--info-bg); }
    .golden-pill { color: var(--success-500); background: var(--success-bg); }
    .target-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
    code { max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .manual-pill { display: inline-flex; width: fit-content; padding: 3px 7px; border-radius: 6px; background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .manual-pill--manual { background: var(--info-bg); color: var(--info-500); }
    .row-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; }

    .pipeline-detail { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 14px; padding: 0 16px 16px 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .detail-item--wide { grid-column: 1 / -1; }
    .detail-item span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .detail-item strong { color: var(--text-primary); font-size: 13px; }
    .sources-list { display: flex; flex-wrap: wrap; gap: 6px; }

    @media (max-width: 760px) {
      .filter-field, .search-field { width: 100%; flex-basis: 100%; }
      .clear-button { margin-left: 0; }
      .pipeline-grid { grid-template-columns: 1fr auto; }
      .pipeline-grid--head { display: none; }
      .pipeline-grid > :nth-child(n+2):nth-child(-n+7) { display: none; }
      .pipeline-detail { grid-template-columns: 1fr; }
      .list-toolbar { flex-direction: column; }
    }
  `],
})
export class PipelinesComponent {
  private readonly data = inject(PlatformDataService);
  private readonly access = inject(AccessService);
  private readonly org = inject(OrgService);

  allPipelines = this.data.pipelines();
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  squadFilter = 'all';
  siglaFilter = 'all';
  layerFilter: DataLayer | 'all' = 'all';
  goldenFilter: GoldenFilter = 'all';
  jsonImportText = '';
  jsonImportError = '';
  draft: PipelineRegistryDraft = this.emptyDraft();

  filteredPipelines = signal<Pipeline[]>(this.accessiblePipelines());
  expandedPipelineId = signal<string | null>(null);
  registryPanel = signal<RegistryPanelMode>('closed');
  editingPipelineId = signal<string | null>(null);

  siglas = Array.from(new Set(this.accessiblePipelines().map(pipeline => pipeline.sigla))).sort();

  summaries(): Array<{ label: string; count: number; color: string }> {
    const pipelines = this.accessiblePipelines();
    return [
      { label: 'Total de jobs', count: pipelines.length, color: 'var(--text-primary)' },
      { label: 'Jobs ativos', count: pipelines.filter(p => this.cadastralStatus(p) === 'completed').length, color: 'var(--success-500)' },
      { label: 'Jobs desativados', count: pipelines.filter(p => this.cadastralStatus(p) === 'offline').length, color: 'var(--text-muted)' },
      { label: 'Novos em 30 dias', count: pipelines.filter(p => this.isNewInLast30Days(p)).length, color: 'var(--info-500)' },
    ];
  }

  readonly statusLabels: Record<string, string> = {
    pending: 'Pendente',
    running: 'Ativo',
    completed: 'Ativo',
    failed: 'Ativo',
    delayed: 'Ativo',
    offline: 'Desativado',
  };

  statusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  canManageRegistry(): boolean {
    return this.access.can('pipeline.manageRegistry');
  }

  openManualForm(): void {
    this.editingPipelineId.set(null);
    this.draft = this.emptyDraft();
    this.registryPanel.set('manual');
  }

  openJsonImport(): void {
    this.editingPipelineId.set(null);
    this.jsonImportText = '';
    this.jsonImportError = '';
    this.registryPanel.set('json');
  }

  closeRegistryPanel(): void {
    this.registryPanel.set('closed');
    this.editingPipelineId.set(null);
    this.jsonImportError = '';
  }

  editPipeline(pipeline: Pipeline): void {
    if (!this.canManageRegistry()) return;
    this.editingPipelineId.set(pipeline.id);
    this.draft = this.toDraft(pipeline);
    this.registryPanel.set('manual');
  }

  deletePipeline(pipeline: Pipeline): void {
    if (!this.canManageRegistry()) return;
    this.data.deletePipelineRegistryEntry(pipeline.id);
    this.allPipelines = this.data.pipelines();
    this.applyFilters();
    if (this.expandedPipelineId() === pipeline.id) this.expandedPipelineId.set(null);
  }

  saveDraft(): void {
    if (!this.canManageRegistry() || !this.draft.name.trim()) return;
    const id = this.editingPipelineId();
    if (id) {
      this.data.updatePipelineRegistryEntry(id, this.normalizedDraft(this.draft));
    } else {
      this.data.addPipelineRegistryEntry(this.normalizedDraft(this.draft));
    }
    this.allPipelines = this.data.pipelines();
    this.applyFilters();
    this.closeRegistryPanel();
  }

  importFromJson(): void {
    if (!this.canManageRegistry()) return;
    try {
      const parsed = JSON.parse(this.jsonImportText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const drafts = items.map(item => this.normalizedDraft({
        ...this.emptyDraft(),
        ...item,
        sources: Array.isArray(item.sources) ? item.sources : this.splitCsv(item.sources ?? ''),
        tags: Array.isArray(item.tags) ? item.tags : this.splitCsv(item.tags ?? ''),
      }));
      this.data.importPipelineRegistryEntries(drafts);
      this.allPipelines = this.data.pipelines();
      this.applyFilters();
      this.closeRegistryPanel();
    } catch {
      this.jsonImportError = 'JSON inválido ou fora do formato esperado.';
    }
  }

  splitCsv(value: string): string[] {
    return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  }

  togglePipeline(id: string): void {
    this.expandedPipelineId.update(current => current === id ? null : id);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.squadFilter = 'all';
    this.siglaFilter = 'all';
    this.layerFilter = 'all';
    this.goldenFilter = 'all';
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.accessiblePipelines();
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(pipeline =>
        pipeline.name.toLowerCase().includes(term)
        || pipeline.description.toLowerCase().includes(term)
        || pipeline.team.toLowerCase().includes(term)
        || pipeline.target.toLowerCase().includes(term)
        || pipeline.sigla.toLowerCase().includes(term),
      );
    }
    if (this.statusFilter !== 'all') {
      result = result.filter(pipeline => this.statusFilter === 'active'
        ? this.cadastralStatus(pipeline) === 'completed'
        : this.cadastralStatus(pipeline) === this.statusFilter);
    }
    if (this.typeFilter !== 'all') result = result.filter(pipeline => pipeline.type === this.typeFilter);
    if (this.squadFilter !== 'all') result = result.filter(pipeline => pipeline.team === this.squadFilter);
    if (this.siglaFilter !== 'all') result = result.filter(pipeline => pipeline.sigla === this.siglaFilter);
    if (this.layerFilter !== 'all') result = result.filter(pipeline => pipeline.targetLayer === this.layerFilter);
    if (this.goldenFilter !== 'all') {
      const golden = this.goldenFilter === 'yes';
      result = result.filter(pipeline => pipeline.targetLayer && pipeline.targetGoldenSource === golden);
    }
    this.filteredPipelines.set(result);
  }

  private accessiblePipelines(): Pipeline[] {
    if (this.access.can('executive.viewGlobal')) return this.allPipelines;
    const squadLabels = new Set(this.access.activeSquadIds().map(id => this.org.labelForUnit(id)));
    return this.allPipelines.filter(pipeline => squadLabels.has(pipeline.team));
  }

  private isNewInLast30Days(pipeline: Pipeline): boolean {
    if (!pipeline.createdAt) return false;
    const createdAt = Date.parse(pipeline.createdAt);
    if (Number.isNaN(createdAt)) return false;
    return Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000;
  }

  private emptyDraft(): PipelineRegistryDraft {
    return {
      name: '',
      sigla: 'ab1',
      description: '',
      ingestionKind: 'glue_job',
      status: 'pending',
      schedule: 'Manual',
      owner: 'Squad A',
      team: 'Squad A',
      sources: [],
      target: '',
      targetLayer: 'sor',
      targetGoldenSource: false,
      tags: ['manual'],
      sla: '',
      avgDuration: 0,
    };
  }

  private toDraft(pipeline: Pipeline): PipelineRegistryDraft {
    return {
      id: pipeline.id,
      name: pipeline.name,
      sigla: pipeline.sigla,
      description: pipeline.description,
      ingestionKind: pipeline.ingestionKind ?? this.kindFromType(pipeline.type),
      status: this.cadastralStatus(pipeline),
      schedule: pipeline.schedule,
      owner: pipeline.owner,
      team: pipeline.team,
      sources: [...pipeline.sources],
      target: pipeline.target,
      targetLayer: pipeline.targetLayer,
      targetGoldenSource: !!pipeline.targetGoldenSource,
      tags: [...pipeline.tags],
      sla: pipeline.sla,
      avgDuration: pipeline.avgDuration,
    };
  }

  private normalizedDraft(draft: PipelineRegistryDraft): PipelineRegistryDraft {
    return {
      ...draft,
      name: draft.name.trim(),
      sigla: draft.sigla || 'n/a',
      description: draft.description || 'Fluxo cadastrado manualmente na plataforma.',
      ingestionKind: this.normalizeKind(draft.ingestionKind),
      schedule: draft.schedule || 'Manual',
      owner: draft.owner || draft.team || 'Sem owner',
      team: draft.team || 'Sem squad',
      sources: draft.sources?.length ? draft.sources : ['legado.nao_mapeado'],
      target: draft.target || 'legado.nao_mapeado',
      tags: draft.tags?.length ? draft.tags : ['manual'],
      avgDuration: Number(draft.avgDuration) || 0,
      targetGoldenSource: !!draft.targetGoldenSource,
    };
  }

  private normalizeKind(value: IngestionFlowKind): IngestionFlowKind {
    return value === 'glue_job' || value === 'munin_sql' || value === 'phoenix' || value === 'cdp' || value === 'other' ? value : 'other';
  }

  private kindFromType(type: Pipeline['type']): IngestionFlowKind {
    return ({
      GlueJob: 'glue_job',
      Munin: 'munin_sql',
      Phoenix: 'phoenix',
      CDP: 'cdp',
      Outros: 'other',
    } as const)[type];
  }

  cadastralStatus(pipeline: Pipeline): Pipeline['status'] {
    if (pipeline.status === 'offline') return 'offline';
    if (pipeline.status === 'pending') return 'pending';
    return 'completed';
  }
}
