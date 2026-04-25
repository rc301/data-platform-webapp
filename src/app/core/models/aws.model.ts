export interface GlueJob {
  id: string;
  name: string;
  database: string;
  description: string;
  state: 'READY' | 'RUNNING' | 'FAILED' | 'STOPPED' | 'SUCCEEDED' | 'OFFLINE';
  lastRun: string;
  nextRun?: string;
  avgDuration: number;
  owner: string;
  tags: Record<string, string>;
  schedule?: string;
  workerType: 'G.1X' | 'G.2X' | 'G.4X' | 'G.8X';
  numberOfWorkers: number;
  glueVersion: string;
  maxRetries: number;
}

export interface StepFunction {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastExecution: StepFunctionExecution;
  executions: StepFunctionExecution[];
  definition: string;
  createdAt: string;
  owner: string;
}

export interface StepFunctionExecution {
  executionId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED';
  startDate: string;
  stopDate?: string;
  input?: string;
  output?: string;
}

export interface S3Bucket {
  name: string;
  region: string;
  sizeBytes: number;
  objectCount: number;
  lastModified: string;
  versioning: boolean;
  encryption: 'AES256' | 'aws:kms' | 'none';
  lifecycleRules: number;
  tags: Record<string, string>;
}

export interface GlueCatalogTable {
  name: string;
  database: string;
  description: string;
  columns: GlueCatalogColumn[];
  location: string;
  inputFormat: string;
  outputFormat: string;
  serdeInfo: string;
  partitionKeys: string[];
  rowCount: number;
  sizeBytes: number;
  lastAccessTime: string;
  lastUpdated: string;
  owner: string;
  classification: string;
}

export interface GlueCatalogColumn {
  name: string;
  type: string;
  comment?: string;
  isPartitionKey?: boolean;
}

// Munin ETL Flow models

export type MuninFlowStatus = 'running' | 'succeeded' | 'failed' | 'pending' | 'stopped';
export type MuninStepStatus = 'running' | 'succeeded' | 'failed' | 'pending' | 'skipped';

export interface MuninFlow {
  id: string;
  name: string;
  description: string;
  status: MuninFlowStatus;
  schedule: string;
  owner: string;
  targetTable: string;
  targetDatabase: string;
  targetBucket: string;
  lastExecution: MuninExecution;
  executions: MuninExecution[];
  tags: string[];
}

export interface MuninExecution {
  id: string;
  flowId: string;
  status: MuninFlowStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  athenaStep: MuninStep;
  glueStep: MuninStep;
  recordsProcessed?: number;
  errorMessage?: string;
}

export interface MuninStep {
  name: string;
  type: 'athena_query' | 'glue_etl';
  status: MuninStepStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  details?: string;
}
