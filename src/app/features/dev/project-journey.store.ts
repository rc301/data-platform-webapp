import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import {
  JourneyTemplateId,
  STAGE_BY_ID,
  getJourneyTemplate,
} from './pipeline-builder/journey-config';
import { PROJECT_JOURNEYS_SEED } from './project-journey.mock';

export type ProjectJourneyStatus = 'draft' | 'active' | 'completed' | 'deleted';

export interface ProjectJourney {
  id: string;
  /** Nome de produto / pipeline. Curto e estável (vai virar slug). */
  name: string;
  /** Template usado: glue-pyspark ou sql-only. */
  templateId: JourneyTemplateId;
  status: ProjectJourneyStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  importedDemandId?: string;
  importedDemandCode?: string;
  /** IDs Projeto vinculados (ex.: ED2741, EA1180). */
  lupCodes: string[];
  /** Tabela final / nome lógico do produto de dados (ex: gold.customer_360). */
  targetTable?: string;
  /** Responsável atual pela jornada (ex.: tech lead da squad). */
  responsible?: string;
  /** Squad da jornada — mostrado em consultas de gestão. */
  squadId?: string;
  /** Domínio funcional (ex.: Comercial, Financeiro). */
  domain?: string;
  currentStage: string;
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectJourneyStore {
  private readonly auth = inject(AuthService);
  private readonly journeysSig = signal<ProjectJourney[]>([...PROJECT_JOURNEYS_SEED]);

  readonly journeys = this.journeysSig.asReadonly();
  readonly activeJourney = computed(() => this.journeysSig().find(journey => journey.status === 'active' || journey.status === 'draft') ?? null);
  readonly mineActive = computed(() => {
    const me = this.auth.user()?.name;
    return this.journeysSig().filter(j => j.status === 'active' && (j.createdBy === me || j.responsible === me));
  });
  readonly mineCompleted = computed(() => {
    const me = this.auth.user()?.name;
    return this.journeysSig().filter(j => j.status === 'completed' && (j.createdBy === me || j.responsible === me));
  });

  create(templateId: JourneyTemplateId): ProjectJourney {
    const now = new Date().toISOString();
    const user = this.auth.user();
    // Toda jornada nasce zerada — nenhuma etapa concluída.
    // O primeiro stage do template é o ponto de entrada do usuário.
    const firstStageId = getJourneyTemplate(templateId).stageIds[0];
    const journey: ProjectJourney = {
      id: `project-journey-${Date.now()}`,
      name: templateId === 'glue-pyspark' ? 'customer_360' : 'customer_360_sql',
      templateId,
      status: 'active',
      createdAt: now,
      createdBy: user?.name ?? 'Usuário mock',
      updatedAt: now,
      lupCodes: [],
      currentStage: STAGE_BY_ID[firstStageId].title,
      progress: 0,
    };
    this.journeysSig.update(journeys => [journey, ...journeys]);
    return journey;
  }

  markDeleted(id: string): void {
    const now = new Date().toISOString();
    const user = this.auth.user();
    this.journeysSig.update(journeys => journeys.map(journey => {
      if (journey.id !== id) return journey;
      return {
        ...journey,
        status: 'deleted',
        updatedAt: now,
        deletedAt: now,
        deletedBy: user?.name ?? 'Usuário mock',
      };
    }));
  }

  importDemand(id: string, demandId: string, demandCode: string): void {
    const now = new Date().toISOString();
    this.journeysSig.update(journeys => journeys.map(journey => journey.id === id ? {
      ...journey,
      importedDemandId: demandId,
      importedDemandCode: demandCode,
      updatedAt: now,
    } : journey));
  }

  setLupCodes(id: string, lupCodes: string[]): void {
    const now = new Date().toISOString();
    this.journeysSig.update(journeys => journeys.map(journey => journey.id === id ? {
      ...journey,
      lupCodes,
      updatedAt: now,
    } : journey));
  }
}
