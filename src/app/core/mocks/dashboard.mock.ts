import { MonitoringMetric, HealthCheck, CostMetric, MonitoringAlert } from '../models';

export const MOCK_METRICS: MonitoringMetric[] = [
  { name: 'Pipelines Active', value: 47, unit: '', trend: 'up', changePercent: 12, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Data Quality Score', value: 94.2, unit: '%', trend: 'up', changePercent: 2.1, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Jobs Running', value: 8, unit: '', trend: 'stable', changePercent: 0, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Alerts Active', value: 3, unit: '', trend: 'down', changePercent: -25, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'S3 Storage', value: 12.4, unit: 'TB', trend: 'up', changePercent: 8.3, timestamp: '2026-03-15T10:00:00Z' },
  { name: 'Monthly Cost', value: 34520, unit: 'USD', trend: 'up', changePercent: 5.2, timestamp: '2026-03-15T10:00:00Z' },
];

export const MOCK_HEALTH_CHECKS: HealthCheck[] = [
  { service: 'AWS Glue', status: 'healthy', latency: 45, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.97 },
  { service: 'Step Functions', status: 'healthy', latency: 32, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'S3', status: 'healthy', latency: 12, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'DynamoDB', status: 'healthy', latency: 8, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.99 },
  { service: 'RDS PostgreSQL', status: 'degraded', latency: 250, lastCheck: '2026-03-15T10:00:00Z', uptime: 99.85, details: 'High connection count detected' },
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

export const MOCK_RECENT_ALERTS: MonitoringAlert[] = [
  {
    id: 'alert-1', severity: 'critical', source: 'Pipeline Monitor', title: 'Pipeline ingestion_orders failed',
    message: 'Glue Job raw_orders_etl failed after 3 retries. Error: Connection timeout to source database.',
    timestamp: '2026-03-15T09:45:00Z', status: 'active', relatedResource: 'pipeline-1', category: 'pipeline'
  },
  {
    id: 'alert-2', severity: 'high', source: 'Data Quality', title: 'Data quality below threshold',
    message: 'Dataset customer_master completeness score dropped to 87% (threshold: 95%).',
    timestamp: '2026-03-15T08:30:00Z', status: 'active', relatedResource: 'dq-rule-3', category: 'data_quality'
  },
  {
    id: 'alert-3', severity: 'medium', source: 'Infrastructure', title: 'RDS connection pool near limit',
    message: 'RDS instance prod-analytics-db has 180/200 active connections.',
    timestamp: '2026-03-15T07:15:00Z', status: 'acknowledged', acknowledgedBy: 'rafael.carvalho', relatedResource: 'rds-1', category: 'infrastructure'
  },
  {
    id: 'alert-4', severity: 'low', source: 'Cost Monitor', title: 'Glue cost 15% above forecast',
    message: 'AWS Glue spend is trending 15% above monthly forecast. Current: $8,750, Forecast: $7,600.',
    timestamp: '2026-03-14T16:00:00Z', status: 'active', relatedResource: 'cost-glue', category: 'cost'
  },
  {
    id: 'alert-5', severity: 'high', source: 'Pipeline Monitor', title: 'SLA breach risk: financial_reporting',
    message: 'Pipeline financial_reporting is running 45min behind schedule. SLA deadline in 2h.',
    timestamp: '2026-03-15T09:00:00Z', status: 'active', relatedResource: 'pipeline-5', category: 'pipeline'
  },
];
