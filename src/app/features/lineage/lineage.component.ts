import {
  Component, signal, computed, ChangeDetectionStrategy, ElementRef, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MermaidDiagramComponent } from '../../shared/components/mermaid-diagram/mermaid-diagram.component';
import { Pipeline } from '../../core/models';
import { LineageEntityType, LineageGraph } from '../../core/models/lineage.model';
import { PlatformDataService } from '../../core/services/platform-data.service';
import { AccessService } from '../../core/access/access.service';
import { OrgService } from '../../core/org/org.service';

interface SelectOption { value: string; label: string; }
interface ManualLineageDraft {
  entityType: LineageEntityType;
  pipelineId: string;
  subType: string;
  entityName: string;
  displayName: string;
  description: string;
  definition: string;
}

@Component({
  selector: 'app-lineage',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatAutocompleteModule, MatButtonToggleModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule, MatTabsModule,
    PageHeaderComponent, MermaidDiagramComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="lineage-page">
  <app-page-header
    title="Linhagem de Dados"
    subtitle="Explore o fluxo de transformação e dependências entre tabelas, jobs, painéis e modelos"
    icon="account_tree">
    <button mat-flat-button color="primary" type="button" (click)="openManualForm()">
      <mat-icon>add</mat-icon>
      Cadastrar linhagem
    </button>
  </app-page-header>

  <section class="manual-panel" *ngIf="manualFormOpen()" aria-label="Cadastro manual de linhagem">
    <div class="manual-panel__head">
      <div>
        <strong>Cadastrar linhagem manual</strong>
        <span>Use para registrar linhagens legadas ou ainda não descobertas automaticamente.</span>
      </div>
      <button mat-icon-button type="button" matTooltip="Fechar" (click)="closeManualForm()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="manual-grid">
      <mat-form-field appearance="outline">
        <mat-label>Job cadastrado</mat-label>
        <mat-select [ngModel]="manualDraft.pipelineId" (ngModelChange)="selectPipelineForManualLineage($event)">
          <mat-option value="">Selecionar pipeline</mat-option>
          <mat-option *ngFor="let pipeline of pipelines()" [value]="pipeline.id">
            {{ pipeline.name }} · {{ pipeline.sigla }} · {{ pipeline.type }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Subtipo</mat-label>
        <input matInput [(ngModel)]="manualDraft.subType" placeholder="gold, GlueJob, Power BI...">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Nome técnico</mat-label>
        <input matInput [(ngModel)]="manualDraft.entityName" placeholder="spec.customer_360">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Nome de exibição</mat-label>
        <input matInput [(ngModel)]="manualDraft.displayName" placeholder="spec.customer_360">
      </mat-form-field>
      <mat-form-field appearance="outline" class="manual-grid__wide">
        <mat-label>Descrição</mat-label>
        <textarea matInput rows="2" [(ngModel)]="manualDraft.description"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="manual-grid__wide manual-editor">
        <mat-label>Definição Mermaid</mat-label>
        <textarea matInput rows="8" [ngModel]="manualDraft.definition" (ngModelChange)="updateManualDefinition($event)" spellcheck="false"></textarea>
      </mat-form-field>
      <section class="manual-preview manual-grid__wide">
        <div class="manual-preview__head">
          <div>
            <strong>Prévia do diagrama</strong>
            <span>Revise a linhagem antes de salvar.</span>
          </div>
          <span class="preview-status" [class.preview-status--ok]="manualMermaidReady()" [class.preview-status--error]="manualMermaidError()">
            {{ manualPreviewLabel() }}
          </span>
        </div>
        <div class="manual-preview__canvas">
          <app-mermaid-diagram
            [definition]="manualDraft.definition"
            (renderReady)="onManualMermaidReady()"
            (renderError)="onManualMermaidError($event)">
          </app-mermaid-diagram>
        </div>
        <p class="manual-preview__error" *ngIf="manualMermaidError()">
          Corrija a sintaxe Mermaid antes de salvar. Detalhe: {{ manualMermaidError() }}
        </p>
      </section>
    </div>

    <div class="manual-panel__footer">
      <span>O registro será marcado como origem manual para auditoria e governança.</span>
      <div>
        <button mat-stroked-button color="primary" type="button" (click)="fillManualExample()">Usar exemplo</button>
        <button mat-flat-button color="primary" type="button" [disabled]="!canSaveManualLineage()" [matTooltip]="!manualMermaidReady() ? 'A prévia Mermaid precisa renderizar sem erro.' : ''" (click)="saveManualLineage()">
          <mat-icon>save</mat-icon>
          Salvar linhagem
        </button>
      </div>
    </div>
  </section>

  <mat-tab-group animationDuration="160ms" class="lineage-tabs" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectedTabIndex.set($event)">
    <mat-tab>
      <ng-template mat-tab-label><mat-icon class="tab-icon">account_tree</mat-icon> Explorar</ng-template>

      <!-- ── Filter strip ───────────────────────────────────────────── -->
      <mat-card class="filter-card">
        <mat-card-content class="filter-body">

          <!-- Row 1: entity type -->
          <div class="filter-row">
            <span class="filter-section-label">Tipo de ativo</span>
            <mat-button-toggle-group
              [value]="entityType()"
              (change)="onTypeChange($event.value)"
              aria-label="Tipo de ativo"
              class="type-toggle">
              <mat-button-toggle value="table">
                <mat-icon>table_chart</mat-icon>
                <span class="toggle-label">Tabela</span>
              </mat-button-toggle>
              <mat-button-toggle value="job">
                <mat-icon>settings</mat-icon>
                <span class="toggle-label">Job</span>
              </mat-button-toggle>
              <mat-button-toggle value="panel">
                <mat-icon>space_dashboard</mat-icon>
                <span class="toggle-label">Painel</span>
              </mat-button-toggle>
              <mat-button-toggle value="model">
                <mat-icon>model_training</mat-icon>
                <span class="toggle-label">Modelo</span>
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <!-- Row 2: contextual filters (progressive disclosure) -->
          <div class="filter-row fields-row" *ngIf="entityType()">
            <mat-form-field appearance="outline" class="filter-field subtype-field">
              <mat-label>{{ subTypeLabel() }}</mat-label>
              <mat-select
                [ngModel]="subType()"
                (ngModelChange)="onSubTypeChange($event)">
                <mat-option value="">Todos</mat-option>
                <mat-option *ngFor="let opt of subTypeOptions()" [value]="opt.value">
                  {{ opt.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field name-field">
              <mat-label>{{ nameLabel() }}</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [ngModel]="entityName()"
                (ngModelChange)="entityName.set($event)"
                [matAutocomplete]="nameAuto"
                (keydown.enter)="visualize()"
                autocomplete="off"
                spellcheck="false">
              <mat-autocomplete #nameAuto="matAutocomplete">
                <mat-option *ngFor="let n of filteredNames()" [value]="n">{{ n }}</mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="visualize-btn"
              (click)="visualize()"
              [disabled]="!entityName().trim()">
              <mat-icon>account_tree</mat-icon>
              Visualizar Linhagem
            </button>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- ── Diagram canvas ─────────────────────────────────────────── -->
      <div class="diagram-canvas">

    <!-- Empty state: no selection yet -->
    <div class="canvas-state" *ngIf="!currentGraph() && !noResults()">
      <div class="state-content">
        <div class="state-icon-wrap">
          <mat-icon>account_tree</mat-icon>
        </div>
        <h3>Explore a linhagem de dados</h3>
        <p>Selecione um tipo de ativo e busque pelo nome para visualizar o fluxo de dependências e transformações</p>
      </div>
    </div>

    <!-- No results state -->
    <div class="canvas-state" *ngIf="noResults()">
      <div class="state-content">
        <div class="state-icon-wrap warn">
          <mat-icon>search_off</mat-icon>
        </div>
        <h3>Nenhuma linhagem encontrada</h3>
        <p>Nenhum ativo corresponde aos filtros informados. Tente outro nome ou ajuste o tipo.</p>
        <button mat-stroked-button color="primary" (click)="clearSearch()">
          <mat-icon>refresh</mat-icon> Nova busca
        </button>
      </div>
    </div>

    <!-- Diagram view -->
    <ng-container *ngIf="currentGraph()">

      <!-- Toolbar -->
      <div class="diagram-toolbar">
        <div class="graph-meta">
          <mat-icon class="graph-type-icon">{{ typeIcon() }}</mat-icon>
          <div class="graph-info">
            <span class="graph-name">{{ currentGraph()?.displayName }}</span>
            <span class="graph-desc">{{ currentGraph()?.description }}</span>
          </div>
          <span class="subtype-badge">{{ currentGraph()?.subType }}</span>
          <span class="source-badge" [class.source-badge--manual]="lineageSource(currentGraph()) === 'manual'">
            {{ lineageSource(currentGraph()) === 'manual' ? 'Manual' : 'Automática' }}
          </span>
        </div>
        <div class="toolbar-right">
          <span class="zoom-pct">{{ zoomPercent() }}</span>
          <button mat-icon-button (click)="zoomOut()" matTooltip="Diminuir zoom" [disabled]="zoomLevel() <= 0.3">
            <mat-icon>remove</mat-icon>
          </button>
          <button mat-icon-button (click)="resetZoom()" matTooltip="Redefinir zoom (100%)">
            <mat-icon>crop_free</mat-icon>
          </button>
          <button mat-icon-button (click)="zoomIn()" matTooltip="Aumentar zoom" [disabled]="zoomLevel() >= 3">
            <mat-icon>add</mat-icon>
          </button>
          <div class="v-divider"></div>
          <button mat-icon-button (click)="exportSvg()" matTooltip="Exportar como SVG">
            <mat-icon>download</mat-icon>
          </button>
        </div>
      </div>

      <!-- Scrollable diagram area -->
      <div class="diagram-scroll" #diagramScroll>
        <div
          class="diagram-zoom-wrap"
          #diagramZoomWrap
          [style.transform]="'scale(' + zoomLevel() + ')'"
          [style.transform-origin]="'top left'">
          <app-mermaid-diagram [definition]="currentGraph()!.definition" (renderReady)="fitDiagramToViewport()"></app-mermaid-diagram>
        </div>
      </div>

      <!-- Legend bar -->
      <div class="diagram-legend">
        <span class="legend-title">Legenda</span>
        <span class="leg-item leg-src">Fonte</span>
        <span class="leg-item leg-bro">Bronze</span>
        <span class="leg-item leg-sil">Silver</span>
        <span class="leg-item leg-gld">Gold</span>
        <span class="leg-item leg-job">Job</span>
        <span class="leg-item leg-pnl">Painel</span>
        <span class="leg-item leg-mdl">Modelo</span>
      </div>

    </ng-container>
      </div>
    </mat-tab>

    <mat-tab>
      <ng-template mat-tab-label><mat-icon class="tab-icon">query_stats</mat-icon> Métricas</ng-template>
      <section class="metrics-page" aria-label="Métricas de linhagem">
        <div class="metrics-hero">
          <div>
            <span>Cobertura de linhagem</span>
            <strong>{{ lineageCoveragePct() }}%</strong>
            <p>{{ jobsWithLineage() }} de {{ totalJobs() }} jobs possuem linhagem cadastrada.</p>
          </div>
          <div class="graph-note">
            <mat-icon>hub</mat-icon>
            <span>Modelo futuro preparado para grafo corporativo, como AWS Neptune.</span>
          </div>
        </div>

        <section class="scope-panel" aria-label="Escopo dos indicadores">
          <div>
            <span>Escopo dos indicadores</span>
            <strong>{{ lineageAccessLabel() }}</strong>
            <small>{{ lineageAccessDescription() }}</small>
          </div>
          <div class="scope-tags">
            <span class="scope-tag" *ngFor="let sigla of accessibleSiglas()">{{ sigla }}</span>
          </div>
        </section>

        <div class="metric-grid">
          <article class="metric-card">
            <span>Total de jobs</span>
            <strong>{{ totalJobs() }}</strong>
            <small>Jobs cadastrados na plataforma.</small>
          </article>
          <article class="metric-card">
            <span>Jobs com linhagem</span>
            <strong>{{ jobsWithLineage() }}</strong>
            <small>Possuem grafo próprio ou aparecem em grafos existentes.</small>
          </article>
          <article class="metric-card">
            <span>Sem linhagem</span>
            <strong>{{ jobsWithoutLineage() }}</strong>
            <small>Prioridade para saneamento de governança.</small>
          </article>
          <article class="metric-card">
            <span>Tabelas mapeadas</span>
            <strong>{{ mappedTables() }}</strong>
            <small>Ativos com upstream ou downstream registrado.</small>
          </article>
          <article class="metric-card">
            <span>Grafos disponíveis</span>
            <strong>{{ totalGraphs() }}</strong>
            <small>Visões navegáveis no explorador.</small>
          </article>
          <article class="metric-card">
            <span>Linhagens manuais</span>
            <strong>{{ manualGraphs() }}</strong>
            <small>Registros criados pela plataforma.</small>
          </article>
          <article class="metric-card">
            <span>Ativos órfãos</span>
            <strong>{{ orphanTables() }}</strong>
            <small>Tabelas sem relações conhecidas no catálogo.</small>
          </article>
        </div>

        <section class="coverage-panel">
          <div class="coverage-panel__head">
            <div>
              <span>Backlog de cobertura</span>
              <strong>Jobs sem linhagem cadastrada</strong>
            </div>
            <small>{{ filteredJobsWithoutLineage().length }} de {{ jobsWithoutLineageList().length }} pendentes</small>
          </div>

          <div class="coverage-filters">
            <input class="coverage-input" placeholder="Filtrar por nome, destino ou responsável" [ngModel]="metricsTextFilter()" (ngModelChange)="metricsTextFilter.set($event)">
            <select class="coverage-input" [ngModel]="metricsSiglaFilter()" (ngModelChange)="metricsSiglaFilter.set($event)">
              <option value="all">Todas as siglas</option>
              <option *ngFor="let sigla of pipelineSiglas()" [value]="sigla">{{ sigla }}</option>
            </select>
            <select class="coverage-input" [ngModel]="metricsDomainFilter()" (ngModelChange)="metricsDomainFilter.set($event)">
              <option value="all">Todos os domínios</option>
              <option *ngFor="let domain of pipelineDomains()" [value]="domain">{{ domain }}</option>
            </select>
          </div>

          <div class="coverage-list" *ngIf="filteredJobsWithoutLineage().length; else completeCoverage">
            <div class="coverage-row" *ngFor="let job of filteredJobsWithoutLineage()">
              <div>
                <strong>{{ job.name }}</strong>
                <span>{{ job.type }} · {{ job.sigla }} · {{ pipelineBusinessDomain(job) }} · {{ job.team }}</span>
              </div>
              <code>{{ job.target }}</code>
              <button mat-stroked-button color="primary" type="button" (click)="startManualLineageForJob(job)">
                <mat-icon>add_link</mat-icon>
                Adicionar linhagem
              </button>
            </div>
          </div>

          <ng-template #completeCoverage>
            <div class="empty-coverage">
              <mat-icon>{{ jobsWithoutLineageList().length ? 'filter_alt_off' : 'verified' }}</mat-icon>
              <span>{{ jobsWithoutLineageList().length ? 'Nenhum job encontrado para os filtros.' : 'Todos os jobs possuem linhagem cadastrada.' }}</span>
            </div>
          </ng-template>
        </section>
      </section>
    </mat-tab>
  </mat-tab-group>
</div>
  `,
  styles: [`
    /* ── Page layout ───────────────────────────────────────────────── */
    .lineage-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .lineage-tabs { display: block; }
    .tab-icon { margin-right: 6px; }

    /* Manual form */
    .manual-panel { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: var(--radius-lg); background: var(--bg-surface); border: 1px solid var(--border-subtle); }
    .manual-panel__head,
    .manual-panel__footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .manual-panel__head div { display: flex; flex-direction: column; gap: 3px; }
    .manual-panel__head strong { color: var(--text-primary); font-size: 14px; }
    .manual-panel__head span,
    .manual-panel__footer span { color: var(--text-muted); font-size: 12px; }
    .manual-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 10px; }
    .manual-grid__wide { grid-column: 1 / -1; }
    .manual-panel__footer div { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .manual-preview { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-app); }
    .manual-preview__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .manual-preview__head div { display: flex; flex-direction: column; gap: 3px; }
    .manual-preview__head strong { color: var(--text-primary); font-size: 13px; }
    .manual-preview__head span,
    .manual-preview__error { color: var(--text-muted); font-size: 12px; }
    .manual-preview__canvas { min-height: 220px; overflow: auto; padding: 12px; border-radius: var(--radius-md); background: var(--bg-surface); }
    .preview-status { flex-shrink: 0; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--neutral-bg); color: var(--text-secondary); font-size: 11px; font-weight: 700; }
    .preview-status--ok { background: var(--success-bg); color: var(--success-500); }
    .preview-status--error { background: var(--danger-bg); color: var(--danger-500); }
    .manual-preview__error { margin: 0; color: var(--danger-500); line-height: 1.5; }

    /* ── Filter card ───────────────────────────────────────────────── */
    .filter-card ::ng-deep .mat-mdc-card-content { padding: 16px 20px 12px; }
    .filter-body { display: flex; flex-direction: column; gap: 12px; }
    .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-section-label {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.8px; min-width: 88px;
    }

    /* Type toggle */
    .type-toggle ::ng-deep .mat-button-toggle {
      border-radius: 8px !important;
      height: 40px;
    }
    .type-toggle ::ng-deep .mat-button-toggle-button { display: flex; align-items: center; }
    .toggle-label { margin-left: 6px; font-size: 13px; font-weight: 500; }

    /* Fields row */
    .fields-row { padding-top: 4px; }
    .filter-field { min-width: 160px; }
    .name-field { min-width: 260px; flex: 1; max-width: 400px; }
    .visualize-btn { height: 56px; min-width: 180px; white-space: nowrap; gap: 6px; }

    /* ── Diagram canvas ─────────────────────────────────────────────── */
    .diagram-canvas {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 620px;
    }

    /* Toolbar */
    .diagram-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-app);
      flex-shrink: 0;
      gap: 12px;
    }
    .graph-meta { display: flex; align-items: center; gap: 12px; overflow: hidden; }
    .graph-type-icon { color: var(--brand-300); flex-shrink: 0; }
    .graph-info { display: flex; flex-direction: column; overflow: hidden; }
    .graph-name { font-size: 15px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .graph-desc { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .subtype-badge {
      flex-shrink: 0;
      padding: 2px 10px; border-radius: 10px;
      background: var(--bg-overlay); color: var(--brand-300);
      font-size: 11px; font-weight: 600;
      border: 1px solid var(--border-subtle);
    }
    .source-badge {
      flex-shrink: 0; padding: 2px 10px; border-radius: 10px;
      background: var(--neutral-bg); color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      font-size: 11px; font-weight: 700;
    }
    .source-badge--manual { background: var(--warning-bg); color: var(--warning-500); }
    .toolbar-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .zoom-pct { font-size: 12px; color: var(--text-muted); font-weight: 600; min-width: 40px; text-align: center; }
    .v-divider { width: 1px; height: 24px; background: var(--border-subtle); margin: 0 4px; }

    /* Scroll area */
    .diagram-scroll {
      flex: 1;
      overflow: auto;
      padding: 32px;
      background: var(--bg-app);
      min-height: 560px;
      /* Custom scrollbar */
      scrollbar-width: thin;
      scrollbar-color: var(--border-strong) var(--bg-app);
    }
    .diagram-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .diagram-scroll::-webkit-scrollbar-track { background: var(--bg-app); }
    .diagram-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
    .diagram-zoom-wrap { display: inline-block; transition: transform 0.15s ease; }

    /* Canvas states */
    .canvas-state {
      flex: 1; min-height: 540px;
      display: flex; align-items: center; justify-content: center;
      padding: 48px;
    }
    .state-content { text-align: center; max-width: 440px; }
    .state-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--bg-overlay);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    .state-icon-wrap mat-icon { font-size: 36px; width: 36px; height: 36px; color: var(--brand-300); }
    .state-icon-wrap.warn { background: var(--warning-bg); }
    .state-icon-wrap.warn mat-icon { color: var(--warning-500); }
    .state-content h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
    .state-content p { font-size: 14px; color: var(--text-secondary); margin: 0 0 24px; line-height: 1.6; }

    /* Legend */
    .diagram-legend {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 10px 16px; border-top: 1px solid var(--border-subtle);
      background: var(--bg-surface); flex-shrink: 0;
    }
    .legend-title {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px;
    }
    .leg-item {
      padding: 2px 10px; border-radius: 10px;
      font-size: 11px; font-weight: 500; border: 1px solid transparent;
    }
    .leg-src { background: var(--info-bg); color: var(--info-500); border-color: var(--border-subtle); }
    .leg-bro { background: var(--warning-bg); color: var(--warning-500); border-color: var(--border-subtle); }
    .leg-sil { background: var(--neutral-bg); color: var(--text-secondary); border-color: var(--border-subtle); }
    .leg-gld { background: var(--warning-bg); color: var(--accent-300); border-color: var(--border-subtle); }
    .leg-job { background: var(--bg-overlay); color: var(--brand-300); border-color: var(--border-subtle); }
    .leg-pnl { background: var(--success-bg); color: var(--success-500); border-color: var(--border-subtle); }
    .leg-mdl { background: var(--info-bg); color: var(--brand-100); border-color: var(--border-subtle); }

    /* Metrics */
    .metrics-page { display: flex; flex-direction: column; gap: 16px; padding-top: 16px; }
    .metrics-hero {
      display: flex; justify-content: space-between; align-items: center; gap: 20px;
      padding: 22px 24px; border-radius: var(--radius-lg);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }
    .metrics-hero span,
    .metric-card span,
    .coverage-panel__head span {
      color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    }
    .metrics-hero strong { display: block; margin-top: 4px; color: var(--text-primary); font-size: 42px; line-height: 1; font-weight: 760; }
    .metrics-hero p { margin: 8px 0 0; color: var(--text-secondary); font-size: 13px; }
    .graph-note { display: flex; align-items: center; gap: 10px; max-width: 360px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--bg-overlay); color: var(--brand-300); }
    .graph-note mat-icon { color: var(--brand-300); }
    .graph-note span { color: var(--brand-300); text-transform: none; letter-spacing: 0; font-size: 12px; line-height: 1.4; }
    .scope-panel { display: grid; grid-template-columns: minmax(260px, .8fr) 1fr; gap: 16px; align-items: center; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface); }
    .scope-panel > div:first-child { display: flex; flex-direction: column; gap: 4px; }
    .scope-panel span { color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    .scope-panel strong { color: var(--text-primary); font-size: 14px; }
    .scope-panel small { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
    .scope-tags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .scope-tag { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 999px; background: var(--bg-overlay); color: var(--brand-300) !important; border: 1px solid var(--border-subtle); font-size: 11px !important; font-weight: 800 !important; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
    .metric-card { padding: 16px; border-radius: var(--radius-lg); background: var(--bg-surface); border: 1px solid var(--border-subtle); }
    .metric-card strong { display: block; margin-top: 8px; color: var(--text-primary); font-size: 28px; line-height: 1; font-weight: 740; }
    .metric-card small { display: block; margin-top: 8px; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .coverage-panel { border-radius: var(--radius-lg); background: var(--bg-surface); border: 1px solid var(--border-subtle); overflow: hidden; }
    .coverage-panel__head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 18px; border-bottom: 1px solid var(--border-subtle); }
    .coverage-panel__head div { display: flex; flex-direction: column; gap: 4px; }
    .coverage-panel__head strong { color: var(--text-primary); font-size: 15px; }
    .coverage-panel__head small { color: var(--text-muted); font-size: 12px; }
    .coverage-filters { display: grid; grid-template-columns: minmax(260px, 1fr) 160px 180px; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); }
    .coverage-input { min-width: 0; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-app); color: var(--text-primary); padding: 8px 10px; font: inherit; font-size: 12px; outline: none; }
    .coverage-input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px rgba(76,141,255,0.18); }
    .coverage-list { display: flex; flex-direction: column; }
    .coverage-row { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(180px, 320px) auto; gap: 16px; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--border-subtle); }
    .coverage-row:last-child { border-bottom: 0; }
    .coverage-row div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .coverage-row strong { color: var(--text-primary); font-size: 13px; }
    .coverage-row span { color: var(--text-secondary); font-size: 12px; }
    .coverage-row code { justify-self: end; max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 4px 8px; border-radius: 7px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
    .empty-coverage { display: flex; align-items: center; gap: 8px; padding: 18px; color: var(--success-500); font-size: 13px; }
    .empty-coverage mat-icon { color: var(--success-500); }

    @media (max-width: 760px) {
      .manual-grid { grid-template-columns: 1fr; }
      .manual-panel__head,
      .manual-panel__footer { align-items: flex-start; flex-direction: column; }
      .metrics-hero { flex-direction: column; align-items: flex-start; }
      .scope-panel { grid-template-columns: 1fr; }
      .scope-tags { justify-content: flex-start; }
      .coverage-filters,
      .coverage-row { grid-template-columns: 1fr; }
      .coverage-row code { justify-self: start; }
    }
  `],
})
export class LineageComponent {
  private readonly data = inject(PlatformDataService);
  private readonly access = inject(AccessService);
  private readonly org = inject(OrgService);
  @ViewChild('diagramScroll') private diagramScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('diagramZoomWrap') private diagramZoomWrap?: ElementRef<HTMLDivElement>;

  // ── Filter state (signals for computed dependency tracking) ──────────────
  readonly entityType = signal<LineageEntityType | null>(null);
  readonly subType    = signal('');
  readonly entityName = signal('');

  // ── Diagram state ─────────────────────────────────────────────────────────
  readonly currentGraph = signal<LineageGraph | null>(null);
  readonly noResults    = signal(false);
  readonly zoomLevel    = signal(1);
  readonly manualFormOpen = signal(false);
  readonly selectedTabIndex = signal(0);
  readonly metricsTextFilter = signal('');
  readonly metricsSiglaFilter = signal('all');
  readonly metricsDomainFilter = signal('all');
  readonly manualMermaidReady = signal(false);
  readonly manualMermaidError = signal('');
  manualDraft: ManualLineageDraft = this.emptyManualDraft();

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly zoomPercent = computed(() => Math.round(this.zoomLevel() * 100) + '%');
  readonly hasGlobalLineageAccess = computed(() =>
    this.access.can('executive.viewGlobal') || this.access.context()?.roles.includes('platform-admin') === true
  );
  readonly accessiblePipelines = computed(() => {
    const pipelines = this.data.pipelines();
    if (this.hasGlobalLineageAccess()) return pipelines;

    const squadLabels = new Set(
      this.access.activeSquadIds()
        .map(id => this.org.labelForUnit(id).toLowerCase())
    );
    return pipelines.filter(pipeline => squadLabels.has(pipeline.team.toLowerCase()) || squadLabels.has(pipeline.owner.toLowerCase()));
  });
  readonly totalJobs = computed(() => this.accessiblePipelines().length);
  readonly pipelines = computed(() => this.accessiblePipelines());
  readonly totalGraphs = computed(() => this.data.lineageGraphs().length);
  readonly manualGraphs = computed(() => this.data.lineageGraphs().filter(graph => this.lineageSource(graph) === 'manual').length);
  readonly jobsWithLineageList = computed(() => this.accessiblePipelines().filter(job => this.hasLineageForJob(job.name)));
  readonly jobsWithLineage = computed(() => this.jobsWithLineageList().length);
  readonly jobsWithoutLineageList = computed(() => this.accessiblePipelines().filter(job => !this.hasLineageForJob(job.name)));
  readonly jobsWithoutLineage = computed(() => this.jobsWithoutLineageList().length);
  readonly pipelineSiglas = computed(() => Array.from(new Set(this.accessiblePipelines().map(job => job.sigla))).sort());
  readonly accessibleSiglas = this.pipelineSiglas;
  readonly pipelineDomains = computed(() => Array.from(new Set(this.accessiblePipelines().map(job => this.pipelineBusinessDomain(job)))).sort());
  readonly filteredJobsWithoutLineage = computed(() => {
    const text = this.metricsTextFilter().trim().toLowerCase();
    const sigla = this.metricsSiglaFilter();
    const domain = this.metricsDomainFilter();
    return this.jobsWithoutLineageList().filter(job => {
      const matchesText = !text || [
        job.name,
        job.description,
        job.target,
        job.owner,
        job.team,
        job.type,
      ].some(value => value.toLowerCase().includes(text));
      const matchesSigla = sigla === 'all' || job.sigla === sigla;
      const matchesDomain = domain === 'all' || this.pipelineBusinessDomain(job) === domain;
      return matchesText && matchesSigla && matchesDomain;
    });
  });
  readonly lineageCoveragePct = computed(() => {
    const total = this.totalJobs();
    return total ? Math.round((this.jobsWithLineage() / total) * 100) : 0;
  });
  readonly mappedTables = computed(() =>
    this.data.catalogAssets().filter(asset =>
      asset.type === 'table' &&
      ((asset.lineage?.upstream.length ?? 0) > 0 || (asset.lineage?.downstream.length ?? 0) > 0)
    ).length
  );
  readonly orphanTables = computed(() =>
    this.data.catalogAssets().filter(asset =>
      asset.type === 'table' &&
      (asset.lineage?.upstream.length ?? 0) === 0 &&
      (asset.lineage?.downstream.length ?? 0) === 0
    ).length
  );
  readonly lineageAccessLabel = computed(() =>
    this.hasGlobalLineageAccess() ? 'Perfil global' : this.access.context()?.activeScope?.label ?? 'Escopo restrito'
  );
  readonly lineageAccessDescription = computed(() => {
    if (this.hasGlobalLineageAccess()) {
      return 'Usuário com acesso global. Os big numbers consideram todas as siglas liberadas na plataforma.';
    }
    const scope = this.access.context()?.activeScope;
    return scope
      ? `Usuário com acesso restrito ao escopo ${scope.label}. Os big numbers consideram apenas as siglas vinculadas às squads acessíveis.`
      : 'Usuário sem escopo ativo. Nenhuma sigla será considerada nos indicadores.';
  });

  readonly typeIcon = computed(() => {
    switch (this.currentGraph()?.entityType ?? this.entityType()) {
      case 'table':  return 'table_chart';
      case 'job':    return 'settings';
      case 'panel':  return 'space_dashboard';
      case 'model':  return 'model_training';
      default:       return 'account_tree';
    }
  });

  readonly subTypeLabel = computed((): string => {
    switch (this.entityType()) {
      case 'table':  return 'Camada';
      case 'job':    return 'Tipo de Job';
      case 'panel':  return 'Plataforma';
      case 'model':  return 'Framework';
      default:       return 'Subtipo';
    }
  });

  readonly nameLabel = computed((): string => {
    switch (this.entityType()) {
      case 'table':  return 'Nome da Tabela';
      case 'job':    return 'Nome do Job';
      case 'panel':  return 'Nome do Painel';
      case 'model':  return 'Nome do Modelo';
      default:       return 'Nome';
    }
  });

  readonly subTypeOptions = computed((): SelectOption[] => {
    switch (this.entityType()) {
      case 'table': return [
        { value: 'bronze', label: 'Bronze' },
        { value: 'silver', label: 'Silver' },
        { value: 'gold',   label: 'Gold'   },
      ];
      case 'job': return [
        { value: 'GlueJob', label: 'GlueJob' },
        { value: 'Munin',   label: 'Munin'   },
        { value: 'Phoenix', label: 'Phoenix' },
        { value: 'CDP',     label: 'CDP'     },
        { value: 'Outros',  label: 'Outros'  },
      ];
      case 'panel': return [
        { value: 'Metabase', label: 'Metabase' },
        { value: 'Tableau',  label: 'Tableau'  },
        { value: 'PowerBI',  label: 'Power BI' },
      ];
      case 'model': return [
        { value: 'dbt',        label: 'dbt'        },
        { value: 'SageMaker',  label: 'SageMaker'  },
        { value: 'Spark',      label: 'Spark MLlib' },
        { value: 'Outros',     label: 'Outros'     },
      ];
      default: return [];
    }
  });

  readonly filteredNames = computed((): string[] => {
    const type  = this.entityType();
    const sub   = this.subType();
    const query = this.entityName().toLowerCase();
    if (!type) return [];
    return this.data.lineageGraphs()
      .filter(g =>
        g.entityType === type &&
        (!sub || g.subType === sub) &&
        (!query || g.entityName.toLowerCase().includes(query) ||
                   g.displayName.toLowerCase().includes(query))
      )
      .map(g => g.entityName);
  });

  // ── Event handlers ────────────────────────────────────────────────────────
  onTypeChange(type: LineageEntityType | null): void {
    this.entityType.set(type);
    this.subType.set('');
    this.entityName.set('');
    this.currentGraph.set(null);
    this.noResults.set(false);
  }

  onSubTypeChange(value: string): void {
    this.subType.set(value);
    this.entityName.set('');
  }

  openManualForm(): void {
    this.resetManualPreviewState();
    this.manualFormOpen.set(true);
  }

  closeManualForm(): void {
    this.manualFormOpen.set(false);
  }

  fillManualExample(): void {
    this.resetManualPreviewState();
    const pipeline = this.data.pipelines()[0];
    this.manualDraft = {
      entityType: 'job',
      pipelineId: pipeline?.id ?? '',
      subType: pipeline?.type ?? 'GlueJob',
      entityName: pipeline?.name ?? '',
      displayName: pipeline?.name ?? '',
      description: pipeline ? `Linhagem manual do job ${pipeline.name}.` : '',
      definition: pipeline ? this.manualDefinitionForJob(pipeline) : this.emptyManualDraft().definition,
    };
  }

  selectPipelineForManualLineage(pipelineId: string): void {
    const pipeline = this.data.pipelines().find(item => item.id === pipelineId);
    if (!pipeline) {
      this.manualDraft = this.emptyManualDraft();
      this.resetManualPreviewState();
      return;
    }
    this.startManualLineageForJob(pipeline);
  }

  updateManualDefinition(value: string): void {
    this.manualDraft.definition = value;
    this.resetManualPreviewState();
  }

  onManualMermaidReady(): void {
    this.manualMermaidReady.set(true);
    this.manualMermaidError.set('');
  }

  onManualMermaidError(error: string): void {
    this.manualMermaidReady.set(false);
    this.manualMermaidError.set(error);
  }

  manualPreviewLabel(): string {
    if (this.manualMermaidError()) return 'Erro na sintaxe';
    if (this.manualMermaidReady()) return 'Prévia válida';
    return 'Validando';
  }

  startManualLineageForJob(job: Pipeline): void {
    this.resetManualPreviewState();
    this.manualDraft = {
      entityType: 'job',
      pipelineId: job.id,
      subType: job.type,
      entityName: job.name,
      displayName: job.name,
      description: `Linhagem manual do job ${job.name}.`,
      definition: this.manualDefinitionForJob(job),
    };
    this.manualFormOpen.set(true);
  }

  canSaveManualLineage(): boolean {
    return !!(
      this.manualDraft.entityType &&
      this.manualDraft.pipelineId &&
      this.manualDraft.subType.trim() &&
      this.manualDraft.entityName.trim() &&
      this.manualDraft.displayName.trim() &&
      this.manualDraft.description.trim() &&
      this.manualDraft.definition.trim() &&
      this.manualMermaidReady() &&
      !this.manualMermaidError()
    );
  }

  saveManualLineage(): void {
    if (!this.canSaveManualLineage()) return;
    const graph = this.data.addManualLineageGraph({
      entityType: this.manualDraft.entityType,
      pipelineId: this.manualDraft.pipelineId,
      subType: this.manualDraft.subType.trim(),
      entityName: this.manualDraft.entityName.trim(),
      displayName: this.manualDraft.displayName.trim(),
      description: this.manualDraft.description.trim(),
      definition: this.manualDraft.definition.trim(),
    });
    if (!graph) return;
    this.manualDraft = this.emptyManualDraft();
    this.resetManualPreviewState();
    this.manualFormOpen.set(false);
    this.selectedTabIndex.set(0);
    this.entityType.set(graph.entityType);
    this.subType.set(graph.subType);
    this.entityName.set(graph.entityName);
    this.currentGraph.set(graph);
    this.noResults.set(false);
    this.zoomLevel.set(1.15);
  }

  visualize(): void {
    const type  = this.entityType();
    const sub   = this.subType();
    const query = this.entityName().trim().toLowerCase();
    if (!type || !query) return;

    const graph = this.prioritizedLineageGraphs().find(g =>
      g.entityType === type &&
      (!sub || g.subType === sub) &&
      (g.entityName.toLowerCase().includes(query) ||
       g.displayName.toLowerCase().includes(query))
    ) ?? null;

    this.currentGraph.set(graph);
    this.noResults.set(graph === null);
    if (graph) this.zoomLevel.set(1.15);
  }

  clearSearch(): void {
    this.entityType.set(null);
    this.subType.set('');
    this.entityName.set('');
    this.currentGraph.set(null);
    this.noResults.set(false);
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  zoomIn(): void  { this.zoomLevel.update(z => Math.min(+(z + 0.2).toFixed(1), 3)); }
  zoomOut(): void { this.zoomLevel.update(z => Math.max(+(z - 0.2).toFixed(1), 0.3)); }
  resetZoom(): void { this.fitDiagramToViewport(); }

  fitDiagramToViewport(): void {
    window.setTimeout(() => {
      const scroll = this.diagramScroll?.nativeElement;
      const wrap = this.diagramZoomWrap?.nativeElement;
      const svg = wrap?.querySelector('svg') as SVGSVGElement | null;
      if (!scroll || !svg) return;

      const rawWidth = Math.max(svg.getBBox?.().width || 0, svg.viewBox.baseVal.width || 0, svg.getBoundingClientRect().width || 0);
      const rawHeight = Math.max(svg.getBBox?.().height || 0, svg.viewBox.baseVal.height || 0, svg.getBoundingClientRect().height || 0);
      if (!rawWidth || !rawHeight) return;

      const availableWidth = Math.max(scroll.clientWidth - 48, 320);
      const availableHeight = Math.max(scroll.clientHeight - 48, 260);
      const scale = Math.min(2.4, Math.max(0.75, Math.min(availableWidth / rawWidth, availableHeight / rawHeight) * 0.98));
      this.zoomLevel.set(Number(scale.toFixed(2)));
      scroll.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    });
  }

  lineageSource(graph: LineageGraph | null | undefined): 'automatic' | 'manual' {
    return graph?.registrationSource ?? 'automatic';
  }

  pipelineBusinessDomain(job: Pipeline): string {
    const haystack = [...job.tags, job.name, job.description, job.target].join(' ').toLowerCase();
    if (haystack.includes('finance')) return 'Financeiro';
    if (haystack.includes('customer') || haystack.includes('crm') || haystack.includes('clickstream')) return 'Clientes';
    if (haystack.includes('product') || haystack.includes('catalog')) return 'Produtos';
    if (haystack.includes('iot') || haystack.includes('sensor')) return 'IoT';
    if (haystack.includes('erp') || haystack.includes('master')) return 'Dados Mestres';
    if (haystack.includes('orchestration')) return 'Operações';
    return 'Não classificado';
  }

  private hasLineageForJob(jobName: string): boolean {
    const pipeline = this.data.pipelines().find(item => item.name === jobName);
    if (pipeline && this.prioritizedLineageGraphs().some(graph => graph.pipelineId === pipeline.id)) return true;
    const normalizedJob = this.normalize(jobName);
    return this.prioritizedLineageGraphs().some(graph =>
      this.normalize(graph.entityName) === normalizedJob ||
      this.normalize(graph.displayName) === normalizedJob ||
      this.normalize(graph.definition).includes(normalizedJob)
    );
  }

  private prioritizedLineageGraphs(): LineageGraph[] {
    return [...this.data.lineageGraphs()].sort((a, b) => {
      if (a.pipelineId && b.pipelineId && a.pipelineId === b.pipelineId) {
        return this.lineageSource(a) === 'manual' ? -1 : this.lineageSource(b) === 'manual' ? 1 : 0;
      }
      return this.lineageSource(a) === 'manual' ? -1 : this.lineageSource(b) === 'manual' ? 1 : 0;
    });
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private resetManualPreviewState(): void {
    this.manualMermaidReady.set(false);
    this.manualMermaidError.set('');
  }

  private emptyManualDraft(): ManualLineageDraft {
    return {
      entityType: 'job',
      pipelineId: '',
      subType: '',
      entityName: '',
      displayName: '',
      description: '',
      definition: 'flowchart LR\n  SOURCE("origem.fisica") --> JOB["job_manual"] --> TARGET[("destino.fisico")]',
    };
  }

  private manualDefinitionForJob(job: Pipeline): string {
    const sourceLines = job.sources.length
      ? job.sources.map((source, index) => `  SRC${index + 1}("${source}") --> JOB`).join('\n')
      : '  SRC1("origem.nao_informada") --> JOB';
    return `flowchart LR
${sourceLines}
  JOB["${job.name} (${job.type})"] --> TGT[("${job.target}")]`;
  }

  // ── Export ────────────────────────────────────────────────────────────────
  exportSvg(): void {
    const svgEl = document.querySelector('.diagram-scroll svg') as SVGElement | null;
    if (!svgEl) return;
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `lineage-${this.currentGraph()?.entityName ?? 'diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
