export interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: 'ingestion' | 'transformation' | 'export' | 'orchestration';
  status: 'active' | 'paused' | 'failed' | 'running';
  schedule: string;
  lastRun: PipelineRun;
  owner: string;
  team: string;
  source: string;
  target: string;
  tags: string[];
  stepFunctionArn?: string;
  glueJobNames?: string[];
  sla?: number;
  avgDuration: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed?: number;
  errorMessage?: string;
  steps: PipelineStep[];
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  type: 'glue_job' | 'lambda' | 'step_function' | 'query' | 'notification';
  details?: string;
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
