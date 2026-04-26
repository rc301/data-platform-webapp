import { DataQualityRule, DataQualityReport, DataQualityTableRegistration, DataQualityTrend } from '../models';

export const MOCK_DQ_RULES: DataQualityRule[] = [
  { id: 'dq-1', name: 'Orders Not Null', description: 'Order ID e Customer ID não podem ser nulos', dataset: 'raw.orders', column: 'order_id', ruleType: 'completeness', threshold: 99.9, currentScore: 99.95, status: 'passing', lastEvaluated: '2026-03-15T08:00:00Z', owner: 'Data Engineering', tags: ['critical', 'orders'] },
  { id: 'dq-2', name: 'Customer Email Format', description: 'E-mail do cliente deve ter formato válido', dataset: 'curated.customer_360', column: 'email', ruleType: 'validity', threshold: 98, currentScore: 97.2, status: 'warning', lastEvaluated: '2026-03-15T07:30:00Z', owner: 'Analytics', tags: ['customer'] },
  { id: 'dq-3', name: 'Customer Completeness', description: 'Completude do registro mestre de clientes', dataset: 'curated.customer_master', ruleType: 'completeness', threshold: 95, currentScore: 87, status: 'failing', lastEvaluated: '2026-03-15T08:00:00Z', owner: 'Data Engineering', tags: ['critical', 'customer'] },
  { id: 'dq-4', name: 'Product SKU Unique', description: 'SKU do produto deve ser único', dataset: 'curated.products', column: 'sku', ruleType: 'uniqueness', threshold: 100, currentScore: 100, status: 'passing', lastEvaluated: '2026-03-15T06:00:00Z', owner: 'Product Data', tags: ['product'] },
  { id: 'dq-5', name: 'Financial Data Freshness', description: 'Dados financeiros devem ser atualizados em até 4 horas', dataset: 'curated.financial_transactions', ruleType: 'freshness', threshold: 100, currentScore: 100, status: 'passing', lastEvaluated: '2026-03-15T09:00:00Z', owner: 'Finance', tags: ['finance', 'sla'] },
  { id: 'dq-6', name: 'Cross-DB Order Consistency', description: 'Totais de pedidos devem ser consistentes entre raw e curated', dataset: 'curated.orders', ruleType: 'consistency', threshold: 99.5, currentScore: 99.8, status: 'passing', lastEvaluated: '2026-03-15T08:30:00Z', owner: 'Data Engineering', tags: ['orders', 'reconciliation'] },
  { id: 'dq-7', name: 'Revenue Accuracy', description: 'Valores de receita devem estar dentro do intervalo esperado', dataset: 'curated.financial_summary', column: 'total_revenue', ruleType: 'accuracy', threshold: 99, currentScore: 98.5, status: 'warning', lastEvaluated: '2026-03-15T07:00:00Z', owner: 'Finance', tags: ['finance'] },
  { id: 'dq-8', name: 'Clickstream Freshness', description: 'Dados de clickstream com atraso máximo de 10 min', dataset: 'raw.clickstream', ruleType: 'freshness', threshold: 100, currentScore: 100, status: 'passing', lastEvaluated: '2026-03-15T09:55:00Z', owner: 'Data Engineering', tags: ['clickstream', 'real-time'] },
];

export const MOCK_DQ_TABLE_REGISTRATIONS: DataQualityTableRegistration[] = [
  {
    id: 'dq-table-1',
    database: 'spec',
    tableName: 'customer_360',
    qualifiedName: 'spec.customer_360',
    owner: 'Squad B',
    engineRole: 'role_data_quality_engine_prod',
    rowCount: 2500000,
    sizeGb: 42.7,
    columns: [
      { name: 'customer_id', type: 'STRING', nullable: false, description: 'Chave funcional do cliente' },
      { name: 'email', type: 'STRING', nullable: true, description: 'E-mail principal' },
      { name: 'total_orders', type: 'INT', nullable: false },
      { name: 'ltv', type: 'DECIMAL(18,2)', nullable: false },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false },
    ],
    primaryKeyColumns: ['customer_id'],
    qualitativeValidations: 'Campos de identificação devem estar coerentes com o cadastro mestre. Segmento deve pertencer ao domínio corporativo vigente.',
    quantitativeValidations: 'Volume diário não deve variar mais de 20% sem evento operacional registrado. Freshness máxima: D-1 até 07h30.',
    customRules: [
      { field: 'email', expression: 'Percentual de nulos não pode ultrapassar 5%', threshold: 95, severity: 'high' },
      { field: 'customer_id', expression: 'Não pode haver duplicidade', threshold: 100, severity: 'critical' },
    ],
    status: 'ready_to_scan',
    createdAt: '2026-03-15T07:25:00Z',
    updatedAt: '2026-03-15T07:40:00Z',
  },
];

export const MOCK_DQ_TRENDS: DataQualityTrend[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, 14 + i);
  const base = 92 + seededWave(i, 6);
  return {
    date: date.toISOString().split('T')[0],
    overallScore: +base.toFixed(1),
    completeness: +(base + seededWave(i + 11, 3) - 1).toFixed(1),
    uniqueness: +(98 + seededWave(i + 19, 2)).toFixed(1),
    validity: +(base - 1 + seededWave(i + 23, 4)).toFixed(1),
    consistency: +(base + seededWave(i + 29, 2)).toFixed(1),
    freshness: +(97 + seededWave(i + 31, 3)).toFixed(1),
  };
});

function seededWave(seed: number, amplitude: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * amplitude;
}

export const MOCK_DQ_REPORT: DataQualityReport = {
  id: 'report-1',
  dataset: 'gold.customer_360',
  runDate: '2026-03-15T08:00:00Z',
  overallScore: 94.2,
  recordsAnalyzed: 2500000,
  issuesFound: 145000,
  ruleResults: [
    { ruleId: 'dq-1', ruleName: 'Not Null Check', ruleType: 'completeness', passed: true, score: 99.95, threshold: 99.9, details: '1.250 valores nulos encontrados', affectedRecords: 1250 },
    { ruleId: 'dq-2', ruleName: 'Email Format', ruleType: 'validity', passed: false, score: 97.2, threshold: 98, details: '70.000 formatos de e-mail inválidos', affectedRecords: 70000 },
    { ruleId: 'dq-4', ruleName: 'SKU Uniqueness', ruleType: 'uniqueness', passed: true, score: 100, threshold: 100, details: 'Todos os SKUs são únicos', affectedRecords: 0 },
    { ruleId: 'dq-6', ruleName: 'Cross-DB Consistency', ruleType: 'consistency', passed: true, score: 99.8, threshold: 99.5, details: '5.000 registros com pequenas divergências', affectedRecords: 5000 },
  ],
};
