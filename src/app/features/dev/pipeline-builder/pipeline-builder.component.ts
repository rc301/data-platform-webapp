import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiBadgeComponent,
  UiButtonComponent,
  UiJourneyStepperComponent,
  JourneyStep,
  JourneyStepStatus,
} from '../../../shared/ui';
import { DataQualityTableFormComponent } from '../../../shared/components/data-quality-table-form/data-quality-table-form.component';
import { DataQualityCustomRule, DataQualityTableRegistration, DataQualityTableRegistrationDraft } from '../../../core/models';
import { PlatformDataService } from '../../../core/services/platform-data.service';
import { ProjectPipelineJourney, ProjectPipelineStore } from '../project-pipeline.store';
import { StageRegistry, StageContext, RfcStageStore } from '../../journey-stages';
import {
  DEFAULT_TEMPLATE_ID,
  JOURNEY_TEMPLATES,
  JourneyStageId,
  JourneyTemplateId,
  JourneyStatusMap,
  SAMPLE_PREVIEWS,
  createInitialStatuses,
  firstOpenStageId,
  getJourneyTemplate,
  getStagesForTemplate,
  STAGE_BY_ID,
} from './journey-config';

/**
 * Container (smart) — orquestra a jornada de criação de pipeline.
 * Usa apenas UI primitives desacoplados em <ui-*>. A camada de apresentação
 * pode ser substituída por componentes de design system trocando os imports.
 */
