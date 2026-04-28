import { Injectable, inject, signal } from '@angular/core';
import { DataQualityTableRegistration, IngestionFlowKind, Pipeline, PipelineExecutionRequest, PipelineExecutionRequestDraft, PipelineRegistryDraft } from '../models';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { MOCK_CATALOG_ASSETS, MOCK_DOMAINS, MOCK_GLOSSARY } from '../mocks/catalog.mock';
import { MOCK_DQ_RULES, MOCK_DQ_TABLE_REGISTRATIONS, MOCK_DQ_TRENDS } from '../mocks/data-quality.mock';
import { MOCK_COST_METRICS, MOCK_HEALTH_CHECKS, MOCK_METRICS, MOCK_PIPELINE_RUN_COSTS, MOCK_RECENT_ALERTS } from '../mocks/dashboard.mock';
import { MOCK_GLUE_JOBS, MOCK_S3_BUCKETS, MOCK_STEP_FUNCTIONS } from '../mocks/infrastructure.mock';
import { MOCK_LINEAGE_GRAPHS } from '../mocks/lineage.mock';
import { MOCK_JOBS } from '../mocks/ops.mock';
import { MOCK_PIPELINE_ALERTS, MOCK_PIPELINES } from '../mocks/pipelines.mock';

@Injectable({ providedIn: 'root' })
export class PlatformDataService {
  private readonly audit = inject(AuditService);
  private readonly auth = inject(AuthService);
  private readonly pipelinesSig = signal(MOCK_PIPELINES);
  private readonly pipelineAlertsSig = signal(MOCK_PIPELINE_ALERTS);
  private readonly monitoringAlertsSig = signal(MOCK_RECENT_ALERTS);
  private readonly metricsSig = signal(MOCK_METRICS);
  private readonly healthChecksSig = signal(MOCK_HEALTH_CHECKS);
  private readonly costMetricsSig = signal(MOCK_COST_METRICS);
  private readonly pipelineRunCostsSig = signal(MOCK_PIPELINE_RUN_COSTS);
  private readonly pipelineExecutionRequestsSig = signal<PipelineExecutionRequest[]>([]);
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
  readonly pipelineRunCosts = this.pipelineRunCostsSig.asReadonly();
  readonly pipelineExecutionRequests = this.pipelineExecutionRequestsSig.asReadonly();
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

  addPipelineRegistryEntry(draft: PipelineRegistryDraft): Pipeline {
    const pipeline = this.toPipeline(draft);
    this.pipelinesSig.update(pipelines => [pipeline, ...pipelines]);
    this.audit.record('pipeline.registry.created', {
      resourceType: 'pipeline',
      resourceId: pipeline.id,
      metadata: { name: pipeline.name, source: pipeline.registrationSource ?? 'manual', ingestionKind: pipeline.ingestionKind ?? 'other' },
    });
    return pipeline;
  }

  updatePipelineRegistryEntry(id: string, draft: PipelineRegistryDraft): Pipeline | null {
    const existing = this.pipelinesSig().find(pipeline => pipeline.id === id);
    if (!existing) return null;

    const updated: Pipeline = {
      ...this.toPipeline({ ...draft, id }),
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
    };
    this.pipelinesSig.update(pipelines => pipelines.map(pipeline => pipeline.id === id ? updated : pipeline));
    this.audit.record('pipeline.registry.updated', {
      resourceType: 'pipeline',
      resourceId: id,
      metadata: { name: updated.name, source: updated.registrationSource ?? 'manual', ingestionKind: updated.ingestionKind ?? 'other' },
    });
    return updated;
  }

  deletePipelineRegistryEntry(id: string): void {
    const pipeline = this.pipelinesSig().find(item => item.id === id);
    this.pipelinesSig.update(pipelines => pipelines.filter(item => item.id !== id));
    this.audit.record('pipeline.registry.deleted', {
      resourceType: 'pipeline',
      resourceId: id,
      metadata: { name: pipeline?.name ?? id, source: pipeline?.registrationSource ?? 'manual' },
    });
  }

  importPipelineRegistryEntries(drafts: PipelineRegistryDraft[]): Pipeline[] {
    const pipelines = drafts.map(draft => this.toPipeline(draft));
    this.pipelinesSig.update(current => [...pipelines, ...current]);
    this.audit.record('pipeline.registry.imported', {
      resourceType: 'pipeline',
      metadata: { count: pipelines.length },
    });
    return pipelines;
  }

  submitPipelineExecutionRequest(draft: PipelineExecutionRequestDraft): PipelineExecutionRequest | null {
    const pipeline = this.pipelinesSig().find(item => item.id === draft.pipelineId);
    if (!pipeline) return null;

    const user = this.auth.user();
    const request: PipelineExecutionRequest = {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      sigla: pipeline.sigla,
      resource: draft.resource,
      action: draft.action,
      jobName: draft.jobName,
      payload: draft.payload,
      partitionSpec: draft.partitionSpec,
      historicalWindow: draft.historicalWindow,
      reason: draft.reason,
      status: 'queued',
      requestedAt: new Date().toISOString(),
      requestedBy: user?.userPrincipal ?? user?.name ?? 'mock.user',
    };
    this.pipelineExecutionRequestsSig.update(requests => [request, ...requests].slice(0, 50));
    this.audit.record('pipeline.execution.requested', {
      resourceType: 'pipeline-execution-request',
      resourceId: request.id,
      metadata: { pipeline: request.pipelineName, sigla: request.sigla, resource: request.resource, action: request.action },
    });
    return request;
  }

  refreshOperationalSnapshot(): void {
    this.pipelinesSig.set([...MOCK_PIPELINES]);
    this.pipelineAlertsSig.set([...MOCK_PIPELINE_ALERTS]);
    this.monitoringAlertsSig.set([...MOCK_RECENT_ALERTS]);
    this.jobsSig.set([...MOCK_JOBS]);
  }

  private toPipeline(draft: PipelineRegistryDraft): Pipeline {
    const now = new Date().toISOString();
    const user = this.auth.user();
    const id = draft.id || `pipeline-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const type = this.typeFromKind(draft.ingestionKind);
    return {
      id,
      name: draft.name,
      sigla: draft.sigla,
      description: draft.description,
      type,
      ingestionKind: draft.ingestionKind,
      registrationSource: 'manual',
      status: draft.status,
      schedule: draft.schedule,
      owner: draft.owner,
      team: draft.team,
      sources: draft.sources,
      target: draft.target,
      targetLayer: draft.targetLayer,
      targetGoldenSource: draft.targetGoldenSource,
      tags: draft.tags,
      sla: draft.sla,
      avgDuration: draft.avgDuration,
      lastRun: {
        id: `run-${id}`,
        pipelineId: id,
        status: draft.status,
        startTime: now,
        duration: draft.avgDuration,
      },
      createdAt: now,
      createdBy: user?.userPrincipal ?? user?.name ?? 'mock.user',
      updatedAt: now,
      updatedBy: user?.userPrincipal ?? user?.name ?? 'mock.user',
    };
  }

  private typeFromKind(kind: IngestionFlowKind): Pipeline['type'] {
    return ({
      glue_job: 'GlueJob',
      munin_sql: 'Munin',
      phoenix: 'Phoenix',
      cdp: 'CDP',
      other: 'Outros',
    } as const)[kind];
  }
}
