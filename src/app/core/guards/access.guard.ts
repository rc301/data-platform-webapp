import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuditService } from '../audit/audit.service';
import { AccessService } from '../access/access.service';
import { Capability } from '../access/access.types';

export const capabilityGuard: CanMatchFn = (route) => {
  const capability = route.data?.['capability'] as Capability | undefined;
  if (!capability) return true;

  const access = inject(AccessService);
  if (access.can(capability)) return true;

  inject(AuditService).record('navigation.denied', {
    resourceType: 'route',
    resourceId: route.path,
    metadata: { capability },
  });
  return inject(Router).parseUrl('/catalog');
};
