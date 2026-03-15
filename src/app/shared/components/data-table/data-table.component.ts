import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ContentChildren, QueryList, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  template?: TemplateRef<any>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="table-card">
      <div class="table-toolbar" *ngIf="showSearch || headerTemplate">
        <mat-form-field appearance="outline" class="search-field" *ngIf="showSearch">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [placeholder]="searchPlaceholder" (input)="onSearch($event)">
        </mat-form-field>
        <ng-container *ngIf="headerTemplate" [ngTemplateOutlet]="headerTemplate"></ng-container>
      </div>
      <div class="table-container">
        <table mat-table [dataSource]="data" matSort (matSortChange)="onSort($event)">
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef [mat-sort-header]="col.sortable !== false ? col.key : ''" [disabled]="col.sortable === false">{{ col.label }}</th>
            <td mat-cell *matCellDef="let row">
              <ng-container *ngIf="col.template; else defaultCell" [ngTemplateOutlet]="col.template" [ngTemplateOutletContext]="{ $implicit: row, column: col.key }"></ng-container>
              <ng-template #defaultCell>{{ row[col.key] }}</ng-template>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row" (click)="rowClick.emit(row)"></tr>
        </table>
      </div>
      <mat-paginator *ngIf="showPaginator" [length]="totalItems" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
    </mat-card>
  `,
  styles: [`
    .table-card { overflow: hidden; }
    .table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; gap: 16px; flex-wrap: wrap; }
    .search-field { width: 320px; }
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .table-row { cursor: pointer; transition: background-color 0.15s; }
    .table-row:hover { background-color: rgba(0,0,0,0.04); }
    th.mat-mdc-header-cell { font-weight: 600; color: #444; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    td.mat-mdc-cell { font-size: 14px; }
  `],
})
export class DataTableComponent {
  @Input({ required: true }) data: any[] = [];
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() showPaginator = true;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() headerTemplate?: TemplateRef<any>;
  @Output() search = new EventEmitter<string>();
  @Output() sort = new EventEmitter<Sort>();
  @Output() page = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<any>();

  get displayedColumns(): string[] {
    return this.columns.map(c => c.key);
  }

  onSearch(event: Event): void {
    this.search.emit((event.target as HTMLInputElement).value);
  }

  onSort(sort: Sort): void {
    this.sort.emit(sort);
  }

  onPage(page: PageEvent): void {
    this.page.emit(page);
  }
}
