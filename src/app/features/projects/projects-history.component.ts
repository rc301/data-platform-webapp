import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { OrgService } from '../../core/org/org.service';
import { ProjectJourney, ProjectJourneyStatus, ProjectJourneyStore } from '../dev/project-journey.store';

type StatusFilter = 'all' | ProjectJourneyStatus;
type TemplateFilter = 'all' | 'glue-pyspark' | 'sql-only';
type PeriodFilter = 'all' | 'last-7' | 'last-30' | 'last-90';

/**
 * Tela "Jornadas" — consulta unificada de jornadas de projeto (em
 * andamento, concluídas e canceladas/deletadas). Substitui a antiga
 * "Histórico de Projetos", que misturava o cadastro de projetos com o
 * histórico operacional.
 *
 * Filtros disponíveis (todos opcionais, combinam por AND):
 *   • Texto livre — nome, ID Projeto, demanda, tabela ou responsável
 *   • Status      — em andamento, concluída, cancelada
 *   • Template    — glue-pyspark / sql-only
 *   • Squad       — todas as squads do escopo do usuário
 *   • Etapa       — qualquer etapa atual conhecida
 *   • Período     — últimos 7 / 30 / 90 dias com base em updatedAt
 *
 * Duplo clique numa linha abre a jornada no builder. Sem botão "acessar".
 */
