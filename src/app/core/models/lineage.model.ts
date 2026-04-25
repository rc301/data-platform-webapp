export type LineageEntityType = 'table' | 'job' | 'panel' | 'model';

export interface LineageGraph {
  id: string;
  entityType: LineageEntityType;
  /** Layer (bronze/silver/gold), job type, platform, or framework */
  subType: string;
  entityName: string;
  displayName: string;
  description: string;
  /** Mermaid flowchart LR definition */
  definition: string;
}
