import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiButtonComponent,
  UiBadgeComponent,
  UiStatComponent,
} from '../../../shared/ui';
import {
  DEFAULT_TEMPLATE_ID,
  JOURNEY_TEMPLATES,
  JourneyTemplateId,
  getStagesForTemplate,
} from '../pipeline-builder/journey-config';
import { AccessService } from '../../../core/access/access.service';
import { ProjectJourney, ProjectJourneyStatus, ProjectJourneyStore } from '../project-journey.store';

/**
 * Visão do Desenvolvedor.
 *
 * Estrutura validada em UX:
 *   1. KPIs do trabalho em andamento — apenas o que o dev controla
 *      (jornadas + pendências de aprovação). Jobs quebrados / incidentes
 *      em tabelas vivem em `/ops` (Sustentação).
 *   2. **Início rápido** com CTA destacado para uma nova jornada — escolha
 *      do template aqui mesmo. Ao selecionar, mostra a sequência de
 *      etapas previstas para o template.
 *   3. **Minhas jornadas** — lista das jornadas do usuário, em andamento
 *      e concluídas, com colunas relevantes para o trabalho diário.
 *      Sem botão "acessar"; duplo clique na linha abre a jornada.
 */
@Component({
  selector: 'app-dev-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    UiPageHeaderComponent, UiCardComponent, UiButtonComponent, UiBadgeComponent, UiStatComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Construir, revisar e publicar jornadas de projeto"
      subtitle="Inicie um novo projeto ou continue uma jornada em andamento.">
      <!-- Sem CTA no topo — o botão de criação vive no card de Início rápido. -->
    </ui-page-header>

    <div class="stats-row">
      <ui-stat label="Jornadas em andamento" [value]="activeMine().length" hint="suas jornadas ativas" />
      <ui-stat label="Concluídas"            [value]="completedMine().length" hint="entregues no seu nome" />
      <ui-stat label="Pendências de aprovação" [value]="pendingApproval()" hint="etapas aguardando você" />
    </div>

    <!-- ========== Início rápido ========== -->
    <ui-card eyebrow="Início rápido" title="Inicie seu novo projeto"
             subtitle="Escolha o tipo de jornada e veja a sequência de etapas que será executada.">
      <div card-actions>
        <ui-button
          variant="primary"
          size="lg"
          icon="+"
          link="/dev/journeys/new"
          [queryParams]="quickStartQueryParams()">
          Criar nova jornada
        </ui-button>
      </div>

      <div class="template-grid" *ngIf="availableTemplates().length; else noTemplates">
        <button
          type="button"
          class="template-summary"
          *ngFor="let template of availableTemplates()"
          [class.template-summary--selected]="template.id === selectedTemplateId()"
          (click)="selectTemplate(template.id)">
          <span class="template-summary__badge">{{ template.badge }}</span>
          <span class="template-summary__body">
            <strong>{{ template.title }}</strong>
            <span>{{ template.description }}</span>
          </span>
          <span class="template-summary__count">{{ template.stageIds.length }} etapas</span>
        </button>
      </div>

      <ng-template #noTemplates>
        <div class="empty-permission">
          Nenhum template de jornada está liberado para o seu perfil atual.
        </div>
      </ng-template>

      <div class="stage-flow" *ngIf="selectedTemplate() as template">
        <div class="stage-flow__head">
          <strong>{{ template.shortTitle }}</strong>
          <span>{{ template.recommendedFor }}</span>
        </div>
        <ng-container *ngFor="let s of previewStages(); let i = index; let last = last">
          <div class="stage-pill">
            <span class="stage-pill__num">{{ i + 1 }}</span>
            <span class="stage-pill__title">{{ s.title }}</span>
            <ui-badge tone="brand">{{ s.badge }}</ui-badge>
          </div>
          <span class="stage-flow__connector" *ngIf="!last" aria-hidden="true"></span>
        </ng-container>
      </div>
    </ui-card>

    <!-- ========== Minhas jornadas ========== -->
    <ui-card eyebrow="Suas jornadas" title="Em andamento" [padded]="false"
             *ngIf="activeMine().length; else noActive">
      <div class="hint">Duplo clique em uma linha para abrir a jornada.</div>
      <ng-container [ngTemplateOutlet]="journeyTable" [ngTemplateOutletContext]="{ rows: activeMine() }"></ng-container>
    </ui-card>
    <ng-template #noActive>
      <ui-card eyebrow="Suas jornadas" title="Em andamento">
        <div class="empty-permission">Você não tem jornadas ativas. Comece pelo "Início rápido" acima.</div>
      </ui-card>
    </ng-template>

    <ui-card eyebrow="Suas jornadas" title="Concluídas"
             [padded]="false" *ngIf="completedMine().length">
      <ng-container [ngTemplateOutlet]="journeyTable" [ngTemplateOutletContext]="{ rows: completedMine() }"></ng-container>
    </ui-card>

    <!-- ========== Tabela compartilhada ========== -->
    <ng-template #journeyTable let-rows="rows">
      <table class="tbl">
        <thead>
          <tr>
            <th>Jornada</th>
            <th>ID Projeto</th>
            <th>Demanda</th>
            <th>Tabela final</th>
            <th>Etapa atual</th>
            <th>Avanço</th>
            <th>Atualizado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let j of rows"
              tabindex="0"
              (dblclick)="openJourney(j)"
              (keydown.enter)="openJourney(j)">
            <td class="tbl__name">
              <strong>{{ j.name }}</strong>
              <small>{{ templateLabel(j.templateId) }}</small>
            </td>
            <td class="tbl__mono">{{ j.projectCodes.join(', ') || '—' }}</td>
            <td class="tbl__mono">{{ j.importedDemandCode || '—' }}</td>
            <td class="tbl__mono">{{ j.targetTable || '—' }}</td>
            <td>{{ j.currentStage }}</td>
            <td>
              <div class="progress">
                <span class="progress__bar"><span [style.width.%]="j.progress"></span></span>
                <span class="progress__pct">{{ j.progress }}%</span>
              </div>
            </td>
            <td class="tbl__muted">{{ j.updatedAt | date:'dd/MM/yyyy HH:mm' }}</td>
          </tr>
        </tbody>
      </table>
    </ng-template>
  `,
  styles: [`
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 22px; }

    /* ===== Início rápido ===== */
    .template-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .template-summary {
      display: grid; grid-template-columns: auto 1fr; gap: 10px 12px; align-items: start;
      padding: 14px;
      width: 100%;
      background: var(--bg-app);
      border: 0;
      border-radius: var(--radius-md);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
    }
    .template-summary:hover, .template-summary--selected { background: var(--bg-elevated); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .template-summary__badge { display: inline-flex; align-items: center; justify-content: center; min-width: 38px; height: 24px; padding: 0 8px; border-radius: 6px; background: var(--bg-overlay); color: var(--brand-300); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .template-summary__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .template-summary__body strong { color: var(--text-primary); font-size: 14px; line-height: 1.3; }
    .template-summary__body span   { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
    .template-summary__count { grid-column: 2; color: var(--success-500); font-size: 12px; font-weight: 700; }

    .stage-flow { display: flex; flex-direction: column; gap: 0; }
    .stage-flow__head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .stage-flow__head strong { color: var(--text-primary); font-size: 14px; }
    .stage-flow__head span   { color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .stage-flow__connector { align-self: flex-start; width: 1px; height: 12px; margin-left: 23px; background: var(--border-default); }
    .stage-pill { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-app); border-radius: var(--radius-md); }
    .stage-pill__num { width: 22px; height: 22px; border-radius: 6px; background: var(--bg-overlay); color: var(--brand-300); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .stage-pill__title { flex: 1; font-size: 13px; color: var(--text-primary); }

    /* ===== Tabela de jornadas ===== */
    .hint { padding: 8px 16px; color: var(--text-muted); font-size: 11px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); cursor: pointer; }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl tbody tr:hover td { background: rgba(76,141,255,0.05); }
    .tbl tbody tr:focus-visible { outline: 2px solid var(--brand-400); outline-offset: -2px; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__name strong { display: block; font-size: 13px; }
    .tbl__name small  { display: block; color: var(--text-muted); font-size: 11px; font-weight: 400; }
    .tbl__mono { font-family: var(--font-mono); color: var(--text-primary); font-size: 11px; }
    .tbl__muted { color: var(--text-muted); font-size: 11px; }

    .progress { display: flex; align-items: center; gap: 8px; min-width: 110px; }
    .progress__bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; display: block; }
    .progress__bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .progress__pct { font-variant-numeric: tabular-nums; font-size: 11px; color: var(--text-secondary); min-width: 36px; text-align: right; }

    .empty-permission { padding: 14px; border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-secondary); font-size: 13px; }

    ui-card { display: block; margin-bottom: 18px; }
  `],
})
export class DevHomeComponent {
  private readonly access = inject(AccessService);
  private readonly journeys = inject(ProjectJourneyStore);
  private readonly router = inject(Router);

  /* ============= Início rápido ============= */
  readonly selectedTemplateId = signal<JourneyTemplateId>(DEFAULT_TEMPLATE_ID);

  readonly availableTemplates = computed(() => {
    if (!this.access.can('pipeline.create')) return [];
    return JOURNEY_TEMPLATES;
  });

  readonly selectedTemplate = computed(() =>
    this.availableTemplates().find(t => t.id === this.selectedTemplateId())
    ?? this.availableTemplates()[0]
    ?? null,
  );

  readonly previewStages = computed(() => {
    const template = this.selectedTemplate();
    return template ? getStagesForTemplate(template.id) : [];
  });

  readonly quickStartQueryParams = computed(() => ({
    template: this.selectedTemplate()?.id ?? DEFAULT_TEMPLATE_ID,
    autoCreate: true,
  }));

  selectTemplate(id: JourneyTemplateId): void {
    if (this.availableTemplates().some(t => t.id === id)) {
      this.selectedTemplateId.set(id);
    }
  }

  /* ============= Minhas jornadas ============= */
  readonly activeMine    = this.journeys.mineActive;
  readonly completedMine = this.journeys.mineCompleted;

  /** Aproximação simples enquanto não temos status por etapa: jornadas
   *  ativas com progresso entre 30 e 90% costumam ter aprovação pendente. */
  readonly pendingApproval = computed(() =>
    this.activeMine().filter(j => j.progress > 30 && j.progress < 90).length
  );

  templateLabel(id: ProjectJourney['templateId']): string {
    return id === 'glue-pyspark' ? 'Glue · PySpark' : 'SQL only';
  }

  openJourney(j: ProjectJourney): void {
    this.router.navigate(['/dev/journeys/new'], { queryParams: { journeyId: j.id } });
  }

  // Mantemos `ProjectJourneyStatus` referenciado para tipos do template
  // (Angular template não usa enum/type, mas exportar evita warning).
  protected readonly _statusType: ProjectJourneyStatus = 'active';
}
