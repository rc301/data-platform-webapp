import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
    mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--text-disabled); margin-bottom: 16px; }
    h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
    p { margin: 8px 0 0; font-size: 14px; color: var(--text-secondary); max-width: 400px; }
  `],
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() message?: string;
  @Input() icon = 'inbox';
}
