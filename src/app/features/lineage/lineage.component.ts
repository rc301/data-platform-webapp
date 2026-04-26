import {
  Component, signal, computed, ChangeDetectionStrategy, inject,
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

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MermaidDiagramComponent } from '../../shared/components/mermaid-diagram/mermaid-diagram.component';
import { LineageEntityType, LineageGraph } from '../../core/models/lineage.model';
import { PlatformDataService } from '../../core/services/platform-data.service';

interface SelectOption { value: string; label: string; }

@Component({
  selector: 'app-lineage',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatAutocompleteModule, MatButtonToggleModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule,
    PageHeaderComponent, MermaidDiagramComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="lineage-page">
  <app-page-header
    title="Linhagem de Dados"
    subtitle="Explore o fluxo de transformação e dependências entre tabelas, jobs, painéis e modelos"
    icon="account_tree">
  </app-page-header>

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
        <div class="hint-chips">
          <span class="hint-chip" (click)="quickSearch('table', 'gold', 'customer_360')">
            <mat-icon>table_chart</mat-icon> gold.customer_360
          </span>
          <span class="hint-chip" (click)="quickSearch('job', 'Munin', 'orchestration_daily_full')">
            <mat-icon>settings</mat-icon> orchestration_daily_full
          </span>
          <span class="hint-chip" (click)="quickSearch('model', 'SageMaker', 'customer_churn_model')">
            <mat-icon>model_training</mat-icon> customer_churn_model
          </span>
        </div>
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
      <div class="diagram-scroll">
        <div
          class="diagram-zoom-wrap"
          [style.transform]="'scale(' + zoomLevel() + ')'"
          [style.transform-origin]="'top left'">
          <app-mermaid-diagram [definition]="currentGraph()!.definition"></app-mermaid-diagram>
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
</div>
  `,
  styles: [`
    /* ── Page layout ───────────────────────────────────────────────── */
    .lineage-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Filter card ───────────────────────────────────────────────── */
    .filter-card ::ng-deep .mat-mdc-card-content { padding: 16px 20px 12px; }
    .filter-body { display: flex; flex-direction: column; gap: 12px; }
    .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-section-label {
      font-size: 11px; font-weight: 600; color: #888;
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
      background: white;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 620px;
    }

    /* Toolbar */
    .diagram-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
      flex-shrink: 0;
      gap: 12px;
    }
    .graph-meta { display: flex; align-items: center; gap: 12px; overflow: hidden; }
    .graph-type-icon { color: #1a237e; flex-shrink: 0; }
    .graph-info { display: flex; flex-direction: column; overflow: hidden; }
    .graph-name { font-size: 15px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .graph-desc { font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .subtype-badge {
      flex-shrink: 0;
      padding: 2px 10px; border-radius: 10px;
      background: #e8eaf6; color: #1a237e;
      font-size: 11px; font-weight: 600;
      border: 1px solid #9fa8da;
    }
    .toolbar-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .zoom-pct { font-size: 12px; color: #666; font-weight: 600; min-width: 40px; text-align: center; }
    .v-divider { width: 1px; height: 24px; background: #e0e0e0; margin: 0 4px; }

    /* Scroll area */
    .diagram-scroll {
      flex: 1;
      overflow: auto;
      padding: 32px;
      background: #fafafa;
      min-height: 0;
      /* Custom scrollbar */
      scrollbar-width: thin;
      scrollbar-color: #bdbdbd #f5f5f5;
    }
    .diagram-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .diagram-scroll::-webkit-scrollbar-track { background: #f5f5f5; }
    .diagram-scroll::-webkit-scrollbar-thumb { background: #bdbdbd; border-radius: 4px; }
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
      background: #e8eaf6;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    .state-icon-wrap mat-icon { font-size: 36px; width: 36px; height: 36px; color: #3949ab; }
    .state-icon-wrap.warn { background: #fff8e1; }
    .state-icon-wrap.warn mat-icon { color: #f9a825; }
    .state-content h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px; }
    .state-content p { font-size: 14px; color: #666; margin: 0 0 24px; line-height: 1.6; }

    /* Hint chips */
    .hint-chips { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .hint-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; background: #f5f5f5;
      border: 1px solid #e0e0e0; border-radius: 20px;
      font-size: 12px; font-weight: 500; color: #333;
      cursor: pointer; user-select: none;
      transition: background 0.15s, border-color 0.15s;
    }
    .hint-chip:hover { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
    .hint-chip mat-icon { font-size: 15px; width: 15px; height: 15px; color: #1a237e; }

    /* Legend */
    .diagram-legend {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 10px 16px; border-top: 1px solid #e0e0e0;
      background: white; flex-shrink: 0;
    }
    .legend-title {
      font-size: 11px; font-weight: 600; color: #888;
      text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px;
    }
    .leg-item {
      padding: 2px 10px; border-radius: 10px;
      font-size: 11px; font-weight: 500; border: 1px solid transparent;
    }
    .leg-src { background: #e3f2fd; color: #0d47a1; border-color: #90caf9; }
    .leg-bro { background: #fff3e0; color: #bf360c; border-color: #ffb74d; }
    .leg-sil { background: #eceff1; color: #37474f; border-color: #b0bec5; }
    .leg-gld { background: #fffde7; color: #e65100; border-color: #ffe082; }
    .leg-job { background: #f3e5f5; color: #4a148c; border-color: #ce93d8; }
    .leg-pnl { background: #e8f5e9; color: #1b5e20; border-color: #a5d6a7; }
    .leg-mdl { background: #e0f7fa; color: #006064; border-color: #80deea; }
  `],
})
export class LineageComponent {
  private readonly data = inject(PlatformDataService);

  // ── Filter state (signals for computed dependency tracking) ──────────────
  readonly entityType = signal<LineageEntityType | null>(null);
  readonly subType    = signal('');
  readonly entityName = signal('');

  // ── Diagram state ─────────────────────────────────────────────────────────
  readonly currentGraph = signal<LineageGraph | null>(null);
  readonly noResults    = signal(false);
  readonly zoomLevel    = signal(1);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly zoomPercent = computed(() => Math.round(this.zoomLevel() * 100) + '%');

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

  visualize(): void {
    const type  = this.entityType();
    const sub   = this.subType();
    const query = this.entityName().trim().toLowerCase();
    if (!type || !query) return;

    const graph = this.data.lineageGraphs().find(g =>
      g.entityType === type &&
      (!sub || g.subType === sub) &&
      (g.entityName.toLowerCase().includes(query) ||
       g.displayName.toLowerCase().includes(query))
    ) ?? null;

    this.currentGraph.set(graph);
    this.noResults.set(graph === null);
    if (graph) this.zoomLevel.set(1);
  }

  quickSearch(type: LineageEntityType, subType: string, name: string): void {
    this.entityType.set(type);
    this.subType.set(subType);
    this.entityName.set(name);
    this.visualize();
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
  resetZoom(): void { this.zoomLevel.set(1); }

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
