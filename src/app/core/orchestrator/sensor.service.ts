import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../services/auth.service';
import { PIPELINE_BINDINGS, SENSORS, SENSOR_STATES, WAITING_PIPELINES } from './sensor.mock';
import {
  PipelineSensorBinding,
  PipelineSensorBindingDraft,
  PipelineWaitingItem,
  Sensor,
  SensorDraft,
  SensorState,
} from './sensor.model';

/**
 * Service do Orquestrador.
 *
 * Mantém quatro coleções:
 *   • sensors  — definição (CRUD)
 *   • states   — runtime / saúde (somente leitura aqui; backend é a fonte)
 *   • bindings — vínculos M:N pipeline ↔ sensors
 *   • waiting  — pipelines em fila esperando origens (derivado em runtime)
 *
 * O service não atualiza `states` — esses dados viriam do backend / CloudWatch.
 * No mock, os dados são fixos; UI consulta via `state(id)`.
 */
@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly audit = inject(AuditService);
  private readonly auth = inject(AuthService);

  private readonly sensorsSig  = signal<Sensor[]>(SENSORS);
  private readonly statesSig   = signal<SensorState[]>(SENSOR_STATES);
  private readonly bindingsSig = signal<PipelineSensorBinding[]>(PIPELINE_BINDINGS);
  private readonly waitingSig  = signal<PipelineWaitingItem[]>(WAITING_PIPELINES);

  readonly sensors  = this.sensorsSig.asReadonly();
  readonly states   = this.statesSig.asReadonly();
  readonly bindings = this.bindingsSig.asReadonly();
  readonly waiting  = this.waitingSig.asReadonly();

  /** Estado de um sensor por id, ou um placeholder cinza. */
  readonly state = (id: Sensor['id']) =>
    this.statesSig().find(s => s.sensorId === id) ?? { sensorId: id, status: 'gray' as const };

  /** Resumo dos faróis (verde/amarelo/vermelho/cinza) — usado nos KPIs. */
  readonly healthSummary = computed(() => {
    const counts = { green: 0, yellow: 0, red: 0, gray: 0 };
    for (const sensor of this.sensorsSig()) {
      counts[this.state(sensor.id).status] += 1;
    }
    return counts;
  });

  /* ============================================================
     Sensor — CRUD
     ============================================================ */
  createSensor(draft: SensorDraft): Sensor {
    const now = new Date().toISOString();
    const sensor: Sensor = {
      id: `sens-${slug(draft.name)}-${shortRand()}`,
      name: draft.name.trim(),
      description: draft.description?.trim(),
      sourceQualifiedName: draft.sourceQualifiedName.trim(),
      query: draft.query.trim(),
      intervalMinutes: Math.max(1, draft.intervalMinutes),
      freshnessThresholdMinutes: Math.max(1, draft.freshnessThresholdMinutes),
      ownerSquadId: draft.ownerSquadId,
      enabled: draft.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    if (this.hasDuplicateQuery(sensor.query)) return this.sensorsSig().find(s => normalizeSql(s.query) === normalizeSql(sensor.query)) ?? sensor;
    this.sensorsSig.update(items => [sensor, ...items]);
    this.audit.record('orchestrator.sensor.created', {
      resourceType: 'sensor', resourceId: sensor.id,
      metadata: { source: sensor.sourceQualifiedName },
    });
    return sensor;
  }

  updateSensor(id: Sensor['id'], draft: SensorDraft): Sensor | null {
    const existing = this.sensorsSig().find(s => s.id === id);
    if (!existing) return null;
    const next: Sensor = {
      ...existing,
      ...draft,
      name: draft.name.trim(),
      sourceQualifiedName: draft.sourceQualifiedName.trim(),
      query: draft.query.trim(),
      enabled: draft.enabled ?? existing.enabled,
      updatedAt: new Date().toISOString(),
    };
    if (this.hasDuplicateQuery(next.query, id)) return existing;
    this.sensorsSig.update(items => items.map(s => s.id === id ? next : s));
    this.audit.record('orchestrator.sensor.updated', { resourceType: 'sensor', resourceId: id });
    return next;
  }

  toggleSensor(id: Sensor['id']): void {
    const existing = this.sensorsSig().find(s => s.id === id);
    if (!existing) return;
    const next: Sensor = { ...existing, enabled: !existing.enabled, updatedAt: new Date().toISOString() };
    this.sensorsSig.update(items => items.map(s => s.id === id ? next : s));
    this.audit.record('orchestrator.sensor.updated', { resourceType: 'sensor', resourceId: id, metadata: { enabled: next.enabled } });
  }

  /* ============================================================
     PipelineSensorBinding — CRUD
     ============================================================ */
  upsertBinding(draft: PipelineSensorBindingDraft): PipelineSensorBinding {
    const now = new Date().toISOString();
    const next: PipelineSensorBinding = { ...draft, updatedAt: now, updatedBy: this.currentUser() };

    this.bindingsSig.update(items => {
      const idx = items.findIndex(b => b.pipelineId === draft.pipelineId);
      if (idx === -1) return [next, ...items];
      const copy = items.slice();
      copy[idx] = next;
      return copy;
    });

    this.audit.record('orchestrator.binding.upserted', {
      resourceType: 'pipeline-sensor-binding',
      resourceId: draft.pipelineId,
      metadata: { sensors: draft.sensorIds.length },
    });
    return next;
  }

  removeBinding(pipelineId: PipelineSensorBinding['pipelineId']): void {
    this.bindingsSig.update(items => items.filter(b => b.pipelineId !== pipelineId));
    this.audit.record('orchestrator.binding.removed', { resourceType: 'pipeline-sensor-binding', resourceId: pipelineId });
  }

  bindingFor(pipelineId: string): PipelineSensorBinding | undefined {
    return this.bindingsSig().find(b => b.pipelineId === pipelineId);
  }

  private currentUser(): string {
    const user = this.auth.user();
    return user?.userPrincipal ?? user?.name ?? 'mock.user';
  }

  private hasDuplicateQuery(query: string, exceptId?: string): boolean {
    const normalized = normalizeSql(query);
    return this.sensorsSig().some(sensor => sensor.id !== exceptId && normalizeSql(sensor.query) === normalized);
  }
}

/* ============================================================
   Helpers locais — mantêm o service sem libs externas.
   ============================================================ */
function slug(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'sensor';
}
function shortRand(): string { return Math.random().toString(36).slice(2, 6); }
function normalizeSql(value: string): string { return value.replace(/\s+/g, ' ').trim().toLowerCase(); }
