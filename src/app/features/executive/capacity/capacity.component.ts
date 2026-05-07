import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UiPageHeaderComponent, UiCardComponent, UiStatComponent, UiBadgeComponent,
} from '../../../shared/ui';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-executive-capacity',
  standalone: true,
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiStatComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Gestão"
      title="Capacidade & SLAs"
      subtitle="Acompanhamento operacional consolidado, com janelas de risco e tendência por domínio." />

    <div class="kpis">
      <ui-stat label="SLA agregado" [value]="slaHealthPct() + '%'" trend="flat" delta="objetivo: 99%" />
      <ui-stat label="Jobs monitorados" [value]="monitoredJobs()" trend="flat" delta="faróis" />
      <ui-stat label="Alertas ativos" [value]="activeAlerts()" trend="flat" delta="operação" />
      <ui-stat label="Alertas pipeline/DQ" [value]="failedPipelineAlerts()" trend="flat" delta="ativos" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Janelas de risco" title="Concentração horária de SLAs">
        <div class="window-list">
          <div class="window-row" *ngFor="let w of windows()">
            <span class="window-row__hour">{{ w.hour }}</span>
            <div class="window-row__bar"><div [style.width.%]="(w.count / maxWindow()) * 100"></div></div>
            <span class="window-row__count">{{ w.count }} jobs</span>
            <ui-badge [tone]="w.count > 12 ? 'danger' : w.count > 8 ? 'warning' : 'neutral'">
              {{ w.count > 12 ? 'Alta concentração' : w.count > 8 ? 'Atenção' : 'Saudável' }}
            </ui-badge>
          </div>
        </div>
      </ui-card>

      <ui-card eyebrow="Squad" title="Carga por squad" subtitle="Pipelines cadastradas e incidentes ativos.">
        <table class="tbl">
          <thead><tr><th>Squad</th><th>Pipelines</th><th>Incidentes</th><th>SLA</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of squads()">
              <td class="tbl__name">{{ s.name }}</td>
              <td>{{ s.pipelines }}</td>
              <td><ui-badge [tone]="s.incidents > 3 ? 'danger' : s.incidents > 1 ? 'warning' : 'success'">{{ s.incidents }}</ui-badge></td>
              <td class="tbl__mono">{{ s.sla }}%</td>
            </tr>
          </tbody>
        </table>
      </ui-card>
    </div>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }

    .window-list { display: flex; flex-direction: column; gap: 10px; }
    .window-row { display: grid; grid-template-columns: 60px 1fr 90px 130px; gap: 12px; align-items: center; }
    .window-row__hour { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); }
    .window-row__bar { height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden; }
    .window-row__bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--warning-500)); }
    .window-row__count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }

    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th, .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); text-align: left; }
    .tbl th { font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.06em; }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary); font-weight: 600; }
    .tbl__mono { font-family: var(--font-mono); color: var(--text-primary); }

    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class CapacityComponent {
  private readonly data = inject(PlatformDataService);

  readonly monitoredJobs = computed(() => this.data.jobs().length);
  readonly activeAlerts = computed(() => this.data.monitoringAlerts().filter(alert => alert.status === 'active').length);
  readonly failedPipelineAlerts = computed(() =>
    this.data.monitoringAlerts().filter(alert => alert.status === 'active' && ['pipeline', 'data_quality'].includes(alert.category)).length,
  );
  readonly slaHealthPct = computed(() => {
    const jobs = this.data.jobs();
    return jobs.length ? Math.round((jobs.filter(job => job.status === 'green').length / jobs.length) * 1000) / 10 : 0;
  });

  readonly windows = computed(() => {
    const counts = new Map<string, number>();
    for (const job of this.data.jobs()) {
      const hour = `${job.expectedStartLocal.slice(0, 2)}:00`;
      counts.set(hour, (counts.get(hour) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  });

  readonly maxWindow = computed(() => Math.max(1, ...this.windows().map(window => window.count)));

  readonly squads = computed(() => {
    const rows = new Map<string, { name: string; pipelines: number; incidents: number; sla: number }>();
    for (const pipeline of this.data.pipelines()) {
      const row = rows.get(pipeline.team) ?? { name: pipeline.team, pipelines: 0, incidents: 0, sla: 100 };
      row.pipelines += 1;
      rows.set(pipeline.team, row);
    }
    for (const alert of this.data.pipelineAlerts()) {
      const pipeline = this.data.pipelines().find(item => item.id === alert.pipelineId);
      const team = pipeline?.team ?? 'Sem squad';
      const row = rows.get(team) ?? { name: team, pipelines: 0, incidents: 0, sla: 100 };
      row.incidents += alert.acknowledged ? 0 : 1;
      rows.set(team, row);
    }
    for (const row of rows.values()) {
      const jobs = this.data.jobs().filter(job => job.squad === row.name);
      row.sla = jobs.length ? Math.round((jobs.filter(job => job.status === 'green').length / jobs.length) * 1000) / 10 : 100;
    }
    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  });
}
