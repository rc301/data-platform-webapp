import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-overlay" *ngIf="loading">
      <mat-spinner [diameter]="48"></mat-spinner>
      <span *ngIf="message">{{ message }}</span>
    </div>
  `,
  styles: [`
    .loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(10,14,20,0.85); z-index: 10; gap: 16px; border-radius: inherit; }
    span { font-size: 14px; color: var(--text-secondary); }
  `],
})
export class LoadingOverlayComponent {
  @Input() loading = false;
  @Input() message?: string;
}
