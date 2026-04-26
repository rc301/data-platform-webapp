import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent,
} from '../../../shared/ui';

interface JourneyRow {
  id: string;
  name: string;
  domain: string;
  squad: string;
  currentStage: string;
  progress: number;
  status: 'active' | 'review' | 'blocked' | 'done';
  updatedAt: string;
}

@Component({
  selector: 'app-journeys-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Minhas jornadas"
      subtitle="Acompanhe o progresso e retome jornadas em curso.">
      <div page-actions>
        <ui-button variant="primary" link="/dev/new-pipeline">+ Nova jornada</ui-button>
      </div>
    </ui-page-header>

    <ui-card [padded]="false">
      <table class="tbl">
        <thead>
          <tr>
            <th>Pipeline</th><th>Domínio</th><th>Squad</th>
            <th>Etapa atual</th><th>Progresso</th><th>Status</th>
            <th>Atualizado</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td class="tbl__name">{{ r.name }}</td>
            <td>{{ r.domain }}</td>
            <td>{{ r.squad }}</td>
            <td class="tbl__stage">{{ r.currentStage }}</td>
            <td class="tbl__progress">
              <div class="bar"><div [style.width.%]="r.progress"></div></div>
              <span>{{ r.progress }}%</span>
            </td>
            <td><ui-badge [tone]="toneFor(r.status)">{{ labelFor(r.status) }}</ui-badge></td>
            <td class="tbl__muted">{{ r.updatedAt }}</td>
            <td><ui-button size="sm" variant="secondary" link="/dev/new-pipeline">Abrir</ui-button></td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl thead th {
      text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);
    }
    .tbl tbody td { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl tbody tr:hover { background: rgba(76,141,255,0.04); }
    .tbl__name { color: var(--text-primary); font-weight: 600; }
    .tbl__stage { color: var(--text-primary); }
    .tbl__muted { color: var(--text-muted); font-size: 12px; }
    .tbl__progress { display: flex; align-items: center; gap: 10px; min-width: 160px; }
    .bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
    .bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .tbl__progress > span { font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; font-size: 12px; }
  `],
})
export class JourneysListComponent {
  rows: JourneyRow[] = [
    { id: '1', name: 'customer_360', domain: 'Comercial', squad: 'Squad B', currentStage: 'Infra de sandbox', progress: 27, status: 'review', updatedAt: 'há 12 min' },
    { id: '2', name: 'risk_exposure_daily', domain: 'Risco', squad: 'Squad C', currentStage: 'Deploy Dev/Hml', progress: 64, status: 'active', updatedAt: 'há 1 h' },
    { id: '3', name: 'iot_sensor_anomaly', domain: 'Operações', squad: 'Squad C', currentStage: 'RFC', progress: 9, status: 'blocked', updatedAt: 'há 3 dias' },
    { id: '4', name: 'finance_curated_v2', domain: 'Financeiro', squad: 'Squad C', currentStage: 'Documentação', progress: 95, status: 'review', updatedAt: 'ontem' },
  ];

  toneFor(s: JourneyRow['status']) {
    return ({ active: 'info', review: 'warning', blocked: 'danger', done: 'success' } as const)[s];
  }
  labelFor(s: JourneyRow['status']) {
    return ({ active: 'Em andamento', review: 'Aguarda aprovação', blocked: 'Bloqueada', done: 'Concluída' } as const)[s];
  }
}
