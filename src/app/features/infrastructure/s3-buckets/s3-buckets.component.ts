import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { MOCK_S3_BUCKETS } from '../../../core/mocks/infrastructure.mock';

@Component({
  selector: 'app-s3-buckets',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatTooltipModule, StatusBadgeComponent, BytesPipe, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <div class="table-header">
        <h3>S3 Buckets</h3>
        <span class="count">{{ buckets.length }} buckets · {{ totalSize | bytes }} total</span>
      </div>
      <table mat-table [dataSource]="buckets" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Bucket Name</th>
          <td mat-cell *matCellDef="let b"><strong>{{ b.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="size">
          <th mat-header-cell *matHeaderCellDef>Size</th>
          <td mat-cell *matCellDef="let b">{{ b.sizeBytes | bytes }}</td>
        </ng-container>
        <ng-container matColumnDef="objects">
          <th mat-header-cell *matHeaderCellDef>Objects</th>
          <td mat-cell *matCellDef="let b">{{ b.objectCount | number }}</td>
        </ng-container>
        <ng-container matColumnDef="encryption">
          <th mat-header-cell *matHeaderCellDef>Encryption</th>
          <td mat-cell *matCellDef="let b"><mat-chip>{{ b.encryption }}</mat-chip></td>
        </ng-container>
        <ng-container matColumnDef="versioning">
          <th mat-header-cell *matHeaderCellDef>Versioning</th>
          <td mat-cell *matCellDef="let b">
            <mat-icon [style.color]="b.versioning ? '#2e7d32' : '#999'">{{ b.versioning ? 'check_circle' : 'cancel' }}</mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="lastModified">
          <th mat-header-cell *matHeaderCellDef>Last Modified</th>
          <td mat-cell *matCellDef="let b">{{ b.lastModified | relativeTime }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .table-header h3 { margin: 0; } .count { color: #888; font-size: 14px; }
    .full-width { width: 100%; }
    .clickable-row { cursor: pointer; } .clickable-row:hover { background: rgba(0,0,0,0.04); }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #444; }
  `],
})
export class S3BucketsComponent {
  buckets = MOCK_S3_BUCKETS;
  columns = ['name', 'size', 'objects', 'encryption', 'versioning', 'lastModified'];
  get totalSize(): number { return this.buckets.reduce((sum, b) => sum + b.sizeBytes, 0); }
}
