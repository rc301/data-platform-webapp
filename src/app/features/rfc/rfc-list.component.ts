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
import { ProjectJourneyStore } from '../dev/project-journey.store';

type StatusFilter = 'all' | DataDemandStatus;
type PeriodFilter = 'all' | 'last-7' | 'last-30' | 'last-90';

/**
 * Central de Demandas — split view.
 *
 * Layout:
 *   • Coluna esquerda: filtros + lista de demandas (50–55% da largura)
 *   • Coluna direita: painel de detalhe da demanda selecionada, em modo
 *                     visualização ou edição (45–50%)
 *
 * Visibilidade:
 *   • PublicViewer (sem dev.viewProjects, com demand.viewOwn) — vê apenas
 *     as demandas que abriu pessoalmente.
 *   • Demais perfis com dev.viewProjects — veem por escopo de acesso.
 *
 * Ações no painel:
 *   • Editar (demand.create)         — entra em modo edição
 *   • Salvar / Descartar             — saem do modo edição
 *   • Cancelar (demand.cancel)       — autosserviço, encerra `cancelled`
 *   • Inativar (demand.inactivate)   — administrativo, encerra `inactive`
 *
 * O ID Projeto associado é derivado do `ProjectJourneyStore` (jornadas
 * que importaram esta demanda) — sem poluir o modelo de `DataDemand`.
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
      <button *ngIf="canCreate()" mat-flat-button color="primary" (click)="startNew()">
        <mat-icon>add</mat-icon> Nova demanda
      </button>
    </app-page-header>

    <section class="filters" aria-label="Filtros de demandas">
      <mat-form-field appearance="outline" class="filters__search">
        <mat-label>Buscar</mat-label>
        <input matInput [(ngModel)]="searchTerm"
               placeholder="ID Demanda, ID Projeto, título, descrição ou solicitante">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Ativas</mat-option>
          <mat-option value="in_review">Em análise</mat-option>
          <mat-option value="approved">Aprovadas</mat-option>
          <mat-option value="cancelled">Canceladas</mat-option>
          <mat-option value="inactive">Inativas</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Domínio</mat-label>
        <mat-select [(ngModel)]="domainFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option *ngFor="let d of domains()" [value]="d">{{ d }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Squad</mat-label>
        <mat-select [(ngModel)]="squadFilter">
          <mat-option value="all">Todas</mat-option>
          <mat-option *ngFor="let s of org.squads()" [value]="s.id">{{ s.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Solicitante</mat-label>
        <mat-select [(ngModel)]="requesterFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option *ngFor="let r of requesters()" [value]="r">{{ r }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Período</mat-label>
        <mat-select [(ngModel)]="periodFilter">
          <mat-option value="all">Sem limite</mat-option>
          <mat-option value="last-7">Últimos 7 dias</mat-option>
          <mat-option value="last-30">Últimos 30 dias</mat-option>
          <mat-option value="last-90">Últimos 90 dias</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>ID Projeto</mat-label>
        <input matInput [(ngModel)]="projectIdFilter" placeholder="ex: ED2741">
      </mat-form-field>
    </section>

    <!-- ========================== Split view =========================== -->
    <section class="split">
      <!-- Lista (esquerda) -->
      <aside class="list-pane" aria-label="Lista de demandas">
        <header class="list-pane__head">
          <strong>{{ filtered().length }} demanda(s)</strong>
          <span>Clique para abrir o painel de detalhes.</span>
        </header>
        <ul class="list">
          <li *ngFor="let d of filtered()"
              class="list__item"
              [class.list__item--active]="selected()?.id === d.id"
              (click)="select(d)">
            <div class="list__main">
              <strong>{{ d.code }} · {{ d.title }}</strong>
              <span class="list__meta">{{ d.domain }} · {{ org.labelForUnit(d.squadId) }} · {{ d.requester }}</span>
            </div>
            <div class="list__right">
              <app-status-badge [status]="badgeStatus(d.status)" [label]="statusLabel(d.status)"></app-status-badge>
              <span class="list__when">{{ d.updatedAt | date:'dd/MM HH:mm' }}</span>
            </div>
          </li>
          <li *ngIf="!filtered().length" class="list__empty">
            Nenhuma demanda encontrada para os filtros atuais.
          </li>
        </ul>
      </aside>

      <!-- Painel (direita) -->
      <section class="detail-pane" aria-live="polite">
        <ng-container *ngIf="selected() as d; else emptyDetail">
          <header class="detail-head">
            <div>
              <span class="detail-head__code">{{ d.code }}</span>
              <h2>{{ editing() ? draft.title : d.title }}</h2>
              <div class="detail-head__meta">
                <app-status-badge [status]="badgeStatus(d.status)" [label]="statusLabel(d.status)"></app-status-badge>
                <span>Atualizada {{ d.updatedAt | date:'dd/MM/yyyy HH:mm' }} por {{ d.updatedBy }}</span>
              </div>
            </div>
            <div class="detail-head__actions">
              <ng-container *ngIf="!editing(); else editingActions">
                <button mat-stroked-button type="button" *ngIf="canEdit(d)" (click)="startEdit(d)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
                <button mat-stroked-button type="button" color="warn" *ngIf="canCancel(d)" (click)="cancelDemand(d)">
                  <mat-icon>do_not_disturb_on</mat-icon> Cancelar
                </button>
                <button mat-stroked-button type="button" *ngIf="canInactivate(d)" (click)="inactivateDemand(d)">
                  <mat-icon>archive</mat-icon> Inativar
                </button>
              </ng-container>
              <ng-template #editingActions>
                <button mat-stroked-button type="button" (click)="discardEdit()">Descartar</button>
                <button mat-flat-button color="primary" type="button" (click)="saveEdit()">
                  <mat-icon>save</mat-icon> Salvar
                </button>
              </ng-template>
            </div>
          </header>

          <!-- Modo visualização -->
          <div class="detail-grid" *ngIf="!editing()">
            <div class="detail-field"><span>Solicitante</span><strong>{{ d.requester }}</strong></div>
            <div class="detail-field"><span>Área de negócio</span><strong>{{ d.businessArea }}</strong></div>
            <div class="detail-field"><span>Domínio</span><strong>{{ d.domain }}</strong></div>
            <div class="detail-field"><span>Squad</span><strong>{{ org.labelForUnit(d.squadId) }}</strong></div>
            <div class="detail-field"><span>SLA</span><strong>{{ d.sla }}</strong></div>
            <div class="detail-field"><span>Destino esperado</span><strong class="mono">{{ d.expectedTarget }}</strong></div>
            <div class="detail-field detail-field--full"><span>Fontes</span><div class="chips"><code *ngFor="let s of d.sources">{{ s }}</code></div></div>
            <div class="detail-field detail-field--full"><span>Descrição</span><p>{{ d.description }}</p></div>
            <div class="detail-field detail-field--full"><span>ID Projeto vinculado</span>
              <div class="chips" *ngIf="linkedProjectIds(d).length; else noLink">
                <code *ngFor="let pid of linkedProjectIds(d)">{{ pid }}</code>
              </div>
              <ng-template #noLink><span class="muted">Sem ID Projeto vinculado</span></ng-template>
            </div>
            <div class="detail-field detail-field--full" *ngIf="d.cancelReason || d.inactiveReason">
              <span>Motivo do encerramento</span>
              <p>{{ d.cancelReason || d.inactiveReason }}</p>
            </div>
          </div>

          <!-- Modo edição -->
          <div class="detail-form" *ngIf="editing()">
            <mat-form-field appearance="outline"><mat-label>Título</mat-label><input matInput [(ngModel)]="draft.title"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Solicitante</mat-label><input matInput [(ngModel)]="draft.requester"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Área</mat-label><input matInput [(ngModel)]="draft.businessArea"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Domínio</mat-label><input matInput [(ngModel)]="draft.domain"></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Squad</mat-label>
              <mat-select [(ngModel)]="draft.squadId">
                <mat-option *ngFor="let s of org.squads()" [value]="s.id">{{ s.name }}</mat-option>
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
            <mat-form-field appearance="outline"><mat-label>SLA</mat-label><input matInput [(ngModel)]="draft.sla"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Destino esperado</mat-label><input matInput [(ngModel)]="draft.expectedTarget"></mat-form-field>
            <mat-form-field appearance="outline" class="detail-form__wide">
              <mat-label>Fontes (separadas por vírgula)</mat-label>
              <input matInput [ngModel]="draft.sources.join(', ')"
                     (ngModelChange)="draft.sources = splitCsv($event)">
            </mat-form-field>
            <mat-form-field appearance="outline" class="detail-form__wide">
              <mat-label>Descrição</mat-label>
              <textarea matInput rows="4" [(ngModel)]="draft.description"></textarea>
            </mat-form-field>
          </div>
        </ng-container>

        <ng-template #emptyDetail>
          <div class="detail-empty">
            <span>Selecione uma demanda na lista para visualizar ou editar.</span>
            <button *ngIf="canCreate()" mat-flat-button color="primary" (click)="startNew()">
              <mat-icon>add</mat-icon> Criar nova demanda
            </button>
          </div>
        </ng-template>
      </section>
    </section>
  `,
  styles: [`
    /* ============== Filtros ============== */
    .filters {
      display: grid;
      grid-template-columns: minmax(280px, 1.4fr) repeat(6, 160px);
      gap: 12px;
      padding: 14px;
      margin-bottom: 14px;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
    }
    .filters__search { grid-column: 1 / 2; }
    @media (max-width: 1500px) { .filters { grid-template-columns: 1fr 1fr 1fr; } .filters__search { grid-column: 1 / -1; } }
    @media (max-width: 760px)  { .filters { grid-template-columns: 1fr; } }

    /* ============== Split layout ============== */
    .split { display: grid; grid-template-columns: minmax(320px, 1.05fr) minmax(420px, 1.25fr); gap: 18px; align-items: flex-start; }
    @media (max-width: 1100px) { .split { grid-template-columns: 1fr; } }

    /* Lista */
    .list-pane { background: var(--bg-surface); border-radius: var(--radius-lg); overflow: hidden; }
    .list-pane__head { padding: 10px 16px; display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 11px; }
    .list-pane__head strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }

    .list { list-style: none; margin: 0; padding: 4px; max-height: calc(100vh - 320px); overflow-y: auto; }
    .list__item {
      display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background .15s ease;
    }
    .list__item:hover { background: var(--bg-elevated); }
    .list__item--active { background: var(--bg-elevated); box-shadow: inset 0 0 0 1px var(--brand-400); }
    .list__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .list__main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .list__meta { color: var(--text-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .list__right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .list__when { color: var(--text-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
    .list__empty { padding: 30px 16px; color: var(--text-muted); font-size: 12px; text-align: center; }

    /* Painel de detalhe */
    .detail-pane { background: var(--bg-surface); border-radius: var(--radius-lg); padding: 20px 22px; min-height: 360px; }
    .detail-empty { display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-muted); font-size: 13px; }

    .detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }
    .detail-head__code { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); letter-spacing: 0.06em; }
    .detail-head h2 { margin: 4px 0 8px; font-size: 18px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
    .detail-head__meta { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 11px; }
    .detail-head__actions { display: flex; gap: 6px; flex-wrap: wrap; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
    .detail-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .detail-field--full { grid-column: 1 / -1; }
    .detail-field span { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .detail-field strong { color: var(--text-primary); font-size: 13px; font-weight: 500; }
    .detail-field strong.mono { font-family: var(--font-mono); font-size: 12px; }
    .detail-field p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    code { font-family: var(--font-mono); font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); }
    .muted { color: var(--text-muted); font-size: 12px; }

    .detail-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .detail-form__wide { grid-column: 1 / -1; }
    @media (max-width: 760px) { .detail-grid, .detail-form { grid-template-columns: 1fr; } }
  `],
})
export class RfcListComponent {
  readonly org = inject(OrgService);
  private readonly demands = inject(DemandService);
  private readonly access = inject(AccessService);
  private readonly auth = inject(AuthService);
  private readonly journeys = inject(ProjectJourneyStore);
  private readonly dialog = inject(MatDialog);

  /* --- Filtros --- */
  searchTerm = '';
  statusFilter: StatusFilter = 'all';
  domainFilter = 'all';
  squadFilter = 'all';
  requesterFilter = 'all';
  periodFilter: PeriodFilter = 'all';
  projectIdFilter = '';

  /* --- Seleção / edição --- */
  readonly selected = signal<DataDemand | null>(null);
  readonly editing  = signal(false);
  draft: DataDemandDraft = this.emptyDraft();

  /* --- Capabilities --- */
  readonly canCreate = computed(() => this.access.can('demand.create'));
  readonly isPublicOnly = computed(() =>
    !this.access.can('dev.viewProjects') && this.access.can('demand.viewOwn'));

  /* --- Domínios e solicitantes do mock para popular dropdowns --- */
  readonly domains    = computed(() => Array.from(new Set(this.demands.demands().map(d => d.domain))).sort());
  readonly requesters = computed(() => Array.from(new Set(this.demands.demands().map(d => d.requester))).sort());

  /* --- Visão filtrada --- */
  readonly scopedDemands = computed(() => {
    const all = this.demands.demands();
    if (this.isPublicOnly()) {
      const me = this.auth.user()?.userPrincipal ?? '';
      return all.filter(d => d.createdBy === me);
    }
    return all;
  });

  readonly filtered = computed<DataDemand[]>(() => {
    const term = this.searchTerm.trim().toLowerCase();
    const projectId = this.projectIdFilter.trim().toUpperCase();
    const cutoff = this.periodCutoffMs();
    return this.scopedDemands().filter(d => {
      if (this.statusFilter !== 'all' && d.status !== this.statusFilter) return false;
      if (this.domainFilter !== 'all' && d.domain !== this.domainFilter) return false;
      if (this.squadFilter !== 'all' && d.squadId !== this.squadFilter) return false;
      if (this.requesterFilter !== 'all' && d.requester !== this.requesterFilter) return false;
      if (cutoff && Date.parse(d.updatedAt) < cutoff) return false;
      if (projectId && !this.linkedProjectIds(d).some(p => p.toUpperCase().includes(projectId))) return false;
      if (term && !this.matchesText(d, term)) return false;
      return true;
    });
  });

  /* --- Cabeçalho contextual --- */
  headerTitle = computed(() => this.isPublicOnly() ? 'Minhas demandas' : 'Demandas');
  headerSubtitle = computed(() =>
    this.isPublicOnly()
      ? 'Abra novas demandas e acompanhe o status das que você criou.'
      : 'Consulte demandas de dados, vincule a projetos (ID Projeto) e acompanhe o ciclo até o atendimento.');

  /* ============= Ações ============= */
  select(d: DataDemand): void {
    if (this.editing()) {
      const proceed = window.confirm('Há edições não salvas. Descartar?');
      if (!proceed) return;
      this.editing.set(false);
    }
    this.selected.set(d);
  }

  startNew(): void {
    if (!this.canCreate()) return;
    this.draft = this.emptyDraft();
    this.selected.set({
      ...this.draft,
      id: 'new',
      code: '—',
      createdAt: new Date().toISOString(),
      createdBy: this.auth.user()?.name ?? '—',
      updatedAt: new Date().toISOString(),
      updatedBy: this.auth.user()?.name ?? '—',
    } as DataDemand);
    this.editing.set(true);
  }

  startEdit(d: DataDemand): void {
    if (!this.canEdit(d)) return;
    this.draft = {
      code: d.code,
      title: d.title,
      description: d.description,
      requester: d.requester,
      businessArea: d.businessArea,
      domain: d.domain,
      squadId: d.squadId,
      status: d.status,
      expectedTarget: d.expectedTarget,
      sla: d.sla,
      sources: [...d.sources],
    };
    this.editing.set(true);
  }

  discardEdit(): void {
    this.editing.set(false);
    if (this.selected()?.id === 'new') this.selected.set(null);
  }

  saveEdit(): void {
    const sel = this.selected();
    if (!sel) return;
    const payload = this.normalizedDraft();
    const saved = sel.id === 'new'
      ? this.demands.create(payload)
      : this.demands.update(sel.id, payload);
    if (saved) this.selected.set(saved);
    this.editing.set(false);
  }

  cancelDemand(d: DataDemand): void {
    if (!this.canCancel(d)) return;
    this.confirmAndAct({
      title: 'Cancelar demanda',
      message: `Cancelar a demanda ${d.code}? Você pode informar um motivo (opcional). A operação será registrada na auditoria.`,
      confirmText: 'Cancelar demanda',
      askReason: true,
    }, reason => {
      this.demands.cancel(d.id, reason);
      const updated = this.demands.demands().find(x => x.id === d.id);
      if (updated) this.selected.set(updated);
    });
  }

  inactivateDemand(d: DataDemand): void {
    if (!this.canInactivate(d)) return;
    this.confirmAndAct({
      title: 'Inativar demanda',
      message: `Inativar administrativamente a demanda ${d.code}? Informe o motivo. A operação será registrada na auditoria.`,
      confirmText: 'Inativar',
      askReason: true,
      warn: true,
    }, reason => {
      this.demands.inactivate(d.id, reason);
      const updated = this.demands.demands().find(x => x.id === d.id);
      if (updated) this.selected.set(updated);
    });
  }

  /* ============= Permissões por linha ============= */
  canEdit(d: DataDemand): boolean {
    if (this.isTerminal(d.status)) return false;
    if (!this.access.can('demand.create')) return false;
    if (this.isPublicOnly()) return d.createdBy === (this.auth.user()?.userPrincipal ?? '');
    return true;
  }

  canCancel(d: DataDemand): boolean {
    if (this.isTerminal(d.status)) return false;
    if (!this.access.can('demand.cancel')) return false;
    if (this.isPublicOnly()) return d.createdBy === (this.auth.user()?.userPrincipal ?? '');
    return true;
  }

  canInactivate(d: DataDemand): boolean {
    if (this.isTerminal(d.status)) return false;
    return this.access.can('demand.inactivate');
  }

  /* ============= Helpers ============= */
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

  badgeStatus(status: DataDemandStatus): string {
    return ({
      active: 'active',
      in_review: 'in_review',
      approved: 'approved',
      cancelled: 'inactive',
      inactive: 'inactive',
    } as Record<DataDemandStatus, string>)[status];
  }

  /** ID Projeto associado: jornadas que importaram esta demanda. */
  linkedProjectIds(d: DataDemand): string[] {
    return this.journeys.journeys()
      .filter(j => j.importedDemandCode === d.code || j.importedDemandId === d.id)
      .flatMap(j => j.lupCodes);
  }

  private isTerminal(status: DataDemandStatus): boolean {
    return status === 'cancelled' || status === 'inactive';
  }

  private matchesText(d: DataDemand, term: string): boolean {
    return [
      d.code, d.title, d.description, d.requester, d.expectedTarget,
      ...d.sources, ...this.linkedProjectIds(d),
    ].filter(Boolean).some(v => v.toLowerCase().includes(term));
  }

  private periodCutoffMs(): number | null {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return ({
      'last-7':  now - 7  * day,
      'last-30': now - 30 * day,
      'last-90': now - 90 * day,
      'all':     null,
    } as const)[this.periodFilter];
  }

  private confirmAndAct(opts: { title: string; message: string; confirmText: string; askReason?: boolean; warn?: boolean }, onConfirm: (reason?: string) => void): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: opts.title, message: opts.message, confirmText: opts.confirmText, warn: !!opts.warn },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
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
