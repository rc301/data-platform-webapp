import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AccessService } from '../../core/access/access.service';
import { LupProject, LupProjectDraft, LupStatus, LupType } from '../../core/org/org.model';
import { OrgService } from '../../core/org/org.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-lup-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, MatDialogModule, PageHeaderComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Cadastro de LUPs" subtitle="Consulta e manutenção governada dos registros LUP do seu escopo" icon="assignment">
      <button mat-flat-button color="primary" *ngIf="canManage()" (click)="openForm()"><mat-icon>add</mat-icon> Nova LUP</button>
    </app-page-header>

    <section class="lup-form" *ngIf="formOpen()">
      <div class="form-head">
        <div>
          <strong>{{ editingId() ? 'Editar LUP' : 'Cadastrar LUP' }}</strong>
          <span>Criação, edição e exclusão ficam registradas na auditoria.</span>
        </div>
        <button mat-icon-button type="button" (click)="closeForm()" matTooltip="Fechar"><mat-icon>close</mat-icon></button>
      </div>

      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Código</mat-label><input matInput [(ngModel)]="draft.code" placeholder="ex: ED2741"></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="draft.type">
            <mat-option value="ED">ED</mat-option>
            <mat-option value="EA">EA</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput [(ngModel)]="draft.name" placeholder="ex: customer_360"></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Squad</mat-label>
          <mat-select [(ngModel)]="draft.squadId">
            <mat-option *ngFor="let squad of allowedSquads()" [value]="squad.id">{{ squad.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Owner</mat-label><input matInput [(ngModel)]="draft.owner"></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="draft.status">
            <mat-option value="draft">Rascunho</mat-option>
            <mat-option value="in_progress">Em andamento</mat-option>
            <mat-option value="waiting_approval">Aguardando aprovação</mat-option>
            <mat-option value="in_production">Em produção</mat-option>
            <mat-option value="completed">Concluído</mat-option>
            <mat-option value="blocked">Bloqueado</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Saúde</mat-label>
          <mat-select [(ngModel)]="draft.health">
            <mat-option value="green">Verde</mat-option>
            <mat-option value="yellow">Amarelo</mat-option>
            <mat-option value="red">Vermelho</mat-option>
            <mat-option value="gray">Cinza</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Progresso (%)</mat-label><input matInput type="number" min="0" max="100" [(ngModel)]="draft.progress"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Pipelines</mat-label><input matInput type="number" min="0" [(ngModel)]="draft.pipelineCount"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Custo mensal estimado</mat-label><input matInput type="number" min="0" [(ngModel)]="draft.monthlyCost"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>LUPs vinculadas</mat-label><input matInput [ngModel]="linkedProjectText" (ngModelChange)="linkedProjectText = $event" placeholder="EA1180, ED2719"></mat-form-field>
        <mat-form-field appearance="outline" class="form-grid__wide"><mat-label>Descrição</mat-label><textarea matInput rows="3" [(ngModel)]="draft.description"></textarea></mat-form-field>
      </div>

      <div class="form-footer">
        <button mat-button type="button" (click)="closeForm()">Cancelar</button>
        <button mat-flat-button color="primary" type="button" [disabled]="!canSave()" (click)="saveProject()"><mat-icon>save</mat-icon> Salvar</button>
      </div>
    </section>

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
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="draft">Rascunho</mat-option>
          <mat-option value="in_progress">Em andamento</mat-option>
          <mat-option value="waiting_approval">Aguardando aprovação</mat-option>
          <mat-option value="in_production">Em produção</mat-option>
          <mat-option value="completed">Concluído</mat-option>
          <mat-option value="blocked">Bloqueado</mat-option>
        </mat-select>
      </mat-form-field>
    </section>

    <section class="lup-table">
      <div class="lup-row lup-row--head">
        <span>LUP</span><span>Tipo</span><span>Squad</span><span>Status</span><span>Saúde</span><span>Progresso</span><span>Pipelines</span><span>Atualizado</span><span></span>
      </div>
      <article class="lup-row" *ngFor="let project of visibleProjects()">
        <div class="main"><strong>{{ project.code }}</strong><span>{{ project.name }}</span></div>
        <span>{{ project.type }}</span>
        <span>{{ org.labelForUnit(project.squadId) }}</span>
        <app-status-badge [status]="project.status" [label]="statusLabel(project.status)"></app-status-badge>
        <app-status-badge [status]="healthStatus(project.health)" [label]="healthLabel(project.health)"></app-status-badge>
        <span>{{ project.progress }}%</span>
        <span>{{ project.pipelineCount }}</span>
        <span>{{ project.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        <div class="actions">
          <button mat-icon-button type="button" matTooltip="Editar" [disabled]="!canManage()" (click)="editProject(project)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button type="button" matTooltip="Excluir" [disabled]="!canManage()" (click)="deleteProject(project)"><mat-icon>delete</mat-icon></button>
        </div>
      </article>
      <div class="empty" *ngIf="!visibleProjects().length">Nenhuma LUP encontrada para os filtros atuais.</div>
    </section>
  `,
  styles: [`
    .filters, .lup-form { margin-bottom: 18px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filters { display: grid; grid-template-columns: minmax(280px, 1fr) 160px 220px; gap: 12px; }
    .form-head, .form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .form-head { margin-bottom: 12px; }
    .form-head div { display: flex; flex-direction: column; gap: 3px; }
    .form-head strong { color: var(--text-primary); }
    .form-head span { color: var(--text-muted); font-size: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 12px; }
    .form-grid__wide { grid-column: 1 / -1; }
    .form-footer { justify-content: flex-end; margin-top: 4px; }
    .lup-table { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }
    .lup-row { display: grid; grid-template-columns: minmax(190px, 1.4fr) 70px 130px 150px 120px 90px 90px 150px 92px; min-width: 1180px; gap: 14px; align-items: center; padding: 13px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .lup-row:last-child { border-bottom: 0; }
    .lup-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .main { display: flex; flex-direction: column; gap: 3px; }
    .main strong { color: var(--text-primary); }
    .main span { color: var(--text-secondary); font-size: 12px; }
    .actions { display: inline-flex; justify-content: flex-end; gap: 2px; }
    .empty { min-width: 1180px; padding: 28px 16px; color: var(--text-muted); font-size: 13px; text-align: center; }
    @media (max-width: 760px) { .filters, .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class LupRegistryComponent {
  readonly org = inject(OrgService);
  private readonly access = inject(AccessService);
  private readonly dialog = inject(MatDialog);

  searchTerm = '';
  typeFilter: 'all' | LupType = 'all';
  statusFilter: 'all' | LupStatus = 'all';
  linkedProjectText = '';
  draft: LupProjectDraft = this.emptyDraft();
  formOpen = signal(false);
  editingId = signal<string | null>(null);

  readonly canManage = computed(() => this.access.can('dev.manageLups'));

  readonly allowedSquads = computed(() => {
    const ids = new Set(this.access.activeSquadIds());
    const squads = this.org.squads().filter(squad => ids.has(squad.id));
    return squads.length ? squads : this.org.squads();
  });

  readonly scopedProjects = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org.projectsForScopes(context.activeScope ? [context.activeScope] : context.scopes, this.access.can('executive.viewGlobal'));
  });

  readonly visibleProjects = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.scopedProjects().filter(project =>
      (this.typeFilter === 'all' || project.type === this.typeFilter)
      && (this.statusFilter === 'all' || project.status === this.statusFilter)
      && (!term
        || project.code.toLowerCase().includes(term)
        || project.name.toLowerCase().includes(term)
        || project.owner.toLowerCase().includes(term)
        || project.description.toLowerCase().includes(term))
    );
  });

  openForm(): void {
    this.editingId.set(null);
    this.draft = this.emptyDraft();
    this.linkedProjectText = '';
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  editProject(project: LupProject): void {
    this.editingId.set(project.id);
    this.draft = { ...project, linkedProjectIds: [...project.linkedProjectIds] };
    this.linkedProjectText = project.linkedProjectIds.join(', ');
    this.formOpen.set(true);
  }

  saveProject(): void {
    if (!this.canSave()) return;
    const id = this.editingId();
    id ? this.org.updateProject(id, this.normalizedDraft()) : this.org.createProject(this.normalizedDraft());
    this.closeForm();
  }

  deleteProject(project: LupProject): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir LUP',
        message: `Deseja excluir a LUP ${project.code}? Esta operação será registrada na auditoria.`,
        confirmText: 'Excluir',
        warn: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.org.deleteProject(project.id);
    });
  }

  canSave(): boolean {
    return this.canManage() && Boolean(this.draft.code.trim() && this.draft.name.trim() && this.draft.description.trim());
  }

  statusLabel(status: LupStatus): string {
    return ({
      draft: 'Rascunho',
      in_progress: 'Em andamento',
      waiting_approval: 'Aguardando aprovação',
      in_production: 'Em produção',
      completed: 'Concluído',
      blocked: 'Bloqueado',
    } as Record<LupStatus, string>)[status];
  }

  healthStatus(health: string): string {
    return ({ green: 'healthy', yellow: 'warning', red: 'critical', gray: 'offline' } as Record<string, string>)[health] ?? 'offline';
  }

  healthLabel(health: string): string {
    return ({ green: 'Verde', yellow: 'Amarelo', red: 'Vermelho', gray: 'Cinza' } as Record<string, string>)[health] ?? health;
  }

  private normalizedDraft(): LupProjectDraft {
    return {
      ...this.draft,
      code: this.draft.code.trim().toUpperCase(),
      name: this.draft.name.trim(),
      description: this.draft.description.trim(),
      owner: this.draft.owner.trim() || this.org.labelForUnit(this.draft.squadId),
      linkedProjectIds: this.splitCsv(this.linkedProjectText).map(item => item.toUpperCase()),
    };
  }

  private emptyDraft(): LupProjectDraft {
    const squadId = this.allowedSquads()[0]?.id || 'squad-a';
    return {
      code: '',
      type: 'ED',
      name: '',
      description: '',
      squadId,
      owner: this.org.labelForUnit(squadId),
      status: 'draft',
      health: 'gray',
      progress: 0,
      pipelineCount: 0,
      monthlyCost: 0,
      linkedProjectIds: [],
    };
  }

  private splitCsv(value: string): string[] {
    return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  }
}
