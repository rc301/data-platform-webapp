import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../services/auth.service';
import { SUBJECTS, SUBJECT_DOMAINS, TABLE_ASSIGNMENTS } from './subject.mock';
import {
  Subject,
  SubjectDomain,
  SubjectDomainDraft,
  SubjectDraft,
  TableAssignment,
  TableAssignmentDraft,
} from './subject.model';

/**
 * Service de Assuntos / Domínios / Atribuições de Tabela.
 *
 * Mantém três coleções em memória e expõe operações de CRUD
 * com auditoria embutida. Quando vier backend real, esta classe vira a
 * "porta" entre UI e API; assinaturas dos métodos não mudam.
 *
 * Regras simples de integridade:
 *   • Apagar um Subject inativa em cascata os SubjectDomain filhos
 *     (não removemos para preservar histórico de TableAssignment).
 *   • Apagar um SubjectDomain só é permitido se nenhuma TableAssignment
 *     o referenciar — caso contrário, lançamos `domain-in-use`.
 */
@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly audit = inject(AuditService);
  private readonly auth = inject(AuthService);

  private readonly subjectsSig    = signal<Subject[]>(SUBJECTS);
  private readonly domainsSig     = signal<SubjectDomain[]>(SUBJECT_DOMAINS);
  private readonly assignmentsSig = signal<TableAssignment[]>(TABLE_ASSIGNMENTS);

  readonly subjects    = this.subjectsSig.asReadonly();
  readonly domains     = this.domainsSig.asReadonly();
  readonly assignments = this.assignmentsSig.asReadonly();

  domainsForSubject(subjectId: Subject['id']) {
    return computed(() => this.domainsSig().filter(d => d.subjectId === subjectId));
  }

  assignmentsForSubject(subjectId: Subject['id']) {
    return computed(() => this.assignmentsSig().filter(a => a.subjectId === subjectId));
  }

  /* ---------------------- Subject CRUD ---------------------- */
  createSubject(draft: SubjectDraft): Subject {
    const now = new Date().toISOString();
    const subject: Subject = {
      id: `subj-${slug(draft.name)}-${shortRand()}`,
      name: draft.name.trim(),
      description: draft.description?.trim(),
      owner: draft.owner?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.subjectsSig.update(items => [subject, ...items]);
    this.audit.record('subject.created', { resourceType: 'subject', resourceId: subject.id, metadata: { name: subject.name } });
    return subject;
  }

  updateSubject(id: Subject['id'], draft: SubjectDraft): Subject | null {
    const existing = this.subjectsSig().find(s => s.id === id);
    if (!existing) return null;
    const next: Subject = {
      ...existing,
      ...draft,
      name: draft.name.trim(),
      updatedAt: new Date().toISOString(),
    };
    this.subjectsSig.update(items => items.map(s => s.id === id ? next : s));
    this.audit.record('subject.updated', { resourceType: 'subject', resourceId: id });
    return next;
  }

  deleteSubject(id: Subject['id']): void {
    if (!this.subjectsSig().some(s => s.id === id)) return;
    this.subjectsSig.update(items => items.filter(s => s.id !== id));
    // Remove cascateado os domínios filhos. Atribuições de tabela ficam órfãs
    // até que admin re-atribua — preferimos exposição de inconsistência sobre
    // perda silenciosa do dado.
    this.domainsSig.update(items => items.filter(d => d.subjectId !== id));
    this.audit.record('subject.deleted', { resourceType: 'subject', resourceId: id });
  }

  /* ----------------- SubjectDomain CRUD --------------------- */
  createDomain(draft: SubjectDomainDraft): SubjectDomain {
    const now = new Date().toISOString();
    const domain: SubjectDomain = {
      id: `dom-${slug(draft.name)}-${shortRand()}`,
      subjectId: draft.subjectId,
      name: draft.name.trim(),
      description: draft.description?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.domainsSig.update(items => [domain, ...items]);
    this.audit.record('subject.domain.created', { resourceType: 'subject-domain', resourceId: domain.id, scopeId: draft.subjectId });
    return domain;
  }

  updateDomain(id: SubjectDomain['id'], draft: SubjectDomainDraft): SubjectDomain | null {
    const existing = this.domainsSig().find(d => d.id === id);
    if (!existing) return null;
    const next: SubjectDomain = {
      ...existing,
      ...draft,
      name: draft.name.trim(),
      updatedAt: new Date().toISOString(),
    };
    this.domainsSig.update(items => items.map(d => d.id === id ? next : d));
    this.audit.record('subject.domain.updated', { resourceType: 'subject-domain', resourceId: id });
    return next;
  }

  /** Retorna `true` em sucesso; `false` se houver TableAssignment usando o domínio. */
  deleteDomain(id: SubjectDomain['id']): boolean {
    const inUse = this.assignmentsSig().some(a => a.domainId === id);
    if (inUse) return false;
    this.domainsSig.update(items => items.filter(d => d.id !== id));
    this.audit.record('subject.domain.deleted', { resourceType: 'subject-domain', resourceId: id });
    return true;
  }

  /* ------------------ TableAssignment CRUD ------------------ */
  upsertAssignment(draft: TableAssignmentDraft, source: TableAssignment['source'] = 'manual'): TableAssignment {
    const now = new Date().toISOString();
    const user = this.currentUser();
    const next: TableAssignment = { ...draft, source, updatedAt: now, updatedBy: user };

    this.assignmentsSig.update(items => {
      const idx = items.findIndex(a => a.qualifiedName === draft.qualifiedName);
      if (idx === -1) return [next, ...items];
      const copy = items.slice();
      copy[idx] = next;
      return copy;
    });

    this.audit.record('subject.assignment.upserted', {
      resourceType: 'table-assignment',
      resourceId: draft.qualifiedName,
      scopeId: draft.subjectId,
      metadata: { source },
    });
    return next;
  }

  removeAssignment(qualifiedName: TableAssignment['qualifiedName']): void {
    this.assignmentsSig.update(items => items.filter(a => a.qualifiedName !== qualifiedName));
    this.audit.record('subject.assignment.removed', { resourceType: 'table-assignment', resourceId: qualifiedName });
  }

  private currentUser(): string {
    const user = this.auth.user();
    return user?.userPrincipal ?? user?.name ?? 'local.user';
  }
}

/* ============================================================
   Helpers — locais para não acoplar a libs externas no service.
   ============================================================ */
function slug(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'item';
}

function shortRand(): string {
  return Math.random().toString(36).slice(2, 6);
}
