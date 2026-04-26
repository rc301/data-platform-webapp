import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  userPrincipal: string;
  role: 'admin' | 'engineer' | 'analyst' | 'viewer';
  team: string;
  groups: string[];
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>({
    id: 'user-1',
    name: 'Rafael Carvalho',
    email: 'rafael.carvalho@company.com',
    userPrincipal: 'rafael.carvalho@company.com',
    role: 'admin',
    team: 'Data Platform',
    groups: [
      'dp.role.platform-admin',
      'dp.scope.gerencia.mgmt-data-platform',
    ],
  });

  readonly user = this.currentUser.asReadonly();
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
