/**
 * Configuração da jornada do desenvolvedor.
 * É só dado — desacoplado da camada de UI. Pode futuramente vir de API/CMS.
 */

import { JourneyStepStatus } from '../../../shared/ui';

export type StageId =
  | 'rfc'
  | 'lup'
  | 'repo'
  | 'sandbox-infra'
  | 'terraform-import'
  | 'unit-tests'
  | 'deploy-dev-hml'
  | 'deploy-prod'
  | 'orchestrator'
  | 'data-quality'
  | 'documentation';

export interface StageDefinition {
  id: StageId;
  index: number;
  title: string;
  badge: string;
  description: string;
  /** Lista de "ações automatizadas" que serão executadas pelo agente via MCP. */
  automatedActions: string[];
  /** O que o desenvolvedor revisa/aprova antes de avançar. */
  approvalGate: string;
}

export const JOURNEY_STAGES: StageDefinition[] = [
  {
    id: 'rfc',
    index: 1,
    title: 'Requisitos da demanda',
    badge: 'RFC',
    description: 'Formalize o problema, escopo, fontes, destinos, SLAs e critérios de aceite. Vincule a uma demanda existente ou crie uma nova RFC.',
    automatedActions: [
      'Pré-preencher RFC com base no template corporativo',
      'Sugerir tags e domínio com base no nome do produto',
      'Validar campos mínimos exigidos pela governança',
    ],
    approvalGate: 'Revisar conteúdo da RFC e aprovar para abertura.',
  },
  {
    id: 'lup',
    index: 2,
    title: 'Código de projeto (LUP)',
    badge: 'LUP',
    description: 'Cria o registro do projeto na Lista Única de Projetos com hierarquia, owner e centro de custo.',
    automatedActions: [
      'Reservar próximo código LUP disponível',
      'Vincular RFC e produto de dados',
      'Atribuir centro de custo conforme squad',
    ],
    approvalGate: 'Confirmar dados do projeto antes de submeter à LUP.',
  },
  {
    id: 'repo',
    index: 3,
    title: 'Repositório GitHub corporativo',
    badge: 'GitHub',
    description: 'Cria o repositório a partir do template oficial de dados (AWS Glue + Terraform), com proteções de branch e CODEOWNERS.',
    automatedActions: [
      'Provisionar repositório org/data-platform-templates → org/<lup>',
      'Configurar branch protection em main e develop',
      'Atribuir squad ao CODEOWNERS',
      'Habilitar ambientes Dev/Hml/Prod no Actions',
    ],
    approvalGate: 'Aprovar configurações antes do provisionamento.',
  },
  {
    id: 'sandbox-infra',
    index: 4,
    title: 'Infra de sandbox',
    badge: 'AWS Sandbox',
    description: 'Provisiona buckets S3, Glue Jobs, IAM roles e Step Functions na conta sandbox para desenvolvimento e testes do ETL.',
    automatedActions: [
      'Criar buckets bronze/silver/gold com naming corporativo',
      'Criar Glue Jobs e Database',
      'Provisionar Step Function com a topologia padrão',
      'Atribuir IAM roles mínimas necessárias',
    ],
    approvalGate: 'Revisar inventário de recursos AWS antes do apply.',
  },
  {
    id: 'terraform-import',
    index: 5,
    title: 'Conversão para Terraform',
    badge: 'Terraform',
    description: 'Importa os recursos da sandbox como código Terraform versionado no repositório.',
    automatedActions: [
      'Executar terraform import para cada recurso provisionado',
      'Gerar módulos por camada (bronze/silver/gold)',
      'Abrir PR de scaffold no repositório do projeto',
    ],
    approvalGate: 'Revisar e aprovar PR de Terraform gerado pelo agente.',
  },
  {
    id: 'unit-tests',
    index: 6,
    title: 'Testes unitários',
    badge: 'Pytest',
    description: 'Esqueleto de testes unitários para transformações, contratos de schema e validações de qualidade.',
    automatedActions: [
      'Gerar testes para cada job Glue identificado',
      'Criar fixtures de dados sintéticos',
      'Configurar coverage mínimo no pre-commit',
    ],
    approvalGate: 'Aprovar cobertura proposta e padrões de teste.',
  },
  {
    id: 'deploy-dev-hml',
    index: 7,
    title: 'Deploy Dev / Homologação',
    badge: 'CI/CD',
    description: 'Esteira GitHub Actions promove código para Dev e Homologação após PR aprovado.',
    automatedActions: [
      'Executar workflow de Dev no merge em develop',
      'Promover para Hml mediante aprovação no Actions',
      'Publicar artefatos versionados',
    ],
    approvalGate: 'Aprovar promoção Dev → Hml na esteira.',
  },
  {
    id: 'deploy-prod',
    index: 8,
    title: 'Deploy Produção (GMUD)',
    badge: 'Prod',
    description: 'GMUD é gerada automaticamente pela esteira ao subir para main. Esta tela apenas exibe o status do código em main.',
    automatedActions: [
      'Detectar merge em main',
      'Abrir GMUD automaticamente com janela proposta',
      'Acompanhar execução do workflow de Prod',
    ],
    approvalGate: 'Confirmar janela de GMUD e acompanhar a execução.',
  },
  {
    id: 'orchestrator',
    index: 9,
    title: 'Cadastro no orquestrador',
    badge: 'Orchestrator',
    description: 'Registra a pipeline no orquestrador corporativo com cron, dependências e janelas de SLA.',
    automatedActions: [
      'Criar DAG/objeto correspondente ao pipeline',
      'Configurar dependências upstream/downstream',
      'Aplicar janela de SLA da RFC',
    ],
    approvalGate: 'Validar cron e dependências antes de ativar.',
  },
  {
    id: 'data-quality',
    index: 10,
    title: 'Cadastro de Data Quality',
    badge: 'DQ',
    description: 'Registra regras de qualidade na ferramenta corporativa, com thresholds e severidade.',
    automatedActions: [
      'Sugerir regras com base no schema dos targets',
      'Configurar thresholds por severidade',
      'Rotear alertas para o canal da squad',
    ],
    approvalGate: 'Aprovar regras propostas e severidades.',
  },
  {
    id: 'documentation',
    index: 11,
    title: 'Documentação do ETL',
    badge: 'Docs',
    description: 'Gera a documentação do processo ETL (visão de negócio, técnico, contrato de dados) e publica no portal.',
    automatedActions: [
      'Gerar documentação a partir de código + RFC',
      'Publicar no portal corporativo de documentação',
      'Vincular ao catálogo de dados',
    ],
    approvalGate: 'Revisar e aprovar a publicação final.',
  },
];

export const STAGE_BY_ID: Record<StageId, StageDefinition> =
  JOURNEY_STAGES.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<StageId, StageDefinition>);

/** Status pré-calculados de uma jornada de exemplo (mock). */
export const SAMPLE_JOURNEY_STATUSES: Record<StageId, JourneyStepStatus> = {
  'rfc': 'approved',
  'lup': 'approved',
  'repo': 'approved',
  'sandbox-infra': 'awaiting_approval',
  'terraform-import': 'pending',
  'unit-tests': 'pending',
  'deploy-dev-hml': 'pending',
  'deploy-prod': 'pending',
  'orchestrator': 'pending',
  'data-quality': 'pending',
  'documentation': 'pending',
};
