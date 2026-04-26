import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { OrgService } from '../../core/org/org.service';
import { AccessService } from '../../core/access/access.service';

@Component({
  selector: 'app-projects-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Histórico de Projetos" subtitle="Projetos concluídos da sua gerência, com LUPs vinculadas e histórico operacional" icon="history"></app-page-header>

    <section class="filters">
      <mat-form-field appearance="outline"><mat-label>Buscar</mat-label><input matInput [(ngModel)]="searchTerm" placeholder="Código, nome, owner ou descrição"></mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select [(ngModel)]="typeFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="ED">ED</mat-option>
          <mat-option value="EA">EA</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="scope-note">
        <span>Escopo</span>
        <strong>{{ managementScopeLabel() }}</strong>
      </div>
    </section>

    <section class="project-table">
      <div class="project-row project-row--head">
        <span>Projeto</span><span>Tipo</span><span>Squad</span><span>Status</span><span>Pipelines</span><span>LUPs vinculadas</span><span>Atualizado</span>
      </div>
      <article class="project-row" *ngFor="let project of visibleProjects()">
        <div class="main"><strong>{{ project.code }}</strong><span>{{ project.name }}</span></div>
        <span>{{ project.type }}</span>
        <span>{{ org.labelForUnit(project.squadId) }}</span>
        <app-status-badge [status]="project.status" [label]="project.status"></app-status-badge>
        <span>{{ project.pipelineCount }}</span>
        <span>{{ project.linkedProjectIds.join(', ') || '-' }}</span>
        <span>{{ project.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
      </article>
      <div class="empty" *ngIf="!visibleProjects().length">
        Nenhum projeto concluído encontrado para a sua gerência com os filtros atuais.
      </div>
    </section>
  `,
  styles: [`
    .filters { display: grid; grid-template-columns: minmax(280px, 1fr) 160px 220px; gap: 12px; margin-bottom: 18px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .scope-note { align-self: stretch; border-radius: var(--radius-md); background: var(--bg-app); padding: 10px 12px; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .scope-note span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .scope-note strong { color: var(--text-primary); font-size: 13px; }
    .project-table { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }
    .project-row { display: grid; grid-template-columns: minmax(220px, 1.5fr) 80px 130px 150px 90px 180px 150px; min-width: 1050px; gap: 14px; align-items: center; padding: 13px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .project-row:last-child { border-bottom: 0; }
    .project-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .main { display: flex; flex-direction: column; gap: 3px; }
    .main strong { color: var(--text-primary); }
    .main span { color: var(--text-secondary); font-size: 12px; }
    .empty { min-width: 1050px; padding: 28px 16px; color: var(--text-muted); font-size: 13px; text-align: center; }
    @media (max-width: 760px) { .filters { grid-template-columns: 1fr; } }
  `],
})
export class ProjectsHistoryComponent {
  readonly org = inject(OrgService);
  readonly access = inject(AccessService);
  searchTerm = '';
  typeFilter = 'all';

  readonly managementScopes = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org.managementScopesFor(context.activeScope ? [context.activeScope] : context.scopes);
  });

  readonly managementScopeLabel = computed(() => this.managementScopes().map(scope => scope.label).join(', ') || 'Sem gerência associada');

  readonly visibleProjects = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.org.projectsForScopes(this.managementScopes()).filter(project =>
      (this.typeFilter === 'all' || project.type === this.typeFilter)
      && project.status === 'completed'
      && (!term
        || project.code.toLowerCase().includes(term)
        || project.name.toLowerCase().includes(term)
        || project.owner.toLowerCase().includes(term)
        || project.description.toLowerCase().includes(term))
    );
  });
}
