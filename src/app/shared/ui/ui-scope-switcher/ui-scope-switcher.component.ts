import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { AccessService } from '../../../core/access/access.service';
import { SCOPE_LEVEL_LABELS } from '../../../core/access/naming.config';
import { AccessScope } from '../../../core/access/access.types';

/**
 * Seletor persistente de escopo de visualização.
 *
 * Mostra o escopo ativo do usuário (squad / coord / gerência / superint /
 * diretoria) e, quando ele pertence a mais de um, permite trocar. O estado
 * é persistido no `AccessService` (que escreve no localStorage) e influi
 * imediatamente em queries derivadas (IDs Projeto, custos, KPIs, etc.).
 *
 * Renderiza nada se o usuário não tem escopos (ex.: PublicViewer puro).
 */
@Component({
  selector: 'ui-scope-switcher',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="hasScopes()">
      <button class="scope" type="button" [matMenuTriggerFor]="hasMultiple() ? scopeMenu : null">
        <span class="scope__hint">Visualizando como</span>
        <span class="scope__main">
          <strong>{{ activeLabel() }}</strong>
          <small>{{ activeLevel() }}</small>
        </span>
        <span class="scope__caret" *ngIf="hasMultiple()">▾</span>
      </button>
      <mat-menu #scopeMenu="matMenu" xPosition="before">
        <button *ngFor="let scope of access.activeScopes()"
                mat-menu-item
                class="scope-option"
                (click)="access.setActiveScope(scope.id)">
          <strong>{{ scope.label }}</strong>
          <span>{{ levelLabel(scope) }}</span>
        </button>
      </mat-menu>
    </ng-container>
  `,
  styles: [`
    :host { display: inline-flex; }
    .scope {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 4px 10px; height: 36px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font: inherit; cursor: pointer;
    }
    .scope:hover { background: var(--bg-elevated); border-color: var(--border-default); }
    .scope__hint { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .scope__main { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
    .scope__main strong { font-size: 12px; font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scope__main small { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .scope__caret { color: var(--text-muted); font-size: 10px; }
    .scope-option { line-height: 1.3 !important; height: auto !important; padding: 8px 16px !important; }
    .scope-option strong { display: block; font-size: 13px; color: var(--text-primary); }
    .scope-option span   { display: block; font-size: 11px; color: var(--text-muted); }
  `],
})
export class UiScopeSwitcherComponent {
  readonly access = inject(AccessService);

  readonly hasScopes   = computed(() => this.access.activeScopes().length > 0);
  readonly hasMultiple = computed(() => this.access.activeScopes().length > 1);
  readonly activeLabel = computed(() => this.access.context()?.activeScope?.label ?? '—');
  readonly activeLevel = computed(() => {
    const scope = this.access.context()?.activeScope;
    return scope ? this.levelLabel(scope) : '';
  });

  levelLabel(scope: AccessScope): string {
    return SCOPE_LEVEL_LABELS[scope.level] ?? scope.level;
  }
}
