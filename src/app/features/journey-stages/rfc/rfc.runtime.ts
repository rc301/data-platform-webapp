import { StageRuntime } from '../stage-runtime';
import { RfcStageComponent } from './rfc-stage.component';

/**
 * Runtime da etapa RFC — primeiro plugin formal da plataforma.
 * Hoje a aprovação é soft (humana). Quando o code-review virar agente,
 * a política passa a 'automatic' apenas alterando este arquivo.
 */
export const rfcStageRuntime: StageRuntime = {
  id: 'rfc',
  render: RfcStageComponent,
  approval: {
    kind: 'soft',
    rationale: 'Owner do projeto valida escopo, fontes e SLA antes de avançar.',
  },
  auditEvents: ['rfc.created', 'rfc.updated', 'rfc.approved', 'rfc.rejected'],
};
