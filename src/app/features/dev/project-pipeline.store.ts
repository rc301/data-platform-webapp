import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { JourneyTemplateId } from './pipeline-builder/journey-config';

export type ProjectPipelineStatus = 'draft' | 'active' | 'deleted';

export interface ProjectPipelineJourney {
  id: string;
  name: string;
  templateId: JourneyTemplateId;
  status: ProjectPipelineStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  currentStage: string;
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectPipelineStore {
  private readonly auth = inject(AuthService);
  private readonly journeysSig = signal<ProjectPipelineJourney[]>([]);

  readonly journeys = this.journeysSig.asReadonly();
  readonly activeJourney = computed(() => this.journeysSig().find(journey => journey.status !== 'deleted') ?? null);

  create(templateId: JourneyTemplateId): ProjectPipelineJourney {
    const now = new Date().toISOString();
    const user = this.auth.user();
    const journey: ProjectPipelineJourney = {
      id: `project-pipeline-${Date.now()}`,
      name: templateId === 'glue-pyspark' ? 'customer_360' : 'customer_360_sql',
      templateId,
      status: 'active',
      createdAt: now,
      createdBy: user?.name ?? 'Usuário mock',
      updatedAt: now,
      currentStage: 'Infra inicial',
      progress: 27,
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
}
