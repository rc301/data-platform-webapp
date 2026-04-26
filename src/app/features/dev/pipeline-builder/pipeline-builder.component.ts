import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
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
import { JOURNEY_STAGES, StageId, SAMPLE_JOURNEY_STATUSES, STAGE_BY_ID } from './journey-config';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header
      eyebrow="Persona · Desenvolvedor"
      title="Nova jornada de pipeline"
      subtitle="Cada etapa é executada por um agente via MCP. O desenvolvedor revisa e aprova antes de avançar.">
      <div page-actions>
        <ui-button variant="ghost" routerLink="/dev/journeys">Minhas jornadas</ui-button>
        <ui-button variant="secondary">Salvar rascunho</ui-button>
      </div>
    </ui-page-header>

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
          [eyebrow]="'Etapa ' + current().index + ' de ' + totalCount()"
          [title]="current().title"
          [subtitle]="current().description">
          <div card-actions>
            <ui-badge [tone]="badgeTone(currentStatus())">{{ statusLabel(currentStatus()) }}</ui-badge>
          </div>

          <!-- Form de RFC: só na primeira etapa -->
          <ng-container *ngIf="current().id === 'rfc'">
            <h4 class="section-title" style="margin-top:0">Formulário RFC</h4>
            <div class="form-grid">
              <label class="field">
                <span class="field__label">Nome do produto de dados</span>
                <input class="field__input" [(ngModel)]="form.productName" placeholder="ex: customer_360" />
              </label>
              <label class="field">
                <span class="field__label">Domínio</span>
                <select class="field__input" [(ngModel)]="form.domain">
                  <option>Comercial</option><option>Financeiro</option>
                  <option>Operações</option><option>Marketing</option><option>Risco</option>
                </select>
              </label>
              <label class="field field--full">
                <span class="field__label">Objetivo de negócio</span>
                <textarea class="field__input" rows="3" [(ngModel)]="form.objective"
                          placeholder="Descreva o problema que esta pipeline resolve."></textarea>
              </label>
              <label class="field">
                <span class="field__label">Squad responsável</span>
                <input class="field__input" [(ngModel)]="form.squad" placeholder="ex: Squad A" />
              </label>
              <label class="field">
                <span class="field__label">SLA</span>
                <input class="field__input" [(ngModel)]="form.sla" placeholder="ex: D-1 até 07h00" />
              </label>
              <label class="field field--full">
                <span class="field__label">Fontes de dados</span>
                <input class="field__input" [(ngModel)]="form.sources" placeholder="ex: rds.orders_db.orders, kinesis.clickstream" />
              </label>
              <label class="field field--full">
                <span class="field__label">Destino</span>
                <input class="field__input" [(ngModel)]="form.target" placeholder="ex: gold.customer_360" />
              </label>
            </div>
          </ng-container>

          <!-- Painel padrão: ações automatizadas + aprovação -->
          <ng-container *ngIf="current().id !== 'rfc'">
            <div class="agent-block">
              <h4 class="section-title" style="margin-top:0">Ações que o agente executará via MCP</h4>
              <ul class="agent-list">
                <li *ngFor="let action of current().automatedActions">
                  <span class="agent-list__check">›</span>{{ action }}
                </li>
              </ul>
            </div>

            <div class="agent-block">
              <h4 class="section-title">Saída do agente (preview)</h4>
              <pre class="agent-output">{{ samplePreview() }}</pre>
            </div>
          </ng-container>

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

        <!-- Resumo lateral -->
        <ui-card eyebrow="Resumo da jornada" title="Contexto do projeto">
          <div class="summary-grid">
            <div><span class="summary-grid__k">Produto</span><span class="summary-grid__v">{{ form.productName || '—' }}</span></div>
            <div><span class="summary-grid__k">Domínio</span><span class="summary-grid__v">{{ form.domain || '—' }}</span></div>
            <div><span class="summary-grid__k">Squad</span><span class="summary-grid__v">{{ form.squad || '—' }}</span></div>
            <div><span class="summary-grid__k">SLA</span><span class="summary-grid__v">{{ form.sla || '—' }}</span></div>
            <div class="summary-grid__row"><span class="summary-grid__k">Destino</span><span class="summary-grid__v">{{ form.target || '—' }}</span></div>
          </div>
        </ui-card>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
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
  `],
})
export class PipelineBuilderComponent {
  readonly stages = JOURNEY_STAGES;

  /** Status mutável da jornada (mock — em produção viria de um service/store). */
  private readonly statuses = signal<Record<StageId, JourneyStepStatus>>({ ...SAMPLE_JOURNEY_STATUSES });
  private readonly currentIdSig = signal<StageId>('sandbox-infra');

  readonly currentId = this.currentIdSig.asReadonly();
  readonly current = computed(() => STAGE_BY_ID[this.currentIdSig()]);
  readonly currentStatus = computed(() => this.statuses()[this.currentIdSig()]);
  readonly totalCount = computed(() => this.stages.length);
  readonly approvedCount = computed(() => Object.values(this.statuses()).filter(s => s === 'approved').length);
  readonly progressPct = computed(() => Math.round((this.approvedCount() / this.totalCount()) * 100));

  readonly stepperItems = computed<JourneyStep[]>(() =>
    this.stages.map(s => ({
      id: s.id,
      index: s.index,
      title: s.title,
      shortTitle: s.title,
      description: s.description,
      badge: s.badge,
      status: this.statuses()[s.id],
    }))
  );

  form = {
    productName: 'customer_360',
    domain: 'Comercial',
    objective: 'Construir visão consolidada de cliente para uso de Marketing e CS.',
    squad: 'Squad B',
    sla: 'D-1 até 07h30 UTC-3',
    sources: 'silver.customer_base, silver.orders, bronze.clickstream',
    target: 'gold.customer_360',
  };

  goToStage(id: string): void {
    this.currentIdSig.set(id as StageId);
  }

  isFirst = computed(() => this.current().index === 1);
  isLast = computed(() => this.current().index === this.totalCount());

  prev(): void {
    const idx = this.current().index;
    if (idx > 1) this.currentIdSig.set(this.stages[idx - 2].id);
  }

  approveAndAdvance(): void {
    const id = this.currentIdSig();
    this.statuses.update(s => ({ ...s, [id]: 'approved' }));
    if (!this.isLast()) {
      const next = this.stages[this.current().index];
      this.currentIdSig.set(next.id);
      this.statuses.update(s => ({ ...s, [next.id]: 'awaiting_approval' }));
    }
  }

  reject(): void {
    const id = this.currentIdSig();
    this.statuses.update(s => ({ ...s, [id]: 'failed' }));
  }

  canApprove(): boolean {
    return this.currentStatus() !== 'approved';
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
    const previews: Record<StageId, string> = {
      'rfc': '',
      'lup': '✓ LUP-2741 reservada\n✓ Centro de custo: 4421-DATA-PLATFORM\n✓ Owner: Squad B',
      'repo': '✓ Repositório criado: org/dp-customer-360\n✓ Branch protection: main, develop\n✓ CODEOWNERS atribuído à @squad-b\n✓ Environments: dev, hml, prod',
      'sandbox-infra': 'Plan AWS Sandbox:\n  + aws_s3_bucket.bronze (dp-cust360-bronze-sbx)\n  + aws_s3_bucket.silver (dp-cust360-silver-sbx)\n  + aws_s3_bucket.gold   (dp-cust360-gold-sbx)\n  + aws_glue_catalog_database.cust360\n  + aws_glue_job.bronze_to_silver\n  + aws_glue_job.silver_to_gold\n  + aws_sfn_state_machine.cust360_daily\n  + aws_iam_role.dp_cust360_glue\n\n7 to add, 0 to change, 0 to destroy.',
      'terraform-import': 'terraform import aws_s3_bucket.bronze dp-cust360-bronze-sbx ✓\nterraform import aws_glue_job.bronze_to_silver cust360_b2s ✓\nterraform import aws_sfn_state_machine.cust360_daily ✓\n\nPR #142 aberto: "scaffold: terraform import from sandbox"',
      'unit-tests': '✓ tests/unit/test_bronze_to_silver.py (12 cases)\n✓ tests/unit/test_silver_to_gold.py (8 cases)\n✓ tests/contract/test_gold_schema.py (4 cases)\nCoverage mínimo configurado: 80%',
      'deploy-dev-hml': '[GitHub Actions]\n✓ deploy-dev: success (4m 12s)\n⏳ deploy-hml: aguardando aprovação manual',
      'deploy-prod': '[main]\n✓ Último merge: feat: add gold.customer_360 (há 12 min)\n⏳ GMUD-9821 aberta automaticamente · janela 2026-04-26 23:00 UTC-3\n   Workflow deploy-prod: pendente',
      'orchestrator': '✓ DAG cust360_daily registrado\n  cron: 0 6 * * *  (06:00 UTC)\n  upstream: orders_silver, clickstream_silver\n  SLA: 07:30 UTC-3',
      'data-quality': '✓ 12 regras propostas\n  • not_null em customer_id (CRITICAL)\n  • unique em customer_id (CRITICAL)\n  • freshness < 24h (HIGH)\n  • row_count change ±20% (MEDIUM)',
      'documentation': '✓ Doc gerada: portal/docs/products/customer_360\n✓ Vinculado ao Catálogo: gold.customer_360\n✓ Owners: Squad B · Stewards: @data-gov',
    };
    return previews[id];
  });
}
