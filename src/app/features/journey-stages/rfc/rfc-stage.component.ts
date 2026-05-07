import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StageContext } from '../stage-runtime';
import { RfcStageStore } from './rfc-stage.store';

/** Modelo do draft de demanda. */
export interface RfcDraft {
  productName: string;
  domain:      string;
  objective:   string;
  squad:       string;
  sla:         string;
  sources:     string;
  target:      string;
}

/**
 * Plugin de UI da etapa de demanda.
 * Comunica com o container via RfcStageStore — o container nunca toca
 * em selector ou API específica deste plugin.
 */
@Component({
  selector: 'app-rfc-stage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h4 class="section-title">Formulário da demanda</h4>
    <div class="form-grid">
      <label class="field">
        <span class="field__label">Nome do produto de dados</span>
        <input class="field__input" [ngModel]="draft().productName" (ngModelChange)="patch({ productName: $event })" placeholder="ex: customer_360" />
      </label>
      <label class="field">
        <span class="field__label">Domínio</span>
        <select class="field__input" [ngModel]="draft().domain" (ngModelChange)="patch({ domain: $event })">
          <option>Comercial</option><option>Financeiro</option>
          <option>Operações</option><option>Marketing</option><option>Risco</option>
        </select>
      </label>
      <label class="field field--full">
        <span class="field__label">Objetivo de negócio</span>
        <textarea class="field__input" rows="3" [ngModel]="draft().objective" (ngModelChange)="patch({ objective: $event })"
                  placeholder="Descreva o problema que esta pipeline resolve."></textarea>
      </label>
      <label class="field">
        <span class="field__label">Squad responsável</span>
        <input class="field__input" [ngModel]="draft().squad" (ngModelChange)="patch({ squad: $event })" placeholder="ex: Squad A" />
      </label>
      <label class="field">
        <span class="field__label">SLA</span>
        <input class="field__input" [ngModel]="draft().sla" (ngModelChange)="patch({ sla: $event })" placeholder="ex: D-1 até 07h00" />
      </label>
      <label class="field field--full">
        <span class="field__label">Fontes de dados</span>
        <input class="field__input" [ngModel]="draft().sources" (ngModelChange)="patch({ sources: $event })" placeholder="ex: rds.orders_db.orders" />
      </label>
      <label class="field field--full">
        <span class="field__label">Destino</span>
        <input class="field__input" [ngModel]="draft().target" (ngModelChange)="patch({ target: $event })" placeholder="ex: spec.customer_360" />
      </label>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em; color: var(--text-muted); font-weight: 600; margin: 0 0 12px; }
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
    @media (max-width: 700px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class RfcStageComponent {
  /** Recebido pelo orquestrador via ngComponentOutlet inputs (StageRenderProps). */
  @Input() context?: StageContext;

  private readonly store = inject(RfcStageStore);
  readonly draft = this.store.draft;

  patch(p: Partial<RfcDraft>): void {
    this.store.update(p);
  }
}
