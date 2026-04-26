import { Injectable, computed, signal } from '@angular/core';
import { AccessScope } from '../access/access.types';
import { LUP_PROJECTS, ORG_UNITS } from './org.mock';
import { LupProject, OrgUnit } from './org.model';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private readonly orgUnitsSig = signal<OrgUnit[]>(ORG_UNITS);
  private readonly projectsSig = signal<LupProject[]>(LUP_PROJECTS);

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

  labelForUnit(id: string): string {
    return this.unitById(id)?.name ?? id;
  }
}
