export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  dataset: string;
  column?: string;
  ruleType: 'completeness' | 'uniqueness' | 'validity' | 'consistency' | 'freshness' | 'accuracy';
  threshold: number;
  currentScore: number;
  status: 'passing' | 'failing' | 'warning' | 'not_evaluated';
  lastEvaluated: string;
  owner: string;
  tags: string[];
}

export interface DataQualityTableRegistration {
  id: string;
  database: string;
  tableName: string;
  qualifiedName: string;
  owner: string;
  engineRole: string;
  rowCount?: number;
  sizeGb?: number;
  columns: DataQualityTableColumn[];
  primaryKeyColumns: string[];
  qualitativeValidations: string;
  quantitativeValidations: string;
  customRules: DataQualityCustomRule[];
  status: 'draft' | 'registered' | 'waiting_access' | 'ready_to_scan';
  createdAt: string;
  updatedAt: string;
}

export interface DataQualityTableColumn {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

export interface DataQualityCustomRule {
  field: string;
  expression: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type DataQualityTableRegistrationDraft =
  Omit<DataQualityTableRegistration, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'customRules'> & {
    customRulesText: string;
  };

export interface DataQualityReport {
  id: string;
  dataset: string;
  runDate: string;
  overallScore: number;
  ruleResults: DataQualityRuleResult[];
  recordsAnalyzed: number;
  issuesFound: number;
}

export interface DataQualityRuleResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  passed: boolean;
  score: number;
  threshold: number;
  details: string;
  affectedRecords: number;
}

export interface DataQualityTrend {
  date: string;
  overallScore: number;
  completeness: number;
  uniqueness: number;
  validity: number;
  consistency: number;
  freshness: number;
}
