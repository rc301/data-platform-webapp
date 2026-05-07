import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent, UiStatComponent, UiFarolComponent,
} from '../../../shared/ui';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { MonitoringAlert } from '../../../core/models';

interface SLAStatus { domain: string; total: number; healthy: number; }
interface ExecutiveRisk {
  severity: string;
  tone: 'danger' | 'warning' | 'info' | 'neutral';
  title: string;
  desc: string;
  owner: string;
}

@Component({
  selector: 'app-executive-overview',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent, UiStatComponent, UiFarolComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Gestão"
      title="KPIs da Plataforma de Dados"
      subtitle="Indicadores executivos consolidados — abril/2026.">
      <div page-actions>
        <ui-button variant="secondary" link="/executive/capacity">Capacidade & SLAs →</ui-button>
      </div>
    </ui-page-header>

    <!-- KPIs principais -->
    <div class="kpis">
      <ui-stat label="Runs com custo detalhado" [value]="detailedCostRuns()" trend="flat" delta="job run" hint="sem total global" />
      <ui-stat label="Jobs ativos" [value]="activePipelines()" trend="flat" delta="cadastro" deltaPeriod="plataforma" />
      <ui-stat label="Saúde média (SLA)" [value]="slaHealthPct() + '%'" trend="flat" delta="objetivo: 99%" />
      <ui-stat label="Registros processados" [value]="processedRecords()" trend="flat" delta="último run" />
      <ui-stat label="Squads ativas" [value]="activeSquads()" />
      <ui-stat label="Custo médio por run" [value]="avgCostPerDetailedRun()" trend="flat" delta="runs detalhados" />
    </div>

    <div class="grid">
      <!-- Saúde por domínio -->
      <ui-card eyebrow="Operação" title="Saúde de SLA por domínio" subtitle="Janela atual — abril/26.">
        <div class="sla-grid">
          <div class="sla-tile" *ngFor="let s of slaByDomain()">
            <div class="sla-tile__head">
              <span class="sla-tile__name">{{ s.domain }}</span>
              <ui-farol [status]="farolFor(s)" [label]="((s.healthy / s.total) * 100 | number:'1.0-0') + '%'" />
            </div>
            <div class="sla-tile__numbers">
              <span class="sla-tile__num">{{ s.healthy }}</span>
              <span class="sla-tile__sep">/</span>
              <span class="sla-tile__den">{{ s.total }}</span>
              <span class="sla-tile__hint">jobs no SLA</span>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Capacidade -->
      <ui-card eyebrow="Capacidade" title="Utilização de recursos" subtitle="Média móvel 7d.">
        <div class="cap-list">
          <div class="cap-row" *ngFor="let r of capacity()">
            <div class="cap-row__head">
              <span>{{ r.label }}</span>
              <span class="cap-row__value">{{ r.value }}%</span>
            </div>
            <div class="cap-row__track">
              <div class="cap-row__fill" [class.cap-row__fill--warn]="r.value > 75" [class.cap-row__fill--danger]="r.value > 90" [style.width.%]="r.value"></div>
            </div>
            <div class="cap-row__meta">{{ r.note }}</div>
          </div>
        </div>
      </ui-card>

      <!-- Riscos / Atenção -->
      <ui-card eyebrow="Riscos" title="Itens que demandam atenção">
        <div class="risk-list">
          <div class="risk-row" *ngFor="let r of risks()">
            <ui-badge [tone]="r.tone">{{ r.severity }}</ui-badge>
            <div class="risk-row__main">
              <span class="risk-row__title">{{ r.title }}</span>
              <span class="risk-row__desc">{{ r.desc }}</span>
            </div>
            <span class="risk-row__owner">{{ r.owner }}</span>
          </div>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; }

    /* SLA */
    .sla-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sla-tile {
      padding: 14px; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      display: flex; flex-direction: column; gap: 8px;
    }
    .sla-tile__head { display: flex; justify-content: space-between; align-items: center; }
    .sla-tile__name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .sla-tile__numbers { display: flex; align-items: baseline; gap: 4px; }
    .sla-tile__num { font-size: 22px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .sla-tile__sep { color: var(--text-muted); }
    .sla-tile__den { color: var(--text-secondary); font-weight: 600; }
    .sla-tile__hint { color: var(--text-muted); font-size: 11px; margin-left: 6px; }

    /* Capacidade */
    .cap-list { display: flex; flex-direction: column; gap: 14px; }
    .cap-row__head { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: var(--text-primary); margin-bottom: 4px; }
    .cap-row__value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .cap-row__track { height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden; }
    .cap-row__fill { height: 100%; background: var(--success-500); }
    .cap-row__fill--warn { background: var(--warning-500); }
    .cap-row__fill--danger { background: var(--danger-500); }
    .cap-row__meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

    /* Riscos */
    .risk-list { display: flex; flex-direction: column; }
    .risk-row { display: grid; grid-template-columns: 90px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); }
    .risk-row:last-child { border-bottom: 0; }
    .risk-row__main { display: flex; flex-direction: column; gap: 2px; }
    .risk-row__title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .risk-row__desc { font-size: 12px; color: var(--text-secondary); }
    .risk-row__owner { font-size: 11px; color: var(--text-muted); }

    @media (max-width: 1100px) {
      .grid { grid-template-columns: 1fr; }
      .sla-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ExecutiveOverviewComponent {
  private readonly data = inject(PlatformDataService);

  readonly detailedCostRuns = computed(() => this.data.pipelineRunCosts().filter(run => run.hasDiscriminatedCost).length);
  readonly activePipelines = computed(() => this.data.pipelines().filter(pipeline => pipeline.status !== 'offline').length);
  readonly activeSquads = computed(() => new Set(this.data.pipelines().map(pipeline => pipeline.team)).size);
  readonly slaHealthPct = computed(() => {
    const jobs = this.data.jobs();
    return jobs.length ? Math.round((jobs.filter(job => job.status === 'green').length / jobs.length) * 1000) / 10 : 0;
  });
  readonly processedRecords = computed(() => this.formatLargeNumber(
    this.data.pipelines().reduce((sum, pipeline) => sum + (pipeline.lastRun.recordsProcessed ?? 0), 0),
  ));
  readonly avgCostPerDetailedRun = computed(() => {
    const runs = this.data.pipelineRunCosts().filter(run => run.hasDiscriminatedCost && run.costUsd !== undefined);
    const avg = runs.length ? runs.reduce((sum, run) => sum + (run.costUsd ?? 0), 0) / runs.length : 0;
    return runs.length ? `US$ ${avg.toFixed(2)}` : 'Indisponível';
  });

  readonly slaByDomain = computed<SLAStatus[]>(() => {
    const assetsByTarget = new Map(this.data.catalogAssets().map(asset => [this.normalizeQualifiedName(asset.qualifiedName), asset]));
    const rows = new Map<string, SLAStatus>();
    for (const pipeline of this.data.pipelines()) {
      const asset = assetsByTarget.get(this.normalizeQualifiedName(pipeline.target));
      if (!asset) continue;
      const current = rows.get(asset.domain) ?? { domain: asset.domain, total: 0, healthy: 0 };
      current.total += 1;
      if (!['failed', 'delayed', 'offline'].includes(pipeline.status)) current.healthy += 1;
      rows.set(asset.domain, current);
    }
    return Array.from(rows.values()).sort((a, b) => a.domain.localeCompare(b.domain));
  });

  readonly capacity = computed(() => [
    { label: 'Glue (DPU horas / cota mensal)', value: 62, note: 'Tendência estável; folga confortável até o fim do mês.' },
    { label: 'Pipelines com custo detalhado', value: this.costCoveragePct(), note: 'Cobertura baseada apenas em job runs com custo discriminado.' },
    { label: 'Jobs com linhagem cadastrada', value: this.lineageCoveragePct(), note: 'Inclui linhagem automática e manual vinculada a pipelines.' },
    { label: 'Alertas ativos', value: Math.min(100, this.data.monitoringAlerts().filter(alert => alert.status === 'active').length * 20), note: 'Pressão operacional derivada de alertas ativos.' },
  ]);

  readonly risks = computed<ExecutiveRisk[]>(() =>
    this.data.monitoringAlerts()
      .filter(alert => alert.status !== 'resolved')
      .slice(0, 4)
      .map(alert => ({
        severity: this.severityLabel(alert.severity),
        tone: this.severityTone(alert.severity),
        title: alert.title,
        desc: alert.message,
        owner: this.ownerFor(alert),
      })),
  );

  farolFor(s: SLAStatus): 'green' | 'yellow' | 'red' {
    const pct = (s.healthy / s.total) * 100;
    if (pct >= 99) return 'green';
    if (pct >= 95) return 'yellow';
    return 'red';
  }

  private costCoveragePct(): number {
    const runs = this.data.pipelineRunCosts();
    return runs.length ? Math.round((runs.filter(run => run.hasDiscriminatedCost).length / runs.length) * 100) : 0;
  }

  private lineageCoveragePct(): number {
    const pipelines = this.data.pipelines();
    if (!pipelines.length) return 0;
    const graphPipelineIds = new Set(this.data.lineageGraphs().map(graph => graph.pipelineId).filter(Boolean));
    return Math.round((pipelines.filter(pipeline => graphPipelineIds.has(pipeline.id)).length / pipelines.length) * 100);
  }

  private ownerFor(alert: MonitoringAlert): string {
    if (alert.category === 'pipeline') {
      return this.data.pipelines().find(pipeline => pipeline.id === alert.relatedResource)?.team ?? 'Plataforma';
    }
    if (alert.category === 'data_quality') {
      return this.data.catalogAssets().find(asset => this.normalizeQualifiedName(asset.qualifiedName) === this.normalizeQualifiedName(alert.relatedResource))?.supportSquad ?? 'Qualidade';
    }
    return 'Plataforma';
  }

  private severityLabel(severity: MonitoringAlert['severity']): string {
    return ({ critical: 'CRÍTICO', high: 'ALTO', medium: 'MÉDIO', low: 'BAIXO', info: 'INFO' } as const)[severity];
  }

  private severityTone(severity: MonitoringAlert['severity']): ExecutiveRisk['tone'] {
    return severity === 'critical' ? 'danger' : severity === 'high' ? 'warning' : severity === 'medium' ? 'info' : 'neutral';
  }

  private formatLargeNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mi`;
    if (value >= 1_000) return `${Math.round(value / 1_000)} mil`;
    return String(value);
  }

  private normalizeQualifiedName(value: string): string {
    return value.trim().toLowerCase().replace(/^datalake\./, '');
  }
}
