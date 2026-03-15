import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatListModule, MatBadgeModule, MatMenuModule, MatTooltipModule, MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav [mode]="sidenavMode()" [opened]="sidenavOpened()" class="app-sidenav" [class.collapsed]="collapsed()">
        <div class="sidenav-header">
          <div class="logo" *ngIf="!collapsed()">
            <mat-icon class="logo-icon">hub</mat-icon>
            <div class="logo-text">
              <span class="logo-title">DataPlatform</span>
              <span class="logo-subtitle">Management Console</span>
            </div>
          </div>
          <div class="logo-mini" *ngIf="collapsed()">
            <mat-icon class="logo-icon">hub</mat-icon>
          </div>
          <button mat-icon-button (click)="toggleCollapse()" class="collapse-btn" *ngIf="sidenavMode() === 'side'">
            <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <div class="sidenav-content">
          <ng-container *ngFor="let group of navGroups">
            <div class="nav-group-title" *ngIf="!collapsed()">{{ group.title }}</div>
            <mat-divider *ngIf="collapsed()"></mat-divider>
            <mat-nav-list dense>
              <a mat-list-item *ngFor="let item of group.items"
                 [routerLink]="item.route"
                 routerLinkActive="active-link"
                 [matTooltip]="collapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <mat-icon matListItemIcon [matBadge]="item.badge" [matBadgeHidden]="!item.badge" matBadgeColor="warn" matBadgeSize="small">{{ item.icon }}</mat-icon>
                <span matListItemTitle *ngIf="!collapsed()">{{ item.label }}</span>
              </a>
            </mat-nav-list>
          </ng-container>
        </div>

        <div class="sidenav-footer" *ngIf="!collapsed()">
          <mat-divider></mat-divider>
          <div class="env-badge">
            <mat-icon>cloud</mat-icon>
            <span>LOCAL DEV</span>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="app-content">
        <mat-toolbar class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" *ngIf="sidenavMode() === 'over'">
            <mat-icon>menu</mat-icon>
          </button>

          <span class="toolbar-spacer"></span>

          <button mat-icon-button matTooltip="Notifications" [matMenuTriggerFor]="notifMenu">
            <mat-icon matBadge="3" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
          </button>

          <mat-menu #notifMenu="matMenu" class="notif-menu">
            <div class="notif-header" mat-menu-item disabled>
              <strong>Notifications</strong>
            </div>
            <button mat-menu-item>
              <mat-icon color="warn">error</mat-icon>
              <span>Pipeline ingestion_orders failed</span>
            </button>
            <button mat-menu-item>
              <mat-icon class="text-orange">warning</mat-icon>
              <span>Data quality below threshold</span>
            </button>
            <button mat-menu-item>
              <mat-icon color="primary">info</mat-icon>
              <span>RDS connections near limit</span>
            </button>
          </mat-menu>

          <button mat-icon-button matTooltip="Help" [matMenuTriggerFor]="helpMenu">
            <mat-icon>help_outline</mat-icon>
          </button>

          <mat-menu #helpMenu="matMenu">
            <button mat-menu-item><mat-icon>description</mat-icon> Documentation</button>
            <button mat-menu-item><mat-icon>open_in_new</mat-icon> Atlan Catalog</button>
            <button mat-menu-item><mat-icon>support</mat-icon> Support</button>
          </mat-menu>

          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <mat-icon>account_circle</mat-icon>
            <span class="user-name">{{ auth.user()?.name }}</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <div class="user-info" mat-menu-item disabled>
              <div><strong>{{ auth.user()?.name }}</strong></div>
              <div class="user-role">{{ auth.user()?.role | titlecase }} · {{ auth.user()?.team }}</div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item><mat-icon>settings</mat-icon> Settings</button>
            <button mat-menu-item (click)="auth.logout()"><mat-icon>logout</mat-icon> Logout</button>
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }

    .app-sidenav {
      width: 260px;
      border-right: 1px solid #e0e0e0;
      background: #fafafa;
      transition: width 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .app-sidenav.collapsed { width: 68px; }

    .sidenav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      min-height: 64px;
    }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { color: #1a237e; font-size: 28px; width: 28px; height: 28px; }
    .logo-text { display: flex; flex-direction: column; }
    .logo-title { font-size: 16px; font-weight: 700; color: #1a237e; line-height: 1.2; }
    .logo-subtitle { font-size: 11px; color: #666; letter-spacing: 0.5px; }
    .logo-mini { display: flex; align-items: center; justify-content: center; width: 100%; }
    .collapse-btn { opacity: 0.6; }
    .collapse-btn:hover { opacity: 1; }

    .sidenav-content { flex: 1; overflow-y: auto; padding: 0 8px; }
    .nav-group-title {
      padding: 16px 16px 4px;
      font-size: 11px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .active-link { background: rgba(26, 35, 126, 0.08) !important; color: #1a237e !important; border-radius: 8px; }
    .active-link mat-icon { color: #1a237e; }

    ::ng-deep .mat-mdc-list-item { border-radius: 8px; margin: 2px 0; }

    .sidenav-footer { padding: 12px 16px; }
    .env-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; border-radius: 6px;
      background: #e8f5e9; color: #2e7d32;
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
    }
    .env-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .app-toolbar {
      background: white;
      color: #333;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .toolbar-spacer { flex: 1; }
    .user-btn { text-transform: none; }
    .user-name { margin: 0 4px; font-size: 14px; }
    .user-info { line-height: 1.4; }
    .user-role { font-size: 12px; color: #888; }
    .text-orange { color: #e65100 !important; }

    .main-content { padding: 24px; background: #f5f5f5; min-height: calc(100vh - 64px); }

    @media (max-width: 768px) {
      .user-name { display: none; }
    }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);
  collapsed = signal(false);
  sidenavOpened = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');

  navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
        { icon: 'notifications_active', label: 'Alerts', route: '/monitoring/alerts', badge: 3 },
      ]
    },
    {
      title: 'Data Management',
      items: [
        { icon: 'account_tree', label: 'Pipelines', route: '/pipelines' },
        { icon: 'verified', label: 'Data Quality', route: '/data-quality' },
        { icon: 'menu_book', label: 'Data Catalog', route: '/catalog' },
      ]
    },
    {
      title: 'Infrastructure',
      items: [
        { icon: 'integration_instructions', label: 'Glue Jobs', route: '/infrastructure/glue-jobs' },
        { icon: 'device_hub', label: 'Step Functions', route: '/infrastructure/step-functions' },
        { icon: 'cloud_queue', label: 'S3 Buckets', route: '/infrastructure/s3' },
        { icon: 'storage', label: 'Databases', route: '/infrastructure/databases' },
        { icon: 'security', label: 'IAM Roles', route: '/infrastructure/iam' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { icon: 'monitoring', label: 'Monitoring', route: '/monitoring' },
        { icon: 'attach_money', label: 'Cost Explorer', route: '/monitoring/costs' },
      ]
    },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }
}
