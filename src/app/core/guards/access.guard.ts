import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuditService } from '../audit/audit.service';
import { AccessService } from '../access/access.service';
import { Capability } from '../access/access.types';

/**
 * Guard de rota baseado em capabilities.
 *
 * Aceita `route.data.capability` como:
 *   - string  → exige aquela capability
 *   - array   → OR (tem QUALQUER uma das listadas)
 *
 * Negações são auditadas. Em caso de bloqueio, redireciona para /catalog
 * (rota com a barreira mais baixa, acessível inclusive ao PublicViewer).
 */
export const capabilityGuard: CanMatchFn = (route) => {
  const required = route.data?.['capability'] as Capability | Capability[] | undefined;
  if (!required) return true;

  const access = inject(AccessService);
  const list = Array.isArray(required) ? required : [required];
  if (list.some(cap => access.can(cap))) return true;

  inject(AuditService).record('navigation.denied', {
    resourceType: 'route',
    resourceId: route.path,
    metadata: { capability: list.join(',') },
  });
  return inject(Router).parseUrl('/catalog');
};
