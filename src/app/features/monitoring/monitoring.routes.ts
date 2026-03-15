import { Routes } from '@angular/router';
import { MonitoringComponent } from './monitoring.component';
import { AlertsComponent } from './alerts/alerts.component';
import { CostsComponent } from './costs/costs.component';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    component: MonitoringComponent,
    children: [
      { path: '', redirectTo: 'alerts', pathMatch: 'full' },
      { path: 'alerts', component: AlertsComponent },
      { path: 'costs', component: CostsComponent },
    ],
  },
];
