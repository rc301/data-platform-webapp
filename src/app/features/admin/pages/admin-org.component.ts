import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiBadgeComponent, UiCardComponent, UiFarolComponent } from '../../../shared/ui';
import { OrgService } from '../../../core/org/org.service';
import { AccessService } from '../../../core/access/access.service';

/**
 * Visualização da árvore organizacional + projetos visíveis no escopo
 * ativo. CRUD completo da hierarquia será adicionado em onda futura, mas a
 * base de dados (OrgService) já expõe create/update/delete.
 */
@Component({
  selector: 'app-admin-org',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiFarolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Organização" title="Árvore organizacional configurada" [padded]="false">
      <table class="tbl">
        <thead>
          <tr><th>Unidade</th><th>Nível</th><th>Ramo</th><th>Pai</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let unit of org.orgUnits()">
            <td class="tbl__name">{{ unit.name }}</td>
            <td>{{ unit.level }}</td>
            <td>{{ unit.branch }}</td>
            <td>{{ org.labelForUnit(unit.parentId || '') || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </ui-card>

    <ui-card eyebrow="Projetos" title="Projetos visíveis no escopo ativo" [padded]="false">
      <table class="tbl">
        <thead>
          <tr><th>ID Projeto</th><th>Projeto</th><th>Squad</th><th>Status</th><th>Farol</th><th>Custo mensal</th><th>Progresso</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let project of visibleProjects()">
            <td class="tbl__name">{{ project.code }}</td>
            <td>{{ project.name }}</td>
            <td>{{ org.labelForUnit(project.squadId) }}</td>
            <td><ui-badge tone="info">{{ project.status }}</ui-badge></td>
            <td><ui-farol [status]="project.health" /></td>
            <td>R$ {{ project.monthlyCost | number:'1.0-0' }}</td>
            <td>{{ project.progress }}%</td>
          </tr>
          <tr *ngIf="!visibleProjects().length">
            <td colspan="7" class="tbl__empty">Nenhum projeto visível para o escopo atual.</td>
          </tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 18px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .tbl td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 32px !important; }
  `],
})
export class AdminOrgComponent {
  readonly org = inject(OrgService);
  private readonly access = inject(AccessService);

  readonly visibleProjects = computed(() => {
    const context = this.access.context();
    if (!context) return [];
    return this.org.projectsForScopes(
      context.activeScope ? [context.activeScope] : context.scopes,
      this.access.can('executive.viewGlobal'),
    );
  });
}
