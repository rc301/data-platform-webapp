import { Injectable, inject, signal } from '@angular/core';
import { AuditService } from '../audit/audit.service';
import { Capability, Role } from './access.types';
import { DEFAULT_ROLE_CAPABILITIES } from './naming.config';

const POLICY_KEY = 'dp.accessPolicy.roleCapabilities';

@Injectable({ providedIn: 'root' })
export class AccessPolicyService {
  private readonly audit = inject(AuditService);
  private readonly roleCapabilitiesSig = signal<Record<Role, Capability[]>>(this.loadPolicy());

  readonly roleCapabilities = this.roleCapabilitiesSig.asReadonly();

  capabilitiesFor(role: Role): Capability[] {
    return this.roleCapabilitiesSig()[role] ?? DEFAULT_ROLE_CAPABILITIES[role];
  }

  setCapabilities(role: Role, capabilities: Capability[]): void {
    const next = Array.from(new Set(capabilities));
    const previous = this.capabilitiesFor(role);
    this.roleCapabilitiesSig.update(policy => ({ ...policy, [role]: next }));
    this.persist();
    this.audit.record('access.policy.updated', {
      resourceType: 'role',
      resourceId: role,
      metadata: {
        role,
        before: previous.join(','),
        after: next.join(','),
      },
    });
  }

  resetRole(role: Role): void {
    this.setCapabilities(role, DEFAULT_ROLE_CAPABILITIES[role]);
    this.audit.record('access.policy.reset', {
      resourceType: 'role',
      resourceId: role,
      metadata: { role },
    });
  }

  private loadPolicy(): Record<Role, Capability[]> {
    try {
      const raw = localStorage.getItem(POLICY_KEY);
      return raw ? { ...DEFAULT_ROLE_CAPABILITIES, ...JSON.parse(raw) } : { ...DEFAULT_ROLE_CAPABILITIES };
    } catch {
      return { ...DEFAULT_ROLE_CAPABILITIES };
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(POLICY_KEY, JSON.stringify(this.roleCapabilitiesSig()));
    } catch {
      // Ambiente local. Backend real deve persistir e versionar politicas.
    }
  }
}
