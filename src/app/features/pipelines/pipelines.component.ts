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
    <app-page-header title="Pipelines" subtitle="Manage and monitor data pipelines" icon="account_tree">
      <button mat-stroked-button color="primary">
        <mat-icon>refresh</mat-icon> Refresh
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
          <input matInput placeholder="Search pipelines..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
            <mat-option value="all">All</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="running">Running</mat-option>
            <mat-option value="failed">Failed</mat-option>
            <mat-option value="paused">Paused</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()">
            <mat-option value="all">All</mat-option>
            <mat-option value="ingestion">Ingestion</mat-option>
            <mat-option value="transformation">Transformation</mat-option>
            <mat-option value="export">Export</mat-option>
            <mat-option value="orchestration">Orchestration</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-card>

    <!-- Alerts Banner -->
    <mat-card class="alerts-banner" *ngIf="unresolvedAlerts.length > 0">
      <mat-icon color="warn">warning</mat-icon>
      <span><strong>{{ unresolvedAlerts.length }} pipeline alerts</strong> require attention</span>
      <span class="spacer"></span>
      <button mat-button color="warn" (click)="showAlerts = !showAlerts">
        {{ showAlerts ? 'Hide' : 'Show' }} Alerts
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
              <app-status-badge [status]="pipeline.status"></app-status-badge>
              <strong>{{ pipeline.name }}</strong>
            </mat-panel-title>
            <mat-panel-description class="panel-description">
              <mat-chip>{{ pipeline.type | titlecase }}</mat-chip>
              <span class="schedule-text">{{ pipeline.schedule }}</span>
              <span class="owner-text">{{ pipeline.team }}</span>
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="pipeline-detail">
            <p class="description">{{ pipeline.description }}</p>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Source</span>
                <span class="detail-value">{{ pipeline.source }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Target</span>
                <span class="detail-value">{{ pipeline.target }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">SLA</span>
                <span class="detail-value">{{ pipeline.sla | duration }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Avg Duration</span>
                <span class="detail-value">{{ pipeline.avgDuration | duration }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Owner</span>
                <span class="detail-value">{{ pipeline.owner }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Last Run</span>
                <span class="detail-value">
                  <app-status-badge [status]="pipeline.lastRun.status"></app-status-badge>
                  {{ pipeline.lastRun.startTime | relativeTime }}
                </span>
              </div>
            </div>

            <div class="tags-row" *ngIf="pipeline.tags.length">
              <mat-chip-set>
                <mat-chip *ngFor="let tag of pipeline.tags">{{ tag }}</mat-chip>
              </mat-chip-set>
            </div>

            <div class="steps-section" *ngIf="pipeline.lastRun.steps?.length">
              <h4>Last Run Steps</h4>
              <div class="steps-row">
                <div *ngFor="let step of pipeline.lastRun.steps; let last = last" class="step-item">
                  <div class="step-dot" [class]="'dot-' + step.status"></div>
                  <span class="step-name">{{ step.name }}</span>
                  <mat-icon class="step-arrow" *ngIf="!last">arrow_forward</mat-icon>
                </div>
              </div>
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

    .steps-section h4 { margin: 0 0 12px; font-size: 14px; color: #444; }
    .steps-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .step-item { display: flex; align-items: center; gap: 6px; }
    .step-dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-succeeded { background: #2e7d32; }
    .dot-running { background: #e65100; animation: pulse 1.5s infinite; }
    .dot-failed { background: #c62828; }
    .dot-pending { background: #bdbdbd; }
    .dot-skipped { background: #9e9e9e; }
    .step-name { font-size: 13px; }
    .step-arrow { font-size: 16px; width: 16px; height: 16px; color: #bbb; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  `],
})
export class PipelinesComponent {
  allPipelines = MOCK_PIPELINES;
  allAlerts = MOCK_PIPELINE_ALERTS;
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  showAlerts = false;

  filteredPipelines = signal<Pipeline[]>(this.allPipelines);

  summaries = [
    { label: 'Total', count: this.allPipelines.length, color: '#333' },
    { label: 'Active', count: this.allPipelines.filter(p => p.status === 'active').length, color: '#2e7d32' },
    { label: 'Running', count: this.allPipelines.filter(p => p.status === 'running').length, color: '#e65100' },
    { label: 'Failed', count: this.allPipelines.filter(p => p.status === 'failed').length, color: '#c62828' },
    { label: 'Paused', count: this.allPipelines.filter(p => p.status === 'paused').length, color: '#757575' },
  ];

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
    this.filteredPipelines.set(result);
  }
}
