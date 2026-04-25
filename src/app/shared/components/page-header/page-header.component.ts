import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon" *ngIf="icon">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <div class="header-text">
          <h1>{{ title }}</h1>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #1a237e, #283593); display: flex; align-items: center; justify-content: center; }
    .header-icon mat-icon { color: white; font-size: 24px; width: 24px; height: 24px; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a; }
    p { margin: 4px 0 0; font-size: 14px; color: #666; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
}
