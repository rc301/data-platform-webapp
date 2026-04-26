import { Capability, Role, ScopeLevel } from './access.types';

export const AD_GROUP_PREFIX = 'dp';

const join = (...parts: string[]) => [AD_GROUP_PREFIX, ...parts].join('.');

export const AD_GROUP_PATTERNS = {
  role: (role: Role) => join('role', role),
  scope: (level: ScopeLevel, id: string) => join('scope', level, id),
};

export const DEFAULT_ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  'public-viewer': [
    'catalog.viewBasic',
  ],
  'developer': [
    'catalog.view',
    'pipeline.view',
    'pipeline.create',
    'lineage.view',
    'dataQuality.view',
    'dev.viewProjects',
  ],
  'techlead': [
    'catalog.view',
    'pipeline.view',
    'pipeline.create',
    'pipeline.approveStage',
    'pipeline.codeReview',
    'lineage.view',
    'dataQuality.view',
    'dev.viewProjects',
    'dev.linkLups',
  ],
  'coordinator': [
    'catalog.view',
    'pipeline.view',
    'pipeline.viewCosts',
    'lineage.view',
    'dataQuality.view',
    'dev.viewProjects',
    'executive.viewOwnScope',
    'ops.viewBoard',
  ],
  'manager': [
    'catalog.view',
    'pipeline.view',
    'pipeline.viewCosts',
    'lineage.view',
    'dataQuality.view',
    'dev.viewProjects',
    'executive.viewOwnScope',
    'ops.viewBoard',
    'admin.viewAudit',
  ],
  'platform-admin': [
    'catalog.view',
    'pipeline.view',
    'pipeline.create',
    'pipeline.approveStage',
    'pipeline.codeReview',
    'pipeline.viewCosts',
    'lineage.view',
    'dataQuality.view',
    'dev.viewProjects',
    'dev.linkLups',
    'executive.viewOwnScope',
    'executive.viewGlobal',
    'ops.viewBoard',
    'admin.manageAccess',
    'admin.manageOrg',
    'admin.viewAudit',
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  'public-viewer': 'Visitante interno',
  'developer': 'Desenvolvedor',
  'techlead': 'Tech Lead',
  'coordinator': 'Coordenador',
  'manager': 'Gerente',
  'platform-admin': 'Administrador da Plataforma',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'public-viewer': 'Qualquer funcionario autenticado. Ve apenas catalogo publico e farol.',
  'developer': 'Cria e acompanha pipelines da propria squad.',
  'techlead': 'Aprova etapas e vincula LUPs no escopo da propria squad.',
  'coordinator': 'Acompanha squads sob sua coordenacao.',
  'manager': 'Acompanha KPIs, custos, SLAs e auditoria do proprio escopo.',
  'platform-admin': 'Administra acesso, hierarquia organizacional e auditoria da plataforma.',
};

export const CAPABILITY_LABELS: Record<Capability, string> = {
  'catalog.viewBasic': 'Catalogo - visao basica',
  'catalog.view': 'Catalogo - visao completa',
  'pipeline.view': 'Pipelines - visualizar',
  'pipeline.create': 'Pipelines - criar jornada',
  'pipeline.approveStage': 'Pipelines - aprovar etapas',
  'pipeline.codeReview': 'Pipelines - code review',
  'pipeline.viewCosts': 'Pipelines - visualizar custos',
  'lineage.view': 'Linhagem - visualizar',
  'dataQuality.view': 'Qualidade - visualizar',
  'dev.viewProjects': 'Projetos LUP - listar',
  'dev.linkLups': 'Projetos LUP - vincular EA/ED',
  'executive.viewOwnScope': 'Executivo - proprio escopo',
  'executive.viewGlobal': 'Executivo - global',
  'ops.viewBoard': 'Sustentacao - painel de farois',
  'admin.manageAccess': 'Admin - gerir acessos',
  'admin.manageOrg': 'Admin - gerir hierarquia',
  'admin.viewAudit': 'Admin - consultar auditoria',
};

export const SCOPE_LEVEL_LABELS: Record<ScopeLevel, string> = {
  squad: 'Squad',
  coord: 'Coordenacao',
  gerencia: 'Gerencia',
  superintendencia: 'Superintendencia',
  diretoria: 'Diretoria',
};

export const ALL_ROLES: Role[] = [
  'public-viewer',
  'developer',
  'techlead',
  'coordinator',
  'manager',
  'platform-admin',
];

export const ALL_CAPABILITIES = Object.keys(CAPABILITY_LABELS) as Capability[];
