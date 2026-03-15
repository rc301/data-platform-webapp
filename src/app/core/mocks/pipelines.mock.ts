import { Pipeline, PipelineRun, PipelineAlert } from '../models';

const makeSteps = (statuses: Array<'succeeded' | 'running' | 'failed' | 'pending'>): any[] =>
  statuses.map((s, i) => ({
    name: `Step ${i + 1}`,
    status: s,
    type: i % 2 === 0 ? 'glue_job' : 'step_function',
    startTime: s !== 'pending' ? '2026-03-15T08:00:00Z' : undefined,
    endTime: s === 'succeeded' ? '2026-03-15T08:15:00Z' : undefined,
  }));

export const MOCK_PIPELINES: Pipeline[] = [
  {
    id: 'pipeline-1', name: 'ingestion_orders', description: 'Ingest orders from source RDS to raw S3 layer',
    type: 'ingestion', status: 'failed', schedule: 'Every 30 min', owner: 'Data Engineering',
    team: 'Platform', source: 'RDS orders_db', target: 's3://datalake-raw/orders/',
    tags: ['critical', 'real-time'], glueJobNames: ['raw_orders_etl'],
    sla: 30, avgDuration: 12,
    lastRun: { id: 'run-1a', pipelineId: 'pipeline-1', status: 'failed', startTime: '2026-03-15T09:30:00Z', endTime: '2026-03-15T09:42:00Z', duration: 12, errorMessage: 'Connection timeout to source database', steps: makeSteps(['succeeded', 'succeeded', 'failed']) }
  },
  {
    id: 'pipeline-2', name: 'transform_customer_360', description: 'Build customer 360 view in curated layer',
    type: 'transformation', status: 'active', schedule: 'Daily 06:00 UTC', owner: 'Analytics Engineering',
    team: 'Analytics', source: 's3://datalake-raw/', target: 's3://datalake-curated/customer_360/',
    tags: ['customer', 'daily'], stepFunctionArn: 'arn:aws:states:us-east-1:123:stateMachine:customer-360',
    sla: 120, avgDuration: 85,
    lastRun: { id: 'run-2a', pipelineId: 'pipeline-2', status: 'succeeded', startTime: '2026-03-15T06:00:00Z', endTime: '2026-03-15T07:25:00Z', duration: 85, recordsProcessed: 2500000, steps: makeSteps(['succeeded', 'succeeded', 'succeeded', 'succeeded']) }
  },
  {
    id: 'pipeline-3', name: 'export_financial_reporting', description: 'Export curated financial data to RDS reporting layer',
    type: 'export', status: 'running', schedule: 'Daily 04:00 UTC', owner: 'Finance Data',
    team: 'Finance', source: 's3://datalake-curated/finance/', target: 'RDS reporting_db',
    tags: ['finance', 'sla-critical'], glueJobNames: ['finance_curated_to_rds'],
    sla: 60, avgDuration: 42,
    lastRun: { id: 'run-3a', pipelineId: 'pipeline-3', status: 'running', startTime: '2026-03-15T04:00:00Z', duration: undefined, recordsProcessed: 1200000, steps: makeSteps(['succeeded', 'succeeded', 'running', 'pending']) }
  },
  {
    id: 'pipeline-4', name: 'ingestion_clickstream', description: 'Ingest clickstream events from Kinesis to raw layer',
    type: 'ingestion', status: 'active', schedule: 'Every 5 min', owner: 'Data Engineering',
    team: 'Platform', source: 'Kinesis clickstream', target: 's3://datalake-raw/clickstream/',
    tags: ['streaming', 'high-volume'], glueJobNames: ['clickstream_etl'],
    sla: 10, avgDuration: 3,
    lastRun: { id: 'run-4a', pipelineId: 'pipeline-4', status: 'succeeded', startTime: '2026-03-15T09:55:00Z', endTime: '2026-03-15T09:58:00Z', duration: 3, recordsProcessed: 45000, steps: makeSteps(['succeeded', 'succeeded']) }
  },
  {
    id: 'pipeline-5', name: 'orchestration_daily_full', description: 'Daily full orchestration - all domains',
    type: 'orchestration', status: 'running', schedule: 'Daily 03:00 UTC', owner: 'Data Platform',
    team: 'Platform', source: 'Multiple', target: 'Multiple',
    tags: ['orchestration', 'full-refresh'], stepFunctionArn: 'arn:aws:states:us-east-1:123:stateMachine:daily-full',
    sla: 240, avgDuration: 195,
    lastRun: { id: 'run-5a', pipelineId: 'pipeline-5', status: 'running', startTime: '2026-03-15T03:00:00Z', recordsProcessed: 15000000, steps: makeSteps(['succeeded', 'succeeded', 'succeeded', 'running', 'pending', 'pending']) }
  },
  {
    id: 'pipeline-6', name: 'ingestion_crm_contacts', description: 'CRM contacts incremental ingestion',
    type: 'ingestion', status: 'active', schedule: 'Every 1 hour', owner: 'CRM Team',
    team: 'Sales', source: 'Salesforce API', target: 's3://datalake-raw/crm/',
    tags: ['crm', 'incremental'], glueJobNames: ['crm_contacts_etl'],
    sla: 60, avgDuration: 18,
    lastRun: { id: 'run-6a', pipelineId: 'pipeline-6', status: 'succeeded', startTime: '2026-03-15T09:00:00Z', endTime: '2026-03-15T09:18:00Z', duration: 18, recordsProcessed: 12000, steps: makeSteps(['succeeded', 'succeeded', 'succeeded']) }
  },
  {
    id: 'pipeline-7', name: 'transform_product_catalog', description: 'Product catalog transformation and enrichment',
    type: 'transformation', status: 'paused', schedule: 'Daily 05:00 UTC', owner: 'Product Data',
    team: 'Product', source: 's3://datalake-raw/products/', target: 's3://datalake-curated/products/',
    tags: ['product', 'paused'], glueJobNames: ['product_enrichment'],
    sla: 90, avgDuration: 55,
    lastRun: { id: 'run-7a', pipelineId: 'pipeline-7', status: 'succeeded', startTime: '2026-03-14T05:00:00Z', endTime: '2026-03-14T05:55:00Z', duration: 55, recordsProcessed: 350000, steps: makeSteps(['succeeded', 'succeeded', 'succeeded']) }
  },
  {
    id: 'pipeline-8', name: 'ingestion_iot_sensors', description: 'IoT sensor data ingestion from Kinesis',
    type: 'ingestion', status: 'active', schedule: 'Every 1 min', owner: 'IoT Team',
    team: 'Engineering', source: 'Kinesis iot-stream', target: 's3://datalake-raw/iot/',
    tags: ['iot', 'real-time', 'high-volume'],
    sla: 5, avgDuration: 1,
    lastRun: { id: 'run-8a', pipelineId: 'pipeline-8', status: 'succeeded', startTime: '2026-03-15T09:59:00Z', endTime: '2026-03-15T09:59:45Z', duration: 1, recordsProcessed: 8500, steps: makeSteps(['succeeded']) }
  },
];

export const MOCK_PIPELINE_ALERTS: PipelineAlert[] = [
  { id: 'pa-1', pipelineId: 'pipeline-1', pipelineName: 'ingestion_orders', type: 'failure', severity: 'critical', message: 'Pipeline failed: Connection timeout to source database after 3 retries', timestamp: '2026-03-15T09:42:00Z', acknowledged: false },
  { id: 'pa-2', pipelineId: 'pipeline-5', pipelineName: 'orchestration_daily_full', type: 'sla_breach', severity: 'high', message: 'Pipeline running 45 min behind schedule, SLA at risk', timestamp: '2026-03-15T09:00:00Z', acknowledged: false },
  { id: 'pa-3', pipelineId: 'pipeline-2', pipelineName: 'transform_customer_360', type: 'data_quality', severity: 'medium', message: 'Data quality check: 3 rules below threshold after transformation', timestamp: '2026-03-15T07:25:00Z', acknowledged: true, acknowledgedBy: 'rafael.carvalho' },
  { id: 'pa-4', pipelineId: 'pipeline-4', pipelineName: 'ingestion_clickstream', type: 'warning', severity: 'low', message: 'Processing time increased 20% in the last hour', timestamp: '2026-03-15T09:30:00Z', acknowledged: false },
];
