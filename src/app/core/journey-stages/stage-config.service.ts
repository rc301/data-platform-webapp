import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditService } from '../audit/audit.service';
import {
  JOURNEY_TEMPLATES,
  JourneyStageId,
  STAGE_CATALOG,
  StageDefinition,
} from '../../features/dev/pipeline-builder/journey-config';

/**
 * Configuração do catálogo de etapas mantido pelo Admin.
 *
 * O `StageRegistry` (em features/journey-stages) carrega os PLUGINS
 * (componentes Angular registrados via DI). Este serviço guarda, à parte,
 * dois eixos editáveis pelo admin:
 *
 *   • `enabled`   — sinaliza se a etapa pode ser usada em novos templates.
 *                   Templates existentes que já a referenciam continuam
 *                   funcionando; o wizard pode mostrar aviso.
 *   • `overrides` — alterações pontuais de metadados (title/description/
 *                   approvalGate) sem precisar editar o STAGE_CATALOG.
 *
 * `effective(id)` retorna a definição com overrides aplicados.
 *
 * Nota arquitetural: separamos "registro de plugin" (DI multi-token) de
 * "configuração editável" (este service) porque eles têm ciclos de vida
 * diferentes — plugins vêm com o build; config vem do banco.
 */
export type StageOverrides = Partial<Pick<StageDefinition, 'title' | 'description' | 'approvalGate'>>;

export interface StageConfigEntry {
  enabled: boolean;
  overrides?: StageOverrides;
}

@Injectable({ providedIn: 'root' })
export class StageConfigService {
  private readonly audit = inject(AuditService);

  /** Map id → config; id ausente = `{ enabled: true, overrides: undefined }`. */
  private readonly configSig = signal<Map<JourneyStageId, StageConfigEntry>>(new Map());

  /** Ids de stages que aparecem em pelo menos um template — usado pela UI. */
  readonly stageUsage = computed(() => {
    const usage = new Map<JourneyStageId, string[]>();
    for (const template of JOURNEY_TEMPLATES) {
      for (const stageId of template.stageIds) {
        const list = usage.get(stageId) ?? [];
        list.push(template.id);
        usage.set(stageId, list);
      }
    }
    return usage;
  });

  isEnabled(id: JourneyStageId): boolean {
    return this.configSig().get(id)?.enabled ?? true;
  }

  overridesFor(id: JourneyStageId): StageOverrides | undefined {
    return this.configSig().get(id)?.overrides;
  }

  /** Definição efetiva (catálogo + overrides). */
  effective(id: JourneyStageId): StageDefinition {
    const base = STAGE_CATALOG[id];
    const overrides = this.overridesFor(id);
    return overrides ? { ...base, ...overrides } : base;
  }

  setEnabled(id: JourneyStageId, enabled: boolean): void {
    const next = new Map(this.configSig());
    const current = next.get(id) ?? { enabled: true };
    next.set(id, { ...current, enabled });
    this.configSig.set(next);
    this.audit.record('stage.config.toggled', {
      resourceType: 'stage', resourceId: id, metadata: { enabled },
    });
  }

  setOverrides(id: JourneyStageId, overrides: StageOverrides | undefined): void {
    const next = new Map(this.configSig());
    const current = next.get(id) ?? { enabled: true };
    next.set(id, { ...current, overrides });
    this.configSig.set(next);
    this.audit.record('stage.config.updated', { resourceType: 'stage', resourceId: id });
  }

  resetStage(id: JourneyStageId): void {
    const next = new Map(this.configSig());
    next.delete(id);
    this.configSig.set(next);
    this.audit.record('stage.config.reset', { resourceType: 'stage', resourceId: id });
  }
}
