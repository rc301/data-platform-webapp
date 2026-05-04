import { Injectable, computed, inject, signal } from '@angular/core';
import { AccessScope } from '../access/access.types';
import { AuditService } from '../audit/audit.service';
import { PROJECT_CODE_RECORDS, ORG_UNITS } from './org.mock';
import { LupProject, LupProjectDraft, OrgUnit } from './org.model';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private readonly audit = inject(AuditService);
  private readonly orgUnitsSig = signal<OrgUnit[]>(ORG_UNITS);
  private readonly projectsSig = signal<LupProject[]>(PROJECT_CODE_RECORDS);

  readonly orgUnits = this.orgUnitsSig.asReadonly();
  readonly projects = this.projectsSig.asReadonly();
  readonly squads = computed(() => this.orgUnitsSig().filter(unit => unit.level === 'squad'));

  unitById(id: string): OrgUnit | undefined {
    return this.orgUnitsSig().find(unit => unit.id === id);
  }

  descendantsOf(unitId: string): OrgUnit[] {
    const children = this.orgUnitsSig().filter(unit => unit.parentId === unitId);
    return children.flatMap(child => [child, ...this.descendantsOf(child.id)]);
  }

  ancestorsOf(unitId: string): OrgUnit[] {
    const unit = this.unitById(unitId);
    if (!unit?.parentId) return [];
    const parent = this.unitById(unit.parentId);
    return parent ? [parent, ...this.ancestorsOf(parent.id)] : [];
  }

  managementScopesFor(scopes: AccessScope[]): AccessScope[] {
    const managementUnits = new Map<string, OrgUnit>();

    for (const scope of scopes) {
      const unit = this.unitById(scope.id);
      if (!unit) continue;

      if (unit.level === 'gerencia') {
        managementUnits.set(unit.id, unit);
        continue;
      }

      const management = this.ancestorsOf(unit.id).find(ancestor => ancestor.level === 'gerencia');
      if (management) managementUnits.set(management.id, management);
    }

    return Array.from(managementUnits.values()).map(unit => ({
      id: unit.id,
      level: 'gerencia',
      label: unit.name,
    }));
  }

  squadIdsForScopes(scopes: AccessScope[]): string[] {
    if (!scopes.length) return [];
    const ids = new Set<string>();
    for (const scope of scopes) {
      if (scope.level === 'squad') {
        ids.add(scope.id);
        continue;
      }
      for (const unit of this.descendantsOf(scope.id)) {
        if (unit.level === 'squad') ids.add(unit.id);
      }
    }
    return Array.from(ids);
  }

  projectsForScopes(scopes: AccessScope[], allowGlobal = false): LupProject[] {
    if (allowGlobal) return this.projectsSig();
    const squadIds = new Set(this.squadIdsForScopes(scopes));
    return this.projectsSig().filter(project => squadIds.has(project.squadId));
  }

  createProject(draft: LupProjectDraft): LupProject {
    const project = this.toProject(draft);
    this.projectsSig.update(projects => [project, ...projects]);
    this.audit.record('lup.created', {
      resourceType: 'lup',
      resourceId: project.id,
      scopeId: project.squadId,
      metadata: { code: project.code, type: project.type },
    });
    return project;
  }

  updateProject(id: string, draft: LupProjectDraft): LupProject | null {
    const existing = this.projectsSig().find(project => project.id === id);
    if (!existing) return null;

    const updated = this.toProject({ ...draft, id, updatedAt: new Date().toISOString() });
    this.projectsSig.update(projects => projects.map(project => project.id === id ? updated : project));

    this.audit.record('lup.updated', {
      resourceType: 'lup',
      resourceId: updated.id,
      scopeId: updated.squadId,
      metadata: { code: updated.code, type: updated.type },
    });
    return updated;
  }

  deleteProject(id: string): void {
    const existing = this.projectsSig().find(project => project.id === id);
    if (!existing) return;
    this.projectsSig.update(projects => projects.filter(project => project.id !== id));
    this.audit.record('lup.deleted', {
      resourceType: 'lup',
      resourceId: existing.id,
      scopeId: existing.squadId,
      metadata: { code: existing.code, type: existing.type },
    });
  }

  labelForUnit(id: string): string {
    return this.unitById(id)?.name ?? id;
  }

  private toProject(draft: LupProjectDraft): LupProject {
    const now = new Date().toISOString();
    const code = draft.code?.trim() || `${draft.type}${Date.now().toString().slice(-4)}`;
    return {
      id: draft.id || `lup-${code.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`,
      code,
      type: draft.type,
      name: draft.name.trim(),
      description: draft.description.trim(),
      squadId: draft.squadId,
      owner: draft.owner.trim(),
      status: draft.status,
      health: draft.health,
      progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)),
      pipelineCount: Math.max(0, Number(draft.pipelineCount) || 0),
      monthlyCost: Math.max(0, Number(draft.monthlyCost) || 0),
      updatedAt: draft.updatedAt || now,
      linkedProjectIds: draft.linkedProjectIds ?? [],
    };
  }
}
