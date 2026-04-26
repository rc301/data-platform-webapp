import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiButtonComponent,
  UiBadgeComponent,
  UiStatComponent,
} from '../../../shared/ui';
import { JOURNEY_STAGES } from '../pipeline-builder/journey-config';

@Component({
  selector: 'app-dev-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    UiPageHeaderComponent, UiCardComponent, UiButtonComponent, UiBadgeComponent, UiStatComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Construir, revisar e publicar pipelines"
      subtitle="Inicie uma nova jornada guiada por agentes ou continue uma jornada em andamento.">
      <div page-actions>
        <ui-button variant="primary" icon="+" routerLink="/dev/new-pipeline">Nova Pipeline</ui-button>
      </div>
    </ui-page-header>

    <div class="stats-row">
      <ui-stat label="Jornadas em andamento" value="3" hint="você é owner em 2" trend="up" delta="+1" deltaPeriod="esta semana" />
      <ui-stat label="Pipelines em produção" value="14" trend="flat" delta="0" deltaPeriod="vs. semana anterior" />
      <ui-stat label="PRs abertos" value="5" trend="up" delta="+2" deltaPeriod="hoje" />
      <ui-stat label="Cobertura de testes" value="86%" trend="up" delta="+3pp" deltaPeriod="último deploy" />
    </div>

    <div class="grid">
      <ui-card eyebrow="Início rápido" title="Jornada de criação de pipeline" subtitle="Etapas guiadas com aprovação humana entre cada uma.">
        <div card-actions>
          <ui-button variant="primary" routerLink="/dev/new-pipeline">Iniciar nova jornada →</ui-button>
        </div>
        <div class="stages-grid">
          <div class="stage-pill" *ngFor="let s of stages">
            <span class="stage-pill__num">{{ s.index }}</span>
            <span class="stage-pill__title">{{ s.title }}</span>
            <ui-badge tone="brand">{{ s.badge }}</ui-badge>
          </div>
        </div>
      </ui-card>

      <ui-card eyebrow="Continue de onde parou" title="Jornadas ativas">
        <div class="journey-row" *ngFor="let j of activeJourneys">
          <div class="journey-row__main">
            <span class="journey-row__name">{{ j.name }}</span>
            <span class="journey-row__meta">{{ j.domain }} · {{ j.squad }}</span>
          </div>
          <div class="journey-row__progress">
            <div class="journey-row__bar"><div [style.width.%]="j.progress"></div></div>
            <span class="journey-row__pct">{{ j.progress }}%</span>
          </div>
          <ui-button variant="secondary" size="sm" routerLink="/dev/new-pipeline">Continuar</ui-button>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }

    .stages-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .stage-pill {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: var(--bg-app); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }
    .stage-pill__num {
      width: 22px; height: 22px; border-radius: 6px;
      background: var(--bg-overlay); color: var(--brand-300);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
      border: 1px solid var(--border-subtle);
    }
    .stage-pill__title { flex: 1; font-size: 13px; color: var(--text-primary); }

    .journey-row { display: grid; grid-template-columns: 1fr 200px auto; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); }
    .journey-row:last-child { border-bottom: 0; }
    .journey-row__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .journey-row__name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .journey-row__meta { font-size: 12px; color: var(--text-muted); }
    .journey-row__progress { display: flex; align-items: center; gap: 8px; }
    .journey-row__bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
    .journey-row__bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .journey-row__pct { font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

    @media (max-width: 1100px) {
      .grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DevHomeComponent {
  stages = JOURNEY_STAGES;
  activeJourneys = [
    { name: 'customer_360', domain: 'Comercial', squad: 'Squad B', progress: 27 },
    { name: 'risk_exposure_daily', domain: 'Risco', squad: 'Squad C', progress: 64 },
    { name: 'iot_sensor_anomaly', domain: 'Operações', squad: 'Squad C', progress: 9 },
  ];
}
