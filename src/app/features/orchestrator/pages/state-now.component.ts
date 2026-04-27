import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiCardComponent, UiFarolComponent, UiStatComponent } from '../../../shared/ui';
import { SensorService } from '../../../core/orchestrator/sensor.service';
import { OrgService } from '../../../core/org/org.service';
import { Sensor, SensorStatus } from '../../../core/orchestrator/sensor.model';

/**
 * Visão operacional padrão. Mostra cada sensor com farol, latência e
 * próxima execução. Filtros: por status, por squad, por origem.
 */
@Component({
  selector: 'app-orch-state-now',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiFarolComponent, UiStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpis">
      <ui-stat label="Verde"     [value]="health().green"  hint="executou no SLA" />
      <ui-stat label="Amarelo"   [value]="health().yellow" hint="atrasado, dentro do limite" />
      <ui-stat label="Vermelho"  [value]="health().red"    hint="estourou SLA / falhou" />
      <ui-stat label="Cinza"     [value]="health().gray"   hint="aguardando janela" />
    </div>

    <ui-card eyebrow="Sensors" title="Estado em tempo real" [padded]="false">
      <div card-actions>
        <select class="select" [(ngModel)]="statusFilter">
          <option value="all">Todos os status</option>
          <option value="green">Verde</option>
          <option value="yellow">Amarelo</option>
          <option value="red">Vermelho</option>
          <option value="gray">Cinza</option>
        </select>
        <input class="select" type="search" placeholder="Filtrar por origem ou nome…" [(ngModel)]="searchTerm">
      </div>

      <table class="tbl">
        <thead>
          <tr><th>Sensor</th><th>Origem</th><th>Squad</th><th>Status</th><th>Última exec.</th><th>Latência</th><th>Próxima</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows()">
            <td class="tbl__name">{{ row.sensor.name }}</td>
            <td><code>{{ row.sensor.sourceQualifiedName }}</code></td>
            <td>{{ org.labelForUnit(row.sensor.ownerSquadId) }}</td>
            <td><ui-farol [status]="row.state.status" /></td>
            <td>{{ row.state.lastRunAt ? (row.state.lastRunAt | date:'short') : '—' }}</td>
            <td>{{ row.state.lastLatencyMs ? (row.state.lastLatencyMs + ' ms') : '—' }}</td>
            <td>{{ row.state.nextRunAt ? (row.state.nextRunAt | date:'short') : '—' }}</td>
          </tr>
          <tr *ngIf="!rows().length"><td colspan="7" class="tbl__empty">Nenhum sensor para os filtros atuais.</td></tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .select { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 6px 10px; color: var(--text-primary); font: inherit; font-size: 12px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }
  `],
})
export class StateNowComponent {
  readonly sensors = inject(SensorService);
  readonly org = inject(OrgService);

  readonly health = this.sensors.healthSummary;

  statusFilter: 'all' | SensorStatus = 'all';
  searchTerm = '';
  // Re-expor filtros como signals seria mais idiomático, mas dois `[(ngModel)]`
  // baseados em propriedade rodam pela detecção sem custo aqui.
  readonly rows = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return this.sensors.sensors().map(sensor => ({
      sensor,
      state: this.sensors.state(sensor.id),
    })).filter(({ sensor, state }) =>
      (this.statusFilter === 'all' || state.status === this.statusFilter)
      && (!term
        || sensor.name.toLowerCase().includes(term)
        || sensor.sourceQualifiedName.toLowerCase().includes(term))
    );
  });
}
