import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../audit/audit.service';
import { OrgService } from '../org/org.service';
import { AccessPolicyService } from './access-policy.service';
import { AccessContext, AccessScope, Capability, ParsedAccessClaims, Role, ScopeLevel } from './access.types';
import { AD_GROUP_PATTERNS, ALL_ROLES, SCOPE_LEVEL_LABELS } from './naming.config';

const ACTIVE_SCOPE_KEY = 'dp.activeAccessScope';

@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly auth = inject(AuthService);
  private readonly org = inject(OrgService);
  private readonly audit = inject(AuditService);
  private readonly policy = inject(AccessPolicyService);
  private readonly requestedScopeId = signal<string | null>(this.loadStoredScopeId());

  readonly claims = computed<ParsedAccessClaims>(() => this.parseGroups(this.auth.user()?.groups ?? []));

  readonly context = computed<AccessContext | null>(() => {
    const user = this.auth.user();
    if (!user) return null;

    const claims = this.claims();
    const roles: Role[] = claims.roles.length ? claims.roles : ['public-viewer'];
    const capabilities: Capability[] = Array.from(new Set(roles.flatMap(role => this.policy.capabilitiesFor(role))));
    const activeScope = this.resolveActiveScope(claims.scopes, this.requestedScopeId());

    return {
      userId: user.id,
      userPrincipal: user.userPrincipal,
      roles,
      scopes: claims.scopes,
      activeScope,
      capabilities,
    };
  });

  readonly activeScopes = computed(() => this.context()?.scopes ?? []);

  constructor() {
    effect(() => {
      const context = this.context();
      if (context) {
        this.audit.record('auth.context.loaded', {
          scopeId: context.activeScope?.id,
          metadata: { roles: context.roles.join(','), scopes: context.scopes.map(s => s.id).join(',') },
        });
      }
    }, { allowSignalWrites: true });
  }

  can(capability: Capability): boolean {
    return this.context()?.capabilities.includes(capability) ?? false;
  }

  hasAny(capabilities: Capability[]): boolean {
    return capabilities.some(capability => this.can(capability));
  }

  setActiveScope(scopeId: string): void {
    const scope = this.activeScopes().find(item => item.id === scopeId);
    if (!scope) return;

    this.requestedScopeId.set(scopeId);
    try { localStorage.setItem(ACTIVE_SCOPE_KEY, scopeId); } catch { /* noop */ }
    this.audit.record('access.scope.changed', { scopeId });
  }

  activeSquadIds(): string[] {
    const context = this.context();
    if (!context) return [];
    if (this.can('executive.viewGlobal')) {
      return this.org.squads().map(squad => squad.id);
    }
    return this.org.squadIdsForScopes(context.activeScope ? [context.activeScope] : context.scopes);
  }

  private parseGroups(groups: string[]): ParsedAccessClaims {
    const roles = new Set<Role>(['public-viewer']);
    const scopes = new Map<string, AccessScope>();

    for (const group of groups) {
      const role = ALL_ROLES.find(item => group === AD_GROUP_PATTERNS.role(item));
      if (role) {
        roles.add(role);
        continue;
      }

      const scope = this.parseScope(group);
      if (scope) scopes.set(scope.id, scope);
    }

    return { roles: Array.from(roles), scopes: Array.from(scopes.values()) };
  }

  private parseScope(group: string): AccessScope | null {
    const parts = group.split('.');
    if (parts.length < 4 || parts[0] !== 'dp' || parts[1] !== 'scope') return null;

    const level = parts[2] as ScopeLevel;
    const id = parts.slice(3).join('.');
    if (!SCOPE_LEVEL_LABELS[level] || !id) return null;

    return {
      level,
      id,
      label: this.org.labelForUnit(id),
    };
  }

  private resolveActiveScope(scopes: AccessScope[], requestedId: string | null): AccessScope | null {
    if (!scopes.length) return null;
    return scopes.find(scope => scope.id === requestedId) ?? scopes[0];
  }

  private loadStoredScopeId(): string | null {
    try { return localStorage.getItem(ACTIVE_SCOPE_KEY); } catch { return null; }
  }
}
