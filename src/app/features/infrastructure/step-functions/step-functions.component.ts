import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-step-functions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, StatusBadgeComponent, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <div class="table-header">
        <h3>Step Functions</h3>
        <span class="count">{{ stepFunctions.length }} máquinas de estado</span>
      </div>
      <table mat-table [dataSource]="stepFunctions" class="full-width">
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let sf"><app-status-badge [status]="sf.status"></app-status-badge></td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nome</th>
          <td mat-cell *matCellDef="let sf"><strong>{{ sf.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="lastExecution">
          <th mat-header-cell *matHeaderCellDef>Última Execução</th>
          <td mat-cell *matCellDef="let sf">
            <app-status-badge [status]="sf.lastExecution.status"></app-status-badge>
            <span class="exec-time">{{ sf.lastExecution.startDate | relativeTime }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="owner">
          <th mat-header-cell *matHeaderCellDef>Responsável</th>
          <td mat-cell *matCellDef="let sf">{{ sf.owner }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .table-header h3 { margin: 0; } .count { color: var(--text-muted); font-size: 14px; }
    .full-width { width: 100%; }
    .exec-time { margin-left: 8px; font-size: 13px; color: var(--text-muted); }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--text-secondary); }
  `],
})
export class StepFunctionsComponent {
  private readonly data = inject(PlatformDataService);

  stepFunctions = this.data.stepFunctions();
  columns = ['status', 'name', 'lastExecution', 'owner'];
}
