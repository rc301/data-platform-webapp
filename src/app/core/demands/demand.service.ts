import { Injectable, inject, signal } from '@angular/core';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../services/auth.service';
import { DATA_DEMANDS } from './demand.mock';
import { DataDemand, DataDemandDraft } from './demand.model';

@Injectable({ providedIn: 'root' })
export class DemandService {
  private readonly audit = inject(AuditService);
  private readonly auth = inject(AuthService);
  private readonly demandsSig = signal<DataDemand[]>(DATA_DEMANDS);

  readonly demands = this.demandsSig.asReadonly();

  create(draft: DataDemandDraft): DataDemand {
    const demand = this.toDemand(draft);
    this.demandsSig.update(items => [demand, ...items]);
    this.audit.record('demand.created', { resourceType: 'demand', resourceId: demand.id, metadata: { code: demand.code, title: demand.title } });
    return demand;
  }

  update(id: string, draft: DataDemandDraft): DataDemand | null {
    const existing = this.demandsSig().find(item => item.id === id);
    if (!existing) return null;
    const demand: DataDemand = {
      ...existing,
      ...draft,
      code: draft.code || existing.code,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentUser(),
    };
    this.demandsSig.update(items => items.map(item => item.id === id ? demand : item));
    this.audit.record('demand.updated', { resourceType: 'demand', resourceId: id, metadata: { code: demand.code, title: demand.title } });
    return demand;
  }

  inactivate(id: string): void {
    const now = new Date().toISOString();
    const user = this.currentUser();
    this.demandsSig.update(items => items.map(item => item.id === id ? {
      ...item,
      status: 'inactive',
      inactiveAt: now,
      inactiveBy: user,
      updatedAt: now,
      updatedBy: user,
    } : item));
    this.audit.record('demand.inactivated', { resourceType: 'demand', resourceId: id });
  }

  private toDemand(draft: DataDemandDraft): DataDemand {
    const now = new Date().toISOString();
    const code = draft.code?.trim() || `DEM-${Date.now().toString().slice(-5)}`;
    return {
      id: `demand-${crypto.randomUUID()}`,
      code,
      title: draft.title,
      description: draft.description,
      requester: draft.requester,
      businessArea: draft.businessArea,
      domain: draft.domain,
      squadId: draft.squadId,
      status: draft.status,
      expectedTarget: draft.expectedTarget,
      sla: draft.sla,
      sources: draft.sources,
      createdAt: now,
      createdBy: this.currentUser(),
      updatedAt: now,
      updatedBy: this.currentUser(),
    };
  }

  private currentUser(): string {
    const user = this.auth.user();
    return user?.userPrincipal ?? user?.name ?? 'mock.user';
  }
}
