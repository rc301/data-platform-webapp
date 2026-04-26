import { DataLayer } from './catalog.model';

export type IngestionFlowKind = 'glue_job' | 'munin_sql' | 'phoenix' | 'cdp' | 'other';
export type PipelineRegistrationSource = 'discovered' | 'manual';

export interface Pipeline {
  id: string;
  name: string;
  sigla: string;
  description: string;
  type: 'GlueJob' | 'Munin' | 'Phoenix' | 'CDP' | 'Outros';
  ingestionKind?: IngestionFlowKind;
  registrationSource?: PipelineRegistrationSource;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'delayed' | 'offline';
  schedule: string;
  lastRun: PipelineRun;
  owner: string;
  team: string;
  sources: string[];
  target: string;
  targetLayer?: DataLayer;
  targetGoldenSource?: boolean;
  tags: string[];
  stepFunctionArn?: string;
  glueJobNames?: string[];
  sla?: string;
  avgDuration: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PipelineRegistryDraft {
  id?: string;
  name: string;
  sigla: string;
  description: string;
  ingestionKind: IngestionFlowKind;
  status: Pipeline['status'];
  schedule: string;
  owner: string;
  team: string;
  sources: string[];
  target: string;
  targetLayer?: DataLayer;
  targetGoldenSource: boolean;
  tags: string[];
  sla?: string;
  avgDuration: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'delayed' | 'offline';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed?: number;
  errorMessage?: string;
}

export interface PipelineAlert {
  id: string;
  pipelineId: string;
  pipelineName: string;
  type: 'failure' | 'sla_breach' | 'data_quality' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}
