import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { MOCK_CATALOG_ASSETS, MOCK_DOMAINS, MOCK_GLOSSARY } from '../../core/mocks/catalog.mock';
import { CatalogAsset } from '../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatTableModule,
    MatTooltipModule, MatExpansionModule, MatDividerModule, MatBadgeModule,
    PageHeaderComponent, StatusBadgeComponent, MetricCardComponent, RelativeTimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Catálogo de Dados" subtitle="Descubra e gerencie ativos de dados" icon="menu_book">
      <a mat-stroked-button color="primary" matTooltip="Abrir Atlan Catalog">
        <mat-icon>open_in_new</mat-icon> Abrir Atlan
      </a>
    </app-page-header>

    <!-- Overview -->
    <div class="metrics-grid">
      <app-metric-card label="Total de Ativos" [value]="assets.length" icon="inventory_2" iconBg="#e8eaf6" iconColor="#1a237e" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Domínios" [value]="domains.length" icon="category" iconBg="#e3f2fd" iconColor="#1565c0" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Certificados" [value]="certifiedCount" icon="verified" iconBg="#e8f5e9" iconColor="#2e7d32" [showTrend]="false"></app-metric-card>
      <app-metric-card label="Termos do Glossário" [value]="glossary.length" icon="book" iconBg="#f3e5f5" iconColor="#7b1fa2" [showTrend]="false"></app-metric-card>
    </div>

    <mat-tab-group animationDuration="200ms">
      <!-- Assets Tab -->
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">table_chart</mat-icon> Ativos</ng-template>
        <div class="tab-content">
          <mat-card class="filters-card">
            <div class="filters-row">
              <mat-form-field appearance="outline" class="filter-field search-field">
                <mat-icon matPrefix>search</mat-icon>
                <input matInput placeholder="Buscar ativos..." [(ngModel)]="searchTerm" (ngModelChange)="filterAssets()">
              </mat-form-field>
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Domínio</mat-label>
                <mat-select [(ngModel)]="domainFilter" (ngModelChange)="filterAssets()">
                  <mat-option value="all">Todos os Domínios</mat-option>
                  <mat-option *ngFor="let d of domains" [value]="d.name">{{ d.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Certificação</mat-label>
                <mat-select [(ngModel)]="certFilter" (ngModelChange)="filterAssets()">
                  <mat-option value="all">Todos</mat-option>
                  <mat-option value="certified">Certificado</mat-option>
                  <mat-option value="in_review">Em Revisão</mat-option>
                  <mat-option value="draft">Rascunho</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card>

          <div class="assets-list">
            <mat-card *ngFor="let asset of filteredAssets()" class="asset-card" (click)="selectAsset(asset)">
              <div class="asset-header">
                <mat-icon class="asset-type-icon">{{ getTypeIcon(asset.type) }}</mat-icon>
                <div class="asset-title">
                  <div class="asset-name">{{ asset.name }}</div>
                  <code class="asset-qualified">{{ asset.qualifiedName }}</code>
                </div>
                <app-status-badge [status]="asset.certificationStatus" [label]="asset.certificationStatus | titlecase"></app-status-badge>
                <div class="asset-popularity" matTooltip="Índice de popularidade">
                  <mat-icon>trending_up</mat-icon>
                  {{ asset.popularity }}
                </div>
              </div>
              <p class="asset-description">{{ asset.description }}</p>
              <div class="asset-meta">
                <mat-chip-set>
                  <mat-chip *ngFor="let tag of asset.tags">{{ tag }}</mat-chip>
                  <mat-chip *ngFor="let cls of asset.classification" class="classification-chip">
                    <mat-icon matChipAvatar>shield</mat-icon> {{ cls }}
                  </mat-chip>
                </mat-chip-set>
                <div class="asset-info-row">
                  <span><mat-icon inline>person</mat-icon> {{ asset.owner }}</span>
                  <span><mat-icon inline>domain</mat-icon> {{ asset.domain }}</span>
                  <span><mat-icon inline>update</mat-icon> {{ asset.lastUpdated | relativeTime }}</span>
                </div>
              </div>
              <!-- Lineage Preview -->
              <div class="lineage-preview" *ngIf="asset.lineage && (asset.lineage.upstream.length || asset.lineage.downstream.length)">
                <mat-divider></mat-divider>
                <div class="lineage-row">
                  <div class="lineage-section" *ngIf="asset.lineage.upstream.length">
                    <span class="lineage-label">Upstream</span>
                    <mat-chip *ngFor="let u of asset.lineage.upstream">
                      <mat-icon matChipAvatar>arrow_back</mat-icon> {{ u.name }}
                    </mat-chip>
                  </div>
                  <div class="lineage-section" *ngIf="asset.lineage.downstream.length">
                    <span class="lineage-label">Downstream</span>
                    <mat-chip *ngFor="let d of asset.lineage.downstream">
                      {{ d.name }} <mat-icon matChipTrailingIcon>arrow_forward</mat-icon>
                    </mat-chip>
                  </div>
                </div>
              </div>
            </mat-card>
          </div>
        </div>
      </mat-tab>

      <!-- Domains Tab -->
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">category</mat-icon> Domínios</ng-template>
        <div class="tab-content">
          <div class="domains-grid">
            <mat-card *ngFor="let domain of domains" class="domain-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="domain-icon">category</mat-icon>
                <mat-card-title>{{ domain.name }}</mat-card-title>
                <mat-card-subtitle>{{ domain.description }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="domain-stats">
                  <div class="domain-stat">
                    <span class="stat-value">{{ domain.assetCount }}</span>
                    <span class="stat-label">Ativos</span>
                  </div>
                  <div class="domain-stat">
                    <span class="stat-value">{{ domain.subDomains.length }}</span>
                    <span class="stat-label">Subdomínios</span>
                  </div>
                </div>
                <mat-chip-set>
                  <mat-chip *ngFor="let sub of domain.subDomains">{{ sub }}</mat-chip>
                </mat-chip-set>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">Ver Ativos</button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      </mat-tab>

      <!-- Glossary Tab -->
      <mat-tab>
        <ng-template mat-tab-label><mat-icon class="tab-icon">book</mat-icon> Glossário</ng-template>
        <div class="tab-content">
          <mat-card>
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
                <td mat-cell *matCellDef="let item"><mat-chip>{{ item.domain }}</mat-chip></td>
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
          </mat-card>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .tab-icon { margin-right: 8px; }
    .tab-content { padding-top: 16px; }

    .filters-card { margin-bottom: 16px; }
    .filters-row { display: flex; gap: 12px; padding: 16px; flex-wrap: wrap; }
    .filter-field { margin-bottom: -20px; }
    .search-field { flex: 1; min-width: 200px; }

    .assets-list { display: flex; flex-direction: column; gap: 12px; }
    .asset-card { cursor: pointer; transition: box-shadow 0.2s, transform 0.15s; }
    .asset-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-1px); }

    .asset-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .asset-type-icon { color: #1a237e; background: #e8eaf6; border-radius: 8px; padding: 8px; font-size: 20px; width: 20px; height: 20px; box-sizing: content-box; }
    .asset-title { flex: 1; }
    .asset-name { font-size: 16px; font-weight: 600; }
    .asset-qualified { font-size: 12px; color: #888; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    .asset-popularity { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #666; }
    .asset-popularity mat-icon { font-size: 16px; width: 16px; height: 16px; color: #1565c0; }
    .asset-description { font-size: 14px; color: #555; margin: 8px 0; }

    .asset-meta { display: flex; flex-direction: column; gap: 8px; }
    .asset-info-row { display: flex; gap: 16px; font-size: 13px; color: #777; }
    .asset-info-row mat-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }
    .classification-chip { --mdc-chip-elevated-container-color: #fff3e0; }

    .lineage-preview { margin-top: 12px; padding-top: 12px; }
    .lineage-row { display: flex; gap: 24px; margin-top: 12px; flex-wrap: wrap; }
    .lineage-section { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .lineage-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }

    .domains-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .domain-card { }
    .domain-icon { background: #e8eaf6 !important; color: #1a237e; border-radius: 12px !important; }
    .domain-stats { display: flex; gap: 24px; margin-bottom: 12px; }
    .domain-stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1a237e; }
    .stat-label { font-size: 12px; color: #888; }

    .glossary-table { width: 100%; }
    th.mat-mdc-header-cell { font-weight: 600; color: #444; font-size: 12px; text-transform: uppercase; }
  `],
})
export class CatalogComponent {
  assets = MOCK_CATALOG_ASSETS;
  domains = MOCK_DOMAINS;
  glossary = MOCK_GLOSSARY;
  glossaryColumns = ['term', 'definition', 'domain', 'status', 'assets'];
  searchTerm = '';
  domainFilter = 'all';
  certFilter = 'all';
  selectedAsset: CatalogAsset | null = null;

  filteredAssets = signal<CatalogAsset[]>(this.assets);

  get certifiedCount(): number {
    return this.assets.filter(a => a.certificationStatus === 'certified').length;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { table: 'table_chart', view: 'visibility', dashboard: 'dashboard', column: 'view_column', schema: 'schema', database: 'storage', pipeline: 'account_tree' };
    return icons[type] || 'description';
  }

  filterAssets(): void {
    let result = this.assets;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(term) || a.qualifiedName.toLowerCase().includes(term) || a.description.toLowerCase().includes(term));
    }
    if (this.domainFilter !== 'all') result = result.filter(a => a.domain === this.domainFilter);
    if (this.certFilter !== 'all') result = result.filter(a => a.certificationStatus === this.certFilter);
    this.filteredAssets.set(result);
  }

  selectAsset(asset: CatalogAsset): void {
    this.selectedAsset = asset;
  }
}
