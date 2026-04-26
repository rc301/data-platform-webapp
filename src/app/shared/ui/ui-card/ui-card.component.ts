import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UI primitive — superfície/card.
 * Slot-based via <ng-content>, sem dependências externas.
 */
@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ui-card" [class.ui-card--interactive]="interactive" [class.ui-card--flat]="flat">
      <header *ngIf="title || subtitle" class="ui-card__header">
        <div class="ui-card__title-row">
          <span *ngIf="eyebrow" class="ui-card__eyebrow">{{ eyebrow }}</span>
          <h3 *ngIf="title" class="ui-card__title">{{ title }}</h3>
          <p *ngIf="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
        </div>
        <div class="ui-card__actions"><ng-content select="[card-actions]"></ng-content></div>
      </header>
      <div class="ui-card__body" [class.ui-card__body--padded]="padded">
        <ng-content></ng-content>
      </div>
      <footer class="ui-card__footer"><ng-content select="[card-footer]"></ng-content></footer>
    </section>
  `,
  styles: [`
    :host { display: block; }
    /*
      Sem borda padrão: o contraste com --bg-app já delimita o card.
      Em estado interativo, uma borda sutil aparece no hover como affordance.
    */
    .ui-card {
      background: var(--bg-surface);
      border: 1px solid transparent;
      border-radius: var(--radius-lg);
      box-shadow: none;
      overflow: hidden;
      transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .ui-card--flat { background: transparent; }
    .ui-card--interactive { cursor: pointer; }
    .ui-card--interactive:hover { border-color: var(--border-default); box-shadow: var(--shadow-2); transform: translateY(-1px); }

    .ui-card__header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      padding: var(--space-5) var(--space-6) var(--space-3);
    }
    .ui-card__title-row { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .ui-card__eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); font-weight: 600; }
    .ui-card__title { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
    .ui-card__subtitle { margin: 2px 0 0; font-size: 13px; color: var(--text-secondary); }
    .ui-card__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .ui-card__body--padded { padding: var(--space-5) var(--space-6); }
    .ui-card__body:not(.ui-card__body--padded) { padding: 0; }
    .ui-card__footer:empty { display: none; }
    .ui-card__footer { padding: var(--space-3) var(--space-6); border-top: 1px solid var(--border-subtle); }
  `],
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() eyebrow?: string;
  @Input() padded = true;
  @Input() interactive = false;
  @Input() flat = false;
}
