import { Injectable, signal } from '@angular/core';
import { RfcDraft } from './rfc-stage.component';

const EMPTY_DRAFT: RfcDraft = {
  productName: 'customer_360',
  domain:      'Comercial',
  objective:   'Construir visão consolidada de cliente para uso de Marketing e CS.',
  squad:       'Squad B',
  sla:         'D-1 até 07h30 UTC-3',
  sources:     'sot.customer_base, sot.orders, sor.clickstream',
  target:      'spec.customer_360',
};

/**
 * Store da etapa de demanda.
 *
 * Plugins de etapa precisam comunicar dados ao container (builder), mas o
 * container não pode conhecer a API específica de cada plugin — caso
 * contrário a arquitetura plug-in se quebra. A solução é um signal store
 * por etapa, injetável por DI: o plugin lê/escreve, o container observa.
 *
 * Quando vier backend real, esta store passa a fazer fetch/update via API
 * sem que o componente saiba.
 */
@Injectable({ providedIn: 'root' })
export class RfcStageStore {
  private readonly draftSig = signal<RfcDraft>({ ...EMPTY_DRAFT });
  readonly draft = this.draftSig.asReadonly();

  update(patch: Partial<RfcDraft>): void {
    this.draftSig.update(current => ({ ...current, ...patch }));
  }

  reset(): void {
    this.draftSig.set({ ...EMPTY_DRAFT });
  }
}
