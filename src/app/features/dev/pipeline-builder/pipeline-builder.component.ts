import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { AuditService } from '../../../core/audit/audit.service';
import { AccessService } from '../../../core/access/access.service';
import { Capability } from '../../../core/access/access.types';
import { StageConfigService } from '../../../core/journey-stages/stage-config.service';
import { DemandService } from '../../../core/demands/demand.service';
import { ProjectJourney, ProjectJourneyStore } from '../project-journey.store';
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
 * Container (smart) — orquestra a jornada de projeto.
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
      [title]="createdJourney() ? 'Jornada de projeto' : 'Nova jornada de projeto'"
      [subtitle]="createdJourney() ? 'Template travado para garantir rastreabilidade da jornada criada.' : 'Escolha o tipo de jornada antes de criar o projeto.'">
      <div page-actions>
        <ui-button variant="ghost" link="/dev/journeys">Meus projetos</ui-button>
        <ui-button variant="danger" *ngIf="createdJourney() && !isDeleted()" (clicked)="deleteJourney()">Apagar jornada</ui-button>
        <ui-button variant="secondary" *ngIf="createdJourney() && !isDeleted()">Salvar</ui-button>
      </div>
    </ui-page-header>

    <ng-container *ngIf="!createdJourney(); else createdExperience">
      <section class="template-switcher" aria-label="Templates de jornada">
        <button
          type="button"
          class="template-option"
          *ngFor="let template of templateOptions()"
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

      <section class="stage-preview" aria-label="Etapas da jornada selecionada">
        <div class="stage-preview__head">
          <span>Etapas da jornada</span>
          <strong>{{ currentTemplate().stageIds.length }}</strong>
        </div>
        <ol>
          <li *ngFor="let stage of stages(); let i = index">
            <span>{{ i + 1 }}</span>
            <div>
              <strong>{{ stage.title }}</strong>
              <small>{{ stage.description }}</small>
            </div>
          </li>
        </ol>
      </section>

      <ui-card eyebrow="Criação" title="Criar jornada de projeto" subtitle="Depois de criada, a jornada mantém o template escolhido. Para trocar de template, apague esta jornada e crie outra.">
        <div class="creation-summary">
          <div>
            <span>Template selecionado</span>
            <strong>{{ currentTemplate().title }}</strong>
          </div>
          <ui-badge tone="brand">{{ currentTemplate().badge }}</ui-badge>
        </div>
        <div card-footer class="footer-row">
          <span class="footer-row__gate">O template não poderá ser alterado após a criação.</span>
          <ui-button variant="primary" (clicked)="createProjectJourney()">Criar Jornada de Projeto</ui-button>
        </div>
      </ui-card>
    </ng-container>

    <ng-template #createdExperience>
      <ui-card *ngIf="isDeleted(); else builderExperience" eyebrow="Jornada deletada" [title]="createdJourney()?.name || 'Jornada de projeto'">
        <div class="deleted-state">
          <ui-badge tone="danger">Deletada</ui-badge>
          <p>
            Esta jornada foi apagada por {{ createdJourney()?.deletedBy }} em
            {{ formatDateTime(createdJourney()?.deletedAt) }}.
          </p>
          <p>O registro permanece visível para auditoria, mas a jornada não pode ser continuada.</p>
        </div>
        <div card-footer class="footer-row">
          <span class="footer-row__gate">Crie uma nova jornada para escolher outro template.</span>
          <ui-button variant="primary" (clicked)="resetForNewJourney()">Nova jornada</ui-button>
        </div>
      </ui-card>
    </ng-template>

    <ng-template #builderExperience>
      <section class="locked-template" aria-label="Template travado">
        <span>Template criado</span>
        <strong>{{ currentTemplate().title }}</strong>
        <ui-badge tone="brand">{{ currentTemplate().badge }}</ui-badge>
        <code *ngIf="createdJourney() as journey">{{ journey.id }}</code>
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
                  title="Cadastro de qualidade da jornada"
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
          <div class="import-demand">
            <label>
              <span>Demanda importada</span>
              <select [(ngModel)]="selectedDemandId">
                <option value="">Selecionar demanda existente</option>
                <option *ngFor="let demand of availableDemands()" [value]="demand.id">{{ demand.code }} · {{ demand.title }}</option>
              </select>
            </label>
            <ui-button variant="secondary" size="sm" [disabled]="!selectedDemandId" (clicked)="importSelectedDemand()">Importar</ui-button>
          </div>
          <div class="import-demand">
            <label>
              <span>LUPs vinculadas</span>
              <input [ngModel]="lupCodesText" (ngModelChange)="lupCodesText = $event" placeholder="ED2741, EA1180">
            </label>
            <ui-button variant="secondary" size="sm" (clicked)="saveLupCodes()">Vincular</ui-button>
          </div>
          <div class="summary-grid">
            <div><span class="summary-grid__k">Jornada</span><span class="summary-grid__v">{{ createdJourney()?.id || '—' }}</span></div>
            <div><span class="summary-grid__k">Demanda</span><span class="summary-grid__v">{{ createdJourney()?.importedDemandCode || '—' }}</span></div>
            <div><span class="summary-grid__k">Template</span><span class="summary-grid__v">{{ currentTemplate().shortTitle }}</span></div>
            <div><span class="summary-grid__k">Produto</span><span class="summary-grid__v">{{ rfcDraft().productName || '—' }}</span></div>
            <div><span class="summary-grid__k">Domínio</span><span class="summary-grid__v">{{ rfcDraft().domain || '—' }}</span></div>
            <div><span class="summary-grid__k">Squad</span><span class="summary-grid__v">{{ rfcDraft().squad || '—' }}</span></div>
            <div><span class="summary-grid__k">SLA</span><span class="summary-grid__v">{{ rfcDraft().sla || '—' }}</span></div>
            <div><span class="summary-grid__k">LUPs</span><span class="summary-grid__v">{{ createdJourney()?.lupCodes?.join(', ') || '—' }}</span></div>
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
    .stage-preview { margin-bottom: 18px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .stage-preview__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .stage-preview__head strong { color: var(--brand-300); }
    .stage-preview ol { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .stage-preview li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: start; padding: 10px; border-radius: var(--radius-md); background: var(--bg-app); }
    .stage-preview li > span { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--bg-overlay); color: var(--brand-300); font-size: 11px; font-weight: 800; }
    .stage-preview li div { display: flex; flex-direction: column; gap: 2px; }
    .stage-preview li strong { color: var(--text-primary); font-size: 13px; }
    .stage-preview li small { color: var(--text-muted); font-size: 12px; line-height: 1.4; }
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
    .locked-template code { margin-left: auto; padding: 3px 7px; border-radius: 4px; background: var(--bg-app); color: var(--text-muted); font-size: 11px; }
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
    .import-demand { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; margin-bottom: 16px; padding: 12px; border-radius: var(--radius-md); background: var(--bg-app); }
    .import-demand label { display: flex; flex-direction: column; gap: 6px; }
    .import-demand span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .import-demand select, .import-demand input { min-width: 0; padding: 9px 10px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary); font: inherit; font-size: 13px; }
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
export class PipelineBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(PlatformDataService);
  private readonly audit = inject(AuditService);
  private readonly demands = inject(DemandService);
  private readonly projectJourneys = inject(ProjectJourneyStore);
  private readonly stageRegistry = inject(StageRegistry);
  private readonly rfcStore = inject(RfcStageStore);
  private readonly access = inject(AccessService);
  private readonly stageConfig = inject(StageConfigService);

  /**
   * Templates que o usuário pode usar agora — filtrado por capability
   * declarada no template (`pipeline.useTemplate.<id>`). Templates sem
   * `requiredCapability` ficam visíveis (compatibilidade com versões
   * antigas que ainda não migraram para gating por template).
   */
  readonly templateOptions = computed(() =>
    JOURNEY_TEMPLATES.filter(t =>
      !t.requiredCapability || this.access.can(t.requiredCapability as Capability)
    )
  );
  readonly selectedTemplateId = signal<JourneyTemplateId>(DEFAULT_TEMPLATE_ID);
  readonly createdJourney = signal<ProjectJourney | null>(null);
  readonly isDeleted = computed(() => this.createdJourney()?.status === 'deleted');
  readonly currentTemplate = computed(() => getJourneyTemplate(this.selectedTemplateId()));
  readonly stages = computed(() => getStagesForTemplate(this.selectedTemplateId()));
  readonly rfcDraft = this.rfcStore.draft;

  /** Runtime do plugin da etapa atual, se registrado. */
  readonly currentRuntime = computed(() => this.stageRegistry.get(this.currentIdSig()));

  /** Inputs projetados via ngComponentOutlet — assinatura StageRenderProps. */
  readonly stageInputs = computed<Record<string, unknown>>(() => {
    const ctx: StageContext = {
      journeyId: this.createdJourney()?.id ?? 'draft',
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
  selectedDemandId = '';
  lupCodesText = '';
  readonly availableDemands = computed(() => this.demands.demands().filter(demand => demand.status !== 'inactive'));

  ngOnInit(): void {
    const templateId = this.templateIdFromQuery();
    if (templateId) {
      this.resetJourneyState(templateId);
      this.applyTemplateDefaults(templateId);
    }
    if (this.route.snapshot.queryParamMap.get('autoCreate') === 'true') {
      this.createProjectJourney();
    }
  }

  createProjectJourney(): void {
    this.resetJourneyState(this.selectedTemplateId());
    const journey = this.projectJourneys.create(this.selectedTemplateId());
    this.createdJourney.set(journey);
  }

  deleteJourney(): void {
    const journey = this.createdJourney();
    if (!journey) return;
    this.projectJourneys.markDeleted(journey.id);
    this.createdJourney.set(this.projectJourneys.journeys().find(item => item.id === journey.id) ?? null);
  }

  resetForNewJourney(): void {
    this.createdJourney.set(null);
    this.resetJourneyState(DEFAULT_TEMPLATE_ID);
    this.applyTemplateDefaults(DEFAULT_TEMPLATE_ID);
  }

  selectTemplate(id: JourneyTemplateId): void {
    if (this.createdJourney()) return;
    if (id === this.selectedTemplateId()) return;

    this.resetJourneyState(id);
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

  importSelectedDemand(): void {
    const journey = this.createdJourney();
    const demand = this.demands.demands().find(item => item.id === this.selectedDemandId);
    if (!journey || !demand) return;

    this.projectJourneys.importDemand(journey.id, demand.id, demand.code);
    this.createdJourney.set(this.projectJourneys.journeys().find(item => item.id === journey.id) ?? journey);
    this.rfcStore.update({
      productName: demand.title,
      objective: demand.description,
      domain: demand.domain,
      squad: demand.requester,
      sources: demand.sources.join(', '),
      target: demand.expectedTarget,
      sla: demand.sla,
    });
    this.qualityTableDraft = this.createQualityTableDraft(demand.expectedTarget);
    this.audit.record('journey.demand.imported', {
      resourceType: 'journey',
      resourceId: journey.id,
      metadata: { demandId: demand.id, demandCode: demand.code },
    });
  }

  saveLupCodes(): void {
    const journey = this.createdJourney();
    if (!journey) return;
    const codes = this.lupCodesText.split(',').map(code => code.trim().toUpperCase()).filter(Boolean);
    this.projectJourneys.setLupCodes(journey.id, codes);
    this.createdJourney.set(this.projectJourneys.journeys().find(item => item.id === journey.id) ?? journey);
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

  private resetJourneyState(templateId: JourneyTemplateId): void {
    const firstStageId = firstOpenStageId(templateId);
    this.selectedTemplateId.set(templateId);
    this.currentIdSig.set(firstStageId);
    this.statuses.set(createInitialStatuses(templateId, firstStageId));
    this.qualityTableSaved.set(false);
  }

  private templateIdFromQuery(): JourneyTemplateId | null {
    const value = this.route.snapshot.queryParamMap.get('template');
    return value === 'glue-pyspark' || value === 'sql-only' ? value : null;
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
