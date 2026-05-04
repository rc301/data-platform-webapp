export type LineageEntityType = 'table' | 'job' | 'panel' | 'model';
export type LineageRegistrationSource = 'automatic' | 'manual';

export interface LineageGraph {
  id: string;
  entityType: LineageEntityType;
  pipelineId?: string;
  registrationSource?: LineageRegistrationSource;
  /** Layer (bronze/silver/gold), job type, platform, or framework */
  subType: string;
  entityName: string;
  displayName: string;
  description: string;
  /** Mermaid flowchart LR definition */
  definition: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
