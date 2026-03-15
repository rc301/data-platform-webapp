import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { MOCK_RDS_INSTANCES, MOCK_DYNAMO_TABLES, MOCK_GLUE_DATABASES } from '../../../core/mocks/infrastructure.mock';

@Component({
  selector: 'app-databases',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatTabsModule, MatIconModule, MatProgressBarModule, MatChipsModule, MatTooltipModule, StatusBadgeComponent, BytesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-tab-group>
      <!-- RDS -->
      <mat-tab label="RDS Instances">
        <div class="tab-content">
          <div class="db-grid">
            <mat-card *ngFor="let rds of rdsInstances" class="db-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="db-icon">dns</mat-icon>
                <mat-card-title>{{ rds.id }}</mat-card-title>
                <mat-card-subtitle>{{ rds.engine }} {{ rds.engineVersion }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <app-status-badge [status]="rds.status"></app-status-badge>
                <div class="db-stats">
                  <div class="stat-row">
                    <span>Connections</span>
                    <strong>{{ rds.connections }}/{{ rds.maxConnections }}</strong>
                  </div>
                  <mat-progress-bar [value]="(rds.connections / rds.maxConnections) * 100" [color]="rds.connections / rds.maxConnections > 0.8 ? 'warn' : 'primary'"></mat-progress-bar>
                  <div class="stat-row"><span>CPU</span><strong>{{ rds.cpu }}%</strong></div>
                  <mat-progress-bar [value]="rds.cpu" [color]="rds.cpu > 80 ? 'warn' : 'primary'"></mat-progress-bar>
                  <div class="stat-row"><span>Instance</span><strong>{{ rds.instanceClass }}</strong></div>
                  <div class="stat-row"><span>Storage</span><strong>{{ rds.storageGB }} GB</strong></div>
                  <div class="stat-row"><span>Multi-AZ</span><strong>{{ rds.multiAZ ? 'Yes' : 'No' }}</strong></div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </mat-tab>

      <!-- DynamoDB -->
      <mat-tab label="DynamoDB Tables">
        <div class="tab-content">
          <mat-card>
            <table mat-table [dataSource]="dynamoTables" class="full-width">
              <ng-container matColumnDef="tableName">
                <th mat-header-cell *matHeaderCellDef>Table</th>
                <td mat-cell *matCellDef="let t"><strong>{{ t.tableName }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let t"><app-status-badge [status]="t.status"></app-status-badge></td>
              </ng-container>
              <ng-container matColumnDef="items">
                <th mat-header-cell *matHeaderCellDef>Items</th>
                <td mat-cell *matCellDef="let t">{{ t.itemCount | number }}</td>
              </ng-container>
              <ng-container matColumnDef="size">
                <th mat-header-cell *matHeaderCellDef>Size</th>
                <td mat-cell *matCellDef="let t">{{ t.sizeBytes | bytes }}</td>
              </ng-container>
              <ng-container matColumnDef="billing">
                <th mat-header-cell *matHeaderCellDef>Billing</th>
                <td mat-cell *matCellDef="let t"><mat-chip>{{ t.billingMode }}</mat-chip></td>
              </ng-container>
              <ng-container matColumnDef="keys">
                <th mat-header-cell *matHeaderCellDef>Keys</th>
                <td mat-cell *matCellDef="let t"><code>{{ t.partitionKey }}</code><span *ngIf="t.sortKey"> / <code>{{ t.sortKey }}</code></span></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="dynamoColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: dynamoColumns;"></tr>
            </table>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Glue Catalog -->
      <mat-tab label="Glue Catalog">
        <div class="tab-content">
          <div class="db-grid">
            <mat-card *ngFor="let db of glueDatabases" class="db-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="catalog-icon">storage</mat-icon>
                <mat-card-title>{{ db.name }}</mat-card-title>
                <mat-card-subtitle>{{ db.description }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="db-stats">
                  <div class="stat-row"><span>Tables</span><strong>{{ db.tables }}</strong></div>
                  <div class="stat-row"><span>Location</span><strong>{{ db.location }}</strong></div>
                  <div class="stat-row"><span>Owner</span><strong>{{ db.owner }}</strong></div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">Browse Tables</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .db-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .db-card { } .db-icon { background: #e3f2fd !important; color: #1565c0; border-radius: 12px !important; }
    .catalog-icon { background: #f3e5f5 !important; color: #7b1fa2; border-radius: 12px !important; }
    .db-stats { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .stat-row { display: flex; justify-content: space-between; font-size: 14px; }
    .stat-row span { color: #666; }
    .full-width { width: 100%; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    th.mat-mdc-header-cell { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #444; }
  `],
})
export class DatabasesComponent {
  rdsInstances = MOCK_RDS_INSTANCES;
  dynamoTables = MOCK_DYNAMO_TABLES;
  glueDatabases = MOCK_GLUE_DATABASES;
  dynamoColumns = ['tableName', 'status', 'items', 'size', 'billing', 'keys'];
}
