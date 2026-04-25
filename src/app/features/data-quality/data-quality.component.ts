import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { MOCK_DQ_RULES, MOCK_DQ_TRENDS } from '../../core/mocks/data-quality.mock';

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule,
    MatTableModule, MatSortModule, MatTooltipModule,
    PageHeaderComponent, MetricCardComponent, StatusBadgeComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Qualidade de Dados" subtitle="Monitore regras e scores de qualidade de dados em datasets" icon="verified">
      <button mat-stroked-button color="primary">
        <mat-icon>add</mat-icon> Nova Regra
      </button>
    </app-page-header>

    <!-- Score Overview -->
    <div class="metrics-grid">
      <app-metric-card label="Score Geral" [value]="overallScore" icon="speed" suffix="%" iconBg="#e8f5e9" iconColor="#2e7d32" [trend]="'up'" [changePercent]="2.1"></app-metric-card>
      <app-metric-card label="Regras Aprovadas" [value]="passingCount" icon="check_circle" iconBg="#e8f5e9" iconColor="#2e7d32" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Regras Reprovadas" [value]="failingCount" icon="cancel" iconBg="#ffebee" iconColor="#c62828" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Regras em Alerta" [value]="warningCount" icon="warning" iconBg="#fff3e0" iconColor="#e65100" [showTrend]="false"></app-metric-card>
    </div>

    <!-- Score Breakdown -->
    <mat-card class="breakdown-card">
      <mat-card-header>
        <mat-card-title>Dimensões de Qualidade</mat-card-title>
        <mat-card-subtitle>Detalhamento do score por dimensão de qualidade</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="dimension-grid">
          <div *ngFor="let dim of dimensions" class="dimension-item">
            <div class="dim-header">
              <mat-icon [style.color]="dim.color">{{ dim.icon }}</mat-icon>
              <span class="dim-name">{{ dim.name }}</span>
              <span class="dim-score" [style.color]="dim.score >= 95 ? '#2e7d32' : dim.score >= 90 ? '#e65100' : '#c62828'">{{ dim.score }}%</span>
            </div>
            <mat-progress-bar [value]="dim.score" [color]="dim.score >= 95 ? 'primary' : dim.score >= 90 ? 'accent' : 'warn'"></mat-progress-bar>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Filters -->
    <mat-card class="filters-card">
      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-field search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Buscar regras..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
            <mat-option value="all">Todos</mat-option>
            <mat-option value="passing">Aprovada</mat-option>
            <mat-option value="failing">Reprovada</mat-option>
            <mat-option value="warning">Alerta</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()">
            <mat-option value="all">Todos</mat-option>
            <mat-option value="completeness">Completude</mat-option>
            <mat-option value="uniqueness">Unicidade</mat-option>
            <mat-option value="validity">Validade</mat-option>
            <mat-option value="consistency">Consistência</mat-option>
            <mat-option value="freshness">Atualidade</mat-option>
            <mat-option value="accuracy">Acurácia</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-card>

    <!-- Rules Table -->
    <mat-card class="rules-card">
      <table mat-table [dataSource]="filteredRules" matSort class="rules-table">
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let rule"><app-status-badge [status]="rule.status"></app-status-badge></td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
          <td mat-cell *matCellDef="let rule">
            <div class="rule-name-cell">
              <strong>{{ rule.name }}</strong>
              <span class="rule-desc">{{ rule.description }}</span>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="dataset">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Dataset</th>
          <td mat-cell *matCellDef="let rule"><code>{{ rule.dataset }}</code></td>
        </ng-container>
        <ng-container matColumnDef="ruleType">
          <th mat-header-cell *matHeaderCellDef>Tipo</th>
          <td mat-cell *matCellDef="let rule"><mat-chip>{{ rule.ruleType | titlecase }}</mat-chip></td>
        </ng-container>
        <ng-container matColumnDef="score">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Score</th>
          <td mat-cell *matCellDef="let rule">
            <div class="score-cell">
              <span class="score-value" [class.score-good]="rule.currentScore >= rule.threshold" [class.score-bad]="rule.currentScore < rule.threshold">{{ rule.currentScore }}%</span>
              <span class="score-threshold">/ {{ rule.threshold }}%</span>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="lastEvaluated">
          <th mat-header-cell *matHeaderCellDef>Última Avaliação</th>
          <td mat-cell *matCellDef="let rule">{{ rule.lastEvaluated | relativeTime }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="rule-row"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }

    .breakdown-card { margin-bottom: 16px; }
    .dimension-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .dimension-item { display: flex; flex-direction: column; gap: 8px; }
    .dim-header { display: flex; align-items: center; gap: 8px; }
    .dim-name { flex: 1; font-weight: 500; font-size: 14px; }
    .dim-score { font-weight: 700; font-size: 16px; }

    .filters-card { margin-bottom: 16px; }
    .filters-row { display: flex; gap: 12px; padding: 16px; flex-wrap: wrap; }
    .filter-field { margin-bottom: -20px; }
    .search-field { flex: 1; min-width: 200px; }

    .rules-card { overflow: hidden; }
    .rules-table { width: 100%; }
    .rule-row { cursor: pointer; }
    .rule-row:hover { background: rgba(0,0,0,0.04); }
    .rule-name-cell { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
    .rule-name-cell strong { font-size: 14px; }
    .rule-desc { font-size: 12px; color: #888; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .score-cell { display: flex; align-items: baseline; gap: 4px; }
    .score-value { font-weight: 700; font-size: 16px; }
    .score-good { color: #2e7d32; }
    .score-bad { color: #c62828; }
    .score-threshold { font-size: 12px; color: #999; }

    th.mat-mdc-header-cell { font-weight: 600; color: #444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  `],
})
export class DataQualityComponent {
  allRules = MOCK_DQ_RULES;
  trends = MOCK_DQ_TRENDS;
  filteredRules = [...this.allRules];
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  displayedColumns = ['status', 'name', 'dataset', 'ruleType', 'score', 'lastEvaluated'];

  latestTrend = this.trends[this.trends.length - 1];

  dimensions = [
    { name: 'Completude', score: this.latestTrend.completeness, icon: 'check_box', color: '#1a237e' },
    { name: 'Unicidade', score: this.latestTrend.uniqueness, icon: 'fingerprint', color: '#4a148c' },
    { name: 'Validade', score: this.latestTrend.validity, icon: 'rule', color: '#004d40' },
    { name: 'Consistência', score: this.latestTrend.consistency, icon: 'sync', color: '#e65100' },
    { name: 'Atualidade', score: this.latestTrend.freshness, icon: 'schedule', color: '#1565c0' },
  ];

  get overallScore(): number { return this.latestTrend.overallScore; }
  get passingCount(): number { return this.allRules.filter(r => r.status === 'passing').length; }
  get failingCount(): number { return this.allRules.filter(r => r.status === 'failing').length; }
  get warningCount(): number { return this.allRules.filter(r => r.status === 'warning').length; }

  applyFilters(): void {
    let result = this.allRules;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(term) || r.dataset.toLowerCase().includes(term));
    }
    if (this.statusFilter !== 'all') result = result.filter(r => r.status === this.statusFilter);
    if (this.typeFilter !== 'all') result = result.filter(r => r.ruleType === this.typeFilter);
    this.filteredRules = result;
  }
}
