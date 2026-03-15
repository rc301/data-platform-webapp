import { GlueJob, StepFunction, S3Bucket, DynamoTable, RdsInstance, GlueCatalogDatabase, IamRole } from '../models';

export const MOCK_GLUE_JOBS: GlueJob[] = [
  { id: 'gj-1', name: 'raw_orders_etl', database: 'raw', description: 'ETL job for orders data', state: 'FAILED', lastRun: '2026-03-15T09:30:00Z', avgDuration: 12, owner: 'Data Engineering', tags: { env: 'prod', domain: 'sales' }, schedule: 'rate(30 minutes)', workerType: 'G.2X', numberOfWorkers: 10, glueVersion: '4.0', maxRetries: 3 },
  { id: 'gj-2', name: 'customer_360_transform', database: 'curated', description: 'Customer 360 transformation', state: 'SUCCEEDED', lastRun: '2026-03-15T06:00:00Z', avgDuration: 45, owner: 'Analytics', tags: { env: 'prod', domain: 'customer' }, schedule: 'cron(0 6 * * ? *)', workerType: 'G.4X', numberOfWorkers: 20, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-3', name: 'clickstream_etl', database: 'raw', description: 'Clickstream data processing', state: 'RUNNING', lastRun: '2026-03-15T09:55:00Z', avgDuration: 3, owner: 'Data Engineering', tags: { env: 'prod', domain: 'digital' }, schedule: 'rate(5 minutes)', workerType: 'G.1X', numberOfWorkers: 5, glueVersion: '4.0', maxRetries: 1 },
  { id: 'gj-4', name: 'finance_curated_to_rds', database: 'curated', description: 'Export finance data to RDS', state: 'RUNNING', lastRun: '2026-03-15T04:00:00Z', avgDuration: 42, owner: 'Finance', tags: { env: 'prod', domain: 'finance' }, schedule: 'cron(0 4 * * ? *)', workerType: 'G.2X', numberOfWorkers: 8, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-5', name: 'product_enrichment', database: 'curated', description: 'Product data enrichment', state: 'STOPPED', lastRun: '2026-03-14T05:00:00Z', avgDuration: 55, owner: 'Product Data', tags: { env: 'prod', domain: 'product' }, schedule: 'cron(0 5 * * ? *)', workerType: 'G.2X', numberOfWorkers: 10, glueVersion: '4.0', maxRetries: 2 },
  { id: 'gj-6', name: 'crm_contacts_etl', database: 'raw', description: 'CRM contacts ingestion', state: 'SUCCEEDED', lastRun: '2026-03-15T09:00:00Z', avgDuration: 18, owner: 'CRM Team', tags: { env: 'prod', domain: 'crm' }, schedule: 'rate(1 hour)', workerType: 'G.1X', numberOfWorkers: 4, glueVersion: '4.0', maxRetries: 3 },
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
  { name: 'datalake-raw', region: 'us-east-1', sizeBytes: 5.2e12, objectCount: 12500000, lastModified: '2026-03-15T09:59:00Z', versioning: true, encryption: 'aws:kms', lifecycleRules: 3, tags: { env: 'prod', layer: 'raw' } },
  { name: 'datalake-curated', region: 'us-east-1', sizeBytes: 3.8e12, objectCount: 8200000, lastModified: '2026-03-15T07:25:00Z', versioning: true, encryption: 'aws:kms', lifecycleRules: 2, tags: { env: 'prod', layer: 'curated' } },
  { name: 'datalake-consumption', region: 'us-east-1', sizeBytes: 1.2e12, objectCount: 3500000, lastModified: '2026-03-15T09:00:00Z', versioning: false, encryption: 'aws:kms', lifecycleRules: 1, tags: { env: 'prod', layer: 'consumption' } },
  { name: 'datalake-logs', region: 'us-east-1', sizeBytes: 800e9, objectCount: 50000000, lastModified: '2026-03-15T10:00:00Z', versioning: false, encryption: 'AES256', lifecycleRules: 5, tags: { env: 'prod', type: 'logs' } },
  { name: 'datalake-temp', region: 'us-east-1', sizeBytes: 200e9, objectCount: 1500000, lastModified: '2026-03-15T09:58:00Z', versioning: false, encryption: 'AES256', lifecycleRules: 2, tags: { env: 'prod', type: 'temp' } },
];

export const MOCK_DYNAMO_TABLES: DynamoTable[] = [
  { tableName: 'pipeline-metadata', status: 'ACTIVE', itemCount: 450, sizeBytes: 2.5e6, readCapacity: 50, writeCapacity: 25, billingMode: 'PROVISIONED', partitionKey: 'pipeline_id', sortKey: 'run_id', gsiCount: 2, lastBackup: '2026-03-15T00:00:00Z' },
  { tableName: 'data-quality-results', status: 'ACTIVE', itemCount: 125000, sizeBytes: 850e6, readCapacity: 100, writeCapacity: 50, billingMode: 'PAY_PER_REQUEST', partitionKey: 'dataset', sortKey: 'evaluation_date', gsiCount: 3, lastBackup: '2026-03-15T00:00:00Z' },
  { tableName: 'catalog-cache', status: 'ACTIVE', itemCount: 5200, sizeBytes: 45e6, readCapacity: 25, writeCapacity: 10, billingMode: 'PAY_PER_REQUEST', partitionKey: 'asset_id', gsiCount: 1, lastBackup: '2026-03-14T00:00:00Z' },
  { tableName: 'alert-history', status: 'ACTIVE', itemCount: 78000, sizeBytes: 320e6, readCapacity: 50, writeCapacity: 25, billingMode: 'PAY_PER_REQUEST', partitionKey: 'alert_id', sortKey: 'timestamp', gsiCount: 2, lastBackup: '2026-03-15T00:00:00Z' },
];

export const MOCK_RDS_INSTANCES: RdsInstance[] = [
  { id: 'rds-1', engine: 'PostgreSQL', engineVersion: '15.4', instanceClass: 'db.r6g.2xlarge', status: 'available', endpoint: 'prod-analytics-db.cluster-xyz.us-east-1.rds.amazonaws.com', port: 5432, multiAZ: true, storageGB: 500, cpu: 42, connections: 180, maxConnections: 200 },
  { id: 'rds-2', engine: 'PostgreSQL', engineVersion: '15.4', instanceClass: 'db.r6g.xlarge', status: 'available', endpoint: 'prod-reporting-db.cluster-xyz.us-east-1.rds.amazonaws.com', port: 5432, multiAZ: true, storageGB: 250, cpu: 28, connections: 65, maxConnections: 150 },
  { id: 'rds-3', engine: 'MySQL', engineVersion: '8.0.35', instanceClass: 'db.r6g.large', status: 'available', endpoint: 'prod-metadata-db.xyz.us-east-1.rds.amazonaws.com', port: 3306, multiAZ: false, storageGB: 100, cpu: 15, connections: 22, maxConnections: 100 },
];

export const MOCK_GLUE_DATABASES: GlueCatalogDatabase[] = [
  { name: 'raw', description: 'Raw data layer - data as ingested from sources', tables: 45, location: 's3://datalake-raw/', owner: 'Data Engineering', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-03-15T09:59:00Z' },
  { name: 'curated', description: 'Curated data layer - cleaned and transformed', tables: 32, location: 's3://datalake-curated/', owner: 'Analytics Engineering', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-03-15T07:25:00Z' },
  { name: 'consumption', description: 'Consumption layer - ready for BI and reporting', tables: 18, location: 's3://datalake-consumption/', owner: 'Analytics', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-03-15T09:00:00Z' },
];

export const MOCK_IAM_ROLES: IamRole[] = [
  { roleName: 'GlueServiceRole-DataPlatform', arn: 'arn:aws:iam::123456789012:role/GlueServiceRole-DataPlatform', description: 'Service role for Glue ETL jobs', createdAt: '2025-01-01T00:00:00Z', lastUsed: '2026-03-15T09:55:00Z', attachedPolicies: ['AmazonS3FullAccess', 'AWSGlueServiceRole', 'CloudWatchLogsFullAccess'], trustPolicy: '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"glue.amazonaws.com"},"Action":"sts:AssumeRole"}]}' },
  { roleName: 'StepFunctionsRole-Orchestration', arn: 'arn:aws:iam::123456789012:role/StepFunctionsRole-Orchestration', description: 'Role for Step Functions orchestration', createdAt: '2025-01-15T00:00:00Z', lastUsed: '2026-03-15T03:00:00Z', attachedPolicies: ['AWSStepFunctionsFullAccess', 'AWSGlueConsoleFullAccess', 'AmazonSNSFullAccess'], trustPolicy: '{}' },
  { roleName: 'DataPlatform-ReadOnly', arn: 'arn:aws:iam::123456789012:role/DataPlatform-ReadOnly', description: 'Read-only access for analysts', createdAt: '2025-02-01T00:00:00Z', lastUsed: '2026-03-15T08:30:00Z', attachedPolicies: ['AmazonS3ReadOnlyAccess', 'AWSGlueConsoleFullAccess'], trustPolicy: '{}' },
];
