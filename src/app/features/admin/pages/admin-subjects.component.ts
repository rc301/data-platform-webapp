import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiBadgeComponent, UiCardComponent } from '../../../shared/ui';
import { SubjectService } from '../../../core/subjects/subject.service';
import {
  Subject,
  SubjectDomain,
  TableAssignment,
} from '../../../core/subjects/subject.model';

/**
 * Admin · Assuntos & Domínios.
 *
 * Layout em 3 painéis:
 *   1. Assuntos (esquerda) — flat list com CRUD; clicar seleciona
 *   2. Domínios do assunto selecionado (centro) — CRUD do filho 1:N
 *   3. Tabelas atribuídas ao assunto selecionado (direita) — atualização
 *      manual da relação tabela → subject + domain
 *
 * O job diário externo escreve em `TableAssignment` via `upsertAssignment`
 * com `source='daily-job'`. A interface humana usa `source='manual'`.
 */
@Component({
  selector: 'app-admin-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      <!-- Coluna 1 — Assuntos -->
      <ui-card eyebrow="Assuntos" title="Lista corporativa">
        <div card-actions>
          <button class="btn btn--primary" type="button" (click)="startCreateSubject()">+ Novo</button>
        </div>

        <ng-container *ngIf="creatingSubject()">
          <div class="form">
            <input class="input" placeholder="Nome do assunto" [(ngModel)]="subjectDraft.name">
            <input class="input" placeholder="Owner (opcional)"  [(ngModel)]="subjectDraft.owner">
            <textarea class="input" placeholder="Descrição (opcional)" rows="2" [(ngModel)]="subjectDraft.description"></textarea>
            <div class="form__actions">
              <button class="btn" type="button" (click)="creatingSubject.set(false)">Cancelar</button>
              <button class="btn btn--primary" type="button" [disabled]="!subjectDraft.name.trim()" (click)="commitCreateSubject()">Criar</button>
            </div>
          </div>
        </ng-container>

        <ul class="list">
          <li *ngFor="let subject of subjects.subjects()"
              class="list__item"
              [class.list__item--active]="subject.id === selectedSubjectId()"
              (click)="selectSubject(subject.id)">
            <div class="list__main">
              <strong>{{ subject.name }}</strong>
              <span>{{ subject.description || 'Sem descrição' }}</span>
            </div>
            <div class="list__meta">
              <ui-badge tone="neutral">{{ countDomains(subject.id) }} domínios</ui-badge>
            </div>
          </li>
          <li *ngIf="!subjects.subjects().length" class="empty">Cadastre o primeiro assunto.</li>
        </ul>
      </ui-card>

      <!-- Coluna 2 — Domínios do assunto -->
      <ui-card [eyebrow]="selectedSubject()?.name || 'Domínios'" title="Domínios do assunto">
        <div card-actions>
          <button class="btn btn--primary" type="button" [disabled]="!selectedSubject()" (click)="startCreateDomain()">+ Novo</button>
        </div>

        <div *ngIf="!selectedSubject()" class="empty">Selecione um assunto à esquerda para gerir seus domínios.</div>

        <ng-container *ngIf="selectedSubject()">
          <ng-container *ngIf="creatingDomain()">
            <div class="form">
              <input class="input" placeholder="Nome do domínio" [(ngModel)]="domainDraft.name">
              <textarea class="input" placeholder="Descrição (opcional)" rows="2" [(ngModel)]="domainDraft.description"></textarea>
              <div class="form__actions">
                <button class="btn" type="button" (click)="creatingDomain.set(false)">Cancelar</button>
                <button class="btn btn--primary" type="button" [disabled]="!domainDraft.name.trim()" (click)="commitCreateDomain()">Criar</button>
              </div>
            </div>
          </ng-container>

          <ul class="list">
            <li *ngFor="let domain of domainsOfSelected()" class="list__item">
              <div class="list__main">
                <strong>{{ domain.name }}</strong>
                <span>{{ domain.description || 'Sem descrição' }}</span>
              </div>
              <div class="list__meta">
                <ui-badge tone="neutral">{{ countTables(domain.id) }} tabelas</ui-badge>
                <button class="btn btn--ghost" type="button" matTooltip="Excluir" (click)="removeDomain(domain)">Excluir</button>
              </div>
            </li>
            <li *ngIf="!domainsOfSelected().length" class="empty">Nenhum domínio cadastrado para este assunto.</li>
          </ul>
        </ng-container>
      </ui-card>

      <!-- Coluna 3 — Atribuições de tabela -->
      <ui-card eyebrow="Tabelas" title="Atribuições do assunto" [padded]="false">
        <div card-actions>
          <button class="btn btn--primary" type="button" [disabled]="!selectedSubject() || !domainsOfSelected().length" (click)="startCreateAssignment()">+ Atribuir</button>
        </div>

        <div *ngIf="creatingAssignment()" class="form form--inline">
          <input class="input" placeholder="qualifiedName (ex: spec.customer_360)" [(ngModel)]="assignmentDraft.qualifiedName">
          <select class="input" [(ngModel)]="assignmentDraft.domainId">
            <option *ngFor="let d of domainsOfSelected()" [value]="d.id">{{ d.name }}</option>
          </select>
          <button class="btn" type="button" (click)="creatingAssignment.set(false)">Cancelar</button>
          <button class="btn btn--primary" type="button" [disabled]="!assignmentDraft.qualifiedName.trim() || !assignmentDraft.domainId" (click)="commitAssignment()">Salvar</button>
        </div>

        <table class="tbl">
          <thead><tr><th>Tabela</th><th>Domínio</th><th>Origem</th><th>Atualizado</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let a of assignmentsOfSelected()">
              <td class="tbl__name">{{ a.qualifiedName }}</td>
              <td>{{ domainName(a.domainId) }}</td>
              <td><ui-badge [tone]="sourceBadgeTone(a.source)">{{ a.source }}</ui-badge></td>
              <td>{{ a.updatedAt | date:'short' }}</td>
              <td><button class="btn btn--ghost" type="button" (click)="removeAssignment(a)">Remover</button></td>
            </tr>
            <tr *ngIf="selectedSubject() && !assignmentsOfSelected().length">
              <td colspan="5" class="tbl__empty">Nenhuma tabela atribuída a este assunto ainda.</td>
            </tr>
            <tr *ngIf="!selectedSubject()">
              <td colspan="5" class="tbl__empty">Selecione um assunto para ver suas tabelas.</td>
            </tr>
          </tbody>
        </table>
      </ui-card>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 18px; align-items: flex-start; }
    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } }

    .form { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--bg-app); border-radius: var(--radius-md); margin-bottom: 12px; }
    .form--inline { flex-direction: row; flex-wrap: wrap; align-items: center; }
    .form--inline .input { flex: 1 1 200px; }
    .form__actions { display: flex; justify-content: flex-end; gap: 8px; }
    .input {
      background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md);
      padding: 8px 10px; color: var(--text-primary); font: inherit; font-size: 13px; outline: none;
    }
    .input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }

    .btn { height: 30px; padding: 0 10px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-overlay); color: var(--text-primary); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn:hover:not([disabled]) { background: var(--bg-elevated); }
    .btn[disabled] { opacity: .45; cursor: not-allowed; }
    .btn--primary { background: var(--brand-500); border-color: var(--brand-500); color: var(--text-on-brand); }
    .btn--primary:hover:not([disabled]) { background: var(--brand-400); }
    .btn--ghost { background: transparent; border-color: transparent; color: var(--text-secondary); }
    .btn--ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }

    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .list__item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: var(--radius-md); cursor: pointer; transition: background .15s ease; }
    .list__item:hover { background: var(--bg-elevated); }
    .list__item--active { background: var(--bg-elevated); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .list__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .list__main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .list__main span { color: var(--text-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
    .list__meta { display: flex; align-items: center; gap: 6px; }
    .empty { padding: 18px 12px; color: var(--text-muted); font-size: 12px; text-align: center; }

    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
  `],
})
export class AdminSubjectsComponent {
  readonly subjects = inject(SubjectService);

  readonly selectedSubjectId = signal<Subject['id'] | null>(this.subjects.subjects()[0]?.id ?? null);

  readonly selectedSubject = computed(() => {
    const id = this.selectedSubjectId();
    return id ? this.subjects.subjects().find(s => s.id === id) ?? null : null;
  });

  readonly domainsOfSelected = computed<SubjectDomain[]>(() => {
    const id = this.selectedSubjectId();
    return id ? this.subjects.domains().filter(d => d.subjectId === id) : [];
  });

  readonly assignmentsOfSelected = computed<TableAssignment[]>(() => {
    const id = this.selectedSubjectId();
    return id ? this.subjects.assignments().filter(a => a.subjectId === id) : [];
  });

  /* ---- Drafts mantidos como propriedades simples (formulários inline) ---- */
  subjectDraft    = { name: '', description: '', owner: '' };
  domainDraft     = { name: '', description: '' };
  assignmentDraft = { qualifiedName: '', domainId: '' };

  creatingSubject    = signal(false);
  creatingDomain     = signal(false);
  creatingAssignment = signal(false);

  /* ---- Subjects ---- */
  selectSubject(id: Subject['id']): void {
    this.selectedSubjectId.set(id);
    this.creatingDomain.set(false);
    this.creatingAssignment.set(false);
  }

  startCreateSubject(): void {
    this.subjectDraft = { name: '', description: '', owner: '' };
    this.creatingSubject.set(true);
  }

  commitCreateSubject(): void {
    if (!this.subjectDraft.name.trim()) return;
    const created = this.subjects.createSubject({ ...this.subjectDraft });
    this.selectedSubjectId.set(created.id);
    this.creatingSubject.set(false);
  }

  countDomains(subjectId: Subject['id']): number {
    return this.subjects.domains().filter(d => d.subjectId === subjectId).length;
  }

  /* ---- Domains ---- */
  startCreateDomain(): void {
    this.domainDraft = { name: '', description: '' };
    this.creatingDomain.set(true);
  }

  commitCreateDomain(): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId || !this.domainDraft.name.trim()) return;
    this.subjects.createDomain({
      subjectId,
      name: this.domainDraft.name,
      description: this.domainDraft.description,
    });
    this.creatingDomain.set(false);
  }

  removeDomain(domain: SubjectDomain): void {
    const ok = this.subjects.deleteDomain(domain.id);
    if (!ok) {
      window.alert(`O domínio "${domain.name}" possui tabelas atribuídas. Remova as tabelas antes de excluir.`);
    }
  }

  countTables(domainId: SubjectDomain['id']): number {
    return this.subjects.assignments().filter(a => a.domainId === domainId).length;
  }

  /* ---- Assignments ---- */
  startCreateAssignment(): void {
    this.assignmentDraft = {
      qualifiedName: '',
      domainId: this.domainsOfSelected()[0]?.id ?? '',
    };
    this.creatingAssignment.set(true);
  }

  commitAssignment(): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) return;
    const { qualifiedName, domainId } = this.assignmentDraft;
    if (!qualifiedName.trim() || !domainId) return;
    this.subjects.upsertAssignment({ qualifiedName: qualifiedName.trim(), subjectId, domainId }, 'manual');
    this.creatingAssignment.set(false);
  }

  removeAssignment(a: TableAssignment): void {
    this.subjects.removeAssignment(a.qualifiedName);
  }

  domainName(domainId: SubjectDomain['id']): string {
    return this.subjects.domains().find(d => d.id === domainId)?.name ?? domainId;
  }

  sourceBadgeTone(source: TableAssignment['source']): 'neutral' | 'brand' | 'success' {
    return source === 'manual' ? 'brand' : source === 'agent' ? 'success' : 'neutral';
  }
}
