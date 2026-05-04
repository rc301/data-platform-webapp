import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartOptions, ChartData, TooltipItem } from 'chart.js';
import {
  UiBadgeComponent,
  UiCardComponent,
  UiFarolComponent,
  UiStatComponent,
} from '../../../shared/ui';
import { DailyProgressService } from '../../../core/ops/daily-progress.service';
import { JobRow } from '../../../core/models';

/* ============================================================
   Cores fixas espelhando os tokens da aplicação. Idealmente leríamos
   `getComputedStyle(document.documentElement).getPropertyValue(...)`,
   mas isso quebra com SSR e força ChangeDetection extra para reagir
   a tema dinâmico. Como o tema é único (dark corporativo), fixar é
   simples, performático e visualmente idêntico.
   ============================================================ */
const COLOR_BRAND_400      = '#4170C4';
const COLOR_BRAND_400_FILL = 'rgba(65,112,196,0.10)';
const COLOR_ACCENT_400     = '#E0B96A';
const COLOR_GRID           = 'rgba(255,255,255,0.06)';
const COLOR_TEXT_MUTED     = '#6F7A91';
const COLOR_TEXT_PRIMARY   = '#E8ECF4';
const COLOR_BG_ELEVATED    = '#1A2230';
const COLOR_BORDER_DEFAULT = 'rgba(255,255,255,0.10)';
const COLOR_DANGER         = '#E5484D';

/**
 * Andamento Diário — curva acumulada de finalizações de jobs DAILY ao
 * longo do dia (00h–24h), comparada com a expectativa histórica
 * (média do horário de finalização nos últimos 7 dias).
 *
 * Decisões de UX/visualização:
 *   • Linha SÓLIDA = realizado    → cor `--brand-400` (forte, primária)
 *   • Linha TRACEJADA = esperado  → cor `--accent-400` (referência, secundária)
 *   • Eixo Y começa em zero       → escala linear inteira (jobs)
 *   • Eixo X 0–23 horas inteiras  → grade leve para legibilidade
 *   • Marker "agora"              → ponto destacado na hora corrente
 *   • Tooltip rico                → real, esperado, delta e progresso %
 *
 * Disclaimers visuais:
 *   • "Inclui apenas jobs com cadência diária"
 *   • "Curva esperada calculada pela média do horário de finalização
 *      dos últimos 7 dias por job"
 */
