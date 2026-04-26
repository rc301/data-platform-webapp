export interface MonitoringMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  timestamp: string;
}

export interface MonitoringAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedAt?: string;
  relatedResource: string;
  category: 'infrastructure' | 'data_quality' | 'pipeline' | 'security' | 'cost';
}

export interface CostMetric {
  service: string;
  currentMonth: number;
  previousMonth: number;
  trend: number;
  budget: number;
  forecast: number;
}

export interface PipelineRunCost {
  id: string;
  pipelineId: string;
  pipelineName: string;
  runId: string;
  engine: 'GlueJob' | 'Munin' | 'Phoenix' | 'CDP' | 'Outros';
  startedAt: string;
  durationMinutes: number;
  recordsProcessed?: number;
  costUsd?: number;
  costBreakdown?: {
    computeUsd?: number;
    orchestrationUsd?: number;
    logsUsd?: number;
  };
  hasDiscriminatedCost: boolean;
  note?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: string;
  uptime: number;
  details?: string;
}
