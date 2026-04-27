import { PipelineSensorBinding, PipelineWaitingItem, Sensor, SensorState } from './sensor.model';

const NOW = '2026-04-26T07:30:00-03:00';
const ago = (mins: number) => new Date(Date.parse(NOW) - mins * 60_000).toISOString();
const inMins = (mins: number) => new Date(Date.parse(NOW) + mins * 60_000).toISOString();

export const SENSORS: Sensor[] = [
  {
    id: 'sens-orders-rds',
    name: 'orders RDS freshness',
    description: 'Verifica se a tabela orders.rds foi atualizada nos últimos 30 min.',
    sourceQualifiedName: 'rds.orders_db.orders',
    query: 'SELECT MAX(updated_at) AS last_update FROM orders_db.orders',
    intervalMinutes: 15,
    freshnessThresholdMinutes: 30,
    ownerSquadId: 'squad-a',
    enabled: true,
    createdAt: '2026-03-01T00:00:00-03:00', updatedAt: '2026-04-20T00:00:00-03:00',
  },
  {
    id: 'sens-clickstream-kinesis',
    name: 'clickstream Kinesis liveness',
    description: 'Confere se o stream Kinesis recebeu eventos nos últimos 5 min.',
    sourceQualifiedName: 'kinesis.clickstream_stream',
    query: 'SELECT MAX(event_timestamp) FROM clickstream_raw',
    intervalMinutes: 5,
    freshnessThresholdMinutes: 10,
    ownerSquadId: 'squad-a',
    enabled: true,
    createdAt: '2026-03-15T00:00:00-03:00', updatedAt: NOW,
  },
  {
    id: 'sens-customer-base',
    name: 'silver customer_base',
    description: 'Garante que silver.customer_base foi consolidado antes do customer_360.',
    sourceQualifiedName: 'silver.customer_base',
    query: 'SELECT MAX(snapshot_at) FROM silver.customer_base',
    intervalMinutes: 30,
    freshnessThresholdMinutes: 90,
    ownerSquadId: 'squad-b',
    enabled: true,
    createdAt: '2026-02-15T00:00:00-03:00', updatedAt: '2026-04-22T00:00:00-03:00',
  },
  {
    id: 'sens-finance-summary',
    name: 'gold financial_summary',
    description: 'Pré-requisito do export para RDS de relatórios financeiros.',
    sourceQualifiedName: 'gold.financial_summary',
    query: 'SELECT MAX(generated_at) FROM gold.financial_summary',
    intervalMinutes: 30,
    freshnessThresholdMinutes: 60,
    ownerSquadId: 'squad-c',
    enabled: false,
    createdAt: '2026-01-12T00:00:00-03:00', updatedAt: '2026-04-10T00:00:00-03:00',
  },
];

export const SENSOR_STATES: SensorState[] = [
  { sensorId: 'sens-orders-rds',         status: 'green',  lastRunAt: ago(8),   lastLatencyMs: 142,  nextRunAt: inMins(7) },
  { sensorId: 'sens-clickstream-kinesis', status: 'yellow', lastRunAt: ago(12), lastLatencyMs: 215,  nextRunAt: inMins(0), errorMessage: 'Stream sem eventos há 12 min — limite 10 min.' },
  { sensorId: 'sens-customer-base',      status: 'red',    lastRunAt: ago(150), lastLatencyMs: 4002, nextRunAt: inMins(20), errorMessage: 'Falha ao consultar — verifique role do motor.' },
  { sensorId: 'sens-finance-summary',    status: 'gray' },
];

export const PIPELINE_BINDINGS: PipelineSensorBinding[] = [
  {
    pipelineId: 'pipeline-2',
    pipelineName: 'transform_customer_360',
    sensorIds: ['sens-customer-base', 'sens-orders-rds'],
    failureAction: 'stop',
    maxWaitMinutes: 120,
    updatedAt: '2026-04-21T00:00:00-03:00', updatedBy: 'rafael.carvalho',
  },
  {
    pipelineId: 'pipeline-3',
    pipelineName: 'export_financial_reporting',
    sensorIds: ['sens-finance-summary'],
    failureAction: 'alert',
    maxWaitMinutes: 60,
    updatedAt: '2026-04-15T00:00:00-03:00', updatedBy: 'thais.borges',
  },
  {
    pipelineId: 'pipeline-1',
    pipelineName: 'ingestion_orders',
    sensorIds: ['sens-orders-rds'],
    failureAction: 'proceed',
    maxWaitMinutes: 30,
    updatedAt: '2026-04-25T00:00:00-03:00', updatedBy: 'rafael.carvalho',
  },
];

export const WAITING_PIPELINES: PipelineWaitingItem[] = [
  {
    pipelineId: 'pipeline-2',
    pipelineName: 'transform_customer_360',
    waitingSensorId: 'sens-customer-base',
    waitingSensorName: 'silver customer_base',
    waitingSourceTable: 'silver.customer_base',
    waitingForMinutes: 92,
    slaMinutes: 120,
  },
  {
    pipelineId: 'pipeline-3',
    pipelineName: 'export_financial_reporting',
    waitingSensorId: 'sens-finance-summary',
    waitingSensorName: 'gold financial_summary',
    waitingSourceTable: 'gold.financial_summary',
    waitingForMinutes: 18,
    slaMinutes: 60,
  },
];
