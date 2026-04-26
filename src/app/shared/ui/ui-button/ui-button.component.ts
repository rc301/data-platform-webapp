import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

/**
 * UI primitive — botão padronizado.
 * Renderiza como <a routerLink> quando recebe `link`, ou <button> caso contrário.
 * Permanece desacoplado: a única dependência adicional é o RouterModule, que é
 * trivialmente substituível ao migrar para um design system (basta o substituto
 * suportar a mesma API: variant/size/disabled/clicked/link).
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="link; else asButton">
      <a [routerLink]="link"
         [class]="classes"
         [attr.aria-disabled]="disabled || null"
         (click)="onClick($event)">
        <span *ngIf="icon" class="ui-btn__icon" aria-hidden="true">{{ icon }}</span>
        <ng-content></ng-content>
      </a>
    </ng-container>
    <ng-template #asButton>
      <button [type]="type"
              [disabled]="disabled"
              [class]="classes"
              (click)="onClick($event)">
        <span *ngIf="icon" class="ui-btn__icon" aria-hidden="true">{{ icon }}</span>
        <ng-content></ng-content>
      </button>
    </ng-template>
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
      text-decoration: none;
    }
    .ui-btn:hover { text-decoration: none; }
    .ui-btn:active:not([disabled]):not([aria-disabled='true']) { transform: translateY(1px); }
    .ui-btn[disabled], .ui-btn[aria-disabled='true'] { opacity: .45; cursor: not-allowed; pointer-events: none; }
    .ui-btn__icon { font-size: 16px; line-height: 0; }

    .ui-btn--sm { --h: 30px; padding: 0 12px; font-size: 12px; }
    .ui-btn--md { --h: 38px; }
    .ui-btn--lg { --h: 46px; padding: 0 22px; font-size: 14px; }
    .ui-btn--block { width: 100%; }

    .ui-btn--primary {
      background: var(--brand-500); color: var(--text-on-brand);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.40);
    }
    .ui-btn--primary:hover { background: var(--brand-400); color: #fff; }

    .ui-btn--secondary {
      background: var(--bg-overlay); color: var(--text-primary);
      border-color: var(--border-default);
    }
    .ui-btn--secondary:hover { background: var(--bg-elevated); border-color: var(--border-strong); color: var(--text-primary); }

    .ui-btn--ghost { background: transparent; color: var(--text-secondary); }
    .ui-btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }

    .ui-btn--danger { background: var(--danger-500); color: #fff; }
    .ui-btn--danger:hover { background: var(--danger-700); color: #fff; }
  `],
})
export class UiButtonComponent {
  @Input() variant: UiButtonVariant = 'primary';
  @Input() size: UiButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() icon?: string;
  /** Se preenchido, renderiza como link de roteamento ao invés de <button>. */
  @Input() link?: string | unknown[];
  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string {
    return [
      'ui-btn',
      `ui-btn--${this.variant}`,
      `ui-btn--${this.size}`,
      this.block ? 'ui-btn--block' : '',
    ].filter(Boolean).join(' ');
  }

  onClick(ev: MouseEvent): void {
    if (this.disabled) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    this.clicked.emit(ev);
  }
}
