import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetricCardComponent } from '../../../shared/components/metric-card/metric-card.component';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatTableModule,
    MatProgressBarModule, MatTooltipModule, MetricCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Summary -->
    <div class="metrics-grid">
      <app-metric-card label="Mês Atual" [value]="totalCurrent" icon="attach_money" prefix="$"
        iconBg="#e8eaf6" iconColor="#1a237e" [trend]="'up'" [changePercent]="totalTrend"></app-metric-card>
      <app-metric-card label="Previsão" [value]="totalForecast" icon="trending_up" prefix="$"
        iconBg="#fff3e0" iconColor="#e65100" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Orçamento" [value]="totalBudget" icon="account_balance" prefix="$"
        iconBg="#e8f5e9" iconColor="#2e7d32" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Uso do Orçamento" [value]="budgetUsage" icon="pie_chart" suffix="%"
        iconBg="#f3e5f5" iconColor="#7b1fa2" [showTrend]="false"></app-metric-card>
    </div>

    <!-- Cost Breakdown -->
    <mat-card>
      <div class="table-header">
        <h3>Detalhamento de Custos por Serviço</h3>
      </div>
      <table mat-table [dataSource]="costs" class="full-width">
        <ng-container matColumnDef="service">
          <th mat-header-cell *matHeaderCellDef>Serviço</th>
          <td mat-cell *matCellDef="let c"><strong>{{ c.service }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="current">
          <th mat-header-cell *matHeaderCellDef>Mês Atual</th>
          <td mat-cell *matCellDef="let c">\${{ c.currentMonth | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="previous">
          <th mat-header-cell *matHeaderCellDef>Mês Anterior</th>
          <td mat-cell *matCellDef="let c">\${{ c.previousMonth | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="trend">
          <th mat-header-cell *matHeaderCellDef>Tendência</th>
          <td mat-cell *matCellDef="let c">
            <span [class.trend-up]="c.trend > 0" [class.trend-down]="c.trend < 0" [class.trend-flat]="c.trend === 0">
              <mat-icon inline>{{ c.trend > 0 ? 'trending_up' : c.trend < 0 ? 'trending_down' : 'trending_flat' }}</mat-icon>
              {{ c.trend > 0 ? '+' : '' }}{{ c.trend | number:'1.1-1' }}%
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="budget">
          <th mat-header-cell *matHeaderCellDef>Orçamento</th>
          <td mat-cell *matCellDef="let c">\${{ c.budget | number:'1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="usage">
          <th mat-header-cell *matHeaderCellDef>Uso do Orçamento</th>
          <td mat-cell *matCellDef="let c">
            <div class="usage-cell">
              <mat-progress-bar [value]="(c.currentMonth / c.budget) * 100"
                [color]="c.currentMonth / c.budget > 0.9 ? 'warn' : 'primary'"></mat-progress-bar>
              <span class="usage-pct">{{ ((c.currentMonth / c.budget) * 100) | number:'1.0-0' }}%</span>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="forecast">
          <th mat-header-cell *matHeaderCellDef>Previsão</th>
          <td mat-cell *matCellDef="let c">
            <span [class.forecast-over]="c.forecast > c.budget">\${{ c.forecast | number:'1.0-0' }}</span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        <tr mat-footer-row *matFooterRowDef="columns" class="total-row"></tr>

        <ng-container matColumnDef="service" stickyEnd>
          <td mat-footer-cell *matFooterCellDef><strong>Total</strong></td>
        </ng-container>
        <ng-container matColumnDef="current">
          <td mat-footer-cell *matFooterCellDef><strong>\${{ totalCurrent | number:'1.0-0' }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="previous">
          <td mat-footer-cell *matFooterCellDef><strong>\${{ totalPrevious | number:'1.0-0' }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="trend">
          <td mat-footer-cell *matFooterCellDef></td>
        </ng-container>
        <ng-container matColumnDef="budget">
          <td mat-footer-cell *matFooterCellDef><strong>\${{ totalBudget | number:'1.0-0' }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="usage">
          <td mat-footer-cell *matFooterCellDef></td>
        </ng-container>
        <ng-container matColumnDef="forecast">
          <td mat-footer-cell *matFooterCellDef><strong>\${{ totalForecast | number:'1.0-0' }}</strong></td>
        </ng-container>
      </table>
    </mat-card>
  `,
  styles: [`
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .table-header { padding: 16px; }
    .table-header h3 { margin: 0; }
    .full-width { width: 100%; }
    .trend-up { color: #c62828; display: flex; align-items: center; gap: 4px; }
    .trend-down { color: #2e7d32; display: flex; align-items: center; gap: 4px; }
    .trend-flat { color: #666; display: flex; align-items: center; gap: 4px; }
    .trend-up mat-icon, .trend-down mat-icon, .trend-flat mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .usage-cell { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .usage-pct { font-size: 13px; color: #666; white-space: nowrap; }
    .forecast-over { color: #c62828; font-weight: 600; }
    .total-row { font-weight: 700; background: #fafafa; }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #444; }
  `],
})
export class CostsComponent {
  private readonly data = inject(PlatformDataService);

  costs = this.data.costMetrics();
  columns = ['service', 'current', 'previous', 'trend', 'budget', 'usage', 'forecast'];

  get totalCurrent(): number { return this.costs.reduce((s, c) => s + c.currentMonth, 0); }
  get totalPrevious(): number { return this.costs.reduce((s, c) => s + c.previousMonth, 0); }
  get totalBudget(): number { return this.costs.reduce((s, c) => s + c.budget, 0); }
  get totalForecast(): number { return this.costs.reduce((s, c) => s + c.forecast, 0); }
  get totalTrend(): number { return +((this.totalCurrent - this.totalPrevious) / this.totalPrevious * 100).toFixed(1); }
  get budgetUsage(): number { return +(this.totalCurrent / this.totalBudget * 100).toFixed(1); }
}
