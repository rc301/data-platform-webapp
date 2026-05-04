import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UiCardComponent, UiBadgeComponent, UiButtonComponent,
  UiFarolComponent, UiStatComponent, FarolStatus,
} from '../../../shared/ui';
import { JobRow } from '../../../core/models';
import { AccessService } from '../../../core/access/access.service';
import { OrgService } from '../../../core/org/org.service';
import { PlatformDataService } from '../../../core/services/platform-data.service';

type FilterStatus = 'all' | FarolStatus;

/**
 * Container de Sustentação — painel operacional com faróis.
 * Composto exclusivamente por UI primitives desacoplados.
 */
@Component({
  selector: 'app-jobs-board',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    UiCardComponent, UiBadgeComponent, UiButtonComponent,
    UiFarolComponent, UiStatComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      Header da seção é responsabilidade do OpsShellComponent (cabeçalho
      compartilhado entre tabs). Aqui só renderizamos o conteúdo do tab.
    -->
    <div class="board-actions">
      <ui-button variant="ghost" icon="↻" (clicked)="refresh()">Atualizar agora</ui-button>
      <ui-button variant="secondary">Configurar alertas</ui-button>
    </div>

    <!-- Faróis (clicáveis = filtro) -->
    <div class="farol-grid">
      <button class="farol-card" [class.farol-card--selected]="filter() === 'green'" (click)="setFilter('green')">
        <span class="farol-card__count">{{ count('green') }}</span>
        <span class="farol-card__farol"><ui-farol status="green" label="Concluídos hoje" /></span>
        <span class="farol-card__hint">Já executou hoje dentro do esperado.</span>
      </button>
      <button class="farol-card" [class.farol-card--selected]="filter() === 'yellow'" (click)="setFilter('yellow')">
        <span class="farol-card__count">{{ count('yellow') }}</span>
        <span class="farol-card__farol"><ui-farol status="yellow" label="Atrasados" /></span>
        <span class="farol-card__hint">Passou da janela esperada — ainda dentro do SLA.</span>
      </button>
      <button class="farol-card" [class.farol-card--selected]="filter() === 'red'" (click)="setFilter('red')">
        <span class="farol-card__count">{{ count('red') }}</span>
        <span class="farol-card__farol"><ui-farol status="red" label="SLA estourado" /></span>
        <span class="farol-card__hint">Não executou ou falhou após o SLA — incidente.</span>
      </button>
      <button class="farol-card" [class.farol-card--selected]="filter() === 'gray'" (click)="setFilter('gray')">
        <span class="farol-card__count">{{ count('gray') }}</span>
        <span class="farol-card__farol"><ui-farol status="gray" label="Aguardando janela" /></span>
        <span class="farol-card__hint">Ainda não passou da janela esperada.</span>
      </button>
    </div>

    <!-- KPIs -->
    <div class="stats-row">
      <ui-stat label="Jobs monitorados" [value]="total()" />
      <ui-stat label="Saúde da plataforma" [value]="healthPct() + '%'" trend="flat" delta="—" deltaPeriod="janela 24h" />
      <ui-stat label="Incidentes abertos" [value]="count('red')" trend="up" delta="+1" deltaPeriod="vs. ontem" />
      <ui-stat label="Tempo médio de detecção" value="3 min" hint="janela 7d" />
    </div>

    <!-- Tabela -->
    <ui-card [padded]="false">
      <div card-actions>
        <div class="filter-bar">
          <input class="filter-bar__search" placeholder="Buscar por nome ou squad…" [(ngModel)]="searchTerm" (ngModelChange)="searchSig.set($event)" />
          <select class="filter-bar__select" [(ngModel)]="squadFilter" (ngModelChange)="squadSig.set($event)">
            <option value="all">Todas as squads</option>
            <option *ngFor="let s of squads()" [value]="s">{{ s }}</option>
          </select>
          <ui-button *ngIf="filter() !== 'all'" variant="ghost" size="sm" (clicked)="setFilter('all')">Limpar farol</ui-button>
        </div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th class="tbl__farol-col">Farol</th>
            <th>Job</th>
            <th>Squad</th>
            <th>Tipo</th>
            <th>Janela esperada</th>
            <th>SLA</th>
            <th>Última execução</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let job of visible()" [class.tbl__row--alert]="job.status === 'red'">
            <td><ui-farol [status]="job.status" /></td>
            <td class="tbl__name">{{ job.name }}</td>
            <td>{{ job.squad }}</td>
            <td><ui-badge tone="neutral">{{ job.type }}</ui-badge></td>
            <td class="tbl__mono">{{ job.expectedStartLocal }}</td>
            <td class="tbl__mono">{{ job.slaDeadlineLocal }}</td>
            <td>
              <span *ngIf="job.lastRunAt; else noRun" [class]="'last-run last-run--' + (job.lastRunStatus || '')">
                {{ formatTime(job.lastRunAt) }} · {{ statusLabel(job.lastRunStatus) }}
              </span>
              <ng-template #noRun><span class="tbl__muted">— não executou hoje</span></ng-template>
            </td>
            <td class="tbl__notes">{{ job.notes || '—' }}</td>
          </tr>
          <tr *ngIf="visible().length === 0">
            <td colspan="8" class="tbl__empty">Nenhum job para o filtro atual.</td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .board-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px; }
    .farol-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .farol-card {
      display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
      padding: 18px 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      cursor: pointer;
      text-align: left;
      font: inherit; color: inherit;
      transition: border-color .15s ease, transform .15s ease, background .15s ease;
    }
    .farol-card:hover { border-color: var(--border-strong); transform: translateY(-1px); }
    .farol-card--selected { border-color: var(--brand-400); box-shadow: 0 0 0 1px var(--brand-400) inset; background: var(--bg-elevated); }
    .farol-card__count { font-size: 32px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
    .farol-card__farol { display: inline-flex; }
    .farol-card__hint { font-size: 12px; color: var(--text-muted); }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 8px 0 24px; }

    .filter-bar { display: flex; align-items: center; gap: 8px; }
    .filter-bar__search, .filter-bar__select {
      background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md);
      padding: 8px 12px; color: var(--text-primary); font: inherit; font-size: 13px;
      outline: none; min-width: 200px;
    }
    .filter-bar__search:focus, .filter-bar__select:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }

    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl thead th {
      text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-app); position: sticky; top: 0;
    }
    .tbl__farol-col { width: 168px; }
    .tbl tbody td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); vertical-align: middle; }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl tbody tr:hover { background: rgba(76,141,255,0.04); }
    .tbl__row--alert { background: rgba(229,72,77,0.04); }
    .tbl__row--alert:hover { background: rgba(229,72,77,0.08); }
    .tbl__name { color: var(--text-primary); font-weight: 600; }
    .tbl__mono { font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); }
    .tbl__muted { color: var(--text-muted); }
    .tbl__notes { color: var(--text-secondary); max-width: 360px; }
    .tbl__empty { padding: 32px; text-align: center; color: var(--text-muted); font-style: italic; }

    .last-run--success { color: var(--success-500); font-weight: 500; }
    .last-run--failed  { color: var(--danger-500); font-weight: 500; }
    .last-run--running { color: var(--info-500); font-weight: 500; }

    @media (max-width: 1100px) {
      .farol-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class JobsBoardComponent {
  private readonly data = inject(PlatformDataService);
  private readonly access = inject(AccessService);
  private readonly org = inject(OrgService);
  private readonly jobs = signal<JobRow[]>(this.accessibleJobs());
  protected readonly searchSig = signal('');
  protected readonly squadSig = signal<string>('all');
  private readonly filterSig = signal<FilterStatus>('all');

  searchTerm = '';
  squadFilter: string = 'all';

  readonly filter = this.filterSig.asReadonly();

  readonly squads = computed(() => Array.from(new Set(this.jobs().map(j => j.squad))).sort());

  readonly total = computed(() => this.jobs().length);

  readonly visible = computed(() => {
    const list = this.jobs();
    const f = this.filterSig();
    const term = this.searchSig().trim().toLowerCase();
    const squad = this.squadSig();
    return list.filter(j => {
      if (f !== 'all' && j.status !== f) return false;
      if (squad !== 'all' && j.squad !== squad) return false;
      if (term && !(`${j.name} ${j.squad}`.toLowerCase().includes(term))) return false;
      return true;
    });
  });

  readonly healthPct = computed(() => {
    const t = this.total();
    if (!t) return 0;
    const ok = this.count('green');
    return Math.round((ok / t) * 100);
  });

  count(status: FarolStatus): number {
    return this.jobs().filter(j => j.status === status).length;
  }

  setFilter(s: FilterStatus): void { this.filterSig.set(s); }

  refresh(): void {
    this.data.refreshOperationalSnapshot();
    this.jobs.set([...this.accessibleJobs()]);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  statusLabel(s?: 'success' | 'failed' | 'running'): string {
    return s === 'success' ? 'OK' : s === 'failed' ? 'FALHOU' : s === 'running' ? 'EM EXECUÇÃO' : '—';
  }

  private accessibleJobs(): JobRow[] {
    if (this.access.can('executive.viewGlobal')) return this.data.jobs();
    const squadLabels = new Set(this.access.activeSquadIds().map(id => this.org.labelForUnit(id)));
    return this.data.jobs().filter(job => squadLabels.has(job.squad));
  }
}
