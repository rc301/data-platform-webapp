export type AuditAction =
  | 'auth.context.loaded'
  | 'access.scope.changed'
  | 'navigation.denied'
  | 'project.viewed'
  | 'pipeline.stage.approved'
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
