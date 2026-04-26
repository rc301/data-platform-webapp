import { Injectable, signal } from '@angular/core';
import { DataQualityTableRegistration } from '../models';
import { MOCK_CATALOG_ASSETS, MOCK_DOMAINS, MOCK_GLOSSARY } from '../mocks/catalog.mock';
import { MOCK_DQ_RULES, MOCK_DQ_TABLE_REGISTRATIONS, MOCK_DQ_TRENDS } from '../mocks/data-quality.mock';
import { MOCK_COST_METRICS, MOCK_HEALTH_CHECKS, MOCK_METRICS, MOCK_RECENT_ALERTS } from '../mocks/dashboard.mock';
import { MOCK_GLUE_JOBS, MOCK_S3_BUCKETS, MOCK_STEP_FUNCTIONS } from '../mocks/infrastructure.mock';
import { MOCK_LINEAGE_GRAPHS } from '../mocks/lineage.mock';
import { MOCK_JOBS } from '../mocks/ops.mock';
import { MOCK_PIPELINE_ALERTS, MOCK_PIPELINES } from '../mocks/pipelines.mock';

@Injectable({ providedIn: 'root' })
export class PlatformDataService {
  private readonly pipelinesSig = signal(MOCK_PIPELINES);
  private readonly pipelineAlertsSig = signal(MOCK_PIPELINE_ALERTS);
  private readonly monitoringAlertsSig = signal(MOCK_RECENT_ALERTS);
  private readonly metricsSig = signal(MOCK_METRICS);
  private readonly healthChecksSig = signal(MOCK_HEALTH_CHECKS);
  private readonly costMetricsSig = signal(MOCK_COST_METRICS);
  private readonly catalogAssetsSig = signal(MOCK_CATALOG_ASSETS);
  private readonly catalogDomainsSig = signal(MOCK_DOMAINS);
  private readonly glossarySig = signal(MOCK_GLOSSARY);
  private readonly dqRulesSig = signal(MOCK_DQ_RULES);
  private readonly dqTableRegistrationsSig = signal(MOCK_DQ_TABLE_REGISTRATIONS);
  private readonly dqTrendsSig = signal(MOCK_DQ_TRENDS);
  private readonly glueJobsSig = signal(MOCK_GLUE_JOBS);
  private readonly stepFunctionsSig = signal(MOCK_STEP_FUNCTIONS);
  private readonly s3BucketsSig = signal(MOCK_S3_BUCKETS);
  private readonly lineageGraphsSig = signal(MOCK_LINEAGE_GRAPHS);
  private readonly jobsSig = signal(MOCK_JOBS);

  readonly pipelines = this.pipelinesSig.asReadonly();
  readonly pipelineAlerts = this.pipelineAlertsSig.asReadonly();
  readonly monitoringAlerts = this.monitoringAlertsSig.asReadonly();
  readonly metrics = this.metricsSig.asReadonly();
  readonly healthChecks = this.healthChecksSig.asReadonly();
  readonly costMetrics = this.costMetricsSig.asReadonly();
  readonly catalogAssets = this.catalogAssetsSig.asReadonly();
  readonly catalogDomains = this.catalogDomainsSig.asReadonly();
  readonly glossary = this.glossarySig.asReadonly();
  readonly dqRules = this.dqRulesSig.asReadonly();
  readonly dqTableRegistrations = this.dqTableRegistrationsSig.asReadonly();
  readonly dqTrends = this.dqTrendsSig.asReadonly();
  readonly glueJobs = this.glueJobsSig.asReadonly();
  readonly stepFunctions = this.stepFunctionsSig.asReadonly();
  readonly s3Buckets = this.s3BucketsSig.asReadonly();
  readonly lineageGraphs = this.lineageGraphsSig.asReadonly();
  readonly jobs = this.jobsSig.asReadonly();

  addDataQualityTableRegistration(registration: DataQualityTableRegistration): void {
    this.dqTableRegistrationsSig.update(registrations => [registration, ...registrations]);
  }

  refreshOperationalSnapshot(): void {
    this.pipelinesSig.set([...MOCK_PIPELINES]);
    this.pipelineAlertsSig.set([...MOCK_PIPELINE_ALERTS]);
    this.monitoringAlertsSig.set([...MOCK_RECENT_ALERTS]);
    this.jobsSig.set([...MOCK_JOBS]);
  }
}
