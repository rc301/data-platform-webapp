import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UI primitive — cabeçalho de página padronizado.
 * Slot `[page-actions]` para botões/controles à direita.
 */
@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__left">
        <span *ngIf="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</span>
        <h1 class="page-header__title">{{ title }}</h1>
        <p *ngIf="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-header__actions"><ng-content select="[page-actions]"></ng-content></div>
    </header>
    <ng-content></ng-content>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--space-4);
      padding-bottom: var(--space-5);
      margin-bottom: var(--space-6);
      border-bottom: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }
    .page-header__left { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .page-header__eyebrow {
      font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--brand-300);
    }
    .page-header__title { margin: 0; font-size: 24px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.02em; }
    .page-header__subtitle { margin: 0; font-size: 14px; color: var(--text-secondary); max-width: 720px; }
    .page-header__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  `],
})
export class UiPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() eyebrow?: string;
}