@Component({
  selector: 'app-daily-progress',
  standalone: true,
  imports: [
    CommonModule, BaseChartDirective,
    UiCardComponent, UiStatComponent, UiBadgeComponent, UiFarolComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ===== KPIs ===== -->
    <div class="kpis">
      <ui-stat
        label="Jobs daily monitorados"
        [value]="summary().total"
        hint="apenas cadência diária" />
      <ui-stat
        label="Concluídos até agora"
        [value]="summary().realizedNow + ' / ' + summary().total"
        [hint]="'expectativa para esta hora: ' + summary().expectedNow" />
      <ui-stat
        label="Vs. expectativa"
        [value]="deltaText()"
        [trend]="deltaTrend()"
        [delta]="deltaSubtext()"
        deltaPeriod="vs. média 7d" />
      <ui-stat
        label="Em atenção"
        [value]="summary().failed + summary().pendingPastWindow"
        [hint]="summary().failed + ' falhas · ' + summary().pendingPastWindow + ' pendentes fora da janela'" />
    </div>

    <!-- ===== Gráfico + lateral ===== -->
    <div class="grid">
      <ui-card
        eyebrow="Andamento do dia"
        title="Curva acumulada de finalizações"
        [subtitle]="'Hora atual: ' + currentHour() + 'h. ' + progressNarrative()">
        <div card-actions>
          <ui-badge tone="brand">Realizado</ui-badge>
          <ui-badge tone="warning">Esperado</ui-badge>
        </div>

        <div class="chart-shell" role="img" [attr.aria-label]="ariaSummary()">
          <canvas baseChart
                  type="line"
                  [data]="chartData()"
                  [options]="chartOptions"></canvas>
        </div>

        <div card-footer class="disclaimers">
          <p>
            <strong>Escopo:</strong>
            inclui apenas jobs com cadência <em>daily</em>.
            Jobs horários, semanais e <em>on-demand</em> são tratados em outras visões.
          </p>
          <p>
            <strong>Metodologia:</strong>
            a linha tracejada representa a média do horário de finalização
            de cada job nos últimos 7 dias, agregada hora a hora. Quando um job não
            executou em algum dia, esse dia é desconsiderado da média.
          </p>
        </div>
      </ui-card>

      <!-- Painel lateral com jobs em atenção -->
      <ui-card eyebrow="Atenção agora" [title]="attentionTitle()" [padded]="false">
        <ul class="attention" *ngIf="attentionJobs().length; else allClean">
          <li *ngFor="let job of attentionJobs()" class="attention__item">
            <ui-farol [status]="job.status" />
            <div class="attention__main">
              <strong>{{ job.name }}</strong>
              <span>{{ job.squad }} · {{ job.type }}</span>
              <span class="attention__note" *ngIf="job.notes">{{ job.notes }}</span>
            </div>
          </li>
        </ul>
        <ng-template #allClean>
          <p class="empty">Nenhuma pendência crítica neste momento.</p>
        </ng-template>
      </ui-card>
    </div>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 18px; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: flex-start; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }

    .chart-shell {
      position: relative;
      width: 100%;
      /* Aspecto ~16:6 — alto o bastante para ler diferenças por hora,
         baixo o bastante para caber na tela com os disclaimers. */
      aspect-ratio: 16 / 6;
      min-height: 260px;
    }
    .chart-shell > canvas { width: 100% !important; height: 100% !important; }

    .disclaimers { display: flex; flex-direction: column; gap: 6px; padding: 12px 24px 16px; font-size: 12px; color: var(--text-muted); }
    .disclaimers p { margin: 0; line-height: 1.55; }
    .disclaimers strong { color: var(--text-secondary); font-weight: 700; }
    .disclaimers em { color: var(--text-secondary); font-style: normal; }

    .attention { list-style: none; margin: 0; padding: 4px; display: flex; flex-direction: column; }
    .attention__item {
      display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: flex-start;
      padding: 10px 12px; border-bottom: 1px solid var(--border-subtle);
    }
    .attention__item:last-child { border-bottom: 0; }
    .attention__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .attention__main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .attention__main span   { color: var(--text-muted); font-size: 11px; }
    .attention__note { color: var(--text-secondary) !important; font-size: 12px; margin-top: 2px; }

    .empty { padding: 24px; color: var(--text-muted); font-size: 13px; text-align: center; }
  `],
})
export class DailyProgressComponent {
  private readonly progress = inject(DailyProgressService);

  /* ---- Reexposições simples para o template ---- */
  readonly summary     = this.progress.summary;
  readonly currentHour = this.progress.currentHour;

  /* =========================================================
     Modelo do gráfico
     ========================================================= */
  readonly chartData = computed<ChartData<'line', number[]>>(() => {
    const realized = this.progress.realizedCurve();
    const expected = this.progress.expectedCurve();
    const now = this.currentHour();

    /* Marker da hora atual: arrays paralelos ao dataset realizado para
       destacar visualmente o ponto "agora" sem precisar de plugin. */
    const radii      = realized.map((_, h) => (h === now ? 6 : 0));
    const colorsLine = realized.map((_, h) => (h === now ? COLOR_TEXT_PRIMARY : COLOR_BRAND_400));

    return {
      labels: DailyProgressService.HOURS.map(h => `${String(h).padStart(2, '0')}h`),
      datasets: [
        {
          label: 'Realizado',
          data: realized,
          borderColor: COLOR_BRAND_400,
          backgroundColor: COLOR_BRAND_400_FILL,
          fill: 'origin',
          tension: 0.25,
          pointRadius: radii,
          pointHoverRadius: 6,
          pointBackgroundColor: colorsLine,
          pointBorderColor: COLOR_BRAND_400,
          pointBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: 'Esperado',
          data: expected,
          borderColor: COLOR_ACCENT_400,
          backgroundColor: 'transparent',
          borderDash: [6, 6],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.25,
          borderWidth: 1.5,
          fill: false,
        },
      ],
    };
  });

  readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLOR_BG_ELEVATED,
        titleColor: COLOR_TEXT_PRIMARY,
        bodyColor: COLOR_TEXT_PRIMARY,
        borderColor: COLOR_BORDER_DEFAULT,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => `Até ${items[0].label}`,
          label: (item: TooltipItem<'line'>) => {
            const value = Number(item.parsed.y ?? 0);
            return `${item.dataset.label}: ${value} job${value === 1 ? '' : 's'}`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            const real = Number(items.find(i => i.dataset.label === 'Realizado')?.parsed.y ?? 0);
            const exp  = Number(items.find(i => i.dataset.label === 'Esperado')?.parsed.y ?? 0);
            const diff = real - exp;
            if (!exp && !real) return '';
            const sign = diff > 0 ? '+' : '';
            return [`Diferença: ${sign}${diff}`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: COLOR_GRID, drawTicks: false },
        ticks: { color: COLOR_TEXT_MUTED, font: { size: 10 }, maxRotation: 0 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: COLOR_GRID, drawTicks: false },
        ticks: { color: COLOR_TEXT_MUTED, font: { size: 10 }, precision: 0, stepSize: 1 },
        border: { display: false },
      },
    },
  };

  /* =========================================================
     Narrativa textual (acessibilidade + sumário humano)
     ========================================================= */
  readonly deltaText = computed(() => {
    const d = this.summary().delta;
    return d > 0 ? `+${d}` : `${d}`;
  });

  readonly deltaTrend = computed<'up' | 'down' | 'flat'>(() => {
    const d = this.summary().delta;
    return d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
  });

  readonly deltaSubtext = computed(() => {
    const d = this.summary().delta;
    if (d === 0) return 'no ritmo da média';
    return d > 0 ? 'à frente da média histórica' : 'atrás da média histórica';
  });

  readonly progressNarrative = computed(() => {
    const { realizedNow, expectedNow, total } = this.summary();
    if (!total) return 'Sem jobs daily monitorados.';
    const pct = Math.round((realizedNow / total) * 100);
    return `${realizedNow} de ${total} jobs (${pct}%) finalizados — esperado ${expectedNow}.`;
  });

  readonly ariaSummary = computed(() => {
    const { realizedNow, expectedNow } = this.summary();
    return `Curva acumulada por hora. Até ${this.currentHour()}h: ${realizedNow} jobs finalizados, ` +
           `esperado ${expectedNow}. Linha sólida representa o realizado; tracejada, a expectativa ` +
           `da média dos últimos 7 dias.`;
  });

  /* =========================================================
     Painel lateral — jobs em atenção
     ========================================================= */
  readonly attentionJobs = computed<JobRow[]>(() =>
    this.progress.dailyJobs().filter(job =>
      job.lastRunStatus === 'failed' || (job.status !== 'green' && job.status !== 'gray' && !job.todayFinishedAt)
    ).slice(0, 8)
  );

  readonly attentionTitle = computed(() => {
    const n = this.attentionJobs().length;
    return n ? `${n} job${n === 1 ? '' : 's'} demandando atenção` : 'Nada por aqui agora';
  });
}
