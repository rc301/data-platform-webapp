import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule, MatIconModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Monitoramento" subtitle="Alertas operacionais e custos discriminados por execução de pipeline" icon="monitoring"></app-page-header>
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
export class MonitoringComponent {
  navLinks = [
    { path: 'alerts', label: 'Alertas', icon: 'notifications_active' },
    { path: 'costs', label: 'Custos de Execução', icon: 'attach_money' },
  ];
}
