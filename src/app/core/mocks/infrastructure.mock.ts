import { GlueJob, StepFunction, S3Bucket } from '../models';

export const MOCK_GLUE_JOBS: GlueJob[] = [
  { id: 'gj-1', name: 'raw_orders_etl', database: 'raw', description: 'Job ETL para dados de pedidos', state: 'FAILED', lastRun: '2026-03-15T09:30:00Z', avgDuration: 12, owner: 'Data Engineering', tags: { env: 'prod', domain: 'sales' }, schedule: 'rate(30 minutes)', workerType: 'G.2X', numberOfWorkers: 10, glueVersion: '4.0', maxRetries: 3 },
  { id: 'gj-2', name: 'customer_360_transform', database: 'curated', description: 'Transformação Customer 360', state: 'SUCCEEDED', lastRun: '2026-03-15T06:00:00Z', avgDuration: 45, owner: 'Analytics', tags: { env: 'prod', domain: 'customer' }, schedule: 'cron(0 6 * * ? *)', workerType: 'G.4X', numberOfWorkers: 20, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-3', name: 'clickstream_etl', database: 'raw', description: 'Processamento de dados de clickstream', state: 'RUNNING', lastRun: '2026-03-15T09:55:00Z', avgDuration: 3, owner: 'Data Engineering', tags: { env: 'prod', domain: 'digital' }, schedule: 'rate(5 minutes)', workerType: 'G.1X', numberOfWorkers: 5, glueVersion: '4.0', maxRetries: 1 },
  { id: 'gj-4', name: 'finance_curated_to_rds', database: 'curated', description: 'Exportação de dados financeiros para RDS', state: 'RUNNING', lastRun: '2026-03-15T04:00:00Z', avgDuration: 42, owner: 'Finance', tags: { env: 'prod', domain: 'finance' }, schedule: 'cron(0 4 * * ? *)', workerType: 'G.2X', numberOfWorkers: 8, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-5', name: 'product_enrichment', database: 'curated', description: 'Enriquecimento de dados de produtos', state: 'STOPPED', lastRun: '2026-03-14T05:00:00Z', avgDuration: 55, owner: 'Product Data', tags: { env: 'prod', domain: 'product' }, schedule: 'cron(0 5 * * ? *)', workerType: 'G.2X', numberOfWorkers: 10, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-6', name: 'crm_contacts_etl', database: 'raw', description: 'Ingestão de contatos CRM', state: 'SUCCEEDED', lastRun: '2026-03-15T09:00:00Z', avgDuration: 18, owner: 'CRM Team', tags: { env: 'prod', domain: 'crm' }, schedule: 'rate(1 hour)', workerType: 'G.1X', numberOfWorkers: 4, glueVersion: '4.0', maxRetries: 3 },
];

export const MOCK_STEP_FUNCTIONS: StepFunction[] = [
  {
    id: 'sf-1', name: 'daily-full-orchestration', status: 'ACTIVE',
    lastExecution: { executionId: 'exec-1', status: 'RUNNING', startDate: '2026-03-15T03:00:00Z' },
    executions: [
      { executionId: 'exec-1', status: 'RUNNING', startDate: '2026-03-15T03:00:00Z' },
      { executionId: 'exec-0', status: 'SUCCEEDED', startDate: '2026-03-14T03:00:00Z', stopDate: '2026-03-14T06:15:00Z' },
    ],
    definition: '{}', createdAt: '2025-01-10T00:00:00Z', owner: 'Data Platform'
  },
  {
    id: 'sf-2', name: 'customer-360-pipeline', status: 'ACTIVE',
    lastExecution: { executionId: 'exec-2', status: 'SUCCEEDED', startDate: '2026-03-15T06:00:00Z', stopDate: '2026-03-15T07:25:00Z' },
    executions: [
      { executionId: 'exec-2', status: 'SUCCEEDED', startDate: '2026-03-15T06:00:00Z', stopDate: '2026-03-15T07:25:00Z' },
    ],
    definition: '{}', createdAt: '2025-06-01T00:00:00Z', owner: 'Analytics'
  },
];

export const MOCK_S3_BUCKETS: S3Bucket[] = [
  { name: 'datalake-bronze', region: 'us-east-1', sizeBytes: 5.2e12, objectCount: 12500000, lastModified: '2026-03-15T09:59:00Z', versioning: true, encryption: 'aws:kms', lifecycleRules: 3, tags: { env: 'prod', layer: 'bronze' } },
  { name: 'datalake-silver', region: 'us-east-1', sizeBytes: 3.8e12, objectCount: 8200000, lastModified: '2026-03-15T07:25:00Z', versioning: true, encryption: 'aws:kms', lifecycleRules: 2, tags: { env: 'prod', layer: 'silver' } },
  { name: 'datalake-gold', region: 'us-east-1', sizeBytes: 1.2e12, objectCount: 3500000, lastModified: '2026-03-15T09:00:00Z', versioning: false, encryption: 'aws:kms', lifecycleRules: 1, tags: { env: 'prod', layer: 'gold' } },
  { name: 'datalake-logs', region: 'us-east-1', sizeBytes: 800e9, objectCount: 50000000, lastModified: '2026-03-15T10:00:00Z', versioning: false, encryption: 'AES256', lifecycleRules: 5, tags: { env: 'prod', type: 'logs' } },
  { name: 'datalake-temp', region: 'us-east-1', sizeBytes: 200e9, objectCount: 1500000, lastModified: '2026-03-15T09:58:00Z', versioning: false, encryption: 'AES256', lifecycleRules: 2, tags: { env: 'prod', type: 'temp' } },
];
