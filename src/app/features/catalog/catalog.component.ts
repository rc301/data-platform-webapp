import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { CatalogAsset, DataLayer } from '../../core/models';
import { PlatformDataService } from '../../core/services/platform-data.service';

type GoldenFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatTableModule, MatTooltipModule,
    PageHeaderComponent, StatusBadgeComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Catálogo de Dados" subtitle="Descubra ativos em lista, com filtros de governança para tabelas" icon="menu_book">
      <a mat-stroked-button color="primary" matTooltip="Abrir Atlan Catalog">
        <mat-icon>open_in_new</mat-icon> Abrir Atlan
      </a>
    </app-page-header>

    <section class="summary-strip">
      <div class="summary-item"><strong>{{ assets.length }}</strong><span>Total de ativos</span></div>
      <div class="summary-item"><strong>{{ tableCount }}</strong><span>Tabelas</span></div>
      <div class="summary-item"><strong>{{ goldenCount }}</strong><span>Golden sources</span></div>
      <div class="summary-item"><strong>{{ domains.length }}</strong><span>Domínios</span></div>
      <div class="summary-item"><strong>{{ glossary.length }}</strong><span>Termos</span></div>
    </section>

    <mat-tab-group animationDuration="200ms">
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">table_chart</mat-icon> Ativos</ng-template>
        <div class="tab-content">
          <section class="filters-panel" aria-label="Filtros do catálogo">
            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-icon matPrefix>search</mat-icon>
              <input matInput placeholder="Buscar por ativo, descrição, qualified name ou sigla" [(ngModel)]="searchTerm" (ngModelChange)="filterAssets()">
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Tipo</mat-label>
              <mat-select [(ngModel)]="typeFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="table">Tabela</mat-option>
                <mat-option value="view">View</mat-option>
                <mat-option value="dashboard">Dashboard</mat-option>
                <mat-option value="pipeline">Pipeline</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Sigla</mat-label>
              <mat-select [(ngModel)]="siglaFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todas</mat-option>
                <mat-option *ngFor="let sigla of siglas" [value]="sigla">{{ sigla }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Camada</mat-label>
              <mat-select [(ngModel)]="layerFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todas</mat-option>
                <mat-option value="sor">SOR</mat-option>
                <mat-option value="sot">SOT</mat-option>
                <mat-option value="spec">SPEC</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Golden source</mat-label>
              <mat-select [(ngModel)]="goldenFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="yes">Sim</mat-option>
                <mat-option value="no">Não</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Domínio</mat-label>
              <mat-select [(ngModel)]="domainFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todos</mat-option>
                <mat-option *ngFor="let domain of domains" [value]="domain.name">{{ domain.name }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Certificação</mat-label>
              <mat-select [(ngModel)]="certFilter" (ngModelChange)="filterAssets()">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="certified">Certificado</mat-option>
                <mat-option value="in_review">Em Revisão</mat-option>
                <mat-option value="draft">Rascunho</mat-option>
                <mat-option value="deprecated">Depreciado</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-button color="primary" class="clear-button" (click)="clearFilters()">Limpar filtros</button>
          </section>

          <section class="list-shell">
            <div class="list-toolbar">
              <strong>{{ filteredAssets().length }} ativos</strong>
              <span>Camada e golden-source se aplicam somente a ativos do tipo tabela.</span>
            </div>

            <div class="asset-grid asset-grid--head">
              <span>Ativo</span>
              <span>Tipo</span>
              <span>Sigla</span>
              <span>Camada</span>
              <span>Golden</span>
              <span>Domínio</span>
              <span>Certificação</span>
              <span>Atualização</span>
            </div>

            <article class="asset-row" *ngFor="let asset of filteredAssets()" [class.asset-row--selected]="selectedAssetId() === asset.id" (click)="toggleAsset(asset)">
              <div class="asset-grid">
                <div class="asset-main">
                  <mat-icon>{{ getTypeIcon(asset.type) }}</mat-icon>
                  <div>
                    <strong>{{ asset.name }}</strong>
                    <code>{{ asset.qualifiedName }}</code>
                  </div>
                </div>
                <span class="type-pill">{{ asset.type }}</span>
                <span class="sigla">{{ asset.sigla }}</span>
                <span>{{ asset.type === 'table' && asset.dataLayer ? (asset.dataLayer | uppercase) : '-' }}</span>
                <span class="golden-cell" [class.golden-cell--yes]="asset.goldenSource">
                  {{ asset.type === 'table' ? (asset.goldenSource ? 'Sim' : 'Não') : '-' }}
                </span>
                <span>{{ asset.domain }}</span>
                <app-status-badge [status]="asset.certificationStatus" [label]="certificationLabel(asset.certificationStatus)"></app-status-badge>
                <span>{{ asset.lastUpdated | relativeTime }}</span>
              </div>

              <div class="asset-detail" *ngIf="selectedAssetId() === asset.id">
                <p>{{ asset.description }}</p>
                <div class="detail-meta">
                  <span><mat-icon inline>person</mat-icon>{{ asset.owner }}</span>
                  <span><mat-icon inline>source</mat-icon>{{ asset.sourceSystem }}</span>
                  <span><mat-icon inline>trending_up</mat-icon>Popularidade {{ asset.popularity }}</span>
                </div>
                <mat-chip-set>
                  <mat-chip *ngFor="let tag of asset.tags">{{ tag }}</mat-chip>
                  <mat-chip *ngFor="let classification of asset.classification" class="classification-chip">
                    <mat-icon matChipAvatar>shield</mat-icon>{{ classification }}
                  </mat-chip>
                </mat-chip-set>
                <div class="lineage-strip" *ngIf="asset.lineage && (asset.lineage.upstream.length || asset.lineage.downstream.length)">
                  <span *ngIf="asset.lineage.upstream.length">Upstream: {{ lineageNames(asset.lineage.upstream) }}</span>
                  <span *ngIf="asset.lineage.downstream.length">Downstream: {{ lineageNames(asset.lineage.downstream) }}</span>
                </div>
              </div>
            </article>
          </section>
        </div>
      </mat-tab>

      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">category</mat-icon> Domínios</ng-template>
        <div class="tab-content">
          <section class="list-shell">
            <div class="domain-grid domain-grid--head">
              <span>Domínio</span><span>Owner</span><span>Ativos</span><span>Subdomínios</span>
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

      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">book</mat-icon> Glossário</ng-template>
        <div class="tab-content">
          <section class="list-shell">
            <table mat-table [dataSource]="glossary" class="glossary-table">
              <ng-container matColumnDef="term">
                <th mat-header-cell *matHeaderCellDef>Termo</th>
                <td mat-cell *matCellDef="let item"><strong>{{ item.term }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="definition">
                <th mat-header-cell *matHeaderCellDef>Definição</th>
                <td mat-cell *matCellDef="let item">{{ item.definition }}</td>
              </ng-container>
              <ng-container matColumnDef="domain">
                <th mat-header-cell *matHeaderCellDef>Domínio</th>
                <td mat-cell *matCellDef="let item">{{ item.domain }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let item"><app-status-badge [status]="item.status"></app-status-badge></td>
              </ng-container>
              <ng-container matColumnDef="assets">
                <th mat-header-cell *matHeaderCellDef>Ativos</th>
                <td mat-cell *matCellDef="let item">{{ item.assignedAssets }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="glossaryColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: glossaryColumns;"></tr>
            </table>
          </section>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .summary-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; margin-bottom: 22px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; background: var(--border-subtle); }
    .summary-item { display: flex; flex-direction: column; gap: 3px; padding: 14px 16px; background: var(--bg-surface); }
    .summary-item strong { color: var(--text-primary); font-size: 24px; line-height: 1; }
    .tab-content { padding-top: 16px; }

    .filters-panel { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface); }
    .filter-field { width: 158px; margin-bottom: -20px; }
    .search-field { flex: 1 1 300px; min-width: 280px; }
    .clear-button { margin-left: auto; }

    .list-shell { border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-surface); }
    .list-toolbar { display: flex; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
    .list-toolbar span { color: var(--text-secondary); font-size: 12px; }
    .asset-grid { display: grid; grid-template-columns: minmax(280px, 2fr) 90px 70px 74px 82px 110px 130px 120px; gap: 12px; align-items: center; padding: 12px 16px; }
    .asset-grid--head, .domain-grid--head { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; background: var(--bg-app); border-bottom: 1px solid var(--border-subtle); }
    .asset-row { border-bottom: 1px solid var(--border-subtle); cursor: pointer; }
    .asset-row:last-child { border-bottom: 0; }
    .asset-row--selected { background: var(--bg-elevated); }
    .asset-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .asset-main mat-icon { color: var(--brand-300); }
    .asset-main div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .asset-main strong { color: var(--text-primary); font-size: 14px; }
    code { max-width: 100%; overflow: hidden; text-overflow: ellipsis; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 12px; }
    .sigla, .type-pill { display: inline-flex; width: fit-content; align-items: center; border-radius: 6px; padding: 3px 7px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .sigla { color: var(--brand-300); background: var(--bg-overlay); border: 1px solid var(--border-subtle); }
    .type-pill { color: var(--text-secondary); background: var(--bg-app); border: 1px solid var(--border-subtle); }
    .golden-cell { color: var(--text-secondary); }
    .golden-cell--yes { color: var(--success-500); font-weight: 800; }
    .asset-detail { display: flex; flex-direction: column; gap: 10px; padding: 0 16px 16px 54px; }
    .asset-detail p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
    .detail-meta, .lineage-strip { display: flex; flex-wrap: wrap; gap: 16px; color: var(--text-secondary); font-size: 12px; }
    .detail-meta span { display: inline-flex; align-items: center; gap: 4px; }
    .classification-chip { --mdc-chip-elevated-container-color: var(--warning-bg); }

    .domain-grid { display: grid; grid-template-columns: minmax(220px, 1.4fr) 180px 90px 2fr; gap: 14px; align-items: center; padding: 12px 16px; }
    .domain-row { border-bottom: 1px solid var(--border-subtle); }
    .domain-row:last-child { border-bottom: 0; }
    .domain-row div { display: flex; flex-direction: column; gap: 2px; }
    .domain-row strong { color: var(--text-primary); font-size: 14px; }
    .domain-row span { color: var(--text-secondary); font-size: 13px; }

    .glossary-table { width: 100%; }
    th.mat-mdc-header-cell { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }

    @media (max-width: 1150px) {
      .asset-grid { grid-template-columns: minmax(260px, 1fr) 78px 64px 76px 44px; }
      .asset-grid > :nth-child(6),
      .asset-grid > :nth-child(7),
      .asset-grid > :nth-child(8) { display: none; }
      .domain-grid { grid-template-columns: 1fr 120px 70px; }
      .domain-grid > :nth-child(4) { display: none; }
    }
    @media (max-width: 720px) {
      .filter-field, .search-field { width: 100%; flex-basis: 100%; }
      .clear-button { margin-left: 0; }
      .asset-grid { grid-template-columns: 1fr auto; }
      .asset-grid--head { display: none; }
      .asset-grid > :nth-child(n+2):nth-child(-n+7) { display: none; }
      .asset-detail { padding-left: 16px; }
      .list-toolbar { flex-direction: column; }
      .domain-grid { grid-template-columns: 1fr; }
      .domain-grid--head { display: none; }
    }
  `],
})
export class CatalogComponent {
  private readonly data = inject(PlatformDataService);

  assets = this.data.catalogAssets();
  domains = this.data.catalogDomains();
  glossary = this.data.glossary();
  glossaryColumns = ['term', 'definition', 'domain', 'status', 'assets'];

  searchTerm = '';
  domainFilter = 'all';
  certFilter = 'all';
  typeFilter = 'all';
  siglaFilter = 'all';
  layerFilter: DataLayer | 'all' = 'all';
  goldenFilter: GoldenFilter = 'all';

  selectedAssetId = signal<string | null>(null);
  filteredAssets = signal<CatalogAsset[]>(this.assets);
  siglas = Array.from(new Set(this.assets.map(asset => asset.sigla))).sort();

  get tableCount(): number {
    return this.assets.filter(asset => asset.type === 'table').length;
  }

  get goldenCount(): number {
    return this.assets.filter(asset => asset.type === 'table' && asset.goldenSource).length;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { table: 'table_chart', view: 'visibility', dashboard: 'dashboard', column: 'view_column', schema: 'schema', database: 'storage', pipeline: 'account_tree' };
    return icons[type] || 'description';
  }

  certificationLabel(status: string): string {
    return ({
      certified: 'Certificado',
      in_review: 'Em revisão',
      draft: 'Rascunho',
      deprecated: 'Depreciado',
    } as Record<string, string>)[status] || status;
  }

  lineageNames(nodes: Array<{ name: string }>): string {
    return nodes.map(node => node.name).join(', ');
  }

  toggleAsset(asset: CatalogAsset): void {
    this.selectedAssetId.update(current => current === asset.id ? null : asset.id);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.domainFilter = 'all';
    this.certFilter = 'all';
    this.typeFilter = 'all';
    this.siglaFilter = 'all';
    this.layerFilter = 'all';
    this.goldenFilter = 'all';
    this.filterAssets();
  }

  filterAssets(): void {
    let result = this.assets;
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(term)
        || asset.qualifiedName.toLowerCase().includes(term)
        || asset.description.toLowerCase().includes(term)
        || asset.sigla.toLowerCase().includes(term),
      );
    }
    if (this.typeFilter !== 'all') result = result.filter(asset => asset.type === this.typeFilter);
    if (this.siglaFilter !== 'all') result = result.filter(asset => asset.sigla === this.siglaFilter);
    if (this.domainFilter !== 'all') result = result.filter(asset => asset.domain === this.domainFilter);
    if (this.certFilter !== 'all') result = result.filter(asset => asset.certificationStatus === this.certFilter);
    if (this.layerFilter !== 'all') result = result.filter(asset => asset.type === 'table' && asset.dataLayer === this.layerFilter);
    if (this.goldenFilter !== 'all') {
      const golden = this.goldenFilter === 'yes';
      result = result.filter(asset => asset.type === 'table' && asset.goldenSource === golden);
    }
    this.filteredAssets.set(result);
  }
}
