export interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: 'GlueJob' | 'Munin' | 'Phoenix' | 'CDP' | 'Outros';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'delayed' | 'offline';
  schedule: string;
  lastRun: PipelineRun;
  owner: string;
  team: string;
  sources: string[];
  target: string;
  tags: string[];
  stepFunctionArn?: string;
  glueJobNames?: string[];
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
