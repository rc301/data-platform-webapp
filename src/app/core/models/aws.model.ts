export interface GlueJob {
  id: string;
  name: string;
  database: string;
  description: string;
  state: 'READY' | 'RUNNING' | 'FAILED' | 'STOPPED' | 'SUCCEEDED';
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

export interface DynamoTable {
  tableName: string;
  status: 'ACTIVE' | 'CREATING' | 'DELETING' | 'UPDATING';
  itemCount: number;
  sizeBytes: number;
  readCapacity: number;
  writeCapacity: number;
  billingMode: 'PROVISIONED' | 'PAY_PER_REQUEST';
  partitionKey: string;
  sortKey?: string;
  gsiCount: number;
  lastBackup?: string;
}

export interface RdsInstance {
  id: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  status: 'available' | 'stopped' | 'starting' | 'stopping' | 'modifying';
  endpoint: string;
  port: number;
  multiAZ: boolean;
  storageGB: number;
  cpu: number;
  connections: number;
  maxConnections: number;
}

export interface GlueCatalogDatabase {
  name: string;
  description: string;
  tables: number;
  location: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
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

export interface IamRole {
  roleName: string;
  arn: string;
  description: string;
  createdAt: string;
  lastUsed?: string;
  attachedPolicies: string[];
  trustPolicy: string;
}
