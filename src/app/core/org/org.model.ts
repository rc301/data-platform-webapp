import { ScopeLevel } from '../access/access.types';
import { FarolStatus } from '../../shared/ui';

export type OrgBranch = 'technology' | 'business';
export type LupType = 'ED' | 'EA';
export type LupStatus = 'draft' | 'in_progress' | 'waiting_approval' | 'in_production' | 'completed' | 'blocked';

export interface OrgUnit {
  id: string;
  name: string;
  level: ScopeLevel;
  branch: OrgBranch;
  parentId?: string;
}

export interface LupProject {
  id: string;
  code: string;
  type: LupType;
  name: string;
  description: string;
  squadId: string;
  owner: string;
  status: LupStatus;
  health: FarolStatus;
  progress: number;
  pipelineCount: number;
  monthlyCost: number;
  updatedAt: string;
  linkedProjectIds: string[];
}

export type LupProjectDraft = Omit<LupProject, 'id' | 'updatedAt'> & {
  id?: string;
  updatedAt?: string;
};
