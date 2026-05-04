import { JobRow } from '../models/ops.model';

export const MOCK_OPERATIONAL_SNAPSHOT_UPDATED_AT = '2026-04-25T12:00:00-03:00';

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

/** PRNG determinístico — semente estável entre reloads. */
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
  {
    id: 'j-13', name: 'customer_consent_snapshot', squad: 'Squad B', type: 'Munin',
    cadence: 'daily',
    expectedStartLocal: '04:30', slaDeadlineLocal: '05:20',
    lastRunAt: '2026-04-25T04:36:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('05:05'),
    todayFinishedAt: '05:02',
  },
  {
    id: 'j-14', name: 'card_invoice_daily', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '05:10', slaDeadlineLocal: '06:10',
    lastRunAt: '2026-04-25T05:14:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('05:55'),
    todayFinishedAt: '05:52',
  },
  {
    id: 'j-15', name: 'card_usage_enrichment', squad: 'Squad C', type: 'CDP',
    cadence: 'daily',
    expectedStartLocal: '06:20', slaDeadlineLocal: '07:20',
    lastRunAt: '2026-04-25T06:28:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('07:10'),
    todayFinishedAt: '07:06',
  },
  {
    id: 'j-16', name: 'credit_portfolio_daily', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '07:15', slaDeadlineLocal: '08:15',
    lastRunAt: '2026-04-25T07:22:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('08:00'),
    todayFinishedAt: '07:58',
  },
  {
    id: 'j-17', name: 'insurance_policy_snapshot', squad: 'Squad A', type: 'Munin',
    cadence: 'daily',
    expectedStartLocal: '08:00', slaDeadlineLocal: '09:00',
    lastRunAt: '2026-04-25T08:08:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('08:46'),
    todayFinishedAt: '08:44',
  },
  {
    id: 'j-18', name: 'marketing_campaign_attribution', squad: 'Squad B', type: 'StepFunction',
    cadence: 'daily',
    expectedStartLocal: '08:30', slaDeadlineLocal: '09:30',
    lastRunAt: '2026-04-25T08:39:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('09:15'),
    todayFinishedAt: '09:12',
  },
  {
    id: 'j-19', name: 'customer_segment_refresh', squad: 'Squad B', type: 'CDP',
    cadence: 'daily',
    expectedStartLocal: '09:00', slaDeadlineLocal: '10:00',
    lastRunAt: '2026-04-25T09:08:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('09:47'),
    todayFinishedAt: '09:50',
  },
  {
    id: 'j-20', name: 'sales_order_margin_daily', squad: 'Squad A', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '09:30', slaDeadlineLocal: '10:30',
    lastRunStatus: undefined, status: 'yellow',
    notes: 'Aguardando finalização do cálculo de margem.',
    last7DaysFinishTimes: jitter7d('10:15'),
  },
  {
    id: 'j-21', name: 'product_price_index', squad: 'Squad B', type: 'Munin',
    cadence: 'daily',
    expectedStartLocal: '10:00', slaDeadlineLocal: '11:00',
    lastRunAt: '2026-04-25T10:04:00-03:00', lastRunStatus: 'running', status: 'yellow',
    notes: 'Em execução; acima da duração média histórica.',
    last7DaysFinishTimes: jitter7d('10:42'),
  },
  {
    id: 'j-22', name: 'cashflow_projection_daily', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '10:30', slaDeadlineLocal: '11:30',
    lastRunAt: '2026-04-25T10:38:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('11:16'),
    todayFinishedAt: '11:12',
  },
  {
    id: 'j-23', name: 'fraud_alert_features', squad: 'Squad C', type: 'CDP',
    cadence: 'daily',
    expectedStartLocal: '11:10', slaDeadlineLocal: '12:10',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Janela do dia ainda aberta no snapshot operacional.',
    last7DaysFinishTimes: jitter7d('11:55'),
  },
  {
    id: 'j-24', name: 'digital_channel_daily', squad: 'Squad B', type: 'StepFunction',
    cadence: 'daily',
    expectedStartLocal: '11:45', slaDeadlineLocal: '12:45',
    lastRunAt: '2026-04-25T11:49:00-03:00', lastRunStatus: 'success', status: 'green',
    last7DaysFinishTimes: jitter7d('12:25'),
    todayFinishedAt: '12:23',
  },
  {
    id: 'j-25', name: 'inventory_position_snapshot', squad: 'Squad A', type: 'Outros',
    cadence: 'daily',
    expectedStartLocal: '12:30', slaDeadlineLocal: '13:30',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Aguardando janela de execução.',
    last7DaysFinishTimes: jitter7d('13:10'),
  },
  {
    id: 'j-26', name: 'vendor_master_validation', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '13:00', slaDeadlineLocal: '14:00',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Aguardando disponibilidade do ERP.',
    last7DaysFinishTimes: jitter7d('13:45'),
  },
  {
    id: 'j-27', name: 'customer_profitability_daily', squad: 'Squad B', type: 'Munin',
    cadence: 'daily',
    expectedStartLocal: '13:30', slaDeadlineLocal: '14:45',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Dependente do fechamento parcial de finanças.',
    last7DaysFinishTimes: jitter7d('14:22'),
  },
  {
    id: 'j-28', name: 'regulatory_report_extract', squad: 'Squad C', type: 'GlueJob',
    cadence: 'daily',
    expectedStartLocal: '15:00', slaDeadlineLocal: '16:00',
    lastRunStatus: undefined, status: 'gray',
    notes: 'Execução prevista para o período da tarde.',
    last7DaysFinishTimes: jitter7d('15:42'),
  },
];
