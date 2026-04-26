import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatTrend = 'up' | 'down' | 'flat';

/**
 * UI primitive — KPI/Stat card.
 * Recebe valor já formatado (string) para máxima desacoplagem da lógica de domínio.
 */
@Component({
  selector: 'ui-stat',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat">
      <div class="stat__head">
        <span class="stat__label">{{ label }}</span>
        <span *ngIf="hint" class="stat__hint">{{ hint }}</span>
      </div>
      <div class="stat__value">{{ value }}</div>
      <div class="stat__delta" *ngIf="delta !== undefined && delta !== null"
           [class.stat__delta--up]="trend === 'up'"
           [class.stat__delta--down]="trend === 'down'">
        <span class="stat__arrow">{{ trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–' }}</span>
        <span>{{ delta }}</span>
        <span *ngIf="deltaPeriod" class="stat__period">{{ deltaPeriod }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stat {
      display: flex; flex-direction: column; gap: 6px;
      padding: var(--space-5);
      background: var(--bg-surface);
      border: 1px solid transparent;
      border-radius: var(--radius-lg);
      min-height: 110px;
      position: relative;
      overflow: hidden;
    }
    .stat::before {
      content: ''; position: absolute; inset: 0 auto 0 0; width: 3px;
      background: linear-gradient(180deg, var(--brand-400), transparent 70%);
      opacity: .55;
    }
    .stat__head { display: flex; justify-content: space-between; align-items: baseline; }
    .stat__label { font-size: 11px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase; color: var(--text-muted); }
    .stat__hint { font-size: 11px; color: var(--text-muted); }
    .stat__value { font-size: 30px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1.05; font-variant-numeric: tabular-nums; }
    .stat__delta { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .stat__arrow { font-size: 10px; }
    .stat__delta--up   { color: var(--success-500); }
    .stat__delta--down { color: var(--danger-500); }
    .stat__period { color: var(--text-muted); font-weight: 500; }
  `],
})
export class UiStatComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() hint?: string;
  @Input() delta?: string | null;
  @Input() deltaPeriod?: string;
  @Input() trend: StatTrend = 'flat';
}
