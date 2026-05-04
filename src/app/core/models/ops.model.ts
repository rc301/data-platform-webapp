import { FarolStatus } from '../../shared/ui';

/**
 * Cadência de execução do job. Apenas `daily` participa da tela de
 * "Andamento diário" (curva acumulada de finalizações).
 */
export type JobCadence = 'daily' | 'hourly' | 'weekly' | 'on-demand';

export interface JobRow {
  id: string;
  name: string;
  squad: string;
  type: 'GlueJob' | 'StepFunction' | 'CDP' | 'Phoenix' | 'Munin' | 'Outros';
  /** Cadência de execução. Default `daily` quando ausente. */
  cadence?: JobCadence;
  expectedStartLocal: string;
  slaDeadlineLocal: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  status: FarolStatus;
  notes?: string;
  /**
   * Horas (HH:MM, fuso local) em que o job finalizou COM SUCESSO em cada
   * um dos últimos 7 dias. Posições podem ser `undefined` quando o job
   * não rodou no dia. Base para a curva esperada da tela de andamento.
   */
  last7DaysFinishTimes?: ReadonlyArray<string | undefined>;
  /**
   * Hora local (HH:MM) em que o job finalizou COM SUCESSO hoje.
   * Vazio = ainda não finalizou. Em backend real, virá derivado do
   * último run com status 'success' do dia corrente.
   */
  todayFinishedAt?: string;
}