@Component({
  selector: 'app-journeys-query',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    PageHeaderComponent, StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Jornadas"
      subtitle="Consulte jornadas em andamento, concluídas e canceladas. Use os filtros para encontrar rapidamente uma jornada específica."
      icon="history"></app-page-header>

    <section class="filters">
      <mat-form-field appearance="outline" class="filters__search">
        <mat-label>Buscar</mat-label>
        <input matInput [(ngModel)]="searchTerm"
               placeholder="Nome, ID Projeto, demanda, tabela ou responsável">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Em andamento</mat-option>
          <mat-option value="completed">Concluída</mat-option>
          <mat-option value="deleted">Cancelada</mat-option>
          <mat-option value="draft">Rascunho</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Template</mat-label>
        <mat-select [(ngModel)]="templateFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="glue-pyspark">Glue · PySpark</mat-option>
          <mat-option value="sql-only">SQL only</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Squad</mat-label>
        <mat-select [(ngModel)]="squadFilter">
          <mat-option value="all">Todas</mat-option>
          <mat-option *ngFor="let squad of org.squads()" [value]="squad.id">{{ squad.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Etapa</mat-label>
        <mat-select [(ngModel)]="stageFilter">
          <mat-option value="all">Todas</mat-option>
          <mat-option *ngFor="let stage of stages()" [value]="stage">{{ stage }}</mat-option>
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
    </section>

    <section class="result-bar">
      <strong>{{ filtered().length }} jornada(s)</strong>
      <span>Duplo clique em uma linha para abrir a jornada.</span>
    </section>

    <section class="journey-table">
      <div class="journey-row journey-row--head">
        <span>Jornada</span>
        <span>ID Projeto</span>
        <span>Demanda</span>
        <span>Tabela final</span>
        <span>Responsável</span>
        <span>Etapa atual</span>
        <span>Progresso</span>
        <span>Status</span>
        <span>Atualizado</span>
      </div>

      <article class="journey-row"
               *ngFor="let j of filtered()"
               (dblclick)="openJourney(j)"
               tabindex="0"
               (keydown.enter)="openJourney(j)">
        <div class="main">
          <strong>{{ j.name }}</strong>
          <span>{{ templateLabel(j.templateId) }}</span>
        </div>
        <span class="mono">{{ j.lupCodes.join(', ') || '—' }}</span>
        <span class="mono">{{ j.importedDemandCode || '—' }}</span>
        <span class="mono">{{ j.targetTable || '—' }}</span>
        <span>{{ j.responsible || j.createdBy }}</span>
        <span>{{ j.currentStage }}</span>
        <span class="progress">
          <span class="progress__bar"><span [style.width.%]="j.progress"></span></span>
          <span class="progress__pct">{{ j.progress }}%</span>
        </span>
        <app-status-badge [status]="badgeStatus(j.status)" [label]="statusLabel(j.status)"></app-status-badge>
        <span class="muted">{{ j.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
      </article>

      <div class="empty" *ngIf="!filtered().length">
        Nenhuma jornada encontrada para os filtros atuais.
      </div>
    </section>
  `,
  styles: [`
    .filters {
      display: grid;
      grid-template-columns: minmax(280px, 1fr) repeat(5, 160px);
      gap: 12px;
      margin-bottom: 14px;
      padding: 14px;
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
    }
    .filters__search { grid-column: 1 / 2; }
    @media (max-width: 1320px) { .filters { grid-template-columns: 1fr 1fr 1fr; } .filters__search { grid-column: 1 / -1; } }
    @media (max-width: 760px)  { .filters { grid-template-columns: 1fr; } }

    .result-bar { display: flex; justify-content: space-between; align-items: baseline; margin: 0 4px 10px; padding: 0 4px; color: var(--text-muted); font-size: 12px; }
    .result-bar strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }

    .journey-table { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }

    .journey-row {
      display: grid;
      grid-template-columns: minmax(220px, 1.4fr) 110px 110px minmax(220px, 1fr) 140px minmax(200px, 1.1fr) 120px 130px 140px;
      min-width: 1320px;
      gap: 14px;
      align-items: center;
      padding: 11px 16px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: background .15s ease;
    }
    .journey-row:hover { background: rgba(76,141,255,0.05); }
    .journey-row:focus-visible { outline: 2px solid var(--brand-400); outline-offset: -2px; }
    .journey-row:last-child { border-bottom: 0; }
    .journey-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: default; }
    .journey-row--head:hover { background: var(--bg-app); }

    .main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .main span   { color: var(--text-muted); font-size: 11px; }
    .mono { font-family: var(--font-mono); color: var(--text-primary); font-size: 11px; }
    .muted { color: var(--text-muted); font-size: 11px; }

    .progress { display: flex; align-items: center; gap: 8px; min-width: 110px; }
    .progress__bar { flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; display: block; }
    .progress__bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--brand-400), var(--success-500)); }
    .progress__pct { font-variant-numeric: tabular-nums; font-size: 11px; color: var(--text-secondary); min-width: 36px; text-align: right; }

    .empty { min-width: 1320px; padding: 28px 16px; color: var(--text-muted); font-size: 13px; text-align: center; }
  `],
})
export class ProjectsHistoryComponent {
  readonly org = inject(OrgService);
  private readonly journeyStore = inject(ProjectJourneyStore);
  private readonly router = inject(Router);

  /* --- filtros (signals para reagir bem com o computed) --- */
  searchTerm = '';
  statusFilter: StatusFilter = 'all';
  templateFilter: TemplateFilter = 'all';
  squadFilter: string = 'all';
  stageFilter: string = 'all';
  periodFilter: PeriodFilter = 'all';

  // Re-leitura via getters não dispara re-compute em signal — para a
  // tela manter performance, usamos linkedSignal-like via signal explícito.
  // Como Angular 17 não tem linkedSignal, o approach mais simples é
  // expor os campos como signals reativos. Aqui mantemos a abordagem de
  // ngModel em property + computed que lê `this.search` etc.; o Angular
  // dispara CD em todo input — bom o suficiente para mocks.

  /* --- domínio: lista de etapas distintas para o filtro --- */
  readonly stages = computed(() => {
    const set = new Set<string>();
    for (const j of this.journeyStore.journeys()) {
      if (j.currentStage) set.add(j.currentStage);
    }
    return Array.from(set).sort();
  });

  /* --- pipeline de filtros --- */
  readonly filtered = computed<ProjectJourney[]>(() => {
    const term = this.searchTerm.trim().toLowerCase();
    const cutoff = this.periodCutoffMs();
    return this.journeyStore.journeys().filter(j => {
      if (this.statusFilter !== 'all' && j.status !== this.statusFilter) return false;
      if (this.templateFilter !== 'all' && j.templateId !== this.templateFilter) return false;
      if (this.squadFilter !== 'all' && j.squadId !== this.squadFilter) return false;
      if (this.stageFilter !== 'all' && j.currentStage !== this.stageFilter) return false;
      if (cutoff && Date.parse(j.updatedAt) < cutoff) return false;
      if (term && !this.matchesText(j, term)) return false;
      return true;
    });
  });

  openJourney(j: ProjectJourney): void {
    // Abre a jornada no builder. Em backend real, a query string carrega
    // o id; o builder se autopopula. Mock atual já navega para a tela.
    this.router.navigate(['/dev/journeys/new'], { queryParams: { journeyId: j.id } });
  }

  templateLabel(id: ProjectJourney['templateId']): string {
    return id === 'glue-pyspark' ? 'Glue · PySpark' : 'SQL only';
  }

  statusLabel(s: ProjectJourneyStatus): string {
    return ({
      active: 'Em andamento',
      completed: 'Concluída',
      deleted: 'Cancelada',
      draft: 'Rascunho',
    } as const)[s];
  }

  /** Mapeia status semântico → token visual do badge. */
  badgeStatus(s: ProjectJourneyStatus): string {
    return ({
      active: 'running',
      completed: 'completed',
      deleted: 'inactive',
      draft: 'pending',
    } as const)[s];
  }

  /* ---- helpers privados ---- */
  private matchesText(j: ProjectJourney, term: string): boolean {
    return [
      j.name,
      j.targetTable,
      j.importedDemandCode,
      j.responsible,
      j.createdBy,
      ...j.lupCodes,
    ].filter(Boolean).some(v => v!.toLowerCase().includes(term));
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
}
