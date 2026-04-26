import { FarolStatus } from '../../shared/ui';

export interface JobRow {
  id: string;
  name: string;
  squad: string;
  type: 'GlueJob' | 'StepFunction' | 'CDP' | 'Phoenix' | 'Munin' | 'Outros';
  expectedStartLocal: string;
  slaDeadlineLocal: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  status: FarolStatus;
  notes?: string;
}
