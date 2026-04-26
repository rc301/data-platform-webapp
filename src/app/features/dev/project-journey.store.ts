import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import {
  JourneyTemplateId,
  STAGE_BY_ID,
  getJourneyTemplate,
} from './pipeline-builder/journey-config';

export type ProjectJourneyStatus = 'draft' | 'active' | 'deleted';

export interface ProjectJourney {
  id: string;
  name: string;
  templateId: JourneyTemplateId;
  status: ProjectJourneyStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  importedDemandId?: string;
  importedDemandCode?: string;
  lupCodes: string[];
  currentStage: string;
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectJourneyStore {
  private readonly auth = inject(AuthService);
  private readonly journeysSig = signal<ProjectJourney[]>([]);

  readonly journeys = this.journeysSig.asReadonly();
  readonly activeJourney = computed(() => this.journeysSig().find(journey => journey.status !== 'deleted') ?? null);

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
