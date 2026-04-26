import { Injectable, signal, computed } from '@angular/core';

export type PersonaId = 'developer' | 'sustaining' | 'manager';

export interface Persona {
  id: PersonaId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  homeRoute: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'developer',
    label: 'Engenheiro de Dados — Desenvolvimento',
    shortLabel: 'Desenvolvedor',
    description: 'Construir pipelines de ponta a ponta com aprovações guiadas.',
    icon: 'terminal',
    homeRoute: '/dev',
  },
  {
    id: 'sustaining',
    label: 'Engenheiro de Dados — Sustentação',
    shortLabel: 'Sustentação',
    description: 'Operação 24x7, faróis de SLA e diagnóstico de incidentes.',
    icon: 'shield',
    homeRoute: '/ops',
  },
  {
    id: 'manager',
    label: 'Gestão',
    shortLabel: 'Gestor',
    description: 'Indicadores executivos, custos e capacidade da plataforma.',
    icon: 'analytics',
    homeRoute: '/executive',
  },
];

const STORAGE_KEY = 'dp.activePersona';

/**
 * Persistente, simples — desacoplado da camada de UI.
 * Componentes consomem `active` (signal) e nunca precisam saber como é armazenado.
 */
@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly _activeId = signal<PersonaId>(this.loadInitial());

  readonly active = computed<Persona>(() => PERSONAS.find(p => p.id === this._activeId())!);
  readonly all = PERSONAS;

  setActive(id: PersonaId): void {
    this._activeId.set(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* noop */ }
  }

  private loadInitial(): PersonaId {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as PersonaId | null;
      if (v && PERSONAS.some(p => p.id === v)) return v;
    } catch { /* noop */ }
    return 'developer';
  }
}
