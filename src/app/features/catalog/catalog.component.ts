import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { CatalogAsset, DataLayer, Pipeline } from '../../core/models';
import { PlatformDataService } from '../../core/services/platform-data.service';

type GoldenFilter = 'all' | 'yes' | 'no';

/**
 * Catálogo de Dados — visão **premium para tabelas**.
 *
 * Decisões de UX (estado da arte):
 *   • Foco exclusivo em tabelas (o domínio do catálogo no produto atual).
 *   • Indicadores curtos: Tabelas / Golden sources / Domínios. Sem
 *     "Termos" (a aba Glossário foi descontinuada).
 *   • Lista densa, com tipografia hierárquica: nome lógico em destaque,
 *     nome físico abaixo em monoespaçado.
 *   • Detalhe expandido em duas colunas — metadados governáveis à
 *     esquerda, pipelines de ingestão à direita.
 *   • Apenas pipelines de ingestão diretos da tabela são listados; as
 *     origens de cada pipeline aparecem como nome físico, sem expandir
 *     a cadeia upstream completa (mantém o foco operacional).
 */
@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatTooltipModule,
    PageHeaderComponent, StatusBadgeComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Catálogo de Dados"
      subtitle="Tabelas catalogadas com nome lógico, camada, golden source, domínio, squad e SLA."
      icon="menu_book">
      <a mat-stroked-button color="primary" href="https://atlan.example/" target="_blank" rel="noopener" matTooltip="Abrir Atlan Catalog em nova aba">
        <mat-icon>open_in_new</mat-icon> Abrir Atlan
      </a>
      <a mat-stroked-button color="primary" href="https://mapa-de-dados.example/" target="_blank" rel="noopener" matTooltip="Abrir Mapa de Dados em nova aba">
        <mat-icon>map</mat-icon> Mapa de Dados
      </a>
    </app-page-header>

    <section class="summary-strip">
      <div class="summary-item"><strong>{{ tableCount() }}</strong><span>Tabelas catalogadas</span></div>
      <div class="summary-item"><strong>{{ goldenCount() }}</strong><span>Golden sources</span></div>
      <div class="summary-item"><strong>{{ domains.length }}</strong><span>Domínios</span></div>
    </section>

    <mat-tab-group animationDuration="200ms">
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">table_chart</mat-icon> Tabelas</ng-template>
        <div class="tab-content">

          <section class="filters-panel" aria-label="Filtros do catálogo">
            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-icon matPrefix>search</mat-icon>
              <input matInput placeholder="Buscar por nome lógico, físico, qualified name ou sigla"
                     [(ngModel)]="searchTerm">
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Sigla</mat-label>
              <mat-select [(ngModel)]="siglaFilter">
                <mat-option value="all">Todas</mat-option>
                <mat-option *ngFor="let sigla of siglas()" [value]="sigla">{{ sigla }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Camada</mat-label>
              <mat-select [(ngModel)]="layerFilter">
                <mat-option value="all">Todas</mat-option>
                <mat-option value="sor">SOR</mat-option>
                <mat-option value="sot">SOT</mat-option>
                <mat-option value="spec">SPEC</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Golden source</mat-label>
              <mat-select [(ngModel)]="goldenFilter">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="yes">Sim</mat-option>
                <mat-option value="no">Não</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Domínio</mat-label>
              <mat-select [(ngModel)]="domainFilter">
                <mat-option value="all">Todos</mat-option>
                <mat-option *ngFor="let domain of domains" [value]="domain.name">{{ domain.name }}</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-button color="primary" class="clear-button" (click)="clearFilters()">
              <mat-icon>filter_alt_off</mat-icon> Limpar filtros
            </button>
          </section>

          <section class="list-shell">
            <div class="list-toolbar">
              <strong>{{ filtered().length }} tabela(s)</strong>
              <span>Camada e golden source são metadados governados pelo time de catálogo.</span>
            </div>

            <div class="asset-grid asset-grid--head">
              <span>Tabela</span>
              <span>Sigla</span>
              <span>Camada</span>
              <span>Golden</span>
              <span>Domínio</span>
              <span>Squad sustentação</span>
              <span>SLA</span>
              <span>Atualização</span>
            </div>

            <article class="asset-row"
                     *ngFor="let asset of filtered()"
                     [class.asset-row--selected]="selectedAssetId() === asset.id"
                     (click)="toggleAsset(asset)">
              <div class="asset-grid">
                <div class="asset-main">
                  <mat-icon>table_chart</mat-icon>
                  <div>
                    <strong>{{ asset.logicalName || asset.name }}</strong>
                    <code>{{ asset.qualifiedName }}</code>
                  </div>
                </div>
                <span class="sigla">{{ asset.sigla }}</span>
                <span>{{ asset.dataLayer ? (asset.dataLayer | uppercase) : '—' }}</span>
                <span class="golden-cell" [class.golden-cell--yes]="asset.goldenSource">
                  {{ asset.goldenSource ? 'Sim' : 'Não' }}
                </span>
                <span>{{ asset.domain }}</span>
                <span>{{ asset.supportSquad || '—' }}</span>
                <span class="sla">{{ asset.slaDelivery || '—' }}</span>
                <span class="muted">{{ asset.lastUpdated | relativeTime }}</span>
              </div>

              <!-- Detalhe premium: 2 colunas -->
              <div class="asset-detail" *ngIf="selectedAssetId() === asset.id" (click)="$event.stopPropagation()">
                <div class="detail-grid">
                  <!-- Coluna esquerda: metadados -->
                  <section class="detail-meta-card">
                    <header class="detail-meta-card__head">
                      <span class="eyebrow">Metadados</span>
                      <h3>{{ asset.logicalName || asset.name }}</h3>
                      <p *ngIf="asset.description">{{ asset.description }}</p>
                    </header>
                    <dl class="detail-meta__list">
                      <div><dt>Nome lógico</dt><dd>{{ asset.logicalName || '—' }}</dd></div>
                      <div><dt>Nome físico</dt><dd class="mono">{{ asset.name }}</dd></div>
                      <div><dt>Database</dt><dd class="mono">{{ databaseName(asset) }}</dd></div>
                      <div><dt>Qualified name</dt><dd class="mono">{{ asset.qualifiedName }}</dd></div>
                      <div><dt>Sigla</dt><dd>{{ asset.sigla }}</dd></div>
                      <div><dt>Camada</dt><dd>{{ asset.dataLayer ? (asset.dataLayer | uppercase) : '—' }}</dd></div>
                      <div>
                        <dt>Golden source</dt>
                        <dd>
                          <span class="badge" [class.badge--success]="asset.goldenSource">
                            {{ asset.goldenSource ? 'Sim' : 'Não' }}
                          </span>
                        </dd>
                      </div>
                      <div><dt>Domínio</dt><dd>{{ asset.domain }}</dd></div>
                      <div><dt>Squad sustentação</dt><dd>{{ asset.supportSquad || '—' }}</dd></div>
                      <div><dt>SLA de entrega</dt><dd>{{ asset.slaDelivery || '—' }}</dd></div>
                    </dl>
                  </section>

                  <!-- Coluna direita: jobs de ingestão + origens diretas -->
                  <section class="detail-ingest">
                    <header class="detail-ingest__head">
                      <span class="eyebrow">Atualização da tabela</span>
                      <h3>Jobs de ingestão</h3>
                      <p>Pipelines que escrevem nesta tabela com suas tabelas origem diretas.</p>
                    </header>

                    <ul class="ingest-list" *ngIf="ingestionFlowsFor(asset).length; else noIngest">
                      <li class="ingest-item" *ngFor="let flow of ingestionFlowsFor(asset)">
                        <div class="ingest-item__head">
                          <strong>{{ flow.name }}</strong>
                          <span class="ingest-item__type">{{ flow.type }}</span>
                        </div>
                        <div class="ingest-item__sources" *ngIf="flow.sources.length; else noSources">
                          <span class="ingest-item__label">Origens diretas</span>
                          <div class="chips">
                            <code *ngFor="let src of flow.sources">{{ physicalName(src) }}</code>
                          </div>
                        </div>
                        <ng-template #noSources>
                          <span class="muted">Sem origens declaradas.</span>
                        </ng-template>
                      </li>
                    </ul>
                    <ng-template #noIngest>
                      <span class="muted">Nenhum job de ingestão direto cadastrado para esta tabela.</span>
                    </ng-template>
                  </section>
                </div>
              </div>
            </article>

            <div class="empty" *ngIf="!filtered().length">
              Nenhuma tabela encontrada para os filtros atuais.
            </div>
          </section>
        </div>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">category</mat-icon> Domínios</ng-template>
        <div class="tab-content">
          <section class="list-shell">
            <div class="domain-grid domain-grid--head">
              <span>Domínio</span><span>Owner</span><span>Tabelas</span><span>Subdomínios</span>
            </div>
            <div class="domain-grid domain-row" *ngFor="let domain of domains">
              <div><strong>{{ domain.name }}</strong><span>{{ domain.description }}</span></div>
              <span>{{ domain.owner }}</span>
              <span>{{ domain.assetCount }}</span>
              <span>{{ domain.subDomains.join(', ') }}</span>
            </div>
          </section>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    /* ============== Indicadores ============== */
    .summary-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1px; margin-bottom: 18px; border-radius: var(--radius-lg); overflow: hidden; background: var(--border-subtle); }
    .summary-item { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; background: var(--bg-surface); }
    .summary-item strong { color: var(--text-primary); font-size: 22px; font-weight: 700; line-height: 1.05; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
    .summary-item span { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .tab-content { padding-top: 16px; }

    /* ============== Filtros ============== */
    .filters-panel { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; padding: 12px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filter-field { width: 158px; margin-bottom: -20px; }
    .search-field { flex: 1 1 320px; min-width: 280px; }
    .clear-button { margin-left: auto; }

    /* ============== Lista ============== */
    .list-shell { border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-surface); }
    .list-toolbar { display: flex; justify-content: space-between; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .list-toolbar strong { font-size: 13px; color: var(--text-primary); font-weight: 600; }
    .list-toolbar span { color: var(--text-muted); font-size: 11px; }

    .asset-grid {
      display: grid;
      grid-template-columns: minmax(280px, 2fr) 80px 80px 80px 130px 140px 160px 100px;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
      font-size: 12px;
    }
    .asset-grid--head {
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      background: var(--bg-app);
      border-bottom: 1px solid var(--border-subtle);
      padding-top: 9px;
      padding-bottom: 9px;
    }
    .asset-row { border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background .15s ease; }
    .asset-row:last-child { border-bottom: 0; }
    .asset-row:hover { background: rgba(76,141,255,0.05); }
    .asset-row--selected { background: var(--bg-elevated); }

    .asset-main { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .asset-main mat-icon { color: var(--brand-300); font-size: 20px; width: 20px; height: 20px; }
    .asset-main div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .asset-main strong { color: var(--text-primary); font-size: 13px; font-weight: 600; letter-spacing: -0.005em; }
    .asset-main code { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); background: transparent; padding: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .sigla { display: inline-flex; width: fit-content; align-items: center; border-radius: 5px; padding: 2px 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--brand-300); background: var(--bg-overlay); }
    .golden-cell { color: var(--text-secondary); font-size: 12px; }
    .golden-cell--yes { color: var(--success-500); font-weight: 700; }
    .sla { color: var(--text-secondary); font-size: 11px; }
    .muted { color: var(--text-muted); }
    .empty { padding: 32px 16px; color: var(--text-muted); font-size: 13px; text-align: center; border-top: 1px solid var(--border-subtle); }

    /* ============== Detalhe premium ============== */
    .asset-detail {
      padding: 16px 16px 20px;
      background: var(--bg-app);
      border-top: 1px solid var(--border-subtle);
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: 18px;
      align-items: flex-start;
    }
    @media (max-width: 1100px) { .detail-grid { grid-template-columns: 1fr; } }

    .detail-meta-card,
    .detail-ingest {
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      padding: 18px 20px;
    }
    .detail-meta-card__head,
    .detail-ingest__head { display: flex; flex-direction: column; gap: 2px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
    .eyebrow { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.10em; font-weight: 700; }
    .detail-meta-card__head h3,
    .detail-ingest__head h3 { margin: 4px 0 0; font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
    .detail-meta-card__head p,
    .detail-ingest__head p { margin: 6px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.55; }

    .detail-meta__list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 0; padding: 0; }
    .detail-meta__list > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .detail-meta__list dt { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .detail-meta__list dd { margin: 0; color: var(--text-primary); font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .detail-meta__list dd.mono { font-family: var(--font-mono); font-size: 12px; }

    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: var(--bg-overlay); color: var(--text-secondary); font-size: 11px; font-weight: 600; }
    .badge--success { background: var(--success-bg); color: var(--success-500); }

    .ingest-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .ingest-item { background: var(--bg-app); border-radius: var(--radius-md); padding: 12px 14px; }
    .ingest-item__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
    .ingest-item__head strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .ingest-item__type { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .ingest-item__label { display: block; color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-bottom: 4px; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chips code { font-family: var(--font-mono); font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--bg-surface); color: var(--text-primary); }

    /* ============== Domínios ============== */
    .domain-grid { display: grid; grid-template-columns: minmax(220px, 1.4fr) 180px 90px 2fr; gap: 14px; align-items: center; padding: 12px 16px; font-size: 12px; }
    .domain-grid--head { color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: var(--bg-app); border-bottom: 1px solid var(--border-subtle); }
    .domain-row { border-bottom: 1px solid var(--border-subtle); }
    .domain-row:last-child { border-bottom: 0; }
    .domain-row div { display: flex; flex-direction: column; gap: 1px; }
    .domain-row strong { color: var(--text-primary); font-size: 13px; font-weight: 600; }
    .domain-row span { color: var(--text-muted); font-size: 11px; }

    @media (max-width: 1280px) {
      .asset-grid { grid-template-columns: minmax(220px, 1fr) 60px 64px 60px 90px 100px; }
      .asset-grid > :nth-child(7),
      .asset-grid > :nth-child(8) { display: none; }
    }
    @media (max-width: 760px) {
      .filter-field, .search-field { width: 100%; flex-basis: 100%; }
      .clear-button { margin-left: 0; }
      .asset-grid { grid-template-columns: 1fr; }
      .asset-grid--head { display: none; }
      .asset-grid > :nth-child(n+2) { display: none; }
      .domain-grid { grid-template-columns: 1fr; }
      .domain-grid--head { display: none; }
    }
  `],
})
export class CatalogComponent {
  private readonly data = inject(PlatformDataService);

  /** Apenas tabelas — o catálogo, hoje, é uma visão de ativos tabulares. */
  readonly tables = computed(() => this.data.catalogAssets().filter(a => a.type === 'table'));
  readonly domains = this.data.catalogDomains();

  /* --- Filtros --- */
  searchTerm = '';
  domainFilter = 'all';
  siglaFilter = 'all';
  layerFilter: DataLayer | 'all' = 'all';
  goldenFilter: GoldenFilter = 'all';

  /* --- Seleção --- */
  readonly selectedAssetId = signal<string | null>(null);

  /* --- KPIs / metadados derivados --- */
  readonly tableCount  = computed(() => this.tables().length);
  readonly goldenCount = computed(() => this.tables().filter(a => a.goldenSource).length);
  readonly siglas      = computed(() => Array.from(new Set(this.tables().map(a => a.sigla))).sort());

  /* --- Pipeline de filtros --- */
  readonly filtered = computed<CatalogAsset[]>(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.tables().filter(asset => {
      if (this.siglaFilter !== 'all' && asset.sigla !== this.siglaFilter) return false;
      if (this.layerFilter !== 'all' && asset.dataLayer !== this.layerFilter) return false;
      if (this.goldenFilter !== 'all' && asset.goldenSource !== (this.goldenFilter === 'yes')) return false;
      if (this.domainFilter !== 'all' && asset.domain !== this.domainFilter) return false;
      if (term && !this.matchesText(asset, term)) return false;
      return true;
    });
  });

  toggleAsset(asset: CatalogAsset): void {
    this.selectedAssetId.update(current => current === asset.id ? null : asset.id);
  }

  databaseName(asset: CatalogAsset): string {
    const parts = asset.qualifiedName.split('.');
    // qualifiedName típico: catalog.database.table → database
    return parts.length >= 2 ? parts.slice(0, -1).pop() ?? '—' : '—';
  }

  /** Nome físico: drop "datalake." e similares; mostra `database.table` ou só o final. */
  physicalName(qualifiedName: string): string {
    const parts = qualifiedName.split('.');
    if (parts.length >= 2) return parts.slice(-2).join('.');
    return qualifiedName;
  }

  /**
   * Pipelines que produzem esta tabela. Não navegamos a cadeia upstream —
   * apenas as origens diretas declaradas no pipeline (foco em diagnóstico
   * operacional, não em linhagem completa, que vive em /lineage).
   */
  ingestionFlowsFor(asset: CatalogAsset): Array<Pick<Pipeline, 'name' | 'type' | 'sources'>> {
    return this.data.pipelines()
      .filter(p =>
        p.target === asset.qualifiedName
        || p.target.endsWith(`.${asset.name}`)
        || asset.qualifiedName.endsWith(`.${p.target.split('.').at(-1)}`),
      )
      .map(({ name, type, sources }) => ({ name, type, sources }));
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.domainFilter = 'all';
    this.siglaFilter = 'all';
    this.layerFilter = 'all';
    this.goldenFilter = 'all';
  }

  private matchesText(asset: CatalogAsset, term: string): boolean {
    const fields = [
      asset.name, asset.qualifiedName, asset.logicalName,
      asset.description, asset.sigla, asset.domain, asset.supportSquad,
    ].filter(Boolean) as string[];
    return fields.some(v => v.toLowerCase().includes(term));
  }
}
