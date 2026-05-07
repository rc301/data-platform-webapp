import { MonitoringMetric, HealthCheck, CostMetric, MonitoringAlert, PipelineRunCost } from '../models';

export const MOCK_METRICS: MonitoringMetric[] = [
  { name: 'Pipelines Ativos', value: 47, unit: '', trend: 'up', changePercent: 12, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Qualidade de Dados', value: 94.2, unit: '%', trend: 'up', changePercent: 2.1, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Jobs em Execução', value: 8, unit: '', trend: 'stable', changePercent: 0, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Alertas Ativos', value: 3, unit: '', trend: 'down', changePercent: -25, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Armazenamento S3', value: 12.4, unit: 'TB', trend: 'up', changePercent: 8.3, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Custo Mensal', value: 34520, unit: 'USD', trend: 'up', changePercent: 5.2, timestamp: '2026-03-15T10:00:00Z' },
];

export const MOCK_HEALTH_CHECKS: HealthCheck[] = [
  { service: 'AWS Glue', status: 'healthy', latency: 45, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.97 },
  { service: 'Step Functions', status: 'healthy', latency: 32, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'S3', status: 'healthy', latency: 12, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'DynamoDB', status: 'healthy', latency: 8, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'RDS PostgreSQL', status: 'degraded', latency: 250, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.85, details: 'Alto número de conexões detectado' },
  { service: 'Glue Catalog', status: 'healthy', latency: 28, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.95 },
  { service: 'Atlan Catalog', status: 'healthy', latency: 120, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.90 },
  { service: 'Data Quality Engine', status: 'healthy', latency: 55, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.92 },
];

export const MOCK_COST_METRICS: CostMetric[] = [
  { service: 'AWS Glue', currentMonth: 8750, previousMonth: 8200, trend: 6.7, budget: 10000, forecast: 9100 },
  { service: 'S3 Storage', currentMonth: 4200, previousMonth: 3900, trend: 7.7, budget: 5000, forecast: 4400 },
  { service: 'RDS', currentMonth: 6800, previousMonth: 6800, trend: 0, budget: 7500, forecast: 6800 },
  { service: 'DynamoDB', currentMonth: 1200, previousMonth: 1100, trend: 9.1, budget: 1500, forecast: 1250 },
  { service: 'Step Functions', currentMonth: 320, previousMonth: 280, trend: 14.3, budget: 500, forecast: 340 },
  { service: 'Lambda', currentMonth: 850, previousMonth: 780, trend: 9.0, budget: 1000, forecast: 890 },
  { service: 'CloudWatch', currentMonth: 450, previousMonth: 420, trend: 7.1, budget: 600, forecast: 470 },
  { service: 'Data Transfer', currentMonth: 2100, previousMonth: 1950, trend: 7.7, budget: 2500, forecast: 2200 },
];

export const MOCK_PIPELINE_RUN_COSTS: PipelineRunCost[] = [
  {
    id: 'prc-1',
    pipelineId: 'pipeline-1',
    pipelineName: 'ingestion_orders',
    runId: 'run-1a',
    engine: 'GlueJob',
    startedAt: '2026-03-15T09:30:00Z',
    durationMinutes: 12,
    recordsProcessed: 0,
    costUsd: 4.82,
    costBreakdown: { computeUsd: 4.10, orchestrationUsd: 0.24, logsUsd: 0.48 },
    hasDiscriminatedCost: true,
  },
  {
    id: 'prc-2',
    pipelineId: 'pipeline-2',
    pipelineName: 'transform_customer_360',
    runId: 'run-2a',
    engine: 'CDP',
    startedAt: '2026-03-15T06:00:00Z',
    durationMinutes: 85,
    recordsProcessed: 2500000,
    costUsd: 18.64,
    costBreakdown: { computeUsd: 16.20, orchestrationUsd: 0.74, logsUsd: 1.70 },
    hasDiscriminatedCost: true,
  },
  {
    id: 'prc-3',
    pipelineId: 'pipeline-5',
    pipelineName: 'orchestration_daily_full',
    runId: 'run-5a',
    engine: 'Munin',
    startedAt: '2026-03-15T03:00:00Z',
    durationMinutes: 195,
    recordsProcessed: 15000000,
    hasDiscriminatedCost: false,
    note: 'Munin legado sem tagueamento de custo por execução.',
  },
  {
    id: 'prc-4',
    pipelineId: 'pipeline-9',
    pipelineName: 'sync_erp_master_data',
    runId: 'run-9a',
    engine: 'Outros',
    startedAt: '2026-03-14T01:00:00Z',
    durationMinutes: 30,
    recordsProcessed: 95000,
    hasDiscriminatedCost: false,
    note: 'Processo legado sem tagueamento de custo por execução.',
  },
];

export const MOCK_RECENT_ALERTS: MonitoringAlert[] = [
  {
    id: 'alert-1', severity: 'critical', source: 'Monitor de Pipelines', title: 'Pipeline ingestion_orders falhou',
    message: 'Glue Job raw_orders_etl falhou após 3 tentativas. Erro: Timeout de conexão com o banco de dados de origem.',
    timestamp: '2026-03-15T09:45:00Z', status: 'active', relatedResource: 'pipeline-1', category: 'pipeline'
  },
  {
    id: 'alert-2', severity: 'high', source: 'Qualidade de Dados', title: 'Qualidade de dados abaixo do limite',
    message: 'Tabela spec.customer_360 com score de completude caiu para 87% (limite: 95%).',
    timestamp: '2026-03-15T08:30:00Z', status: 'active', relatedResource: 'spec.customer_360', category: 'data_quality'
  },
  {
    id: 'alert-3', severity: 'medium', source: 'Infraestrutura', title: 'Pool de conexões RDS próximo do limite',
    message: 'Instância RDS prod-analytics-db com 180/200 conexões ativas.',
    timestamp: '2026-03-15T07:15:00Z', status: 'acknowledged', acknowledgedBy: 'rafael.carvalho', relatedResource: 'rds-1', category: 'infrastructure'
  },
  {
    id: 'alert-4', severity: 'low', source: 'Monitor de Custos', title: 'Custo Glue 15% acima da previsão',
    message: 'Gasto com AWS Glue está 15% acima da previsão mensal. Atual: $8.750, Previsão: $7.600.',
    timestamp: '2026-03-14T16:00:00Z', status: 'active', relatedResource: 'cost-glue', category: 'cost'
  },
  {
    id: 'alert-5', severity: 'high', source: 'Monitor de Pipelines', title: 'Risco de violação de SLA: orchestration_daily_full',
    message: 'Pipeline orchestration_daily_full está 45min atrasada em relação ao SLA.',
    timestamp: '2026-03-15T09:00:00Z', status: 'active', relatedResource: 'pipeline-5', category: 'pipeline'
  },
];