@Component({
  selector: 'app-pipeline-builder',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent, UiJourneyStepperComponent,
    DataQualityTableFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      [title]="createdPipeline() ? 'Pipeline de projeto' : 'Nova pipeline de projeto'"
      [subtitle]="createdPipeline() ? 'Template travado para garantir rastreabilidade da jornada criada.' : 'Escolha o tipo de pipeline antes de criar a jornada do projeto.'">
      <div page-actions>
        <ui-button variant="ghost" link="/dev/journeys">Minhas jornadas</ui-button>
        <ui-button variant="danger" *ngIf="createdPipeline() && !isDeleted()" (clicked)="deletePipeline()">Apagar pipeline</ui-button>
        <ui-button variant="secondary" *ngIf="createdPipeline() && !isDeleted()">Salvar rascunho</ui-button>
      </div>
    </ui-page-header>

    <ng-container *ngIf="!createdPipeline(); else createdExperience">
      <section class="template-switcher" aria-label="Templates de jornada">
        <button
          type="button"
          class="template-option"
          *ngFor="let template of templateOptions"
          [class.template-option--selected]="template.id === selectedTemplateId()"
          (click)="selectTemplate(template.id)">
          <span class="template-option__badge">{{ template.badge }}</span>
          <span class="template-option__body">
            <strong>{{ template.title }}</strong>
            <span>{{ template.description }}</span>
          </span>
          <span class="template-option__meta">
            <span>{{ template.stageIds.length }} etapas</span>
            <span>{{ template.recommendedFor }}</span>
          </span>
        </button>
      </section>

      <ui-card eyebrow="Criação" title="Criar pipeline de projeto" subtitle="Depois de criada, a pipeline mantém o template escolhido. Para trocar de template, apague esta pipeline e crie outra.">
        <div class="creation-summary">
          <div>
            <span>Template selecionado</span>
            <strong>{{ currentTemplate().title }}</strong>
          </div>
          <ui-badge tone="brand">{{ currentTemplate().badge }}</ui-badge>
        </div>
        <div card-footer class="footer-row">
          <span class="footer-row__gate">O template não poderá ser alterado após a criação.</span>
          <ui-button variant="primary" (clicked)="createProjectPipeline()">Criar Pipeline de Projeto</ui-button>
        </div>
      </ui-card>
    </ng-container>

    <ng-template #createdExperience>
      <ui-card *ngIf="isDeleted(); else builderExperience" eyebrow="Pipeline deletada" [title]="createdPipeline()?.name || 'Pipeline de projeto'">
        <div class="deleted-state">
          <ui-badge tone="danger">Deletada</ui-badge>
          <p>
            Esta pipeline foi apagada por {{ createdPipeline()?.deletedBy }} em
            {{ formatDateTime(createdPipeline()?.deletedAt) }}.
          </p>
          <p>O registro permanece visível para auditoria, mas a jornada não pode ser continuada.</p>
        </div>
        <div card-footer class="footer-row">
          <span class="footer-row__gate">Crie uma nova pipeline para escolher outro template.</span>
          <ui-button variant="primary" (clicked)="resetForNewPipeline()">Nova pipeline</ui-button>
        </div>
      </ui-card>
    </ng-template>

    <ng-template #builderExperience>
      <section class="locked-template" aria-label="Template travado">
        <span>Template criado</span>
        <strong>{{ currentTemplate().title }}</strong>
        <ui-badge tone="brand">{{ currentTemplate().badge }}</ui-badge>
      </section>

      <div class="builder">
      <!-- ========== Coluna de etapas ========== -->
      <aside class="builder__rail">
        <div class="rail__head">
          <span class="rail__progress-label">Progresso</span>
          <span class="rail__progress-value">{{ approvedCount() }} / {{ totalCount() }}</span>
        </div>
        <div class="rail__bar"><div class="rail__fill" [style.width.%]="progressPct()"></div></div>

        <ui-journey-stepper
          [steps]="stepperItems()"
          [currentStepId]="currentId()"
          (stepClicked)="goToStage($event.id)">
        </ui-journey-stepper>
      </aside>

      <!-- ========== Painel da etapa atual ========== -->
      <section class="builder__panel">
        <ui-card
          [eyebrow]="currentTemplate().shortTitle + ' · Etapa ' + currentIndex() + ' de ' + totalCount()"
          [title]="current().title"
          [subtitle]="current().description">
          <div card-actions>
            <ui-badge [tone]="badgeTone(currentStatus())">{{ statusLabel(currentStatus()) }}</ui-badge>
          </div>

          <!-- Plugin de etapa, quando registrado no StageRegistry -->
          <ng-container *ngIf="currentRuntime() as runtime; else legacyRenderer">
            <ng-container *ngIf="runtime.render as cmp">
              <ng-container *ngComponentOutlet="cmp; inputs: stageInputs()"></ng-container>
            </ng-container>
          </ng-container>

          <!-- Renderização inline para etapas ainda não migradas como plugin -->
          <ng-template #legacyRenderer>
            <div class="agent-block">
              <h4 class="section-title" style="margin-top:0">Ações que o agente executará via MCP</h4>
              <ul class="agent-list">
                <li *ngFor="let action of current().automatedActions">
                  <span class="agent-list__check">›</span>{{ action }}
                </li>
              </ul>
            </div>

            <ng-container *ngIf="current().id === 'data-quality'; else agentPreview">
              <div class="agent-block">
                <app-data-quality-table-form
                  [value]="qualityTableDraft"
                  title="Cadastro de qualidade da pipeline"
                  description="A metadata vem preenchida após consulta da tabela pela role do motor. Complete chave primária, validações genéricas e regras customizadas."
                  submitLabel="Cadastrar tabela"
                  (metadataRequested)="loadQualityMetadata()"
                  (saved)="saveQualityTable($event)">
                </app-data-quality-table-form>
                <p *ngIf="qualityTableSaved()">
                  Tabela cadastrada no mock de Qualidade. Ela já fica disponível para scan do motor.
                </p>
              </div>
            </ng-container>

            <ng-template #agentPreview>
              <div class="agent-block">
                <h4 class="section-title">Saída do agente (preview)</h4>
                <pre class="agent-output">{{ samplePreview() }}</pre>
              </div>
            </ng-template>
          </ng-template>

          <div card-footer class="footer-row">
            <span class="footer-row__gate">{{ current().approvalGate }}</span>
            <div class="footer-row__actions">
              <ui-button variant="ghost" [disabled]="isFirst()" (clicked)="prev()">← Voltar</ui-button>
              <ui-button variant="secondary" (clicked)="reject()" *ngIf="canApprove()">Rejeitar</ui-button>
              <ui-button variant="primary" (clicked)="approveAndAdvance()" [disabled]="isLast() && currentStatus() === 'approved'">
                {{ isLast() ? 'Concluir jornada' : 'Aprovar e avançar →' }}
              </ui-button>
            </div>
          </div>
        </ui-card>

        <!-- Resumo lateral — lido das stores das etapas (hoje só RFC) -->
        <ui-card eyebrow="Resumo da jornada" title="Contexto do projeto">
          <div class="summary-grid">
            <div><span class="summary-grid__k">Template</span><span class="summary-grid__v">{{ currentTemplate().shortTitle }}</span></div>
            <div><span class="summary-grid__k">Produto</span><span class="summary-grid__v">{{ rfcDraft().productName || '—' }}</span></div>
            <div><span class="summary-grid__k">Domínio</span><span class="summary-grid__v">{{ rfcDraft().domain || '—' }}</span></div>
            <div><span class="summary-grid__k">Squad</span><span class="summary-grid__v">{{ rfcDraft().squad || '—' }}</span></div>
            <div><span class="summary-grid__k">SLA</span><span class="summary-grid__v">{{ rfcDraft().sla || '—' }}</span></div>
            <div class="summary-grid__row"><span class="summary-grid__k">Destino</span><span class="summary-grid__v">{{ rfcDraft().target || '—' }}</span></div>
          </div>
        </ui-card>
      </section>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .template-switcher {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .template-option {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px 14px;
      align-items: start;
      padding: 16px;
      text-align: left;
      font: inherit;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }
    .template-option:hover,
    .template-option--selected {
      background: var(--bg-elevated);
      border-color: var(--brand-400);
    }
    .template-option__badge {
      display: inline-flex;
      padding: 5px 8px;
      border-radius: 6px;
      background: var(--bg-overlay);
      border: 1px solid var(--border-subtle);
      color: var(--brand-300);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .template-option__body {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }
    .template-option__body strong { color: var(--text-primary); font-size: 15px; line-height: 1.3; }
    .template-option__body span { color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
    .template-option__meta {
      grid-column: 2;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.4;
    }
    .template-option__meta span:first-child { color: var(--success-500); font-weight: 700; }
    .creation-summary,
    .locked-template {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-app);
    }
    .creation-summary div { display: flex; flex-direction: column; gap: 3px; }
    .creation-summary span,
    .locked-template span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .creation-summary strong,
    .locked-template strong { color: var(--text-primary); font-size: 14px; }
    .locked-template { margin-bottom: 20px; justify-content: flex-start; }
    .deleted-state { display: flex; flex-direction: column; gap: 8px; }
    .deleted-state p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }

    .builder { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: flex-start; }

    .builder__rail {
      position: sticky; top: 84px;
      padding: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }
    .rail__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .rail__progress-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em; color: var(--text-muted); font-weight: 600; }
    .rail__progress-value { font-size: 14px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .rail__bar { height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; margin-bottom: 16px; }
    .rail__fill { height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); transition: width .3s ease; }

    .builder__panel { display: flex; flex-direction: column; gap: 20px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field--full { grid-column: 1 / -1; }
    .field__label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    .field__input {
      background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md);
      padding: 10px 12px; color: var(--text-primary); font: inherit; font-size: 13px;
      outline: none; transition: border-color .15s ease;
    }
    .field__input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }

    .agent-block { margin-top: 20px; }
    .agent-block:first-child { margin-top: 0; }

    .agent-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .agent-list li {
      display: flex; gap: 10px;
      padding: 10px 12px;
      background: var(--bg-app); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-size: 13px; color: var(--text-secondary);
    }
    .agent-list__check { color: var(--brand-300); font-weight: 700; }

    .agent-output {
      margin: 0; padding: 14px 16px;
      font-family: var(--font-mono); font-size: 12px; line-height: 1.5;
      background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      color: var(--text-secondary); white-space: pre-wrap; max-height: 240px; overflow: auto;
    }

    .footer-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .footer-row__gate { font-size: 12px; color: var(--text-muted); max-width: 480px; }
    .footer-row__actions { display: flex; gap: 8px; }

    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .summary-grid__row { grid-column: 1 / -1; }
    .summary-grid > div { display: flex; flex-direction: column; gap: 2px; }
    .summary-grid__k { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .summary-grid__v { font-size: 13px; color: var(--text-primary); font-weight: 500; }

    @media (max-width: 1100px) {
      .builder { grid-template-columns: 1fr; }
      .builder__rail { position: static; }
      .form-grid, .summary-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 620px) {
      .template-switcher { grid-template-columns: 1fr; }
      .template-option { grid-template-columns: 1fr; }
      .template-option__meta { grid-column: 1; }
    }
  `],
})
export class PipelineBuilderComponent {
  private readonly data = inject(PlatformDataService);
  private readonly projectPipelines = inject(ProjectPipelineStore);
  private readonly stageRegistry = inject(StageRegistry);
  private readonly rfcStore = inject(RfcStageStore);

  readonly templateOptions = JOURNEY_TEMPLATES;
  readonly selectedTemplateId = signal<JourneyTemplateId>(DEFAULT_TEMPLATE_ID);
  readonly createdPipeline = signal<ProjectPipelineJourney | null>(null);
  readonly isDeleted = computed(() => this.createdPipeline()?.status === 'deleted');
  readonly currentTemplate = computed(() => getJourneyTemplate(this.selectedTemplateId()));
  readonly stages = computed(() => getStagesForTemplate(this.selectedTemplateId()));
  readonly rfcDraft = this.rfcStore.draft;

  /** Runtime do plugin da etapa atual, se registrado. */
  readonly currentRuntime = computed(() => this.stageRegistry.get(this.currentIdSig()));

  /** Inputs projetados via ngComponentOutlet — assinatura StageRenderProps. */
  readonly stageInputs = computed<Record<string, unknown>>(() => {
    const ctx: StageContext = {
      journeyId: this.createdPipeline()?.id ?? 'draft',
      stageId: this.currentIdSig(),
      project: { ...this.rfcDraft() },
      previousOutputs: {},
    };
    return { context: ctx };
  });

  /** Status mutável da jornada (mock — em produção viria de um service/store). */
  private readonly statuses = signal<JourneyStatusMap>(
    createInitialStatuses(DEFAULT_TEMPLATE_ID, firstOpenStageId(DEFAULT_TEMPLATE_ID)),
  );
  private readonly currentIdSig = signal<JourneyStageId>(firstOpenStageId(DEFAULT_TEMPLATE_ID));

  readonly currentId = this.currentIdSig.asReadonly();
  readonly current = computed(() => STAGE_BY_ID[this.currentIdSig()]);
  readonly currentIndex = computed(() => this.indexForStage(this.currentIdSig()) + 1);
  readonly currentStatus = computed(() => this.statuses()[this.currentIdSig()] ?? 'pending');
  readonly totalCount = computed(() => this.stages().length);
  readonly approvedCount = computed(() => this.stages().filter(stage => this.statuses()[stage.id] === 'approved').length);
  readonly progressPct = computed(() => {
    const total = this.totalCount();
    return total === 0 ? 0 : Math.round((this.approvedCount() / total) * 100);
  });

  readonly stepperItems = computed<JourneyStep[]>(() =>
    this.stages().map((s, index) => ({
      id: s.id,
      index: index + 1,
      title: s.title,
      shortTitle: s.title,
      description: s.description,
      badge: s.badge,
      status: this.statuses()[s.id] ?? 'pending',
    }))
  );

  qualityTableDraft: Partial<DataQualityTableRegistrationDraft> = this.createQualityTableDraft('gold.customer_360');
  qualityTableSaved = signal(false);

  createProjectPipeline(): void {
    const pipeline = this.projectPipelines.create(this.selectedTemplateId());
    this.createdPipeline.set(pipeline);
  }

  deletePipeline(): void {
    const pipeline = this.createdPipeline();
    if (!pipeline) return;
    this.projectPipelines.markDeleted(pipeline.id);
    this.createdPipeline.set(this.projectPipelines.journeys().find(journey => journey.id === pipeline.id) ?? null);
  }

  resetForNewPipeline(): void {
    this.createdPipeline.set(null);
    this.selectTemplate(DEFAULT_TEMPLATE_ID);
  }

  selectTemplate(id: JourneyTemplateId): void {
    if (this.createdPipeline()) return;
    if (id === this.selectedTemplateId()) return;

    const firstStageId = firstOpenStageId(id);
    this.selectedTemplateId.set(id);
    this.currentIdSig.set(firstStageId);
    this.statuses.set(createInitialStatuses(id, firstStageId));
    this.applyTemplateDefaults(id);
  }

  goToStage(id: string): void {
    const stageId = id as JourneyStageId;
    if (this.stages().some(stage => stage.id === stageId)) {
      this.currentIdSig.set(stageId);
    }
  }

  isFirst = computed(() => this.currentIndex() <= 1);
  isLast = computed(() => this.currentIndex() >= this.totalCount());

  prev(): void {
    const idx = this.indexForStage(this.currentIdSig());
    if (idx > 0) this.currentIdSig.set(this.stages()[idx - 1].id);
  }

  approveAndAdvance(): void {
    const id = this.currentIdSig();
    this.statuses.update(s => ({ ...s, [id]: 'approved' }));
    if (!this.isLast()) {
      const next = this.stages()[this.indexForStage(id) + 1];
      this.currentIdSig.set(next.id);
      this.statuses.update(s => ({ ...s, [next.id]: 'awaiting_approval' }));
    }
  }

  reject(): void {
    const id = this.currentIdSig();
    this.statuses.update(s => ({ ...s, [id]: 'failed' }));
  }

  loadQualityMetadata(): void {
    this.qualityTableDraft = this.createQualityTableDraft(this.rfcDraft().target, true);
  }

  saveQualityTable(draft: DataQualityTableRegistrationDraft): void {
    this.qualityTableDraft = draft;
    this.qualityTableSaved.set(true);
    this.data.addDataQualityTableRegistration(this.toQualityTableRegistration(draft));
  }

  canApprove(): boolean {
    return this.currentStatus() !== 'approved';
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('pt-BR');
  }

  badgeTone(status: JourneyStepStatus): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' {
    return ({
      pending: 'neutral',
      active: 'info',
      in_progress: 'info',
      awaiting_approval: 'warning',
      approved: 'success',
      failed: 'danger',
      skipped: 'neutral',
    } as const)[status];
  }

  statusLabel(status: JourneyStepStatus): string {
    return ({
      pending: 'Pendente',
      active: 'Disponível',
      in_progress: 'Executando',
      awaiting_approval: 'Aguarda aprovação',
      approved: 'Aprovado',
      failed: 'Falhou',
      skipped: 'Ignorado',
    } as const)[status];
  }

  /** Stub de saída do agente — em produção viria do MCP server. */
  samplePreview = computed(() => {
    const id = this.currentIdSig();
    return SAMPLE_PREVIEWS[id];
  });

  private indexForStage(stageId: JourneyStageId): number {
    return this.stages().findIndex(stage => stage.id === stageId);
  }

  private applyTemplateDefaults(templateId: JourneyTemplateId): void {
    if (templateId === 'sql-only') {
      this.rfcStore.update({
        objective: 'Construir mart analitico com transformacoes SQL versionadas e validações automatizadas.',
        sources: 'raw.crm_customers, raw.orders',
        target: 'mart.customer_360',
      });
      this.qualityTableDraft = this.createQualityTableDraft('mart.customer_360');
      this.qualityTableSaved.set(false);
      return;
    }

    this.rfcStore.update({
      objective: 'Construir visão consolidada de cliente para uso de Marketing e CS.',
      sources: 'silver.customer_base, silver.orders, bronze.clickstream',
      target: 'gold.customer_360',
    });
    this.qualityTableDraft = this.createQualityTableDraft('gold.customer_360');
    this.qualityTableSaved.set(false);
  }

  private createQualityTableDraft(qualifiedName: string, withMetadata = false): Partial<DataQualityTableRegistrationDraft> {
    const [database = 'spec', tableName = qualifiedName] = qualifiedName.split('.').length > 1
      ? qualifiedName.split('.')
      : ['spec', qualifiedName];

    return {
      database,
      tableName,
      qualifiedName: `${database}.${tableName}`,
      owner: this.rfcStore?.draft()?.squad ?? 'Squad B',
      engineRole: 'role_data_quality_engine_prod',
      rowCount: withMetadata ? 2500000 : undefined,
      sizeGb: withMetadata ? 42.7 : undefined,
      columns: withMetadata ? [
        { name: 'customer_id', type: 'STRING', nullable: false, description: 'Chave funcional do cliente' },
        { name: 'email', type: 'STRING', nullable: true, description: 'E-mail principal' },
        { name: 'total_orders', type: 'INT', nullable: false },
        { name: 'ltv', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false },
      ] : [],
      primaryKeyColumns: withMetadata ? ['customer_id'] : [],
      qualitativeValidations: withMetadata ? 'Segmento e identificação devem estar coerentes com cadastro mestre e domínio funcional aprovado.' : '',
      quantitativeValidations: withMetadata ? 'Freshness máxima D-1 até 07h30. Variação diária de volume acima de 20% deve alertar.' : '',
      customRulesText: withMetadata ? 'email | Percentual de nulos não pode ultrapassar 5% | 95 | high\ncustomer_id | Não pode haver duplicidade | 100 | critical' : '',
    };
  }

  private toQualityTableRegistration(draft: DataQualityTableRegistrationDraft): DataQualityTableRegistration {
    const now = new Date().toISOString();
    return {
      id: `dq-project-table-${Date.now()}`,
      database: draft.database,
      tableName: draft.tableName,
      qualifiedName: draft.qualifiedName || `${draft.database}.${draft.tableName}`,
      owner: draft.owner,
      engineRole: draft.engineRole,
      rowCount: draft.rowCount,
      sizeGb: draft.sizeGb,
      columns: draft.columns,
      primaryKeyColumns: draft.primaryKeyColumns,
      qualitativeValidations: draft.qualitativeValidations,
      quantitativeValidations: draft.quantitativeValidations,
      customRules: this.parseCustomRules(draft.customRulesText),
      status: draft.columns.length ? 'ready_to_scan' : 'waiting_access',
      createdAt: now,
      updatedAt: now,
    };
  }

  private parseCustomRules(text: string): DataQualityCustomRule[] {
    return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const [field = '', expression = '', threshold = '0', severity = 'medium'] = line.split('|').map(part => part.trim());
      return { field, expression, threshold: Number(threshold) || 0, severity: this.normalizeSeverity(severity) };
    });
  }

  private normalizeSeverity(value: string): DataQualityCustomRule['severity'] {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'medium';
  }
}
