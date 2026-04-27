import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DemandService } from '../../core/demands/demand.service';
import { DataDemand, DataDemandDraft, DataDemandStatus } from '../../core/demands/demand.model';
import { OrgService } from '../../core/org/org.service';
import { AccessService } from '../../core/access/access.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Central de Demandas (RFCs).
 *
 * Visibilidade:
 *   • PublicViewer (sem dev.viewProjects, com demand.viewOwn) — vê apenas
 *     as demandas que abriu pessoalmente.
 *   • Demais perfis com dev.viewProjects — veem por escopo de acesso
 *     (squad / coord / gerência), conforme `OrgService`.
 *
 * Ações:
 *   • Editar (demand.create)
 *   • Cancelar (demand.cancel) — autosserviço, encerra como `cancelled`
 *   • Inativar (demand.inactivate) — administrativo, encerra como `inactive`
 *   Ambos preservam histórico para auditoria.
 */
@Component({
  selector: 'app-rfc-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule, MatDialogModule,
    PageHeaderComponent, StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="headerTitle()" [subtitle]="headerSubtitle()" icon="description">
      <button *ngIf="canCreate()" mat-flat-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Nova demanda
      </button>
    </app-page-header>

    <section class="demand-form" *ngIf="formOpen()">
      <div class="form-head">
        <strong>{{ editingId() ? 'Editar demanda' : 'Cadastrar demanda' }}</strong>
        <button mat-icon-button type="button" matTooltip="Fechar" (click)="closeForm()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Código</mat-label><input matInput [(ngModel)]="draft.code" placeholder="Será gerado se vazio"></mat-form-field>
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
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Destino esperado</mat-label><input matInput [(ngModel)]="draft.expectedTarget"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>SLA</mat-label><input matInput [(ngModel)]="draft.sla"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Fontes (separadas por vírgula)</mat-label><input matInput [ngModel]="draft.sources.join(', ')" (ngModelChange)="draft.sources = splitCsv($event)"></mat-form-field>
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
          <mat-option value="active">Ativas (em andamento)</mat-option>
          <mat-option value="all">Todos</mat-option>
          <mat-option value="in_review">Em análise</mat-option>
          <mat-option value="approved">Aprovadas</mat-option>
          <mat-option value="cancelled">Canceladas</mat-option>
          <mat-option value="inactive">Inativas</mat-option>
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
        <app-status-badge [status]="badgeStatus(demand.status)" [label]="statusLabel(demand.status)"></app-status-badge>
        <span>{{ demand.requester }}</span>
        <span class="desc">{{ demand.description }}</span>
        <div class="actions">
          <button mat-icon-button type="button" matTooltip="Editar" [disabled]="!canEdit(demand)" (click)="editDemand(demand)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button type="button" matTooltip="Cancelar (autosserviço)" [disabled]="!canCancel(demand)" (click)="cancelDemand(demand)"><mat-icon>do_not_disturb_on</mat-icon></button>
          <button mat-icon-button type="button" matTooltip="Inativar (administrativo)" [disabled]="!canInactivate(demand)" (click)="inactivateDemand(demand)"><mat-icon>archive</mat-icon></button>
        </div>
      </article>
      <div class="empty" *ngIf="!visibleDemands().length">
        Nenhuma demanda encontrada para os filtros atuais.
      </div>
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
    .demand-row { display: grid; grid-template-columns: minmax(190px, 1.2fr) 120px 130px 130px 160px minmax(280px, 2fr) 132px; min-width: 1140px; gap: 14px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .demand-row:last-child { border-bottom: 0; }
    .demand-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .demand-main { display: flex; flex-direction: column; gap: 2px; }
    .demand-main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .demand-main span { color: var(--text-muted); font-size: 12px; }
    .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions { display: inline-flex; justify-content: flex-end; gap: 0; }
    .empty { padding: 28px 16px; color: var(--text-muted); font-size: 13px; text-align: center; }
    @media (max-width: 760px) { .filters, .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class RfcListComponent {
  readonly org = inject(OrgService);
  private readonly demands = inject(DemandService);
  private readonly access = inject(AccessService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  searchTerm = '';
  /** Default 'active' agrega "em andamento" — o caso mais comum de uso. */
  statusFilter: 'all' | DataDemandStatus = 'active';
  formOpen = signal(false);
  editingId = signal<string | null>(null);
  draft: DataDemandDraft = this.emptyDraft();

  /* ============================================================
     Capabilities — UI esconde controles, mas o backend (futuro) é
     a fonte de verdade. Nunca confiar só no frontend para autorizar.
     ============================================================ */
  readonly canCreate = computed(() => this.access.can('demand.create'));
  readonly isPublicOnly = computed(() =>
    !this.access.can('dev.viewProjects') && this.access.can('demand.viewOwn'));

  /* ============================================================
     Visibilidade dos registros
     ============================================================ */
  /** Lista base após aplicação do escopo do usuário. */
  readonly scopedDemands = computed(() => {
    const all = this.demands.demands();
    if (this.isPublicOnly()) {
      const me = this.auth.user()?.userPrincipal ?? '';
      return all.filter(d => d.createdBy === me);
    }
    // Demais perfis: filtragem por escopo (squad/coord/gerência) é feita
    // pelo backend; no mock atual, dev.viewProjects vê tudo.
    return all;
  });

  readonly visibleDemands = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.scopedDemands().filter(demand =>
      (this.statusFilter === 'all' || demand.status === this.statusFilter)
      && (!term
        || demand.code.toLowerCase().includes(term)
        || demand.title.toLowerCase().includes(term)
        || demand.requester.toLowerCase().includes(term)
        || demand.description.toLowerCase().includes(term))
    );
  });

  /* ============================================================
     Cabeçalho contextual
     ============================================================ */
  headerTitle = computed(() => this.isPublicOnly() ? 'Minhas demandas' : 'Central de Demandas');
  headerSubtitle = computed(() =>
    this.isPublicOnly()
      ? 'Abra novas demandas e acompanhe o status das que você criou.'
      : 'Requisitos de dados que podem ser consultados, mantidos e importados em jornadas de projeto.');

  /* ============================================================
     Ações
     ============================================================ */
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
    if (!this.canEdit(demand)) return;
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

  cancelDemand(demand: DataDemand): void {
    if (!this.canCancel(demand)) return;
    this.confirmAndAct({
      title: 'Cancelar demanda',
      message: `Cancelar a demanda ${demand.code}? Você pode informar um motivo (opcional). A operação será registrada na auditoria.`,
      confirmText: 'Cancelar demanda',
      askReason: true,
    }, reason => this.demands.cancel(demand.id, reason));
  }

  inactivateDemand(demand: DataDemand): void {
    if (!this.canInactivate(demand)) return;
    this.confirmAndAct({
      title: 'Inativar demanda',
      message: `Inativar administrativamente a demanda ${demand.code}? Informe o motivo. A operação será registrada na auditoria.`,
      confirmText: 'Inativar',
      askReason: true,
      warn: true,
    }, reason => this.demands.inactivate(demand.id, reason));
  }

  /* ============================================================
     Permissões por linha
     ============================================================ */
  canEdit(demand: DataDemand): boolean {
    if (this.isTerminal(demand.status)) return false;
    if (!this.access.can('demand.create')) return false;
    if (this.isPublicOnly()) return demand.createdBy === (this.auth.user()?.userPrincipal ?? '');
    return true;
  }

  canCancel(demand: DataDemand): boolean {
    if (this.isTerminal(demand.status)) return false;
    if (!this.access.can('demand.cancel')) return false;
    if (this.isPublicOnly()) return demand.createdBy === (this.auth.user()?.userPrincipal ?? '');
    return true;
  }

  canInactivate(demand: DataDemand): boolean {
    if (this.isTerminal(demand.status)) return false;
    return this.access.can('demand.inactivate');
  }

  private isTerminal(status: DataDemandStatus): boolean {
    return status === 'cancelled' || status === 'inactive';
  }

  /* ============================================================
     Helpers
     ============================================================ */
  splitCsv(value: string): string[] {
    return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  }

  statusLabel(status: DataDemandStatus): string {
    return ({
      active: 'Ativa',
      in_review: 'Em análise',
      approved: 'Aprovada',
      cancelled: 'Cancelada',
      inactive: 'Inativa',
    } as Record<DataDemandStatus, string>)[status];
  }

  /** Mapeia status semântico → token visual de badge. */
  badgeStatus(status: DataDemandStatus): string {
    return ({
      active: 'active',
      in_review: 'in_review',
      approved: 'approved',
      cancelled: 'inactive',
      inactive: 'inactive',
    } as Record<DataDemandStatus, string>)[status];
  }

  private confirmAndAct(opts: { title: string; message: string; confirmText: string; askReason?: boolean; warn?: boolean }, onConfirm: (reason?: string) => void): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: opts.title, message: opts.message, confirmText: opts.confirmText, warn: !!opts.warn },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      // ConfirmDialog atual não captura motivo livre — usamos prompt() simples
      // como placeholder para a UX detalhada que virá com o componente próprio.
      const reason = opts.askReason ? (window.prompt('Motivo (opcional):') ?? undefined) : undefined;
      onConfirm(reason || undefined);
    });
  }

  private normalizedDraft(): DataDemandDraft {
    return {
      ...this.draft,
      title: this.draft.title.trim(),
      description: this.draft.description || 'Demanda cadastrada manualmente.',
      requester: this.draft.requester || this.auth.user()?.name || 'Solicitante não informado',
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
      requester: this.auth.user()?.name ?? '',
      businessArea: '',
      domain: '',
      squadId: this.org.squads()[0]?.id ?? 'squad-a',
      status: 'active',
      expectedTarget: '',
      sla: '',
      sources: [],
    };
  }
}
