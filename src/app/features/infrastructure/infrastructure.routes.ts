import { Routes } from '@angular/router';
import { InfrastructureComponent } from './infrastructure.component';
import { GlueJobsComponent } from './glue-jobs/glue-jobs.component';
import { StepFunctionsComponent } from './step-functions/step-functions.component';
import { S3BucketsComponent } from './s3-buckets/s3-buckets.component';

export const INFRASTRUCTURE_ROUTES: Routes = [
  {
    path: '',
    component: InfrastructureComponent,
    children: [
      { path: '', redirectTo: 'glue-jobs', pathMatch: 'full' },
      { path: 'glue-jobs', component: GlueJobsComponent },
      { path: 'step-functions', component: StepFunctionsComponent },
      { path: 's3', component: S3BucketsComponent },
    ],
  },
];
