import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { MOCK_METRICS, MOCK_HEALTH_CHECKS, MOCK_RECENT_ALERTS } from '../../core/mocks/dashboard.mock';
import { MOCK_PIPELINES } from '../../core/mocks/pipelines.mock';
import { MonitoringAlert, HealthCheck } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatListModule, MatDividerModule, MatProgressBarModule,
    PageHeaderComponent, MetricCardComponent, StatusBadgeComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Dashboard" subtitle="Data Platform overview and health status" icon="dashboard">
      <button mat-stroked-button color="primary" routerLink="/monitoring/alerts">
        <mat-icon>notifications</mat-icon> View All Alerts
      </button>
    </app-page-header>

    <!-- KPI Metrics -->
    <div class="metrics-grid">
      <app-metric-card
        label="Pipelines Active" [value]="metrics[0].value" icon="account_tree"
        [trend]="metrics[0].trend" [changePercent]="metrics[0].changePercent"
        iconBg="#e8eaf6" iconColor="#1a237e" [clickable]="true"
      ></app-metric-card>
      <app-metric-card
        label="Data Quality" [value]="metrics[1].value" icon="verified" suffix="%"
        [trend]="metrics[1].trend" [changePercent]="metrics[1].changePercent"
        iconBg="#e8f5e9" iconColor="#2e7d32" [clickable]="true"
      ></app-metric-card>
      <app-metric-card
        label="Jobs Running" [value]="metrics[2].value" icon="play_circle"
        [trend]="metrics[2].trend" [changePercent]="metrics[2].changePercent"
        iconBg="#fff3e0" iconColor="#e65100" [clickable]="true"
      ></app-metric-card>
      <app-metric-card
        label="Active Alerts" [value]="metrics[3].value" icon="warning"
        [trend]="metrics[3].trend" [changePercent]="metrics[3].changePercent"
        iconBg="#ffebee" iconColor="#c62828" [clickable]="true"
      ></app-metric-card>
      <app-metric-card
        label="S3 Storage" [value]="metrics[4].value" icon="cloud_queue" suffix=" TB"
        [trend]="metrics[4].trend" [changePercent]="metrics[4].changePercent"
        iconBg="#e3f2fd" iconColor="#1565c0"
      ></app-metric-card>
      <app-metric-card
        label="Monthly Cost" [value]="metrics[5].value" icon="attach_money" prefix="$"
        [trend]="metrics[5].trend" [changePercent]="metrics[5].changePercent"
        iconBg="#f3e5f5" iconColor="#7b1fa2"
      ></app-metric-card>
    </div>

    <div class="dashboard-grid">
      <!-- Recent Alerts -->
      <mat-card class="alerts-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-avatar warn-avatar">warning</mat-icon>
          <mat-card-title>Recent Alerts</mat-card-title>
          <mat-card-subtitle>{{ activeAlerts }} active alerts</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item *ngFor="let alert of recentAlerts" class="alert-item">
              <mat-icon matListItemIcon [class]="'severity-' + alert.severity">
                {{ getSeverityIcon(alert.severity) }}
              </mat-icon>
              <div matListItemTitle>{{ alert.title }}</div>
              <div matListItemLine class="alert-meta">
                <app-status-badge [status]="alert.severity" [label]="alert.severity | titlecase"></app-status-badge>
                <span class="alert-time">{{ alert.timestamp | relativeTime }}</span>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary" routerLink="/monitoring/alerts">View All Alerts</button>
        </mat-card-actions>
      </mat-card>

      <!-- Service Health -->
      <mat-card class="health-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-avatar health-avatar">favorite</mat-icon>
          <mat-card-title>Service Health</mat-card-title>
          <mat-card-subtitle>{{ healthyServices }}/{{ healthChecks.length }} services healthy</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="health-list">
            <div *ngFor="let hc of healthChecks" class="health-row">
              <div class="health-name">
                <div class="health-dot" [class]="'dot-' + hc.status"></div>
                {{ hc.service }}
              </div>
              <span class="health-latency">{{ hc.latency }}ms</span>
              <span class="health-uptime">{{ hc.uptime }}%</span>
              <app-status-badge [status]="hc.status"></app-status-badge>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Pipeline Status -->
      <mat-card class="pipeline-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-avatar pipeline-avatar">account_tree</mat-icon>
          <mat-card-title>Pipeline Status</mat-card-title>
          <mat-card-subtitle>{{ runningPipelines }} running, {{ failedPipelines }} failed</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="pipeline-list">
            <div *ngFor="let p of pipelines" class="pipeline-row" [routerLink]="'/pipelines'" class="clickable-row">
              <div class="pipeline-info">
                <span class="pipeline-name">{{ p.name }}</span>
                <span class="pipeline-meta">{{ p.type | titlecase }} · {{ p.team }}</span>
              </div>
              <app-status-badge [status]="p.status"></app-status-badge>
            </div>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary" routerLink="/pipelines">View All Pipelines</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
    }

    .card-avatar { border-radius: 12px !important; display: flex; align-items: center; justify-content: center; }
    .warn-avatar { background: #ffebee; color: #c62828; }
    .health-avatar { background: #e8f5e9; color: #2e7d32; }
    .pipeline-avatar { background: #e8eaf6; color: #1a237e; }

    .alert-item { margin-bottom: 4px; }
    .alert-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .alert-time { font-size: 12px; color: #999; }

    .severity-critical { color: #c62828; }
    .severity-high { color: #e65100; }
    .severity-medium { color: #f9a825; }
    .severity-low { color: #1565c0; }

    .health-list { display: flex; flex-direction: column; gap: 8px; }
    .health-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .health-name { flex: 1; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14px; }
    .health-dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-healthy { background: #2e7d32; }
    .dot-degraded { background: #e65100; }
    .dot-down { background: #c62828; }
    .health-latency { font-size: 13px; color: #666; min-width: 50px; text-align: right; }
    .health-uptime { font-size: 13px; color: #666; min-width: 50px; text-align: right; }

    .pipeline-list { display: flex; flex-direction: column; gap: 4px; }
    .pipeline-row { display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 8px; }
    .clickable-row { cursor: pointer; transition: background 0.15s; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }
    .pipeline-info { display: flex; flex-direction: column; }
    .pipeline-name { font-weight: 500; font-size: 14px; }
    .pipeline-meta { font-size: 12px; color: #888; }
  `],
})
export class DashboardComponent {
  metrics = MOCK_METRICS;
  healthChecks = MOCK_HEALTH_CHECKS;
  recentAlerts = MOCK_RECENT_ALERTS;
  pipelines = MOCK_PIPELINES;

  get activeAlerts(): number {
    return this.recentAlerts.filter(a => a.status === 'active').length;
  }

  get healthyServices(): number {
    return this.healthChecks.filter(h => h.status === 'healthy').length;
  }

  get runningPipelines(): number {
    return this.pipelines.filter(p => p.status === 'running').length;
  }

  get failedPipelines(): number {
    return this.pipelines.filter(p => p.status === 'failed').length;
  }

  getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = { critical: 'error', high: 'warning', medium: 'info', low: 'info_outline' };
    return icons[severity] || 'info';
  }
}
