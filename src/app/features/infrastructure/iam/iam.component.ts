import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { MOCK_IAM_ROLES } from '../../../core/mocks/infrastructure.mock';

@Component({
  selector: 'app-iam',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatExpansionModule, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <div class="table-header">
        <h3>IAM Roles</h3>
        <span class="count">{{ roles.length }} roles</span>
      </div>
      <mat-accordion>
        <mat-expansion-panel *ngFor="let role of roles">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="role-icon">security</mat-icon>
              <strong>{{ role.roleName }}</strong>
            </mat-panel-title>
            <mat-panel-description>
              {{ role.description }}
            </mat-panel-description>
          </mat-expansion-panel-header>
          <div class="role-detail">
            <div class="detail-row"><span class="detail-label">ARN</span><code>{{ role.arn }}</code></div>
            <div class="detail-row"><span class="detail-label">Created</span><span>{{ role.createdAt | relativeTime }}</span></div>
            <div class="detail-row"><span class="detail-label">Last Used</span><span>{{ role.lastUsed ? (role.lastUsed | relativeTime) : 'Never' }}</span></div>
            <div class="detail-row">
              <span class="detail-label">Policies</span>
              <mat-chip-set>
                <mat-chip *ngFor="let p of role.attachedPolicies">{{ p }}</mat-chip>
              </mat-chip-set>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </mat-card>
  `,
  styles: [`
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .table-header h3 { margin: 0; } .count { color: #888; font-size: 14px; }
    .role-icon { margin-right: 8px; color: #1a237e; }
    .role-detail { display: flex; flex-direction: column; gap: 12px; }
    .detail-row { display: flex; align-items: flex-start; gap: 12px; }
    .detail-label { min-width: 100px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; }
    code { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all; }
  `],
})
export class IamComponent {
  roles = MOCK_IAM_ROLES;
}
