/**
 * Journey Stages — barrel.
 * Plugins de etapas. Cada um é autocontido (componente + runtime + tipos).
 * Para registrar um novo plugin:
 *   1. Crie a pasta features/journey-stages/<id>/
 *   2. Implemente <id>-stage.component.ts (opcional, se houver UI)
 *   3. Implemente <id>.runtime.ts exportando o StageRuntime
 *   4. Adicione no provider STAGE_RUNTIMES em app.config.ts
 */
export * from './stage-runtime';
export * from './stage-registry.service';
export * from './action-stage/action-stage.component';
export * from './rfc/rfc-stage.component';
export * from './rfc/rfc-stage.store';
export * from './rfc/rfc.runtime';
