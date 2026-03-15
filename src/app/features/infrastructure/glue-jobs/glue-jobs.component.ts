import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { MOCK_GLUE_JOBS } from '../../../core/mocks/infrastructure.mock';

@Component({
  selector: 'app-glue-jobs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatSortModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule, StatusBadgeComponent, RelativeTimePipe, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <div class="table-header">
        <h3>AWS Glue Jobs</h3>
        <span class="count">{{ jobs.length }} jobs</span>
      </div>
      <table mat-table [dataSource]="jobs" matSort class="full-width">
        <ng-container matColumnDef="state">
          <th mat-header-cell *matHeaderCellDef>State</th>
          <td mat-cell *matCellDef="let j"><app-status-badge [status]="j.state"></app-status-badge></td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let j"><strong>{{ j.name }}</strong><br><span class="desc">{{ j.description }}</span></td>
        </ng-container>
        <ng-container matColumnDef="database">
          <th mat-header-cell *matHeaderCellDef>Database</th>
          <td mat-cell *matCellDef="let j"><code>{{ j.database }}</code></td>
        </ng-container>
        <ng-container matColumnDef="workerType">
          <th mat-header-cell *matHeaderCellDef>Workers</th>
          <td mat-cell *matCellDef="let j">{{ j.numberOfWorkers }}x {{ j.workerType }}</td>
        </ng-container>
        <ng-container matColumnDef="avgDuration">
          <th mat-header-cell *matHeaderCellDef>Avg Duration</th>
          <td mat-cell *matCellDef="let j">{{ j.avgDuration | duration }}</td>
        </ng-container>
        <ng-container matColumnDef="lastRun">
          <th mat-header-cell *matHeaderCellDef>Last Run</th>
          <td mat-cell *matCellDef="let j">{{ j.lastRun | relativeTime }}</td>
        </ng-container>
        <ng-container matColumnDef="schedule">
          <th mat-header-cell *matHeaderCellDef>Schedule</th>
          <td mat-cell *matCellDef="let j">{{ j.schedule || '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let j">
            <button mat-icon-button matTooltip="Run now"><mat-icon>play_arrow</mat-icon></button>
            <button mat-icon-button matTooltip="View logs"><mat-icon>description</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .table-header h3 { margin: 0; }
    .count { color: #888; font-size: 14px; }
    .full-width { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }
    .desc { font-size: 12px; color: #888; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #444; }
  `],
})
export class GlueJobsComponent {
  jobs = MOCK_GLUE_JOBS;
  columns = ['state', 'name', 'database', 'workerType', 'avgDuration', 'lastRun', 'schedule', 'actions'];
}
