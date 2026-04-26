import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="metric-card" [class.clickable]="clickable">
      <div class="metric-content">
        <div class="metric-icon" [style.background-color]="iconBg">
          <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
        </div>
        <div class="metric-info">
          <span class="metric-label">{{ label }}</span>
          <span class="metric-value">{{ prefix }}{{ formattedValue }}{{ suffix }}</span>
          <div class="metric-trend" *ngIf="showTrend">
            <mat-icon class="trend-icon" [class.trend-up]="trend === 'up'" [class.trend-down]="trend === 'down'">
              {{ trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat' }}
            </mat-icon>
            <span [class.trend-up]="trend === 'up'" [class.trend-down]="trend === 'down'">
              {{ changePercent > 0 ? '+' : '' }}{{ changePercent }}%
            </span>
          </div>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .metric-card { cursor: default; transition: transform 0.2s, box-shadow 0.2s; }
    .metric-card.clickable { cursor: pointer; }
    .metric-card.clickable:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
    .metric-content { display: flex; align-items: center; gap: 16px; padding: 16px; }
    .metric-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .metric-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .metric-info { display: flex; flex-direction: column; gap: 2px; }
    .metric-label { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
    .metric-trend { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; }
    .trend-icon { font-size: 18px; width: 18px; height: 18px; }
    .trend-up { color: var(--success-500); }
    .trend-down { color: var(--danger-500); }
  `],
})
export class MetricCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) icon!: string;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() trend: 'up' | 'down' | 'stable' = 'stable';
  @Input() changePercent = 0;
  @Input() showTrend = true;
  @Input() clickable = false;
  @Input() iconBg = 'var(--info-bg)';
  @Input() iconColor = 'var(--info-500)';

  get formattedValue(): string {
    if (this.value >= 1000000) return (this.value / 1000000).toFixed(1) + 'M';
    if (this.value >= 1000) return (this.value / 1000).toFixed(1) + 'K';
    return this.value % 1 === 0 ? this.value.toString() : this.value.toFixed(1);
  }
}
