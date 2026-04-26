import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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
import { DataQualityTableFormComponent } from '../../shared/components/data-quality-table-form/data-quality-table-form.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { PlatformDataService } from '../../core/services/platform-data.service';
import { DataQualityCustomRule, DataQualityTableRegistration, DataQualityTableRegistrationDraft } from '../../core/models';

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule,
    MatTableModule, MatSortModule, MatTooltipModule,
    PageHeaderComponent, MetricCardComponent, StatusBadgeComponent, DataQualityTableFormComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Qualidade de Dados" subtitle="Cadastre tabelas para o motor de qualidade e monitore regras derivadas" icon="verified">
      <button mat-stroked-button color="primary" (click)="showCreateForm.set(true)">
        <mat-icon>add</mat-icon> Cadastrar Tabela
      </button>
    </app-page-header>

    <section class="create-panel" *ngIf="showCreateForm()">
      <app-data-quality-table-form
        [value]="tableRegistrationDraft"
        title="Cadastrar qualidade por tabela"
        description="Após liberar acesso à role do motor de qualidade, consulte a tabela e complete chave primária, validações genéricas e regras customizadas."
        submitLabel="Cadastrar tabela"
        (metadataRequested)="loadSampleMetadata()"
        (saved)="saveTableRegistration($event)"
        (cancelled)="showCreateForm.set(false)">
      </app-data-quality-table-form>
    </section>

    <!-- Score Overview -->
    <div class="metrics-grid">
      <app-metric-card label="Score Geral" [value]="overallScore" icon="speed" suffix="%" iconBg="#e8f5e9" iconColor="#2e7d32" [trend]="'up'" [changePercent]="2.1"></app-metric-card>
      <app-metric-card label="Tabelas Cadastradas" [value]="tableRegistrations().length" icon="table_chart" iconBg="#e3f2fd" iconColor="#1565c0" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Regras Aprovadas" [value]="passingCount" icon="check_circle" iconBg="#e8f5e9" iconColor="#2e7d32" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Regras Reprovadas" [value]="failingCount" icon="cancel" iconBg="#ffebee" iconColor="#c62828" [showTrend]="false"></app-metric-card>
    </div>

    <mat-card class="registrations-card">
      <mat-card-header>
        <mat-card-title>Tabelas sob qualidade</mat-card-title>
        <mat-card-subtitle>Cadastros por tabela disponíveis para varredura do motor</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="registration-list">
          <div class="registration-row registration-row--head">
            <span>Tabela</span><span>Role</span><span>PK</span><span>Customizadas</span><span>Status</span>
          </div>
          <div class="registration-row" *ngFor="let registration of tableRegistrations()">
            <code>{{ registration.qualifiedName }}</code>
            <span>{{ registration.engineRole }}</span>
            <span>{{ registration.primaryKeyColumns.join(', ') || '-' }}</span>
            <span>{{ registration.customRules.length }}</span>
            <app-status-badge [status]="registration.status" [label]="registrationStatusLabel(registration.status)"></app-status-badge>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

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
      <table mat-table [dataSource]="filteredRules()" matSort class="rules-table">
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
    .create-panel { margin-bottom: 20px; }

    .registrations-card { margin-bottom: 16px; }
    .registration-list { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
    .registration-row { display: grid; grid-template-columns: 1.2fr 1.4fr 1fr 110px 150px; gap: 12px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
    .registration-row:last-child { border-bottom: 0; }
    .registration-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }

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
  private readonly data = inject(PlatformDataService);

  allRules = signal(this.data.dqRules());
  tableRegistrations = signal(this.data.dqTableRegistrations());
  trends = this.data.dqTrends();
  filteredRules = signal([...this.allRules()]);
  showCreateForm = signal(false);
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  displayedColumns = ['status', 'name', 'dataset', 'ruleType', 'score', 'lastEvaluated'];

  tableRegistrationDraft: Partial<DataQualityTableRegistrationDraft> = {
    database: '',
    tableName: '',
    qualifiedName: '',
    owner: 'Data Platform',
    engineRole: 'role_data_quality_engine_prod',
    columns: [],
    primaryKeyColumns: [],
    qualitativeValidations: '',
    quantitativeValidations: '',
    customRulesText: '',
  };

  latestTrend = this.trends[this.trends.length - 1];

  dimensions = [
    { name: 'Completude', score: this.latestTrend.completeness, icon: 'check_box', color: '#1a237e' },
    { name: 'Unicidade', score: this.latestTrend.uniqueness, icon: 'fingerprint', color: '#4a148c' },
    { name: 'Validade', score: this.latestTrend.validity, icon: 'rule', color: '#004d40' },
    { name: 'Consistência', score: this.latestTrend.consistency, icon: 'sync', color: '#e65100' },
    { name: 'Atualidade', score: this.latestTrend.freshness, icon: 'schedule', color: '#1565c0' },
  ];

  get overallScore(): number { return this.latestTrend.overallScore; }
  get passingCount(): number { return this.allRules().filter(r => r.status === 'passing').length; }
  get failingCount(): number { return this.allRules().filter(r => r.status === 'failing').length; }
  get warningCount(): number { return this.allRules().filter(r => r.status === 'warning').length; }

  applyFilters(): void {
    let result = this.allRules();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(term) || r.dataset.toLowerCase().includes(term));
    }
    if (this.statusFilter !== 'all') result = result.filter(r => r.status === this.statusFilter);
    if (this.typeFilter !== 'all') result = result.filter(r => r.ruleType === this.typeFilter);
    this.filteredRules.set(result);
  }

  registrationStatusLabel(status: DataQualityTableRegistration['status']): string {
    return ({
      draft: 'Rascunho',
      registered: 'Cadastrada',
      waiting_access: 'Aguardando acesso',
      ready_to_scan: 'Pronta para scan',
    } as const)[status];
  }

  loadSampleMetadata(): void {
    this.tableRegistrationDraft = {
      database: 'spec',
      tableName: 'customer_360',
      qualifiedName: 'spec.customer_360',
      owner: 'Squad B',
      engineRole: 'role_data_quality_engine_prod',
      rowCount: 2500000,
      sizeGb: 42.7,
      columns: [
        { name: 'customer_id', type: 'STRING', nullable: false, description: 'Chave funcional do cliente' },
        { name: 'email', type: 'STRING', nullable: true, description: 'E-mail principal' },
        { name: 'total_orders', type: 'INT', nullable: false },
        { name: 'ltv', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false },
      ],
      primaryKeyColumns: ['customer_id'],
      qualitativeValidations: '',
      quantitativeValidations: '',
      customRulesText: '',
    };
  }

  saveTableRegistration(draft: DataQualityTableRegistrationDraft): void {
    this.data.addDataQualityTableRegistration(this.toTableRegistration(draft));
    this.tableRegistrations.set(this.data.dqTableRegistrations());
    this.showCreateForm.set(false);
  }

  private toTableRegistration(draft: DataQualityTableRegistrationDraft): DataQualityTableRegistration {
    const now = new Date().toISOString();
    return {
      id: `dq-table-${this.tableRegistrations().length + 1}`,
      database: draft.database,
      tableName: draft.tableName,
      qualifiedName: draft.qualifiedName || `${draft.database}.${draft.tableName}`,
      owner: draft.owner,
      engineRole: draft.engineRole,
      rowCount: draft.rowCount,
      sizeGb: draft.sizeGb,
      columns: draft.columns,
      primaryKeyColumns: draft.primaryKeyColumns,
      qualitativeValidations: draft.qualitativeValidations,
      quantitativeValidations: draft.quantitativeValidations,
      customRules: this.parseCustomRules(draft.customRulesText),
      status: draft.columns.length ? 'ready_to_scan' : 'waiting_access',
      createdAt: now,
      updatedAt: now,
    };
  }

  private parseCustomRules(text: string): DataQualityCustomRule[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [field = '', expression = '', threshold = '0', severity = 'medium'] = line.split('|').map(part => part.trim());
        return {
          field,
          expression,
          threshold: Number(threshold) || 0,
          severity: this.normalizeSeverity(severity),
        };
      });
  }

  private normalizeSeverity(value: string): DataQualityCustomRule['severity'] {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'medium';
  }
}
