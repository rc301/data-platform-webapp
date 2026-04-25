import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { MOCK_PIPELINES, MOCK_PIPELINE_ALERTS } from '../../core/mocks/pipelines.mock';
import { Pipeline, PipelineAlert } from '../../core/models';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatBadgeModule,
    MatProgressBarModule, MatTooltipModule, MatDividerModule, MatExpansionModule,
    PageHeaderComponent, StatusBadgeComponent, RelativeTimePipe, DurationPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Pipelines" subtitle="Gerencie e monitore pipelines de dados" icon="account_tree">
      <button mat-stroked-button color="primary">
        <mat-icon>refresh</mat-icon> Atualizar
      </button>
    </app-page-header>

    <!-- Summary Cards -->
    <div class="summary-row">
      <mat-card class="summary-card" *ngFor="let s of summaries">
        <div class="summary-content">
          <span class="summary-value" [style.color]="s.color">{{ s.count }}</span>
          <span class="summary-label">{{ s.label }}</span>
        </div>
      </mat-card>
    </div>

    <!-- Filters -->
    <mat-card class="filters-card">
      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-field search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Buscar pipelines..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
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
          <mat-label>Squad</mat-label>
          <mat-select [(ngModel)]="squadFilter" (ngModelChange)="applyFilters()">
            <mat-option value="all">Todas</mat-option>
            <mat-option value="Squad A">Squad A</mat-option>
            <mat-option value="Squad B">Squad B</mat-option>
            <mat-option value="Squad C">Squad C</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-card>

    <!-- Alerts Banner -->
    <mat-card class="alerts-banner" *ngIf="unresolvedAlerts.length > 0">
      <mat-icon color="warn">warning</mat-icon>
      <span><strong>{{ unresolvedAlerts.length }} alertas de pipeline</strong> requerem atenção</span>
      <span class="spacer"></span>
      <button mat-button color="warn" (click)="showAlerts = !showAlerts">
        {{ showAlerts ? 'Ocultar' : 'Mostrar' }} Alertas
      </button>
    </mat-card>

    <div class="alerts-list" *ngIf="showAlerts">
      <mat-card *ngFor="let alert of unresolvedAlerts" class="alert-card" [class]="'alert-' + alert.severity">
        <div class="alert-row">
          <mat-icon>{{ alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info' }}</mat-icon>
          <div class="alert-info">
            <strong>{{ alert.pipelineName }}</strong>
            <span>{{ alert.message }}</span>
          </div>
          <app-status-badge [status]="alert.severity" [label]="alert.type | titlecase"></app-status-badge>
          <span class="alert-time">{{ alert.timestamp | relativeTime }}</span>
        </div>
      </mat-card>
    </div>

    <!-- Pipeline List -->
    <div class="pipeline-list">
      <mat-accordion multi>
        <mat-expansion-panel *ngFor="let pipeline of filteredPipelines()" class="pipeline-panel">
          <mat-expansion-panel-header>
            <mat-panel-title class="panel-title">
              <app-status-badge [status]="pipeline.status" [label]="statusLabel(pipeline.status)"></app-status-badge>
              <strong>{{ pipeline.name }}</strong>
            </mat-panel-title>
            <mat-panel-description class="panel-description">
              <mat-chip>{{ pipeline.type }}</mat-chip>
              <span class="schedule-text">{{ pipeline.schedule }}</span>
              <span class="owner-text">{{ pipeline.team }}</span>
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="pipeline-detail">
            <p class="description">{{ pipeline.description }}</p>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Origens</span>
                <div class="detail-value sources-list">
                  <code *ngFor="let s of pipeline.sources">{{ s }}</code>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Destino</span>
                <span class="detail-value">{{ pipeline.target }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">SLA</span>
                <span class="detail-value">{{ pipeline.sla || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Duração Média</span>
                <span class="detail-value">{{ pipeline.avgDuration | duration }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Responsável</span>
                <span class="detail-value">{{ pipeline.owner }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Última Execução</span>
                <span class="detail-value">
                  <app-status-badge [status]="pipeline.lastRun.status" [label]="statusLabel(pipeline.lastRun.status)"></app-status-badge>
                  {{ pipeline.lastRun.startTime | relativeTime }}
                </span>
              </div>
            </div>

            <div class="tags-row" *ngIf="pipeline.tags.length">
              <mat-chip-set>
                <mat-chip *ngFor="let tag of pipeline.tags">{{ tag }}</mat-chip>
              </mat-chip-set>
            </div>

          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: [`
    .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .summary-card { text-align: center; }
    .summary-content { display: flex; flex-direction: column; padding: 12px; }
    .summary-value { font-size: 32px; font-weight: 700; }
    .summary-label { font-size: 13px; color: #666; margin-top: 4px; }

    .filters-card { margin-bottom: 16px; }
    .filters-row { display: flex; gap: 12px; padding: 16px; flex-wrap: wrap; }
    .filter-field { margin-bottom: -20px; }
    .search-field { flex: 1; min-width: 200px; }

    .alerts-banner { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 16px; background: #fff3e0; }
    .spacer { flex: 1; }

    .alerts-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .alert-card { padding: 12px 16px; }
    .alert-critical { border-left: 4px solid #c62828; }
    .alert-high { border-left: 4px solid #e65100; }
    .alert-medium { border-left: 4px solid #f9a825; }
    .alert-low { border-left: 4px solid #1565c0; }
    .alert-row { display: flex; align-items: center; gap: 12px; }
    .alert-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert-info span { font-size: 13px; color: #666; }
    .alert-time { font-size: 12px; color: #999; white-space: nowrap; }

    .pipeline-list { margin-top: 16px; }
    .pipeline-panel { margin-bottom: 8px; }
    .panel-title { display: flex; align-items: center; gap: 12px; min-width: 280px; }
    .panel-description { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
    .schedule-text, .owner-text { font-size: 13px; color: #666; }

    .pipeline-detail { padding: 8px 0; }
    .description { color: #555; margin-bottom: 16px; font-size: 14px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; color: #333; display: flex; align-items: center; gap: 8px; }

    .tags-row { margin-bottom: 16px; }
    .sources-list { display: flex; flex-direction: column; gap: 4px; }
    .sources-list code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; }
  `],
})
export class PipelinesComponent {
  allPipelines = MOCK_PIPELINES;
  allAlerts = MOCK_PIPELINE_ALERTS;
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  squadFilter = 'all';
  showAlerts = false;

  filteredPipelines = signal<Pipeline[]>(this.allPipelines);

  summaries = [
    { label: 'Total', count: this.allPipelines.length, color: '#333' },
    { label: 'Completados', count: this.allPipelines.filter(p => p.status === 'completed').length, color: '#2e7d32' },
    { label: 'Executando', count: this.allPipelines.filter(p => p.status === 'running').length, color: '#e65100' },
    { label: 'Com Falha', count: this.allPipelines.filter(p => p.status === 'failed').length, color: '#c62828' },
    { label: 'Atrasados', count: this.allPipelines.filter(p => p.status === 'delayed').length, color: '#f57c00' },
    { label: 'Pendentes', count: this.allPipelines.filter(p => p.status === 'pending').length, color: '#757575' },
    { label: 'Desligados', count: this.allPipelines.filter(p => p.status === 'offline').length, color: '#9e9e9e' },
  ];

  readonly statusLabels: Record<string, string> = {
    pending: 'Pendente',
    running: 'Executando',
    completed: 'Completado',
    failed: 'Falha',
    delayed: 'Atrasado',
    offline: 'Desligado',
  };

  statusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  get unresolvedAlerts(): PipelineAlert[] {
    return this.allAlerts.filter(a => !a.acknowledged);
  }

  applyFilters(): void {
    let result = this.allPipelines;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.team.toLowerCase().includes(term));
    }
    if (this.statusFilter !== 'all') {
      result = result.filter(p => p.status === this.statusFilter);
    }
    if (this.typeFilter !== 'all') {
      result = result.filter(p => p.type === this.typeFilter);
    }
    if (this.squadFilter !== 'all') {
      result = result.filter(p => p.team === this.squadFilter);
    }
    this.filteredPipelines.set(result);
  }
}
