/**
 * Estados de uma demanda. A semântica importa para auditoria:
 *   - active     : aberta, em fila
 *   - in_review  : sendo analisada
 *   - approved   : pronta para virar projeto
 *   - cancelled  : encerrada pelo solicitante (autosserviço, demanda
 *                  voluntariamente desistida).
 *   - inactive   : encerrada administrativamente (gestão decide arquivar).
 *
 * `cancelled` e `inactive` são estados terminais e preservam o histórico
 * para auditoria — registros não são removidos do mock/banco.
 */
export type DataDemandStatus = 'active' | 'in_review' | 'approved' | 'cancelled' | 'inactive';

export interface DataDemand {
  id: string;
  code: string;
  title: string;
  description: string;
  requester: string;
  businessArea: string;
  domain: string;
  squadId: string;
  status: DataDemandStatus;
  expectedTarget: string;
  sla: string;
  sources: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** Preenchido quando o solicitante cancela voluntariamente. */
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  /** Preenchido quando a gestão arquiva administrativamente. */
  inactiveAt?: string;
  inactiveBy?: string;
  inactiveReason?: string;
}

export interface DataDemandDraft {
  code?: string;
  title: string;
  description: string;
  requester: string;
  businessArea: string;
  domain: string;
  squadId: string;
  status: DataDemandStatus;
  expectedTarget: string;
  sla: string;
  sources: string[];
}
