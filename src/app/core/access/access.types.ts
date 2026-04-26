export type Role =
  | 'public-viewer'
  | 'developer'
  | 'techlead'
  | 'coordinator'
  | 'manager'
  | 'platform-admin';

export type ScopeLevel =
  | 'squad'
  | 'coord'
  | 'gerencia'
  | 'superintendencia'
  | 'diretoria';

export type Capability =
  | 'catalog.viewBasic'
  | 'catalog.view'
  | 'pipeline.view'
  | 'pipeline.create'
  | 'pipeline.approveStage'
  | 'pipeline.codeReview'
  | 'pipeline.viewCosts'
  | 'lineage.view'
  | 'dataQuality.view'
  | 'dev.viewProjects'
  | 'dev.linkLups'
  | 'executive.viewOwnScope'
  | 'executive.viewGlobal'
  | 'ops.viewBoard'
  | 'admin.manageAccess'
  | 'admin.manageOrg'
  | 'admin.viewAudit';

export interface AccessScope {
  level: ScopeLevel;
  id: string;
  label: string;
}

export interface AccessContext {
  userId: string;
  userPrincipal: string;
  roles: Role[];
  scopes: AccessScope[];
  activeScope: AccessScope | null;
  capabilities: Capability[];
}

export interface ParsedAccessClaims {
  roles: Role[];
  scopes: AccessScope[];
}
