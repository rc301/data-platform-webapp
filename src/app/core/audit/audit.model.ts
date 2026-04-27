export type AuditAction =
  | 'auth.context.loaded'
  | 'access.scope.changed'
  | 'access.policy.updated'
  | 'access.policy.reset'
  | 'navigation.denied'
  | 'project.viewed'
  | 'pipeline.stage.approved'
  | 'pipeline.registry.created'
  | 'pipeline.registry.updated'
  | 'pipeline.registry.deleted'
  | 'pipeline.registry.imported'
  | 'demand.created'
  | 'demand.updated'
  | 'demand.cancelled'
  | 'demand.inactivated'
  | 'lup.created'
  | 'lup.updated'
  | 'lup.deleted'
  | 'journey.demand.imported'
  | 'admin.access.viewed'
  | 'admin.org.viewed'
  | 'admin.audit.viewed';

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userPrincipal: string;
  resourceType?: string;
  resourceId?: string;
  scopeId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AuditRetentionPolicy {
  sensitiveEventsYears: number;
  viewEventsYears: number;
}

export interface AuditSinkConfig {
  primary: 'cloudwatch';
  stream: 'firehose';
  archive: 's3-object-lock';
  retention: AuditRetentionPolicy;
  piiPolicy: 'userId+userPrincipal';
}
