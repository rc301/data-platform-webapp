import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiBadgeComponent, UiCardComponent, UiFarolComponent } from '../../../shared/ui';
import { SensorService } from '../../../core/orchestrator/sensor.service';

/**
 * Pipelines aguardando origens. Mostra quem está em fila, quanto tempo
 * vem esperando e o quanto sobra do SLA. Cor da barra reflete urgência.
 */
@Component({
  selector: 'app-orch-pipelines-waiting',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiFarolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-card eyebrow="Fila" title="Pipelines aguardando origens" [padded]="false">
      <table class="tbl">
        <thead>
          <tr>
            <th>Pipeline</th>
            <th>Aguardando</th>
            <th>Origem</th>
            <th>Status do sensor</th>
            <th>Tempo na fila</th>
            <th>SLA</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of rows()">
            <td class="tbl__name">{{ item.pipelineName }}</td>
            <td>{{ item.waitingSensorName }}</td>
            <td><code>{{ item.waitingSourceTable }}</code></td>
            <td><ui-farol [status]="sensors.state(item.waitingSensorId).status" /></td>
            <td>{{ item.waitingForMinutes }} min</td>
            <td>
              <div class="sla">
                <ui-badge [tone]="badgeTone(item)">{{ slaLabel(item) }}</ui-badge>
                <div class="sla__bar" *ngIf="item.slaMinutes">
                  <div [style.width.%]="slaPct(item)" [class.sla__bar--warn]="slaPct(item) > 70" [class.sla__bar--danger]="slaPct(item) > 90"></div>
                </div>
              </div>
            </td>
          </tr>
          <tr *ngIf="!rows().length"><td colspan="6" class="tbl__empty">Nenhuma pipeline aguardando origens.</td></tr>
        </tbody>
      </table>
    </ui-card>
  `,
  styles: [`
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; font-weight: 700; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); }
    .tbl td { padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
    .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl__name { color: var(--text-primary) !important; font-weight: 600; }
    .tbl__empty { text-align: center; color: var(--text-muted); padding: 28px !important; }
    code { padding: 1px 6px; border-radius: 4px; background: var(--bg-app); color: var(--text-primary); font-size: 11px; }

    .sla { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .sla__bar { height: 4px; background: var(--bg-overlay); border-radius: 2px; overflow: hidden; }
    .sla__bar > div { height: 100%; background: var(--success-500); transition: width .2s ease; }
    .sla__bar--warn   > div { background: var(--warning-500); }
    .sla__bar--danger > div { background: var(--danger-500); }
  `],
})
export class PipelinesWaitingComponent {
  readonly sensors = inject(SensorService);

  readonly rows = computed(() => this.sensors.waiting());

  slaPct(item: { waitingForMinutes: number; slaMinutes?: number }): number {
    if (!item.slaMinutes) return 0;
    return Math.min(100, Math.round((item.waitingForMinutes / item.slaMinutes) * 100));
  }

  slaLabel(item: { waitingForMinutes: number; slaMinutes?: number }): string {
    if (!item.slaMinutes) return 'Sem SLA';
    const remaining = item.slaMinutes - item.waitingForMinutes;
    return remaining > 0 ? `${remaining} min restantes` : 'SLA estourado';
  }

  badgeTone(item: { waitingForMinutes: number; slaMinutes?: number }): 'neutral' | 'success' | 'warning' | 'danger' {
    if (!item.slaMinutes) return 'neutral';
    const pct = this.slaPct(item);
    if (pct > 90) return 'danger';
    if (pct > 70) return 'warning';
    return 'success';
  }
}
