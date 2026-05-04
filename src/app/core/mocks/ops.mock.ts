import { JobRow } from '../models/ops.model';

/**
 * Helper de geração de "horários de finalização nos últimos 7 dias".
 * Aceita uma média alvo (HH:MM) e produz 7 horas com pequena variação
 * em torno do alvo, com posições eventualmente undefined para simular
 * dias em que o job não rodou (~10% de "buracos" em jobs estáveis).
 */
function jitter7d(meanHHmm: string, missChance = 0): ReadonlyArray<string | undefined> {
  const [h, m] = meanHHmm.split(':').map(Number);
  const out: Array<string | undefined> = [];
  for (let day = 0; day < 7; day++) {
    if (Math.abs(seededRandom(`${meanHHmm}:${day}`)) < missChance) { out.push(undefined); continue; }
    // jitter de até ±12 minutos em torno da média — produz curva crível
    const offset = Math.round(seededRandom(`${meanHHmm}:t:${day}`) * 12);
    const total = h * 60 + m + offset;
    const hh = Math.max(0, Math.min(23, Math.floor(total / 60)));
    const mm = Math.max(0, Math.min(59, total % 60));
    out.push(`${pad(hh)}:${pad(mm)}`);
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** PRNG determinístico — mock estável entre reloads. */
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // normaliza para [-1, 1]
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

export const MOCK_JOBS: JobRow[] = [
  {
    id: 'j-1', name: 'ingestion_orders', squad: 'Squad A', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '06:00', slaDeadlineLocal: '06:30',
    lastRunAt: '2026-04-25T06:05:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('06:18'),
    todayFinishedAt: '06:14',
  },
  {
    id: 'j-2', name: 'transform_customer_360', squad: 'Squad B', type: 'CDP',
    cadence: 'daily',
    expectedStartLocal: '06:00', slaDeadlineLocal: '07:30',
    lastRunAt: '2026-04-25T06:00:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('07:05'),
    todayFinishedAt: '07:02',
  },
  {
    id: 'j-3', name: 'export_financial_reporting', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '04:00', slaDeadlineLocal: '05:00',
    lastRunStatus: 'failed', status: 'red',
    notes: 'Falhou as 04:08 - timeout no destino RDS.',
    last7DaysFinishTimes: jitter7d('04:42'),
    /* todayFinishedAt vazio — falhou e ainda não rodou novamente */
  },
  {
    id: 'j-4', name: 'orchestration_daily_full', squad: 'Squad A', type: 'Munin',
    cadence: 'daily',
    expectedStartLocal: '03:00', slaDeadlineLocal: '07:00',
    lastRunAt: '2026-04-25T03:00:00-03:00', lastRunStatus: 'running', status: 'yellow',
    notes: 'Em execucao desde 03:00 - atrasada 45 min vs. media historica.',
    last7DaysFinishTimes: jitter7d('06:30'),
    /* sem todayFinishedAt — ainda em execução */
  },
  {
    id: 'j-5', name: 'ingestion_clickstream', squad: 'Squad A', type: 'GlueJob',
    /* roda a cada 5 min — não entra no gráfico de daily */
    cadence: 'hourly',
    expectedStartLocal: '00:05', slaDeadlineLocal: '00:15',
    lastRunAt: '2026-04-25T11:55:00-03:00', lastRunStatus: 'success', status: 'green',
  },
  {
    id: 'j-6', name: 'ingestion_crm_contacts', squad: 'Squad B', type: 'Phoenix',
    cadence: 'daily',
    expectedStartLocal: '11:00', slaDeadlineLocal: '12:00',
    lastRunStatus: undefined, status: 'yellow',
    notes: 'Janela esperada comeca as 11:00 - 22 min de atraso.',
    last7DaysFinishTimes: jitter7d('11:25'),
    /* sem todayFinishedAt — atrasado */
  },
  {
    id: 'j-7', name: 'harmonize_product_catalog', squad: 'Squad B', type: 'CDP',
    cadence: 'daily',
    expectedStartLocal: '05:00', slaDeadlineLocal: '06:30',
    lastRunStatus: undefined, status: 'red',
    notes: 'Nao executou hoje. SLA estourado as 06:30.',
    last7DaysFinishTimes: jitter7d('06:00', 0.15),
    /* sem todayFinishedAt — não executou */
  },
  {
    id: 'j-8', name: 'ingestion_iot_sensors', squad: 'Squad C', type: 'GlueJob',
    cadence: 'hourly',
    expectedStartLocal: '00:01', slaDeadlineLocal: '00:05',
    lastRunAt: '2026-04-25T11:59:00-03:00', lastRunStatus: 'success', status: 'green',
  },
  {
    id: 'j-9', name: 'sync_erp_master_data', squad: 'Squad C', type: 'Outros',
    cadence: 'daily',
    expectedStartLocal: '14:00', slaDeadlineLocal: '15:00',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Janela esperada as 14:00 - ainda dentro do prazo.',
    last7DaysFinishTimes: jitter7d('14:35'),
    /* sem todayFinishedAt — janela ainda não chegou */
  },
  {
    id: 'j-10', name: 'kpi_marketing_daily', squad: 'Squad B', type: 'StepFunction',
    cadence: 'daily',
    expectedStartLocal: '07:00', slaDeadlineLocal: '08:00',
    lastRunAt: '2026-04-25T07:12:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('07:50'),
    todayFinishedAt: '07:46',
  },
  {
    id: 'j-11', name: 'risk_exposure_daily', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '06:30', slaDeadlineLocal: '07:30',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Aguardando dependencia upstream (orchestration_daily_full).',
    last7DaysFinishTimes: jitter7d('07:20'),
    /* aguardando dependência */
  },
  {
    id: 'j-12', name: 'finance_curated_to_rds', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '05:30', slaDeadlineLocal: '06:30',
    lastRunStatus: 'failed', status: 'red',
    notes: 'Falhou as 05:48 - credencial expirada.',
    last7DaysFinishTimes: jitter7d('06:05'),
    /* sem todayFinishedAt — falhou */
  },
];
