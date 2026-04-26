import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type JourneyStepStatus = 'pending' | 'active' | 'in_progress' | 'awaiting_approval' | 'approved' | 'failed' | 'skipped';

export interface JourneyStep {
  id: string;
  index: number;
  title: string;
  shortTitle?: string;
  description?: string;
  /** Tag curta opcional (ex: "RFC", "LUP", "GitHub", "Terraform"). */
  badge?: string;
  status: JourneyStepStatus;
}

/**
 * UI primitive — Stepper vertical para jornadas longas e auditáveis.
 * Não realiza navegação; é puramente apresentacional + emite eventos.
 * O container (smart) decide transições e passa a lista de steps já calculada.
 */
@Component({
  selector: 'ui-journey-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="journey">
      <li *ngFor="let step of steps; let i = index"
          class="journey__step"
          [class.journey__step--current]="step.id === currentStepId"
          [class.journey__step--clickable]="clickable"
          (click)="clickable && stepClicked.emit(step)">
        <div class="journey__rail">
          <div class="journey__node" [attr.data-status]="step.status">
            <span class="journey__node-glyph">{{ glyphFor(step.status) || step.index }}</span>
          </div>
          <div class="journey__connector" *ngIf="i < steps.length - 1"></div>
        </div>
        <div class="journey__body">
          <div class="journey__head">
            <span class="journey__title">{{ step.title }}</span>
            <span *ngIf="step.badge" class="journey__badge">{{ step.badge }}</span>
            <span class="journey__status" [attr.data-status]="step.status">{{ statusLabel(step.status) }}</span>
          </div>
          <p *ngIf="step.description" class="journey__desc">{{ step.description }}</p>
        </div>
      </li>
    </ol>
  `,
  styles: [`
    :host { display: block; }
    .journey { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .journey__step { display: grid; grid-template-columns: 36px 1fr; gap: 16px; padding: 0; min-height: 76px; }
    .journey__step--clickable { cursor: pointer; }
    .journey__step--clickable:hover .journey__title { color: var(--brand-300); }

    .journey__rail { display: flex; flex-direction: column; align-items: center; }
    .journey__node {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      background: var(--bg-elevated); border: 1.5px solid var(--border-default);
      color: var(--text-secondary);
      flex-shrink: 0;
      transition: all .2s ease;
    }
    .journey__connector { flex: 1; width: 2px; background: var(--border-subtle); margin: 4px 0; }

    .journey__node[data-status='approved']           { background: var(--success-700); border-color: var(--success-500); color: #fff; }
    .journey__node[data-status='in_progress']        { background: var(--brand-500); border-color: var(--brand-400); color: #fff; box-shadow: 0 0 0 4px rgba(76,141,255,0.18); }
    .journey__node[data-status='awaiting_approval'] { background: var(--warning-700); border-color: var(--warning-500); color: #fff; }
    .journey__node[data-status='active']             { background: var(--bg-overlay); border-color: var(--brand-400); color: var(--brand-300); }
    .journey__node[data-status='failed']             { background: var(--danger-700); border-color: var(--danger-500); color: #fff; }
    .journey__node[data-status='skipped']            { background: var(--bg-elevated); border-color: var(--border-default); color: var(--text-muted); }

    .journey__step--current .journey__node { box-shadow: 0 0 0 4px rgba(76,141,255,0.18); }

    .journey__body { padding: 2px 0 16px; }
    .journey__head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .journey__title { color: var(--text-primary); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; }
    .journey__badge {
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
      padding: 2px 6px; border-radius: 4px;
      background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border-subtle);
      text-transform: uppercase;
    }
    .journey__status {
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
      background: var(--neutral-bg); color: var(--neutral-500);
    }
    .journey__status[data-status='approved']          { background: var(--success-bg); color: var(--success-500); }
    .journey__status[data-status='in_progress']       { background: var(--info-bg); color: var(--info-500); }
    .journey__status[data-status='awaiting_approval'] { background: var(--warning-bg); color: var(--warning-500); }
    .journey__status[data-status='failed']            { background: var(--danger-bg); color: var(--danger-500); }
    .journey__status[data-status='active']            { background: var(--info-bg); color: var(--info-500); }
    .journey__desc { margin: 6px 0 0; color: var(--text-secondary); font-size: 13px; max-width: 640px; }
  `],
})
export class UiJourneyStepperComponent {
  @Input({ required: true }) steps: JourneyStep[] = [];
  @Input() currentStepId?: string | null;
  @Input() clickable = true;
  @Output() stepClicked = new EventEmitter<JourneyStep>();

  glyphFor(status: JourneyStepStatus): string | null {
    return ({
      approved: '✓',
      failed: '✕',
      in_progress: '',
      awaiting_approval: '',
      pending: '',
      active: '',
      skipped: '–',
    } as const)[status];
  }

  statusLabel(status: JourneyStepStatus): string {
    return ({
      pending: 'Pendente',
      active: 'Disponível',
      in_progress: 'Em execução',
      awaiting_approval: 'Aguardando aprovação',
      approved: 'Aprovado',
      failed: 'Falhou',
      skipped: 'Ignorado',
    } as const)[status];
  }
}
