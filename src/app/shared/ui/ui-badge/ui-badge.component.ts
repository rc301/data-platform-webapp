import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiBadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

/**
 * UI primitive — badge/tag textual com tom semântico.
 */
@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'ui-badge ui-badge--' + tone" [class.ui-badge--solid]="solid">
      <span *ngIf="dot" class="ui-badge__dot"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ui-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 10px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      text-transform: uppercase;
    }
    .ui-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .ui-badge--neutral  { color: var(--neutral-500);  background: var(--neutral-bg);  border-color: rgba(111,122,145,0.30); }
    .ui-badge--brand    { color: var(--brand-300);    background: rgba(46,91,176,0.15); border-color: rgba(76,141,255,0.30); }
    .ui-badge--success  { color: var(--success-500);  background: var(--success-bg);  border-color: rgba(43,182,115,0.30); }
    .ui-badge--warning  { color: var(--warning-500);  background: var(--warning-bg);  border-color: rgba(229,162,60,0.30); }
    .ui-badge--danger   { color: var(--danger-500);   background: var(--danger-bg);   border-color: rgba(229,72,77,0.30); }
    .ui-badge--info     { color: var(--info-500);     background: var(--info-bg);     border-color: rgba(76,141,255,0.30); }

    .ui-badge--solid.ui-badge--brand   { background: var(--brand-500);   color: #fff; border-color: transparent; }
    .ui-badge--solid.ui-badge--success { background: var(--success-700); color: #fff; border-color: transparent; }
    .ui-badge--solid.ui-badge--warning { background: var(--warning-700); color: #fff; border-color: transparent; }
    .ui-badge--solid.ui-badge--danger  { background: var(--danger-700);  color: #fff; border-color: transparent; }
  `],
})
export class UiBadgeComponent {
  @Input() tone: UiBadgeTone = 'neutral';
  @Input() solid = false;
  @Input() dot = false;
}
