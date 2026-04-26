import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

/**
 * UI primitive — botão padronizado.
 * Desacoplado de qualquer biblioteca de UI: usa apenas tokens CSS do tema.
 * Substituível por um componente de design system futuro mantendo a mesma API.
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="'ui-btn ui-btn--' + variant + ' ui-btn--' + size + (block ? ' ui-btn--block' : '')"
      (click)="clicked.emit($event)">
      <span *ngIf="icon" class="ui-btn__icon" aria-hidden="true">{{ icon }}</span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ui-btn {
      --h: 38px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: var(--h);
      padding: 0 16px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      font-family: inherit;
      font-size: 13px; font-weight: 600; letter-spacing: -0.005em;
      cursor: pointer;
      transition: background .15s ease, border-color .15s ease, color .15s ease, transform .05s ease;
      white-space: nowrap;
    }
    .ui-btn:active:not(:disabled) { transform: translateY(1px); }
    .ui-btn:disabled { opacity: .45; cursor: not-allowed; }
    .ui-btn__icon { font-size: 16px; line-height: 0; }

    .ui-btn--sm { --h: 30px; padding: 0 12px; font-size: 12px; }
    .ui-btn--md { --h: 38px; }
    .ui-btn--lg { --h: 46px; padding: 0 22px; font-size: 14px; }
    .ui-btn--block { width: 100%; }

    .ui-btn--primary {
      background: var(--brand-500); color: var(--text-on-brand);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.40);
    }
    .ui-btn--primary:hover:not(:disabled) { background: var(--brand-400); }

    .ui-btn--secondary {
      background: var(--bg-overlay); color: var(--text-primary);
      border-color: var(--border-default);
    }
    .ui-btn--secondary:hover:not(:disabled) { background: var(--bg-elevated); border-color: var(--border-strong); }

    .ui-btn--ghost {
      background: transparent; color: var(--text-secondary);
    }
    .ui-btn--ghost:hover:not(:disabled) { background: var(--bg-elevated); color: var(--text-primary); }

    .ui-btn--danger {
      background: var(--danger-500); color: #fff;
    }
    .ui-btn--danger:hover:not(:disabled) { background: var(--danger-700); }
  `],
})
export class UiButtonComponent {
  @Input() variant: UiButtonVariant = 'primary';
  @Input() size: UiButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() icon?: string;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
