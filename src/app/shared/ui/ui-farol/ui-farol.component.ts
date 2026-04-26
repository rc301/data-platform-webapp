import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FarolStatus = 'green' | 'yellow' | 'red' | 'gray';

/**
 * UI primitive — Farol (semáforo) operacional.
 * Convenção do produto:
 *   green  — Já executou hoje
 *   yellow — Já passou do horário esperado e ainda não executou
 *   red    — Estourou SLA
 *   gray   — Ainda não executou e não passou do horário esperado
 */
@Component({
  selector: 'ui-farol',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'farol farol--' + status" [attr.title]="tooltip">
      {{ label || labelByStatus }}
    </span>
  `,
})
export class UiFarolComponent {
  @Input({ required: true }) status!: FarolStatus;
  @Input() label?: string;
  @Input() tooltip?: string;

  get labelByStatus(): string {
    return ({
      green:  'Concluído hoje',
      yellow: 'Atrasado',
      red:    'SLA estourado',
      gray:   'Aguardando janela',
    } as const)[this.status];
  }
}
