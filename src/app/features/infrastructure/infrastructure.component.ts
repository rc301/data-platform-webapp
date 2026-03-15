import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-infrastructure',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule, MatIconModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Infrastructure" subtitle="AWS resources and services management" icon="cloud"></app-page-header>
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <a mat-tab-link *ngFor="let link of navLinks" [routerLink]="link.path" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">
        <mat-icon class="tab-icon">{{ link.icon }}</mat-icon> {{ link.label }}
      </a>
    </nav>
    <mat-tab-nav-panel #tabPanel>
      <div class="tab-content"><router-outlet></router-outlet></div>
    </mat-tab-nav-panel>
  `,
  styles: [`.tab-icon { margin-right: 8px; } .tab-content { padding-top: 24px; }`],
})
export class InfrastructureComponent {
  navLinks = [
    { path: 'glue-jobs', label: 'Glue Jobs', icon: 'integration_instructions' },
    { path: 'step-functions', label: 'Step Functions', icon: 'device_hub' },
    { path: 's3', label: 'S3 Buckets', icon: 'cloud_queue' },
    { path: 'databases', label: 'Databases', icon: 'storage' },
    { path: 'iam', label: 'IAM Roles', icon: 'security' },
  ];
}
