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
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { DataLayer, Pipeline, PipelineAlert } from '../../core/models';
import { AccessService } from '../../core/access/access.service';
import { OrgService } from '../../core/org/org.service';
import { PlatformDataService } from '../../core/services/platform-data.service';

type GoldenFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    PageHeaderComponent, StatusBadgeComponent, RelativeTimePipe, DurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Pipelines" subtitle="Monitore pipelines em uma lista operacional com filtros por escopo de dados" icon="account_tree">
      <button mat-stroked-button color="primary" (click)="refresh()">
        <mat-icon>refresh</mat-icon> Atualizar
      </button>
    </app-page-header>

    <section class="summary-strip">
      <div class="summary-item" *ngFor="let s of summaries">
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
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="pending">Pendente</mat-option>
          <mat-option value="running">Executando</mat-option>
          <mat-option value="completed">Completado</mat-option>
          <mat-option value="failed">Falha</mat-option>
          <mat-option value="delayed">Atrasado</mat-option>
          <mat-option value="offline">Desligado</mat-option>
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

      <button mat-button color="primary" class="clear-button" (click)="clearFilters()">Limpar filtros</button>
    </section>

    <section class="alerts-banner" *ngIf="unresolvedAlerts.length > 0">
      <mat-icon color="warn">warning</mat-icon>
      <span><strong>{{ unresolvedAlerts.length }} alertas</strong> requerem atenção</span>
      <button mat-button color="warn" (click)="showAlerts = !showAlerts">
        {{ showAlerts ? 'Ocultar' : 'Mostrar' }}
      </button>
    </section>

    <section class="alerts-list" *ngIf="showAlerts">
      <article *ngFor="let alert of unresolvedAlerts" class="alert-row" [class]="'alert-row alert-' + alert.severity">
        <mat-icon>{{ alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info' }}</mat-icon>
        <div>
          <strong>{{ alert.pipelineName }}</strong>
          <span>{{ alert.message }}</span>
        </div>
        <app-status-badge [status]="alert.severity" [label]="alert.type | titlecase"></app-status-badge>
        <time>{{ alert.timestamp | relativeTime }}</time>
      </article>
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
        <span>Última execução</span>
        <span></span>
      </div>

      <article class="pipeline-row" *ngFor="let pipeline of filteredPipelines()" [class.pipeline-row--open]="expandedPipelineId() === pipeline.id">
        <div class="pipeline-grid">
          <div class="pipeline-main">
            <app-status-badge [status]="pipeline.status" [label]="statusLabel(pipeline.status)"></app-status-badge>
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
          <span class="last-run">
            <app-status-badge [status]="pipeline.lastRun.status" [label]="statusLabel(pipeline.lastRun.status)"></app-status-badge>
            {{ pipeline.lastRun.startTime | relativeTime }}
          </span>
          <button mat-icon-button type="button" matTooltip="Ver detalhes" (click)="togglePipeline(pipeline.id)">
            <mat-icon>{{ expandedPipelineId() === pipeline.id ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>

        <div class="pipeline-detail" *ngIf="expandedPipelineId() === pipeline.id">
          <div class="detail-item">
            <span>Origens</span>
            <div class="sources-list"><code *ngFor="let source of pipeline.sources">{{ source }}</code></div>
          </div>
          <div class="detail-item"><span>SLA</span><strong>{{ pipeline.sla || '-' }}</strong></div>
          <div class="detail-item"><span>Duração média</span><strong>{{ pipeline.avgDuration | duration }}</strong></div>
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
    .summary-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 1px; margin-bottom: 18px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; background: var(--border-subtle); }
    .summary-item { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; background: var(--bg-surface); }
    .summary-value { font-size: 26px; font-weight: 800; line-height: 1; }

    .filters-panel { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filter-field { width: 168px; margin-bottom: -20px; }
    .search-field { flex: 1 1 280px; min-width: 260px; }
    .clear-button { margin-left: auto; }

    .alerts-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px 14px; border: 1px solid var(--warning-500); border-radius: var(--radius-md); background: var(--warning-bg); color: var(--text-primary); }
    .alerts-banner button { margin-left: auto; }
    .alerts-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .alert-row { display: grid; grid-template-columns: auto 1fr auto auto; gap: 12px; align-items: center; padding: 12px 14px; border: 1px solid var(--border-subtle); border-left-width: 4px; border-radius: var(--radius-md); background: var(--bg-surface); }

    .list-shell { border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow-x: auto; background: var(--bg-surface); }
    .list-toolbar { display: flex; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
    .list-toolbar span { color: var(--text-secondary); font-size: 12px; }
    .pipeline-grid { display: grid; grid-template-columns: minmax(280px, 2.2fr) 76px 92px minmax(210px, 1.4fr) 96px 150px minmax(190px, 1.2fr) 44px; gap: 12px; align-items: center; padding: 12px 16px; }
    .pipeline-grid--head { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; background: var(--bg-app); border-bottom: 1px solid var(--border-subtle); }
    .pipeline-row { border-bottom: 1px solid var(--border-subtle); }
    .pipeline-row:last-child { border-bottom: 0; }
    .pipeline-row--open { background: var(--bg-elevated); }
    .pipeline-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .pipeline-main div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .pipeline-main strong { color: var(--text-primary); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pipeline-main span { color: var(--text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sigla, .type-pill, .layer-pill, .golden-pill { display: inline-flex; width: fit-content; align-items: center; border-radius: 6px; padding: 3px 7px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .sigla { color: var(--brand-300); background: var(--bg-overlay); border: 1px solid var(--border-subtle); }
    .type-pill { color: var(--text-secondary); background: var(--bg-app); border: 1px solid var(--border-subtle); }
    .layer-pill { color: var(--info-500); background: var(--info-bg); }
    .golden-pill { color: var(--success-500); background: var(--success-bg); }
    .target-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
    code { max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 12px; }
    .last-run { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 12px; }

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
  allAlerts = this.data.pipelineAlerts();
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  squadFilter = 'all';
  siglaFilter = 'all';
  layerFilter: DataLayer | 'all' = 'all';
  goldenFilter: GoldenFilter = 'all';
  showAlerts = false;

  filteredPipelines = signal<Pipeline[]>(this.accessiblePipelines());
  expandedPipelineId = signal<string | null>(null);

  siglas = Array.from(new Set(this.accessiblePipelines().map(pipeline => pipeline.sigla))).sort();

  summaries = [
    { label: 'Total', count: this.accessiblePipelines().length, color: 'var(--text-primary)' },
    { label: 'Completados', count: this.accessiblePipelines().filter(p => p.status === 'completed').length, color: 'var(--success-500)' },
    { label: 'Executando', count: this.accessiblePipelines().filter(p => p.status === 'running').length, color: 'var(--warning-500)' },
    { label: 'Com Falha', count: this.accessiblePipelines().filter(p => p.status === 'failed').length, color: 'var(--danger-500)' },
    { label: 'Atrasados', count: this.accessiblePipelines().filter(p => p.status === 'delayed').length, color: 'var(--warning-700)' },
    { label: 'Pendentes', count: this.accessiblePipelines().filter(p => p.status === 'pending').length, color: 'var(--text-muted)' },
    { label: 'Desligados', count: this.accessiblePipelines().filter(p => p.status === 'offline').length, color: 'var(--text-disabled)' },
  ];

  readonly statusLabels: Record<string, string> = {
    pending: 'Pendente',
    running: 'Executando',
    completed: 'Completado',
    failed: 'Falha',
    delayed: 'Atrasado',
    offline: 'Desligado',
  };

  get unresolvedAlerts(): PipelineAlert[] {
    return this.allAlerts.filter(alert => !alert.acknowledged);
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  refresh(): void {
    this.data.refreshOperationalSnapshot();
    this.allPipelines = this.data.pipelines();
    this.allAlerts = this.data.pipelineAlerts();
    this.applyFilters();
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
    if (this.statusFilter !== 'all') result = result.filter(pipeline => pipeline.status === this.statusFilter);
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
}
