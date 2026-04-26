import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DemandService } from '../../core/demands/demand.service';
import { DataDemand, DataDemandDraft } from '../../core/demands/demand.model';
import { OrgService } from '../../core/org/org.service';

@Component({
  selector: 'app-rfc-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, PageHeaderComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Central de Demandas" subtitle="Requisitos de dados que podem ser consultados, mantidos e importados em jornadas de projeto" icon="description">
      <button mat-flat-button color="primary" (click)="openForm()"><mat-icon>add</mat-icon> Nova demanda</button>
    </app-page-header>

    <section class="demand-form" *ngIf="formOpen()">
      <div class="form-head">
        <strong>{{ editingId() ? 'Editar demanda' : 'Cadastrar demanda' }}</strong>
        <button mat-icon-button type="button" (click)="closeForm()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Código</mat-label><input matInput [(ngModel)]="draft.code"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Título</mat-label><input matInput [(ngModel)]="draft.title"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Solicitante</mat-label><input matInput [(ngModel)]="draft.requester"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Área</mat-label><input matInput [(ngModel)]="draft.businessArea"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Domínio</mat-label><input matInput [(ngModel)]="draft.domain"></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Squad</mat-label>
          <mat-select [(ngModel)]="draft.squadId">
            <mat-option *ngFor="let squad of org.squads()" [value]="squad.id">{{ squad.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="draft.status">
            <mat-option value="active">Ativa</mat-option>
            <mat-option value="in_review">Em análise</mat-option>
            <mat-option value="approved">Aprovada</mat-option>
            <mat-option value="inactive">Inativa</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Destino esperado</mat-label><input matInput [(ngModel)]="draft.expectedTarget"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>SLA</mat-label><input matInput [(ngModel)]="draft.sla"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Fontes (vírgula)</mat-label><input matInput [ngModel]="draft.sources.join(', ')" (ngModelChange)="draft.sources = splitCsv($event)"></mat-form-field>
        <mat-form-field appearance="outline" class="form-grid__wide"><mat-label>Descrição</mat-label><textarea matInput rows="3" [(ngModel)]="draft.description"></textarea></mat-form-field>
      </div>
      <div class="form-footer">
        <span>Alterações são registradas na trilha de auditoria.</span>
        <button mat-flat-button color="primary" (click)="saveDemand()"><mat-icon>save</mat-icon> Salvar</button>
      </div>
    </section>

    <section class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Buscar</mat-label>
        <input matInput [(ngModel)]="searchTerm" placeholder="Código, título, solicitante ou descrição">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Ativa</mat-option>
          <mat-option value="in_review">Em análise</mat-option>
          <mat-option value="approved">Aprovada</mat-option>
          <mat-option value="inactive">Inativa</mat-option>
        </mat-select>
      </mat-form-field>
    </section>

    <section class="demand-table">
      <div class="demand-row demand-row--head">
        <span>Demanda</span><span>Domínio</span><span>Squad</span><span>Status</span><span>Solicitante</span><span>Descrição</span><span></span>
      </div>
      <article class="demand-row" *ngFor="let demand of visibleDemands()">
        <div class="demand-main"><strong>{{ demand.code }}</strong><span>{{ demand.title }}</span></div>
        <span>{{ demand.domain }}</span>
        <span>{{ org.labelForUnit(demand.squadId) }}</span>
        <app-status-badge [status]="demand.status" [label]="statusLabel(demand.status)"></app-status-badge>
        <span>{{ demand.requester }}</span>
        <span class="desc">{{ demand.description }}</span>
        <div class="actions">
          <button mat-icon-button type="button" matTooltip="Editar" (click)="editDemand(demand)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button type="button" matTooltip="Inativar" [disabled]="demand.status === 'inactive'" (click)="inactivateDemand(demand)"><mat-icon>block</mat-icon></button>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .filters, .demand-form { margin-bottom: 18px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filters { display: grid; grid-template-columns: minmax(280px, 1fr) 220px; gap: 12px; }
    .form-head, .form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .form-head { margin-bottom: 12px; }
    .form-head strong { color: var(--text-primary); }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 12px; }
    .form-grid__wide { grid-column: 1 / -1; }
    .form-footer span { color: var(--text-muted); font-size: 12px; }
    .demand-table { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }
    .demand-row { display: grid; grid-template-columns: minmax(190px, 1.2fr) 120px 130px 130px 160px minmax(280px, 2fr) 92px; min-width: 1120px; gap: 14px; align-items: center; padding: 13px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .demand-row:last-child { border-bottom: 0; }
    .demand-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .demand-main { display: flex; flex-direction: column; gap: 3px; }
    .demand-main strong { color: var(--text-primary); }
    .demand-main span { color: var(--text-secondary); font-size: 12px; }
    .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions { display: inline-flex; justify-content: flex-end; gap: 2px; }
    @media (max-width: 760px) { .filters, .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class RfcListComponent {
  readonly org = inject(OrgService);
  private readonly demands = inject(DemandService);
  searchTerm = '';
  statusFilter = 'all';
  draft: DataDemandDraft = this.emptyDraft();
  formOpen = signal(false);
  editingId = signal<string | null>(null);

  readonly visibleDemands = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.demands.demands().filter(demand =>
      (this.statusFilter === 'all' || demand.status === this.statusFilter)
      && (!term
        || demand.code.toLowerCase().includes(term)
        || demand.title.toLowerCase().includes(term)
        || demand.requester.toLowerCase().includes(term)
        || demand.description.toLowerCase().includes(term))
    );
  });

  openForm(): void {
    this.editingId.set(null);
    this.draft = this.emptyDraft();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  editDemand(demand: DataDemand): void {
    this.editingId.set(demand.id);
    this.draft = {
      code: demand.code,
      title: demand.title,
      description: demand.description,
      requester: demand.requester,
      businessArea: demand.businessArea,
      domain: demand.domain,
      squadId: demand.squadId,
      status: demand.status,
      expectedTarget: demand.expectedTarget,
      sla: demand.sla,
      sources: [...demand.sources],
    };
    this.formOpen.set(true);
  }

  saveDemand(): void {
    if (!this.draft.title.trim()) return;
    const id = this.editingId();
    id ? this.demands.update(id, this.normalizedDraft()) : this.demands.create(this.normalizedDraft());
    this.closeForm();
  }

  inactivateDemand(demand: DataDemand): void {
    this.demands.inactivate(demand.id);
  }

  splitCsv(value: string): string[] {
    return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  }

  statusLabel(status: string): string {
    return ({ active: 'Ativa', in_review: 'Em análise', approved: 'Aprovada', inactive: 'Inativa' } as Record<string, string>)[status] ?? status;
  }

  private normalizedDraft(): DataDemandDraft {
    return {
      ...this.draft,
      title: this.draft.title.trim(),
      description: this.draft.description || 'Demanda cadastrada manualmente.',
      requester: this.draft.requester || 'Solicitante não informado',
      businessArea: this.draft.businessArea || 'Não informado',
      domain: this.draft.domain || 'Dados',
      squadId: this.draft.squadId || this.org.squads()[0]?.id || 'squad-a',
      expectedTarget: this.draft.expectedTarget || 'A definir',
      sla: this.draft.sla || 'A definir',
      sources: this.draft.sources.length ? this.draft.sources : ['A definir'],
    };
  }

  private emptyDraft(): DataDemandDraft {
    return {
      title: '',
      description: '',
      requester: '',
      businessArea: '',
      domain: '',
      squadId: 'squad-a',
      status: 'active',
      expectedTarget: '',
      sla: '',
      sources: [],
    };
  }
}
