import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UiPageHeaderComponent, UiCardComponent, UiStatComponent, UiBadgeComponent,
} from '../../../shared/ui';

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
      <ui-stat label="SLA agregado" value="97.4%" trend="flat" delta="—" deltaPeriod="objetivo: 99%" />
      <ui-stat label="Janela MTTR (P50)" value="14 min" trend="down" delta="-3 min" deltaPeriod="vs. mar/26" />
      <ui-stat label="Janela MTTR (P90)" value="48 min" trend="flat" delta="+1 min" />
      <ui-stat label="Incidentes/mês" value="11" trend="down" delta="-2" deltaPeriod="vs. mar/26" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Janelas de risco" title="Concentração horária de SLAs">
        <div class="window-list">
          <div class="window-row" *ngFor="let w of windows">
            <span class="window-row__hour">{{ w.hour }}</span>
            <div class="window-row__bar"><div [style.width.%]="(w.count / maxWindow) * 100"></div></div>
            <span class="window-row__count">{{ w.count }} jobs</span>
            <ui-badge [tone]="w.count > 12 ? 'danger' : w.count > 8 ? 'warning' : 'neutral'">
              {{ w.count > 12 ? 'Alta concentração' : w.count > 8 ? 'Atenção' : 'Saudável' }}
            </ui-badge>
          </div>
        </div>
      </ui-card>

      <ui-card eyebrow="Squad" title="Carga por squad" subtitle="Pipelines em produção e incidentes no mês.">
        <table class="tbl">
          <thead><tr><th>Squad</th><th>Pipelines</th><th>Incidentes</th><th>SLA</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of squads">
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
  windows = [
    { hour: '03:00', count: 5 },
    { hour: '04:00', count: 7 },
    { hour: '05:00', count: 9 },
    { hour: '06:00', count: 14 },
    { hour: '07:00', count: 11 },
    { hour: '08:00', count: 6 },
    { hour: '12:00', count: 3 },
    { hour: '18:00', count: 4 },
    { hour: '23:00', count: 8 },
  ];
  maxWindow = 14;

  squads = [
    { name: 'Squad A', pipelines: 32, incidents: 4, sla: 96.2 },
    { name: 'Squad B', pipelines: 41, incidents: 2, sla: 98.8 },
    { name: 'Squad C', pipelines: 38, incidents: 5, sla: 95.4 },
    { name: 'Squad D', pipelines: 12, incidents: 0, sla: 100.0 },
    { name: 'Squad E', pipelines: 9,  incidents: 1, sla: 99.1 },
  ];
}
