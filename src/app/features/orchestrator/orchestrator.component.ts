import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { PlatformDataService } from '../../core/services/platform-data.service';

@Component({
  selector: 'app-orchestrator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PageHeaderComponent, StatusBadgeComponent, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Orquestrador"
      subtitle="Status operacional dos fluxos agendados, atrasos de SLA e execuções sob atenção"
      icon="device_hub">
      <button mat-stroked-button color="primary" (click)="refresh()">
        <mat-icon>refresh</mat-icon> Atualizar
      </button>
    </app-page-header>

    <section class="health-grid">
      <article class="health-card health-card--ok">
        <span>Saúde geral</span>
        <strong>{{ healthLabel() }}</strong>
        <small>{{ runningCount() }} em execução agora</small>
      </article>
      <article class="health-card">
        <span>Fluxos monitorados</span>
        <strong>{{ totalFlows() }}</strong>
        <small>Glue, Munin SQL e legados</small>
      </article>
      <article class="health-card health-card--warn">
        <span>Atrasos</span>
        <strong>{{ delayedCount() }}</strong>
        <small>fora da janela esperada</small>
      </article>
      <article class="health-card health-card--danger">
        <span>Incidentes</span>
        <strong>{{ failedCount() }}</strong>
        <small>falha ou SLA estourado</small>
      </article>
    </section>

    <section class="board">
      <div class="board__head">
        <div>
          <h3>Agenda de hoje</h3>
          <p>Visão consolidada para sustentação e desenvolvimento acompanharem o estado do orquestrador.</p>
        </div>
      </div>

      <div class="flow-row flow-row--head">
        <span>Fluxo</span>
        <span>Motor</span>
        <span>Squad</span>
        <span>Status</span>
        <span>SLA</span>
        <span>Última execução</span>
      </div>

      <article class="flow-row" *ngFor="let flow of orchestratedFlows()">
        <div class="flow-main">
          <strong>{{ flow.name }}</strong>
          <span>{{ flow.description }}</span>
        </div>
        <span class="engine">{{ flow.type }}</span>
        <span>{{ flow.team }}</span>
        <app-status-badge [status]="flow.status" [label]="statusLabel(flow.status)"></app-status-badge>
        <span>{{ flow.sla || '-' }}</span>
        <span>{{ flow.lastRun.startTime | relativeTime }}</span>
      </article>
    </section>
  `,
  styles: [`
    .health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .health-card { display: flex; flex-direction: column; gap: 6px; padding: 18px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .health-card span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .health-card strong { color: var(--text-primary); font-size: 28px; line-height: 1; }
    .health-card small { color: var(--text-secondary); font-size: 12px; }
    .health-card--ok { box-shadow: inset 3px 0 0 var(--success-500); }
    .health-card--warn { box-shadow: inset 3px 0 0 var(--warning-500); }
    .health-card--danger { box-shadow: inset 3px 0 0 var(--danger-500); }

    .board { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }
    .board__head { display: flex; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
    .board__head h3 { margin: 0; color: var(--text-primary); font-size: 16px; }
    .board__head p { margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; }
    .flow-row { display: grid; grid-template-columns: minmax(280px, 2fr) 120px 120px 130px 180px 150px; gap: 14px; align-items: center; padding: 13px 16px; border-bottom: 1px solid var(--border-subtle); min-width: 980px; }
    .flow-row:last-child { border-bottom: 0; }
    .flow-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .flow-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .flow-main strong { color: var(--text-primary); font-size: 14px; }
    .flow-main span { color: var(--text-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .engine { display: inline-flex; width: fit-content; padding: 3px 8px; border-radius: 6px; background: var(--bg-app); color: var(--text-secondary); font-size: 11px; font-weight: 800; text-transform: uppercase; }
  `],
})
export class OrchestratorComponent {
  private readonly data = inject(PlatformDataService);

  readonly orchestratedFlows = computed(() =>
    this.data.pipelines().filter(flow => flow.type === 'Munin' || flow.schedule.toLowerCase() !== 'manual'),
  );
  readonly totalFlows = computed(() => this.orchestratedFlows().length);
  readonly runningCount = computed(() => this.orchestratedFlows().filter(flow => flow.status === 'running').length);
  readonly delayedCount = computed(() => this.orchestratedFlows().filter(flow => flow.status === 'delayed').length);
  readonly failedCount = computed(() => this.orchestratedFlows().filter(flow => flow.status === 'failed').length);
  readonly healthLabel = computed(() => this.failedCount() > 0 ? 'Degradado' : this.delayedCount() > 0 ? 'Atenção' : 'Saudável');

  refresh(): void {
    this.data.refreshOperationalSnapshot();
  }

  statusLabel(status: string): string {
    return ({
      pending: 'Pendente',
      running: 'Executando',
      completed: 'Completado',
      failed: 'Falha',
      delayed: 'Atrasado',
      offline: 'Desligado',
    } as Record<string, string>)[status] ?? status;
  }
}
