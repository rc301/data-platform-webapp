import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import type { JourneyStageId } from '../dev/pipeline-builder/journey-config';
import { StageRuntime } from './stage-runtime';

/**
 * Multi-token para registro estático de plugins via providers.
 * Em app.config.ts:
 *   { provide: STAGE_RUNTIMES, useValue: rfcStageRuntime, multi: true }
 */
export const STAGE_RUNTIMES = new InjectionToken<StageRuntime[]>('journey.stage-runtimes');

@Injectable({ providedIn: 'root' })
export class StageRegistry {
  private readonly impls = new Map<JourneyStageId, StageRuntime>();

  constructor(@Optional() @Inject(STAGE_RUNTIMES) seed: StageRuntime[] | null) {
    (seed ?? []).forEach(runtime => this.register(runtime));
  }

  /** Registro em runtime — usado pelo futuro journey builder customizável. */
  register(runtime: StageRuntime): void {
    this.impls.set(runtime.id, runtime);
  }

  get(id: JourneyStageId): StageRuntime | undefined {
    return this.impls.get(id);
  }

  has(id: JourneyStageId): boolean {
    return this.impls.has(id);
  }

  /** Lista todos os runtimes — base para a UI de drag-and-drop futura. */
  list(): readonly StageRuntime[] {
    return Array.from(this.impls.values());
  }
}
