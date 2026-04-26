import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AuditAction, AuditEvent, AuditSinkConfig } from './audit.model';

export const AUDIT_SINK_CONFIG: AuditSinkConfig = {
  primary: 'cloudwatch',
  stream: 'firehose',
  archive: 's3-object-lock',
  retention: {
    sensitiveEventsYears: 5,
    viewEventsYears: 1,
  },
  piiPolicy: 'userId+userPrincipal',
};

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly auth = inject(AuthService);
  private readonly eventsSig = signal<AuditEvent[]>([]);

  readonly sinkConfig = AUDIT_SINK_CONFIG;
  readonly events = this.eventsSig.asReadonly();
  readonly latestEvents = computed(() => this.eventsSig().slice(0, 20));

  record(action: AuditAction, details: Omit<Partial<AuditEvent>, 'id' | 'timestamp' | 'action' | 'userId' | 'userPrincipal'> = {}): void {
    const user = this.auth.user();
    if (!user) return;

    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      userId: user.id,
      userPrincipal: user.userPrincipal,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      scopeId: details.scopeId,
      metadata: details.metadata,
    };
    this.eventsSig.update(events => [event, ...events].slice(0, 200));
  }
}
