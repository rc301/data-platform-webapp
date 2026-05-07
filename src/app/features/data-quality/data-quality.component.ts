import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataQualityTableFormComponent } from '../../shared/components/data-quality-table-form/data-quality-table-form.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { AccessService } from '../../core/access/access.service';
import { PlatformDataService } from '../../core/services/platform-data.service';
import {
  CatalogAsset,
  DataQualityCustomRule,
  DataQualityRule,
  DataQualityTableColumn,
  DataQualityTableRegistration,
  DataQualityTableRegistrationDraft,
} from '../../core/models';

interface TableQualityRow {
  asset: CatalogAsset;
  score: number;
  status: 'approved' | 'warning' | 'critical';
  rules: DataQualityRule[];
  slaBreaches: number;
}

interface FieldMetricRow {
  field: string;
  type: string;
  kind: 'qualitative' | 'quantitative';
  metrics: Array<{ name: string; score: number }>;
}

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule,
    MatSelectModule, MatTabsModule, MatTooltipModule,
    PageHeaderComponent, StatusBadgeComponent, DataQualityTableFormComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Qualidade de Dados" subtitle="Acompanhe a qualidade das tabelas monitoradas pela plataforma" icon="verified">
      <button mat-stroked-button color="primary" *ngIf="canManageMetadata()" (click)="showCreateForm.set(true)">
        <mat-icon>add</mat-icon> Cadastrar qualidade
      </button>
    </app-page-header>

    <section class="create-panel" *ngIf="showCreateForm() && canManageMetadata()">
      <app-data-quality-table-form
        [value]="tableRegistrationDraft"
        title="Cadastrar qualidade por tabela"
        description="Após liberar acesso à role do motor, consulte metadata da tabela e complete chave primária, validações e regras customizadas."
        submitLabel="Cadastrar tabela"
        (metadataRequested)="loadSampleMetadata()"
        (saved)="saveTableRegistration($event)"
        (cancelled)="showCreateForm.set(false)">
      </app-data-quality-table-form>
    </section>

    <mat-tab-group animationDuration="160ms">
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">monitoring</mat-icon> Hoje</ng-template>

        <section class="kpi-grid">
          <article class="kpi-card">
            <span>Tabelas aprovadas</span>
            <strong>{{ approvedTablesPct() }}%</strong>
            <small>{{ approvedTablesCount() }} de {{ monitoredTablesCount() }} tabelas monitoradas hoje.</small>
          </article>
          <article class="kpi-card">
            <span>Estouro de SLA</span>
            <strong>{{ slaBreachesToday() }}</strong>
            <small>Pilar de temporalidade nas execuções de hoje.</small>
          </article>
          <article class="kpi-card">
            <span>Qualidade 100%</span>
            <strong>{{ perfectTablesCount() }}</strong>
            <small>Tabelas sem desvio nas regras avaliadas.</small>
          </article>
        </section>

        <section class="panel">
          <div class="panel__head">
            <div>
              <span>Panorama operacional</span>
              <strong>Qualidade das tabelas monitoradas</strong>
            </div>
            <small>{{ tableQualityRows().length }} tabelas</small>
          </div>

          <div class="quality-table">
            <div class="quality-row quality-row--head">
              <span>Tabela</span><span>Score</span><span>Status</span><span>SLA</span><span>Regras</span>
            </div>
            <div class="quality-row" *ngFor="let row of tableQualityRows()">
              <div class="main">
                <strong>{{ row.asset.name }}</strong>
                <code>{{ row.asset.qualifiedName }}</code>
              </div>
              <div class="score">
                <strong>{{ row.score }}%</strong>
                <mat-progress-bar [value]="row.score"></mat-progress-bar>
              </div>
              <app-status-badge [status]="row.status === 'approved' ? 'passing' : row.status === 'warning' ? 'warning' : 'failing'" [label]="qualityStatusLabel(row.status)"></app-status-badge>
              <span>{{ row.slaBreaches ? row.slaBreaches + ' estouro(s)' : 'Sem estouro' }}</span>
              <span>{{ row.rules.length }}</span>
            </div>
          </div>
        </section>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">table_chart</mat-icon> Detalhe da Tabela</ng-template>

        <section class="filters">
          <mat-form-field appearance="outline" class="table-select">
            <mat-label>Tabela</mat-label>
            <mat-select [ngModel]="selectedTableName()" (ngModelChange)="selectedTableName.set($event)">
              <mat-option *ngFor="let row of tableQualityRows()" [value]="row.asset.qualifiedName">
                {{ row.asset.qualifiedName }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </section>

        <section class="detail-layout" *ngIf="selectedTableRow() as row">
          <article class="panel score-panel">
            <div class="panel__head">
              <div>
                <span>Últimos 5 dias</span>
                <strong>{{ row.asset.name }}</strong>
              </div>
              <div class="score-hero">
                <span>Score atual</span>
                <strong>{{ row.score }}%</strong>
              </div>
            </div>
            <div class="daily-score-grid">
              <div class="daily-score-card" *ngFor="let point of lastFiveScores()">
                <span>{{ point.date | date:'dd/MM' }}</span>
                <strong>{{ point.score }}%</strong>
                <div class="daily-score-card__bar">
                  <i [style.width.%]="point.score"></i>
                </div>
              </div>
            </div>
          </article>

          <article class="panel">
            <div class="panel__head">
              <div>
                <span>Campos e métricas</span>
                <strong>Qualidade por tipo de dado</strong>
              </div>
            </div>
            <div class="field-list">
              <div class="field-row" *ngFor="let field of fieldMetricRows()">
                <div class="field-row__head">
                  <div>
                    <strong>{{ field.field }}</strong>
                    <span>{{ field.type }} · {{ field.kind === 'qualitative' ? 'Qualitativo' : 'Quantitativo' }}</span>
                  </div>
                </div>
                <div class="metric-pills">
                  <span class="metric-pill" *ngFor="let metric of field.metrics">
                    {{ metric.name }} <strong>{{ metric.score }}%</strong>
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article class="panel">
            <div class="panel__head">
              <div>
                <span>Regras ativas</span>
                <strong>Monitoramento da tabela</strong>
              </div>
            </div>
            <div class="rules-list">
              <div class="rule-line" *ngFor="let rule of rulesForSelectedTable()">
                <app-status-badge [status]="rule.status"></app-status-badge>
                <div>
                  <strong>{{ rule.name }}</strong>
                  <span>{{ rule.description }}</span>
                </div>
                <code>{{ rule.column || 'tabela' }}</code>
              </div>
            </div>
          </article>
        </section>
      </mat-tab>

      <mat-tab *ngIf="canManageMetadata()">
        <ng-template mat-tab-label><mat-icon class="tab-icon">rule</mat-icon> Metadados</ng-template>

        <section class="kpi-grid kpi-grid--compact">
          <article class="kpi-card">
            <span>Tabelas cadastradas</span>
            <strong>{{ tableRegistrations().length }}</strong>
            <small>Metadados prontos para o motor de qualidade.</small>
          </article>
          <article class="kpi-card">
            <span>Regras qualitativas</span>
            <strong>{{ qualitativeRuleTemplates.length }}</strong>
            <small>Templates genéricos ativos.</small>
          </article>
          <article class="kpi-card">
            <span>Regras quantitativas</span>
            <strong>{{ quantitativeRuleTemplates.length }}</strong>
            <small>Templates genéricos ativos.</small>
          </article>
        </section>

        <section class="metadata-grid">
          <article class="panel">
            <div class="panel__head"><div><span>Campos qualitativos</span><strong>Regras monitoradas</strong></div></div>
            <label class="check-row" *ngFor="let rule of qualitativeRuleTemplates">
              <input type="checkbox" checked>
              <span>{{ rule }}</span>
            </label>
          </article>
          <article class="panel">
            <div class="panel__head"><div><span>Campos quantitativos</span><strong>Regras ativas</strong></div></div>
            <label class="check-row" *ngFor="let rule of quantitativeRuleTemplates">
              <input type="checkbox" checked>
              <span>{{ rule }}</span>
            </label>
          </article>
        </section>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .tab-icon { margin-right: 6px; }
    .create-panel { margin-bottom: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 16px 0; }
    .kpi-grid--compact { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .kpi-card, .panel { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
    .kpi-card { padding: 16px; }
    .kpi-card span, .panel__head span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .kpi-card strong { display: block; margin-top: 8px; color: var(--text-primary); font-size: 30px; line-height: 1; }
    .kpi-card small { display: block; margin-top: 8px; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .panel { overflow: hidden; }
    .panel__head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
    .panel__head div { display: flex; flex-direction: column; gap: 4px; }
    .panel__head strong { color: var(--text-primary); font-size: 14px; }
    .panel__head small { color: var(--text-muted); font-size: 12px; }
    .quality-table { overflow-x: auto; }
    .quality-row { display: grid; grid-template-columns: minmax(240px, 1.4fr) 170px 140px 130px 80px; gap: 14px; align-items: center; min-width: 840px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .quality-row:last-child { border-bottom: 0; }
    .quality-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .main strong, .field-row strong, .rule-line strong { color: var(--text-primary); font-size: 13px; }
    code { width: fit-content; max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .score { display: flex; flex-direction: column; gap: 6px; }
    .score strong { color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .filters { margin: 16px 0; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .table-select { width: min(520px, 100%); margin-bottom: -20px; }
    .detail-layout { display: grid; grid-template-columns: 1fr; gap: 14px; }
    .score-panel { background: var(--bg-surface); }
    .score-hero { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; padding: 10px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-overlay); min-width: 140px; }
    .score-hero span { color: var(--text-muted); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .score-hero strong { color: var(--text-primary); font-size: 34px; line-height: 1; font-variant-numeric: tabular-nums; }
    .daily-score-grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; padding: 16px; }
    .daily-score-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: var(--radius-md); background: var(--bg-app); border: 1px solid var(--border-subtle); }
    .daily-score-card span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .daily-score-card strong { color: var(--text-primary); font-size: 26px; line-height: 1; font-variant-numeric: tabular-nums; }
    .daily-score-card__bar { height: 6px; overflow: hidden; border-radius: 999px; background: var(--bg-overlay); }
    .daily-score-card__bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .field-list, .rules-list { display: flex; flex-direction: column; }
    .field-row, .rule-line { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .field-row:last-child, .rule-line:last-child { border-bottom: 0; }
    .field-row__head div, .rule-line div { display: flex; flex-direction: column; gap: 3px; }
    .field-row span, .rule-line span { color: var(--text-secondary); font-size: 12px; }
    .metric-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .metric-pill { display: inline-flex; gap: 6px; align-items: center; padding: 4px 8px; border-radius: 999px; background: var(--bg-overlay); color: var(--text-secondary); font-size: 11px; }
    .metric-pill strong { color: var(--text-primary); font-size: 11px; }
    .rule-line { display: grid; grid-template-columns: 110px minmax(220px, 1fr) auto; gap: 12px; align-items: center; }
    .metadata-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; margin-top: 16px; }
    .check-row { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .check-row:last-child { border-bottom: 0; }
    .check-row input { accent-color: var(--brand-400); }
    @media (max-width: 760px) {
      .rule-line { grid-template-columns: 1fr; }
      .daily-score-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DataQualityComponent {
  private readonly data = inject(PlatformDataService);
  private readonly access = inject(AccessService);

  readonly allRules = this.data.dqRules;
  readonly tableRegistrations = this.data.dqTableRegistrations;
  showCreateForm = signal(false);
  selectedTableName = signal('');

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

  qualitativeRuleTemplates = [
    'Completude mínima de campos obrigatórios',
    'Formato válido para identificadores e e-mails',
    'Domínio de valores permitido',
    'Consistência semântica com cadastro mestre',
  ];

  quantitativeRuleTemplates = [
    'Faixa mínima e máxima esperada',
    'Detecção de outliers por janela histórica',
    'Distribuição estatística dentro do padrão',
    'Variação diária de volume dentro do limite',
  ];

  tableQualityRows = computed<TableQualityRow[]>(() => {
    const tables = this.data.catalogAssets().filter(asset => asset.type === 'table');
    return tables.map(asset => {
      const rules = this.rulesForAsset(asset);
      const score = rules.length ? Math.round(rules.reduce((sum, rule) => sum + rule.currentScore, 0) / rules.length) : this.seedScore(asset.name);
      const slaBreaches = rules.filter(rule => rule.ruleType === 'freshness' && rule.status !== 'passing').length;
      return {
        asset,
        rules,
        score,
        slaBreaches,
        status: score >= 95 ? 'approved' : score >= 90 ? 'warning' : 'critical',
      };
    });
  });

  selectedTableRow = computed(() => {
    const rows = this.tableQualityRows();
    const selected = this.selectedTableName() || rows[0]?.asset.qualifiedName;
    return rows.find(row => row.asset.qualifiedName === selected) ?? rows[0] ?? null;
  });

  monitoredTablesCount = computed(() => this.tableQualityRows().length);
  approvedTablesCount = computed(() => this.tableQualityRows().filter(row => row.status === 'approved').length);
  approvedTablesPct = computed(() => this.monitoredTablesCount() ? Math.round((this.approvedTablesCount() / this.monitoredTablesCount()) * 100) : 0);
  slaBreachesToday = computed(() => this.tableQualityRows().reduce((sum, row) => sum + row.slaBreaches, 0));
  perfectTablesCount = computed(() => this.tableQualityRows().filter(row => row.score === 100).length);

  lastFiveScores = computed(() => {
    const base = this.selectedTableRow()?.score ?? 95;
    return this.data.dqTrends().slice(-5).map((trend, index) => ({
      date: trend.date,
      score: Math.max(80, Math.min(100, Math.round(base - 2 + index + this.seedOffset(trend.date)))),
    }));
  });

  rulesForSelectedTable = computed(() => this.selectedTableRow()?.rules ?? []);

  fieldMetricRows = computed<FieldMetricRow[]>(() => {
    const row = this.selectedTableRow();
    const registration = row ? this.registrationFor(row.asset) : undefined;
    const columns = registration?.columns?.length ? registration.columns : this.fallbackColumns(row?.asset);
    return columns.map(column => {
      const kind = this.isQuantitative(column) ? 'quantitative' : 'qualitative';
      return {
        field: column.name,
        type: column.type,
        kind,
        metrics: (kind === 'quantitative' ? ['Completude', 'Faixa válida', 'Outliers', 'Distribuição'] : ['Completude', 'Validade', 'Padronização', 'Consistência'])
          .map((name, index) => ({ name, score: this.metricScore(column.name, index) })),
      };
    });
  });

  canManageMetadata(): boolean {
    const roles = this.access.context()?.roles ?? [];
    return roles.some(role => ['techlead', 'coordinator', 'manager', 'platform-admin'].includes(role));
  }

  qualityStatusLabel(status: TableQualityRow['status']): string {
    return ({ approved: 'Aprovada', warning: 'Atenção', critical: 'Crítica' } as const)[status];
  }

  loadSampleMetadata(): void {
    const asset = this.selectedTableRow()?.asset ?? this.data.catalogAssets().find(item => item.qualifiedName === 'spec.customer_360');
    const qualifiedName = asset?.qualifiedName ?? 'spec.customer_360';
    const { database, tableName } = this.splitQualifiedName(qualifiedName);
    const columns = asset?.schema?.columns?.length
      ? asset.schema.columns.map(column => ({
          name: column.name,
          type: column.type,
          nullable: column.isNullable,
          description: column.description,
        }))
      : this.fallbackColumns(asset);
    this.tableRegistrationDraft = {
      database,
      tableName,
      qualifiedName,
      owner: asset?.supportSquad ?? 'Data Platform',
      engineRole: 'role_data_quality_engine_prod',
      rowCount: asset?.name === 'customer_360' ? 2500000 : undefined,
      sizeGb: asset?.name === 'customer_360' ? 42.7 : undefined,
      columns,
      primaryKeyColumns: columns.filter(column => /(^|_)id$/i.test(column.name)).slice(0, 1).map(column => column.name),
      qualitativeValidations: '',
      quantitativeValidations: '',
      customRulesText: '',
    };
  }

  saveTableRegistration(draft: DataQualityTableRegistrationDraft): void {
    this.data.addDataQualityTableRegistration(this.toTableRegistration(draft));
    this.showCreateForm.set(false);
  }

  private rulesForAsset(asset: CatalogAsset): DataQualityRule[] {
    return this.allRules().filter(rule => this.sameQualifiedName(rule.dataset, asset.qualifiedName));
  }

  private registrationFor(asset: CatalogAsset): DataQualityTableRegistration | undefined {
    return this.tableRegistrations().find(registration => this.sameQualifiedName(registration.qualifiedName, asset.qualifiedName));
  }

  private fallbackColumns(asset?: CatalogAsset): DataQualityTableColumn[] {
    if (asset?.schema?.columns?.length) {
      return asset.schema.columns.map(column => ({
        name: column.name,
        type: column.type,
        nullable: column.isNullable,
        description: column.description,
      }));
    }
    const prefix = asset?.name ?? 'tabela';
    return [
      { name: `${prefix}_id`, type: 'STRING', nullable: false },
      { name: 'descricao', type: 'STRING', nullable: true },
      { name: 'valor_total', type: 'DECIMAL(18,2)', nullable: true },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false },
    ];
  }

  private isQuantitative(column: DataQualityTableColumn): boolean {
    return /int|decimal|double|float|number|numeric|bigint/i.test(column.type);
  }

  private seedScore(value: string): number {
    return 88 + (this.hash(value) % 13);
  }

  private metricScore(value: string, index: number): number {
    return 86 + ((this.hash(value) + index * 7) % 15);
  }

  private seedOffset(value: string): number {
    return this.hash(value) % 3;
  }

  private hash(value: string): number {
    return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
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

  private sameQualifiedName(left: string, right: string): boolean {
    return this.normalizeQualifiedName(left) === this.normalizeQualifiedName(right);
  }

  private normalizeQualifiedName(value: string): string {
    return value.trim().toLowerCase().replace(/^datalake\./, '');
  }

  private splitQualifiedName(qualifiedName: string): { database: string; tableName: string } {
    const parts = qualifiedName.split('.');
    return {
      database: parts.length > 1 ? parts.slice(0, -1).join('.') : 'default',
      tableName: parts.at(-1) ?? qualifiedName,
    };
  }
}
