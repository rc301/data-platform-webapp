import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-chip [class]="'status-badge status-' + normalizedStatus" [highlighted]="highlighted">
      <mat-icon matChipAvatar *ngIf="icon">{{ icon }}</mat-icon>
      {{ label || status }}
    </mat-chip>
  `,
  styles: [`
    :host { display: inline-flex; }
    .status-badge { font-size: 12px; font-weight: 500; }
    .status-healthy, .status-passing, .status-succeeded, .status-active, .status-available, .status-certified, .status-completed { --mdc-chip-elevated-container-color: var(--success-bg); --mdc-chip-label-text-color: var(--success-500); }
    .status-degraded, .status-warning, .status-running, .status-in_review, .status-paused, .status-delayed { --mdc-chip-elevated-container-color: var(--warning-bg); --mdc-chip-label-text-color: var(--warning-500); }
    .status-down, .status-failing, .status-failed, .status-critical, .status-deprecated { --mdc-chip-elevated-container-color: var(--danger-bg); --mdc-chip-label-text-color: var(--danger-500); }
    .status-draft, .status-pending, .status-not_evaluated, .status-inactive, .status-stopped { --mdc-chip-elevated-container-color: var(--neutral-bg); --mdc-chip-label-text-color: var(--neutral-500); }
    .status-info, .status-low, .status-medium { --mdc-chip-elevated-container-color: var(--info-bg); --mdc-chip-label-text-color: var(--info-500); }
    .status-offline { --mdc-chip-elevated-container-color: var(--neutral-bg); --mdc-chip-label-text-color: var(--text-muted); }
  `],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;
  @Input() label?: string;
  @Input() icon?: string;
  @Input() highlighted = false;

  get normalizedStatus(): string {
    return this.status?.toLowerCase().replace(/\s+/g, '_') || '';
  }
}
