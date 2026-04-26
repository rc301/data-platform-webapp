import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent, UiStatComponent, UiFarolComponent,
} from '../../../shared/ui';

interface DomainSpend {
  domain: string;
  monthly: number;   // BRL
  pctOfTotal: number;
  trend: 'up' | 'down' | 'flat';
  delta: string;
}

interface SLAStatus { domain: string; total: number; healthy: number; }

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
        <ui-button variant="ghost">Exportar PDF</ui-button>
        <ui-button variant="secondary" link="/executive/capacity">Capacidade & SLAs →</ui-button>
      </div>
    </ui-page-header>

    <!-- KPIs principais -->
    <div class="kpis">
      <ui-stat label="Custo do mês (parcial)" value="R$ 184,2K" trend="up" delta="+6.8%" deltaPeriod="vs. mar/26" hint="forecast R$ 312K" />
      <ui-stat label="Pipelines em produção" value="142" trend="up" delta="+9" deltaPeriod="trimestre" />
      <ui-stat label="Saúde média (SLA)" value="97.4%" trend="flat" delta="—" deltaPeriod="objetivo: 99%" />
      <ui-stat label="Volume processado" value="48.6 TB" trend="up" delta="+12%" deltaPeriod="vs. mar/26" />
      <ui-stat label="Squads ativas" value="6" />
      <ui-stat label="Custo por TB" value="R$ 3.79" trend="down" delta="-4.1%" deltaPeriod="ganho de eficiência" />
    </div>

    <div class="grid">
      <!-- Custos por domínio -->
      <ui-card eyebrow="Custos" title="Distribuição mensal por domínio" subtitle="Soma S3 + Glue + Step Functions + RDS rateado.">
        <div card-actions>
          <ui-button variant="ghost" size="sm" link="/monitoring/costs">Detalhar →</ui-button>
        </div>
        <div class="cost-list">
          <div class="cost-row" *ngFor="let d of costsByDomain">
            <div class="cost-row__head">
              <span class="cost-row__domain">{{ d.domain }}</span>
              <span class="cost-row__amount">R$ {{ d.monthly | number:'1.0-0' }}</span>
            </div>
            <div class="cost-row__bar"><div [style.width.%]="d.pctOfTotal"></div></div>
            <div class="cost-row__meta">
              <span>{{ d.pctOfTotal }}% do total</span>
              <span [class]="'delta delta--' + d.trend">{{ d.delta }}</span>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Saúde por domínio -->
      <ui-card eyebrow="Operação" title="Saúde de SLA por domínio" subtitle="Janela atual — abril/26.">
        <div class="sla-grid">
          <div class="sla-tile" *ngFor="let s of slaByDomain">
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
          <div class="cap-row" *ngFor="let r of capacity">
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
          <div class="risk-row" *ngFor="let r of risks">
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

    /* Custos */
    .cost-list { display: flex; flex-direction: column; gap: 14px; }
    .cost-row { display: flex; flex-direction: column; gap: 6px; }
    .cost-row__head { display: flex; justify-content: space-between; align-items: baseline; }
    .cost-row__domain { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .cost-row__amount { font-size: 14px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .cost-row__bar { height: 6px; background: var(--bg-overlay); border-radius: 3px; overflow: hidden; }
    .cost-row__bar > div { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--accent-500)); }
    .cost-row__meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
    .delta--up   { color: var(--danger-500); font-weight: 600; }
    .delta--down { color: var(--success-500); font-weight: 600; }
    .delta--flat { color: var(--text-muted); }

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
  costsByDomain: DomainSpend[] = [
    { domain: 'Comercial',  monthly: 58400, pctOfTotal: 32, trend: 'up',   delta: '+8.1%' },
    { domain: 'Financeiro', monthly: 42100, pctOfTotal: 23, trend: 'up',   delta: '+3.4%' },
    { domain: 'Operações',  monthly: 33600, pctOfTotal: 18, trend: 'down', delta: '-2.0%' },
    { domain: 'Marketing',  monthly: 26900, pctOfTotal: 15, trend: 'up',   delta: '+11.4%' },
    { domain: 'Risco',      monthly: 23200, pctOfTotal: 12, trend: 'flat', delta: '0.2%' },
  ];

  slaByDomain: SLAStatus[] = [
    { domain: 'Comercial', total: 38, healthy: 37 },
    { domain: 'Financeiro', total: 24, healthy: 22 },
    { domain: 'Operações', total: 31, healthy: 30 },
    { domain: 'Marketing', total: 18, healthy: 18 },
    { domain: 'Risco', total: 14, healthy: 13 },
    { domain: 'IoT', total: 17, healthy: 14 },
  ];

  capacity = [
    { label: 'Glue (DPU horas / cota mensal)', value: 62, note: 'Tendência estável; folga confortável até o fim do mês.' },
    { label: 'S3 (storage / acordo comercial)', value: 78, note: 'Atenção: 78% da cota anual, tendência de aumento de 4pp/mês.' },
    { label: 'Step Functions (transições)', value: 41, note: 'Dentro do esperado.' },
    { label: 'RDS (conexões simultâneas)', value: 92, note: 'Crítico: pico atingiu 92% — avaliar pool ou réplica de leitura.' },
  ];

  risks = [
    { severity: 'CRÍTICO',  tone: 'danger'  as const, title: 'RDS reporting próximo do limite de conexões', desc: 'Picos a 92% — risco de impacto em finance_curated_to_rds.', owner: 'Squad C' },
    { severity: 'ALTO',     tone: 'warning' as const, title: 'S3 corporativo atingirá cota anual em 8 meses', desc: 'Sem ação, plataforma estoura cota antes da renovação contratual.', owner: 'Plataforma' },
    { severity: 'MÉDIO',    tone: 'info'    as const, title: 'Custo do domínio Marketing +11.4% MoM', desc: 'Aumento associado a ingestão real-time não otimizada.', owner: 'Squad B' },
    { severity: 'MÉDIO',    tone: 'info'    as const, title: 'Cobertura de testes abaixo de 70% em 2 pipelines', desc: 'Risco de regressão silenciosa em produção.', owner: 'Squad A' },
  ];

  farolFor(s: SLAStatus): 'green' | 'yellow' | 'red' {
    const pct = (s.healthy / s.total) * 100;
    if (pct >= 99) return 'green';
    if (pct >= 95) return 'yellow';
    return 'red';
  }
}
