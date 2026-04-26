import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PlatformDataService } from '../../../core/services/platform-data.service';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Custos de execução"
      subtitle="Análise pontual de custo por execução de pipeline de dados, sem agregações globais incompletas"
      icon="attach_money">
    </app-page-header>

    <section class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Pipeline</mat-label>
        <mat-select [(ngModel)]="pipelineFilter">
          <mat-option value="all">Todas com acesso</mat-option>
          <mat-option *ngFor="let name of pipelineNames()" [value]="name">{{ name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Job run</mat-label>
        <input matInput placeholder="run-2a" [(ngModel)]="runFilter">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Motor</mat-label>
        <mat-select [(ngModel)]="engineFilter">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="GlueJob">GlueJob</mat-option>
          <mat-option value="Munin">Munin SQL</mat-option>
          <mat-option value="CDP">CDP</mat-option>
          <mat-option value="Phoenix">Phoenix</mat-option>
          <mat-option value="Outros">Outros</mat-option>
        </mat-select>
      </mat-form-field>
    </section>

    <section class="cost-table">
      <div class="cost-row cost-row--head">
        <span>Pipeline</span><span>Run</span><span>Motor</span><span>Duração</span><span>Registros</span><span>Custo</span><span>Discriminação</span>
      </div>
      <article class="cost-row" *ngFor="let item of visibleCosts()">
        <div class="main">
          <strong>{{ item.pipelineName }}</strong>
          <span>{{ item.startedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <code>{{ item.runId }}</code>
        <span class="engine">{{ item.engine }}</span>
        <span>{{ item.durationMinutes }} min</span>
        <span>{{ item.recordsProcessed ?? '-' | number }}</span>
        <strong *ngIf="item.hasDiscriminatedCost; else noCost">US$ {{ item.costUsd | number:'1.2-2' }}</strong>
        <ng-template #noCost><span class="missing">Sem custo discriminado</span></ng-template>
        <span class="breakdown" *ngIf="item.hasDiscriminatedCost; else noBreakdown">
          Compute {{ item.costBreakdown?.computeUsd | number:'1.2-2' }} · Orch {{ item.costBreakdown?.orchestrationUsd | number:'1.2-2' }} · Logs {{ item.costBreakdown?.logsUsd | number:'1.2-2' }}
        </span>
        <ng-template #noBreakdown><span class="missing">{{ item.note || 'Informação não disponível para este run.' }}</span></ng-template>
      </article>
    </section>
  `,
  styles: [`
    .filters { display: grid; grid-template-columns: minmax(240px, 1fr) 220px 180px; gap: 12px; margin-bottom: 18px; padding: 14px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .cost-table { border-radius: var(--radius-lg); background: var(--bg-surface); overflow-x: auto; }
    .cost-row { display: grid; grid-template-columns: minmax(240px, 2fr) 130px 110px 100px 110px 150px minmax(280px, 2fr); gap: 12px; align-items: center; min-width: 1120px; padding: 13px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .cost-row:last-child { border-bottom: 0; }
    .cost-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .main strong { color: var(--text-primary); }
    .main span { color: var(--text-muted); font-size: 12px; }
    code { width: fit-content; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); }
    .engine { width: fit-content; padding: 3px 8px; border-radius: 6px; background: var(--bg-app); color: var(--text-secondary); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .missing { color: var(--text-muted); font-style: italic; }
    .breakdown { color: var(--text-secondary); font-size: 12px; }
    @media (max-width: 760px) { .filters { grid-template-columns: 1fr; } }
  `],
})
export class CostsComponent {
  private readonly data = inject(PlatformDataService);

  pipelineFilter = 'all';
  runFilter = '';
  engineFilter = 'all';

  readonly pipelineNames = computed(() => Array.from(new Set(this.data.pipelineRunCosts().map(item => item.pipelineName))).sort());
  readonly visibleCosts = computed(() => {
    const run = this.runFilter.trim().toLowerCase();
    return this.data.pipelineRunCosts().filter(item =>
      (this.pipelineFilter === 'all' || item.pipelineName === this.pipelineFilter)
      && (this.engineFilter === 'all' || item.engine === this.engineFilter)
      && (!run || item.runId.toLowerCase().includes(run))
    );
  });
}
