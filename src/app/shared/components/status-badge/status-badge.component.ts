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
    .status-healthy, .status-passing, .status-succeeded, .status-active, .status-available, .status-certified, .status-completed { --mdc-chip-elevated-container-color: #e8f5e9; --mdc-chip-label-text-color: #2e7d32; }
    .status-degraded, .status-warning, .status-running, .status-in_review, .status-paused, .status-delayed { --mdc-chip-elevated-container-color: #fff3e0; --mdc-chip-label-text-color: #e65100; }
    .status-down, .status-failing, .status-failed, .status-critical, .status-deprecated { --mdc-chip-elevated-container-color: #ffebee; --mdc-chip-label-text-color: #c62828; }
    .status-draft, .status-pending, .status-not_evaluated, .status-inactive, .status-stopped { --mdc-chip-elevated-container-color: #eceff1; --mdc-chip-label-text-color: #546e7a; }
    .status-info, .status-low, .status-medium { --mdc-chip-elevated-container-color: #e3f2fd; --mdc-chip-label-text-color: #1565c0; }
    .status-offline { --mdc-chip-elevated-container-color: #eeeeee; --mdc-chip-label-text-color: #757575; }
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
