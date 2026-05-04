import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-s3-buckets',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, StatusBadgeComponent, BytesPipe, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <div class="table-header">
        <h3>S3 Buckets</h3>
        <span class="count">{{ buckets.length }} buckets · {{ totalSize | bytes }} total</span>
      </div>
      <table mat-table [dataSource]="buckets" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nome do Bucket</th>
          <td mat-cell *matCellDef="let b"><strong>{{ b.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="size">
          <th mat-header-cell *matHeaderCellDef>Tamanho</th>
          <td mat-cell *matCellDef="let b">{{ b.sizeBytes | bytes }}</td>
        </ng-container>
        <ng-container matColumnDef="objects">
          <th mat-header-cell *matHeaderCellDef>Objetos</th>
          <td mat-cell *matCellDef="let b">{{ b.objectCount | number }}</td>
        </ng-container>
        <ng-container matColumnDef="encryption">
          <th mat-header-cell *matHeaderCellDef>Criptografia</th>
          <td mat-cell *matCellDef="let b"><mat-chip>{{ b.encryption }}</mat-chip></td>
        </ng-container>
        <ng-container matColumnDef="versioning">
          <th mat-header-cell *matHeaderCellDef>Versionamento</th>
          <td mat-cell *matCellDef="let b">
            <mat-icon [class.icon-ok]="b.versioning" [class.icon-muted]="!b.versioning">{{ b.versioning ? 'check_circle' : 'cancel' }}</mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="lastModified">
          <th mat-header-cell *matHeaderCellDef>Última Modificação</th>
          <td mat-cell *matCellDef="let b">{{ b.lastModified | relativeTime }}</td>
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
    .icon-ok { color: var(--success-500); }
    .icon-muted { color: var(--text-muted); }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--text-secondary); }
  `],
})
export class S3BucketsComponent {
  private readonly data = inject(PlatformDataService);

  buckets = this.data.s3Buckets();
  columns = ['name', 'size', 'objects', 'encryption', 'versioning', 'lastModified'];
  get totalSize(): number { return this.buckets.reduce((sum, b) => sum + b.sizeBytes, 0); }
}
