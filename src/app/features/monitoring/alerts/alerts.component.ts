import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { MOCK_RECENT_ALERTS } from '../../../core/mocks/dashboard.mock';
import { MonitoringAlert } from '../../../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule, MatBadgeModule, MatTooltipModule,
    StatusBadgeComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Summary -->
    <div class="summary-row">
      <mat-card class="summary-card critical" (click)="severityFilter = 'critical'; applyFilter()">
        <span class="summary-count">{{ criticalCount }}</span>
        <span class="summary-label">Critical</span>
      </mat-card>
      <mat-card class="summary-card high" (click)="severityFilter = 'high'; applyFilter()">
        <span class="summary-count">{{ highCount }}</span>
        <span class="summary-label">High</span>
      </mat-card>
      <mat-card class="summary-card medium" (click)="severityFilter = 'medium'; applyFilter()">
        <span class="summary-count">{{ mediumCount }}</span>
        <span class="summary-label">Medium</span>
      </mat-card>
      <mat-card class="summary-card low" (click)="severityFilter = 'low'; applyFilter()">
        <span class="summary-count">{{ lowCount }}</span>
        <span class="summary-label">Low</span>
      </mat-card>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Severity</mat-label>
        <mat-select [(ngModel)]="severityFilter" (ngModelChange)="applyFilter()">
          <mat-option value="all">All</mat-option>
          <mat-option value="critical">Critical</mat-option>
          <mat-option value="high">High</mat-option>
          <mat-option value="medium">Medium</mat-option>
          <mat-option value="low">Low</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
          <mat-option value="all">All</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="acknowledged">Acknowledged</mat-option>
          <mat-option value="resolved">Resolved</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilter()">
          <mat-option value="all">All</mat-option>
          <mat-option value="pipeline">Pipeline</mat-option>
          <mat-option value="data_quality">Data Quality</mat-option>
          <mat-option value="infrastructure">Infrastructure</mat-option>
          <mat-option value="cost">Cost</mat-option>
          <mat-option value="security">Security</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Alert List -->
    <div class="alerts-list">
      <mat-card *ngFor="let alert of filteredAlerts()" class="alert-card" [class]="'severity-border-' + alert.severity">
        <div class="alert-content">
          <div class="alert-icon">
            <mat-icon [class]="'severity-icon-' + alert.severity">{{ getSeverityIcon(alert.severity) }}</mat-icon>
          </div>
          <div class="alert-body">
            <div class="alert-header-row">
              <h4 class="alert-title">{{ alert.title }}</h4>
              <div class="alert-badges">
                <app-status-badge [status]="alert.severity"></app-status-badge>
                <app-status-badge [status]="alert.status"></app-status-badge>
                <mat-chip>{{ alert.category | titlecase }}</mat-chip>
              </div>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-footer">
              <span class="alert-source"><mat-icon inline>source</mat-icon> {{ alert.source }}</span>
              <span class="alert-time"><mat-icon inline>schedule</mat-icon> {{ alert.timestamp | relativeTime }}</span>
              <span *ngIf="alert.acknowledgedBy" class="alert-ack"><mat-icon inline>person</mat-icon> {{ alert.acknowledgedBy }}</span>
            </div>
          </div>
          <div class="alert-actions">
            <button mat-icon-button matTooltip="Acknowledge" *ngIf="alert.status === 'active'">
              <mat-icon>check_circle_outline</mat-icon>
            </button>
            <button mat-icon-button matTooltip="View details">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .summary-card { cursor: pointer; text-align: center; padding: 16px; transition: transform 0.15s; }
    .summary-card:hover { transform: translateY(-2px); }
    .summary-count { font-size: 32px; font-weight: 700; display: block; }
    .summary-label { font-size: 13px; color: #666; }
    .critical .summary-count { color: #c62828; }
    .high .summary-count { color: #e65100; }
    .medium .summary-count { color: #f9a825; }
    .low .summary-count { color: #1565c0; }

    .filters-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-field { min-width: 150px; }
    .filter-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    .alerts-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-card { overflow: hidden; }
    .severity-border-critical { border-left: 4px solid #c62828; }
    .severity-border-high { border-left: 4px solid #e65100; }
    .severity-border-medium { border-left: 4px solid #f9a825; }
    .severity-border-low { border-left: 4px solid #1565c0; }

    .alert-content { display: flex; gap: 16px; align-items: flex-start; }
    .alert-icon { padding-top: 4px; }
    .severity-icon-critical { color: #c62828; }
    .severity-icon-high { color: #e65100; }
    .severity-icon-medium { color: #f9a825; }
    .severity-icon-low { color: #1565c0; }

    .alert-body { flex: 1; }
    .alert-header-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .alert-title { margin: 0; font-size: 15px; flex: 1; }
    .alert-badges { display: flex; gap: 8px; align-items: center; }
    .alert-message { font-size: 14px; color: #555; margin: 8px 0; }
    .alert-footer { display: flex; gap: 16px; font-size: 13px; color: #888; }
    .alert-footer mat-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }
    .alert-actions { display: flex; flex-direction: column; }
  `],
})
export class AlertsComponent {
  allAlerts = MOCK_RECENT_ALERTS;
  severityFilter = 'all';
  statusFilter = 'all';
  categoryFilter = 'all';
  filteredAlerts = signal<MonitoringAlert[]>(this.allAlerts);

  get criticalCount(): number { return this.allAlerts.filter(a => a.severity === 'critical').length; }
  get highCount(): number { return this.allAlerts.filter(a => a.severity === 'high').length; }
  get mediumCount(): number { return this.allAlerts.filter(a => a.severity === 'medium').length; }
  get lowCount(): number { return this.allAlerts.filter(a => a.severity === 'low').length; }

  getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = { critical: 'error', high: 'warning', medium: 'info', low: 'info_outline' };
    return icons[severity] || 'info';
  }

  applyFilter(): void {
    let result = this.allAlerts;
    if (this.severityFilter !== 'all') result = result.filter(a => a.severity === this.severityFilter);
    if (this.statusFilter !== 'all') result = result.filter(a => a.status === this.statusFilter);
    if (this.categoryFilter !== 'all') result = result.filter(a => a.category === this.categoryFilter);
    this.filteredAlerts.set(result);
  }
}
