import { Injectable, computed, inject } from '@angular/core';
import { JobRow } from '../models/ops.model';
import { PlatformDataService } from '../services/platform-data.service';

/**
 * Calcula as duas curvas (acumuladas por hora 0–23) da tela "Andamento Diário":
 *
 *   • Curva REALIZADA  — quantos jobs daily de fato finalizaram com sucesso
 *                         até cada hora do dia atual.
 *   • Curva ESPERADA   — quantos jobs deveriam ter finalizado até cada hora,
 *                         baseado na média de horário de finalização nos
 *                         últimos 7 dias por job.
 *
 * Limita-se a jobs `cadence === 'daily'` — jobs horários/sob demanda têm
 * comportamento diferente e diluiriam o sinal.
 *
 * O service é puro: recebe `jobs` da fonte (PlatformDataService) e devolve
 * arrays alinhados a `HOURS`. Quando vier backend real, a única troca é a
 * fonte do `jobs()` — a álgebra das curvas continua igual.
 */
@Injectable({ providedIn: 'root' })
export class DailyProgressService {
  private readonly data = inject(PlatformDataService);

  /** Sequência fixa 0–23 para indexação dos pontos de cada curva. */
  static readonly HOURS: ReadonlyArray<number> = Array.from({ length: 24 }, (_, i) => i);

  /** Apenas os jobs daily — base de cálculo. */
  readonly dailyJobs = computed(() =>
    this.data.jobs().filter(job => (job.cadence ?? 'daily') === 'daily')
  );

  /** Total de jobs daily monitorados. */
  readonly totalDaily = computed(() => this.dailyJobs().length);

  /** Curva REALIZADA — len 24, acumulado por hora cheia. */
  readonly realizedCurve = computed<number[]>(() => {
    const finishHours = this.dailyJobs()
      .map(job => parseFinishHourCeil(job.todayFinishedAt))
      .filter((h): h is number => h !== null);
    return cumulativeByHour(finishHours);
  });

  /**
   * Curva ESPERADA — len 24, acumulado por hora cheia.
   * Para cada job, usa a média (em minutos) das horas de finalização dos
   * últimos 7 dias. Jobs sem histórico são ignorados (não puxam a curva).
   */
  readonly expectedCurve = computed<number[]>(() => {
    const expectedHours = this.dailyJobs()
      .map(job => averageFinishHourCeil(job.last7DaysFinishTimes))
      .filter((h): h is number => h !== null);
    return cumulativeByHour(expectedHours);
  });

  /** Hora cheia atual (0–23) do navegador — usado pelo gráfico. */
  readonly currentHour = computed(() => new Date().getHours());

  /** KPIs derivados — usados nos cartões de cima da tela. */
  readonly summary = computed(() => {
    const total = this.totalDaily();
    const hour = this.currentHour();
    const realizedNow = this.realizedCurve()[hour] ?? 0;
    const expectedNow = this.expectedCurve()[hour] ?? 0;

    const failed = this.dailyJobs().filter(j => j.lastRunStatus === 'failed').length;
    const pendingPastWindow = this.dailyJobs().filter(j =>
      !j.todayFinishedAt && (j.status === 'red' || j.status === 'yellow')
    ).length;

    return {
      total,
      realizedNow,
      expectedNow,
      delta: realizedNow - expectedNow,
      failed,
      pendingPastWindow,
    };
  });
}

/* ============================================================
   Helpers puros — sem dependência de Angular para serem testáveis.
   ============================================================ */

/**
 * Converte "HH:MM" em hora cheia (0–23) com **arredondamento para cima**.
 * Ex.: "06:14" → 7. Justificativa: na curva acumulada por hora cheia, um
 * job que terminou 06:14 aparece concluído NA CONTA da hora 7 — ele NÃO
 * está pronto às 06:00, mas ESTÁ pronto às 07:00.
 */
function parseFinishHourCeil(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return Math.min(23, m === 0 ? h : h + 1);
}

/**
 * Média dos horários (HH:MM) em minutos → hora cheia com arredondamento
 * para cima. Ignora `undefined` (dia em que o job não rodou).
 */
function averageFinishHourCeil(samples?: ReadonlyArray<string | undefined>): number | null {
  if (!samples?.length) return null;
  const minutes = samples
    .filter((v): v is string => !!v)
    .map(v => {
      const [h, m] = v.split(':').map(Number);
      return h * 60 + m;
    });
  if (!minutes.length) return null;
  const avg = minutes.reduce((a, b) => a + b, 0) / minutes.length;
  const h = Math.floor(avg / 60);
  const m = Math.round(avg % 60);
  return Math.min(23, m === 0 ? h : h + 1);
}

/**
 * Recebe uma lista de horas (0–23) e devolve o acumulado por hora:
 * arr[h] = quantos eventos ocorreram até a hora `h` (inclusive).
 */
function cumulativeByHour(hours: number[]): number[] {
  const counts = new Array(24).fill(0);
  for (const h of hours) {
    if (h >= 0 && h < 24) counts[h] += 1;
  }
  // acumula in-place
  for (let i = 1; i < counts.length; i++) {
    counts[i] += counts[i - 1];
  }
  return counts;
}
