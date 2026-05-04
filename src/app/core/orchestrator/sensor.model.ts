/**
 * Domínio do Orquestrador — Sensores e vínculos M:N.
 *
 *   Sensor (CRUD):
 *     • Query SQL que verifica se uma tabela origem foi atualizada.
 *     • Roda em frequência fixa (default 15 min).
 *     • Tem dono (squad), threshold de freshness (em minutos) e SLA opcional.
 *
 *   PipelineSensorBinding (CRUD):
 *     • Vincula uma pipeline (pipelineId) a N sensors (sensorIds).
 *     • Define como reagir em falha (alertar / parar / seguir).
 *     • Define o timeout máximo de espera por origem.
 *
 *   SensorState:
 *     • Snapshot da última execução do sensor — derivado em runtime.
 *     • Não persistimos no mesmo aggregate do Sensor para refletir o real:
 *       no backend a query de status virá do CloudWatch / Step Functions,
 *       não do mesmo banco de cadastro.
 */

export type SensorStatus = 'green' | 'yellow' | 'red' | 'gray';
export type FailureAction = 'alert' | 'stop' | 'proceed';

export interface Sensor {
  id: string;
  name: string;
  description?: string;
  /** Tabela que o sensor vigia, em forma canônica. */
  sourceQualifiedName: string;
  /** Query SQL executada periodicamente. Apenas SELECT. */
  query: string;
  /** Periodicidade em minutos. */
  intervalMinutes: number;
  /** Quanto tempo o resultado deve permanecer "fresco" antes de virar stale. */
  freshnessThresholdMinutes: number;
  /** Squad responsável pela manutenção. */
  ownerSquadId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SensorState {
  sensorId: Sensor['id'];
  status: SensorStatus;
  /** ISO da última execução com sucesso. */
  lastRunAt?: string;
  /** Resultado lógico da query: 1 liberou a origem; 0 ainda não liberou. */
  lastResult?: 0 | 1;
  /** Latência observada (ms). */
  lastLatencyMs?: number;
  /** Próxima execução prevista. */
  nextRunAt?: string;
  /** Mensagem de erro caso `status === 'red'`. */
  errorMessage?: string;
}

export interface PipelineSensorBinding {
  pipelineId: string;
  pipelineName: string;
  sensorIds: ReadonlyArray<Sensor['id']>;
  failureAction: FailureAction;
  /** Tempo máximo (em minutos) que o pipeline aguarda os sensors antes de
   *  acionar a `failureAction`. */
  maxWaitMinutes: number;
  updatedAt: string;
  updatedBy: string;
}

/** Snapshot derivado: pipeline esperando o sensor X liberar. */
export interface PipelineWaitingItem {
  pipelineId: string;
  pipelineName: string;
  waitingSensorId: Sensor['id'];
  waitingSensorName: string;
  waitingSourceTable: string;
  waitingForMinutes: number;
  slaMinutes?: number;
}

export interface SensorDraft {
  name: string;
  description?: string;
  sourceQualifiedName: string;
  query: string;
  intervalMinutes: number;
  freshnessThresholdMinutes: number;
  ownerSquadId: string;
  enabled?: boolean;
}

export interface PipelineSensorBindingDraft {
  pipelineId: string;
  pipelineName: string;
  sensorIds: ReadonlyArray<Sensor['id']>;
  failureAction: FailureAction;
  maxWaitMinutes: number;
}
