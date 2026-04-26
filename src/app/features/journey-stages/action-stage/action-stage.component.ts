import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StageContext } from '../stage-runtime';

/**
 * Renderer padrão para etapas action-only (sem UI custom).
 * Mostra a descrição da etapa, lista de ações automatizadas e o preview
 * de saída. As ações de aprovação são responsabilidade do builder, não
 * deste componente.
 */
@Component({
  selector: 'app-action-stage',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action-stage" *ngIf="actions?.length || preview">
      <section class="action-stage__block" *ngIf="actions?.length">
        <h4 class="section-title">Ações que o agente executará via MCP</h4>
        <ul class="action-stage__list">
          <li *ngFor="let action of actions">
            <span class="action-stage__bullet">›</span>{{ action }}
          </li>
        </ul>
      </section>

      <section class="action-stage__block" *ngIf="preview">
        <h4 class="section-title">Saída do agente (preview)</h4>
        <pre class="action-stage__output">{{ preview }}</pre>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .action-stage__block { margin-bottom: 16px; }
    .action-stage__block:last-child { margin-bottom: 0; }
    .action-stage__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .action-stage__list li {
      display: flex; gap: 10px;
      padding: 10px 12px;
      background: var(--bg-app); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-size: 13px; color: var(--text-secondary);
    }
    .action-stage__bullet { color: var(--brand-300); font-weight: 700; }
    .action-stage__output {
      margin: 0; padding: 14px 16px;
      font-family: var(--font-mono); font-size: 12px; line-height: 1.5;
      background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
      color: var(--text-secondary); white-space: pre-wrap; max-height: 240px; overflow: auto;
    }
  `],
})
export class ActionStageComponent {
  @Input() context?: StageContext;
  @Input() actions: readonly string[] = [];
  @Input() preview = '';
}
