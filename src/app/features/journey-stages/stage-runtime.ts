import { Type } from '@angular/core';
import { Capability } from '../../core/access/access.types';

/**
 * ============================================================================
 *  Journey Stages — runtime contract
 * ----------------------------------------------------------------------------
 *  Cada etapa de uma jornada (demanda, criar repo, terraform import, deploy, etc.)
 *  é tratada como um plugin que implementa StageRuntime. Templates de jornada
 *  são apenas listas ordenadas de stage IDs — eles não conhecem implementação.
 *
 *  Esta é a fundação para o "journey builder configurável" futuro: plugins
 *  podem ser registrados estaticamente (DI multi-token) ou em runtime via
 *  StageRegistry.register, permitindo que usuários montem suas próprias
 *  jornadas em drag-and-drop.
 * ============================================================================
 */

import type { JourneyStageId } from '../dev/pipeline-builder/journey-config';

/** Política de aprovação para a transição "concluir etapa". */
export type ApprovalPolicy =
  | { kind: 'automatic' }
  | { kind: 'soft';     requiredCapability?: Capability; rationale?: string }
  | { kind: 'hard';     requiredCapability: Capability;  rationale?: string };

/** Razões pelas quais uma etapa pode estar bloqueada. */
export interface StageBlockedReason {
  code: 'missing_dependency' | 'missing_capability' | 'invalid_state' | 'custom';
  message: string;
}

/** Contexto que o orquestrador passa para qualquer etapa. */
export interface StageContext {
  readonly journeyId: string;
  readonly stageId: JourneyStageId;
  /** Snapshot do projeto (ID Projeto, squad, domínio, destino, etc.). */
  readonly project: Record<string, unknown>;
  /** Saídas das etapas anteriores, indexadas por stageId. */
  readonly previousOutputs: Readonly<Record<string, unknown>>;
}

/** Resultado da execução de uma etapa. */
export type StageResult<TOutput = unknown> =
  | { kind: 'success';  output: TOutput }
  | { kind: 'rejected'; reason: string }
  | { kind: 'failed';   error: { code: string; message: string } };

/** Props que o componente de render recebe via @Input. */
export interface StageRenderProps<TConfig = unknown> {
  context: StageContext;
  config?: TConfig;
}

/**
 * Contrato de uma etapa.
 *
 * @typeParam TInput  — payload de entrada da execução
 * @typeParam TOutput — payload de saída
 * @typeParam TConfig — overrides por template (ex.: terraform-import só faz
 *                      sentido em Glue, mas a etapa pode ter knobs por uso)
 */
export interface StageRuntime<TInput = unknown, TOutput = unknown, TConfig = unknown> {
  readonly id: JourneyStageId;

  /**
   * Componente Angular renderizado no painel central. Etapas que são apenas
   * "ações" (sem UI custom) podem omitir e o orquestrador usa o renderer
   * padrão (ActionStageComponent).
   *
   * O tipo `Type<unknown>` é proposital — o orquestrador instancia via
   * `ngComponentOutlet` e injeta `inputs` (StageRenderProps) sem checagem
   * estrutural. Cada plugin é responsável por declarar seus @Input em
   * conformidade com StageRenderProps.
   */
  readonly render?: Type<unknown>;

  /**
   * Pré-condições. Use para sinalizar "demanda só após ID Projeto existir", "deploy
   * prod só após code review aprovado" etc. Retorna `true` quando livre.
   */
  canStart?(ctx: StageContext): true | StageBlockedReason;

  /**
   * Execução real (chamada ao MCP/agente). Idempotente. Quando ausente, o
   * orquestrador trata como etapa puramente humana (apenas aprovação).
   */
  execute?(ctx: StageContext, input: TInput): Promise<StageResult<TOutput>>;

  /** Política de aprovação para "concluir e avançar". */
  readonly approval: ApprovalPolicy;

  /**
   * Eventos que esta etapa emite. O AuditService usa para garantir
   * cobertura mínima de auditoria por etapa.
   */
  readonly auditEvents?: ReadonlyArray<string>;
}
