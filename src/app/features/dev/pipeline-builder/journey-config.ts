/**
 * Configuracao da jornada do desenvolvedor.
 *
 * A etapa e uma capacidade reutilizavel. O template de jornada decide a ordem,
 * quais etapas entram e qual tecnologia sera usada em cada jornada de projeto.
 * Hoje usa configuração local; futuramente pode vir de uma API/CMS sem alterar a UI.
 */

import { JourneyStepStatus } from '../../../shared/ui';

export type JourneyStageId =
  | 'rfc'
  | 'lup'
  | 'repo'
  | 'glue-sandbox-infra'
  | 'terraform-import'
  | 'pyspark-unit-tests'
  | 'sql-workspace'
  | 'sql-assets'
  | 'sql-validation-tests'
  | 'deploy-dev-hml'
  | 'deploy-prod'
  | 'orchestrator'
  | 'data-quality'
  | 'documentation';

export type StageId = JourneyStageId;
export type JourneyTemplateId = 'glue-pyspark' | 'sql-only';
export type JourneyStatusMap = Partial<Record<JourneyStageId, JourneyStepStatus>>;

export interface StageDefinition {
  id: JourneyStageId;
  title: string;
  badge: string;
  description: string;
  /** Lista de "acoes automatizadas" que serao executadas pelo agente via MCP. */
  automatedActions: string[];
  /** O que o desenvolvedor revisa/aprova antes de avancar. */
  approvalGate: string;
}

export interface JourneyTemplate {
  id: JourneyTemplateId;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  recommendedFor: string;
  stageIds: readonly JourneyStageId[];
  /**
   * Capability requerida para usar este template em uma nova jornada.
   * Convenção: `pipeline.useTemplate.<id>`. O wizard filtra os templates
   * pela capability ANTES de listar.
   */
  requiredCapability?: string;
}

export const STAGE_CATALOG: Record<JourneyStageId, StageDefinition> = {
  'rfc': {
    id: 'rfc',
    title: 'Requisitos da demanda',
    badge: 'Demanda',
    description: 'Formalize problema, escopo, fontes, destinos, SLAs e criterios de aceite. Vincule a uma demanda existente ou crie uma nova demanda.',
    automatedActions: [
      'Pre-preencher demanda com base no template corporativo',
      'Sugerir tags e dominio com base no nome do produto',
      'Validar campos minimos exigidos pela governanca',
    ],
    approvalGate: 'Revisar conteudo da demanda e aprovar para abertura.',
  },
  'lup': {
    id: 'lup',
    title: 'ID Projeto',
    badge: 'ID Projeto',
    description: 'Cria o registro corporativo do projeto com hierarquia, owner e centro de custo.',
    automatedActions: [
      'Reservar proximo ID Projeto disponivel',
      'Vincular demanda e produto de dados',
      'Atribuir centro de custo conforme squad',
    ],
    approvalGate: 'Confirmar dados do projeto antes de salvar o ID Projeto.',
  },
  'repo': {
    id: 'repo',
    title: 'Repositorio GitHub corporativo',
    badge: 'GitHub',
    description: 'Cria o repositorio a partir do template tecnico definido pela jornada, com protecoes de branch, ambientes e CODEOWNERS.',
    automatedActions: [
      'Provisionar repositorio a partir do template selecionado',
      'Configurar branch protection em main e develop',
      'Atribuir squad ao CODEOWNERS',
      'Habilitar ambientes Dev/Hml/Prod no Actions',
    ],
    approvalGate: 'Aprovar template tecnico e configuracoes antes do provisionamento.',
  },
  'glue-sandbox-infra': {
    id: 'glue-sandbox-infra',
    title: 'Infra de sandbox Glue',
    badge: 'AWS Glue',
    description: 'Provisiona buckets S3, Glue Jobs, IAM roles e Step Functions na conta sandbox para desenvolvimento e testes do ETL PySpark.',
    automatedActions: [
      'Criar buckets bronze/silver/gold com naming corporativo',
      'Criar Glue Jobs e Glue Database',
      'Provisionar Step Function com a topologia padrao',
      'Atribuir IAM roles minimas necessarias',
    ],
    approvalGate: 'Revisar inventario de recursos AWS antes do apply.',
  },
  'terraform-import': {
    id: 'terraform-import',
    title: 'Conversao para Terraform',
    badge: 'Terraform',
    description: 'Importa recursos criados na sandbox como codigo Terraform versionado no repositorio.',
    automatedActions: [
      'Executar terraform import para cada recurso provisionado',
      'Gerar modulos por camada (bronze/silver/gold)',
      'Abrir PR de scaffold no repositorio do projeto',
    ],
    approvalGate: 'Revisar e aprovar PR de Terraform gerado pelo agente.',
  },
  'pyspark-unit-tests': {
    id: 'pyspark-unit-tests',
    title: 'Testes PySpark',
    badge: 'Pytest',
    description: 'Gera testes unitarios para transformacoes PySpark, contratos de schema e validacoes de qualidade.',
    automatedActions: [
      'Gerar testes para cada job Glue identificado',
      'Criar fixtures de dados sinteticos',
      'Configurar coverage minimo no pre-commit',
    ],
    approvalGate: 'Aprovar cobertura proposta e padroes de teste.',
  },
  'sql-workspace': {
    id: 'sql-workspace',
    title: 'Workspace SQL',
    badge: 'SQL',
    description: 'Prepara ambiente, conexoes, variaveis e permissoes para uma ferramenta que executa apenas SQL.',
    automatedActions: [
      'Criar workspace/projeto na ferramenta SQL',
      'Vincular conexoes autorizadas para leitura e escrita',
      'Configurar variaveis por ambiente',
      'Aplicar permissoes minimas para squad e esteira',
    ],
    approvalGate: 'Validar ambiente, conexoes e escopo de acesso antes de ativar.',
  },
  'sql-assets': {
    id: 'sql-assets',
    title: 'Artefatos SQL',
    badge: 'Models',
    description: 'Gera estrutura de scripts, modelos SQL, convencoes de nomenclatura e manifesto de dependencias.',
    automatedActions: [
      'Criar estrutura padrao de pastas para scripts SQL',
      'Gerar modelos iniciais a partir de fontes e destino',
      'Mapear dependencias entre queries',
      'Registrar owners e tags tecnicas no manifesto',
    ],
    approvalGate: 'Revisar modelos SQL e dependencias antes do primeiro commit.',
  },
  'sql-validation-tests': {
    id: 'sql-validation-tests',
    title: 'Validacoes SQL',
    badge: 'Tests',
    description: 'Cria testes de contrato e queries de validacao executaveis pela propria ferramenta SQL.',
    automatedActions: [
      'Gerar testes de not null, unique e accepted values',
      'Criar queries de reconciliacao entre origem e destino',
      'Configurar thresholds para falha ou alerta',
    ],
    approvalGate: 'Aprovar cobertura de validacoes SQL e thresholds.',
  },
  'deploy-dev-hml': {
    id: 'deploy-dev-hml',
    title: 'Deploy Dev / Homologacao',
    badge: 'CI/CD',
    description: 'Esteira promove artefatos para Dev e Homologacao apos PR aprovado.',
    automatedActions: [
      'Executar workflow de Dev no merge em develop',
      'Promover para Hml mediante aprovacao no Actions',
      'Publicar artefatos versionados',
    ],
    approvalGate: 'Aprovar promocao Dev -> Hml na esteira.',
  },
  'deploy-prod': {
    id: 'deploy-prod',
    title: 'Deploy Producao (GMUD)',
    badge: 'Prod',
    description: 'GMUD e gerada automaticamente pela esteira ao subir para main. Esta tela exibe o status do codigo em main.',
    automatedActions: [
      'Detectar merge em main',
      'Abrir GMUD automaticamente com janela proposta',
      'Acompanhar execucao do workflow de Prod',
    ],
    approvalGate: 'Confirmar janela de GMUD e acompanhar a execucao.',
  },
  'orchestrator': {
    id: 'orchestrator',
    title: 'Cadastro no orquestrador',
    badge: 'Orch',
    description: 'Registra a pipeline no orquestrador corporativo com cron, dependencias e janelas de SLA.',
    automatedActions: [
      'Criar DAG/objeto correspondente ao pipeline',
      'Configurar dependencias upstream/downstream',
      'Aplicar janela de SLA da demanda',
    ],
    approvalGate: 'Validar cron e dependencias antes de ativar.',
  },
  'data-quality': {
    id: 'data-quality',
    title: 'Cadastro de Data Quality',
    badge: 'DQ',
    description: 'Registra regras de qualidade na ferramenta corporativa, com thresholds, severidade e roteamento.',
    automatedActions: [
      'Sugerir regras com base no schema dos targets',
      'Configurar thresholds por severidade',
      'Rotear alertas para o canal da squad',
    ],
    approvalGate: 'Aprovar regras propostas e severidades.',
  },
  'documentation': {
    id: 'documentation',
    title: 'Documentacao do processo',
    badge: 'Docs',
    description: 'Gera documentacao de negocio, tecnica e contrato de dados, publicando no portal corporativo.',
    automatedActions: [
      'Gerar documentacao a partir de codigo, demanda e manifestos',
      'Publicar no portal corporativo de documentacao',
      'Vincular ao catalogo de dados',
    ],
    approvalGate: 'Revisar e aprovar a publicacao final.',
  },
};

export const JOURNEY_TEMPLATES: readonly JourneyTemplate[] = [
  {
    id: 'glue-pyspark',
    title: 'Glue com PySpark',
    shortTitle: 'Glue PySpark',
    badge: 'ETL',
    description: 'Jornada para pipelines com AWS Glue, PySpark, Terraform e esteira de deploy.',
    recommendedFor: 'Transformacoes distribuídas, jobs Glue e infraestrutura AWS versionada.',
    requiredCapability: 'pipeline.useTemplate.glue-pyspark',
    stageIds: [
      'rfc',
      'lup',
      'repo',
      'glue-sandbox-infra',
      'terraform-import',
      'pyspark-unit-tests',
      'deploy-dev-hml',
      'deploy-prod',
      'orchestrator',
      'data-quality',
      'documentation',
    ],
  },
  {
    id: 'sql-only',
    title: 'Ferramenta SQL only',
    shortTitle: 'SQL only',
    badge: 'SQL',
    description: 'Jornada enxuta para pipelines em uma ferramenta que executa apenas SQL.',
    recommendedFor: 'Views, marts, validacoes e transformacoes sem codigo PySpark ou infraestrutura Glue.',
    requiredCapability: 'pipeline.useTemplate.sql-only',
    stageIds: [
      'rfc',
      'lup',
      'repo',
      'sql-workspace',
      'sql-assets',
      'sql-validation-tests',
      'deploy-dev-hml',
      'deploy-prod',
      'orchestrator',
      'data-quality',
      'documentation',
    ],
  },
];

export const DEFAULT_TEMPLATE_ID: JourneyTemplateId = 'glue-pyspark';

export const TEMPLATE_BY_ID: Record<JourneyTemplateId, JourneyTemplate> =
  JOURNEY_TEMPLATES.reduce(
    (acc, template) => ({ ...acc, [template.id]: template }),
    {} as Record<JourneyTemplateId, JourneyTemplate>,
  );

export const STAGE_BY_ID = STAGE_CATALOG;

/** Lista plana dos IDs preservando a ordem do catálogo — útil para iteração na UI. */
export const JOURNEY_STAGE_IDS_BY_CATALOG: readonly JourneyStageId[] = Object.keys(STAGE_CATALOG) as JourneyStageId[];

export function getJourneyTemplate(templateId: JourneyTemplateId): JourneyTemplate {
  return TEMPLATE_BY_ID[templateId];
}

export function getStagesForTemplate(templateId: JourneyTemplateId): StageDefinition[] {
  return getJourneyTemplate(templateId).stageIds.map(stageId => STAGE_CATALOG[stageId]);
}

/**
 * Stage que abre como "ativa" em uma jornada recém-criada.
 * Por contrato, uma jornada nova começa zerada — nenhuma etapa concluída,
 * apenas a primeira aguardando ação do usuário.
 */
export function firstOpenStageId(templateId: JourneyTemplateId): JourneyStageId {
  return getJourneyTemplate(templateId).stageIds[0];
}

export function createInitialStatuses(
  templateId: JourneyTemplateId,
  currentStageId: JourneyStageId = firstOpenStageId(templateId),
): JourneyStatusMap {
  const statuses: JourneyStatusMap = {};
  const stages = getJourneyTemplate(templateId).stageIds;
  const currentIndex = stages.indexOf(currentStageId);

  stages.forEach((stageId, index) => {
    if (index < currentIndex) {
      statuses[stageId] = 'approved';
      return;
    }
    statuses[stageId] = stageId === currentStageId ? 'awaiting_approval' : 'pending';
  });

  return statuses;
}

/** Sequencia default mantida para telas legadas que ainda precisam de preview simples. */
export const JOURNEY_STAGES: StageDefinition[] = getStagesForTemplate(DEFAULT_TEMPLATE_ID);

/** Status pre-calculados de uma jornada de exemplo local. */
export const SAMPLE_JOURNEY_STATUSES: JourneyStatusMap =
  createInitialStatuses(DEFAULT_TEMPLATE_ID, 'glue-sandbox-infra');

/** Stub de saida do agente. Em producao, essa saida vira evento/log do MCP server. */
export const SAMPLE_PREVIEWS: Record<JourneyStageId, string> = {
  'rfc': '',
  'lup': '✓ ID Projeto ED2741 reservado\n✓ Centro de custo: 4421-DATA-PLATFORM\n✓ Owner: Squad B',
  'repo': '✓ Repositorio criado: org/dp-customer-360\n✓ Branch protection: main, develop\n✓ CODEOWNERS atribuido a @squad-b\n✓ Environments: dev, hml, prod',
  'glue-sandbox-infra': 'Plan AWS Sandbox:\n  + aws_s3_bucket.bronze (dp-cust360-bronze-sbx)\n  + aws_s3_bucket.silver (dp-cust360-silver-sbx)\n  + aws_s3_bucket.gold   (dp-cust360-gold-sbx)\n  + aws_glue_catalog_database.cust360\n  + aws_glue_job.bronze_to_silver\n  + aws_glue_job.silver_to_gold\n  + aws_sfn_state_machine.cust360_daily\n  + aws_iam_role.dp_cust360_glue\n\n7 to add, 0 to change, 0 to destroy.',
  'terraform-import': 'terraform import aws_s3_bucket.bronze dp-cust360-bronze-sbx ✓\nterraform import aws_glue_job.bronze_to_silver cust360_b2s ✓\nterraform import aws_sfn_state_machine.cust360_daily ✓\n\nPR #142 aberto: "scaffold: terraform import from sandbox"',
  'pyspark-unit-tests': '✓ tests/unit/test_sor_to_sot.py (12 cases)\n✓ tests/unit/test_sot_to_spec.py (8 cases)\n✓ tests/contract/test_spec_schema.py (4 cases)\nCoverage minimo configurado: 80%',
  'sql-workspace': 'Workspace SQL:\n  ✓ Projeto dp_customer_360 criado\n  ✓ Conexao source_analytics atribuida\n  ✓ Conexao mart_gold atribuida\n  ✓ Variaveis DEV/HML/PRD registradas\n  ✓ Service account da esteira autorizada',
  'sql-assets': 'Scaffold SQL:\n  + models/staging/stg_customers.sql\n  + models/staging/stg_orders.sql\n  + models/marts/customer_360.sql\n  + manifest.yml\n\nDependencias mapeadas: stg_customers, stg_orders -> customer_360',
  'sql-validation-tests': 'Validacoes SQL:\n  ✓ customer_id not null\n  ✓ customer_id unique\n  ✓ accepted_values customer_status\n  ✓ reconciliacao row_count origem x destino\n  Threshold de alerta: variacao acima de 15%',
  'deploy-dev-hml': '[GitHub Actions]\n✓ deploy-dev: success (4m 12s)\n⏳ deploy-hml: aguardando aprovacao manual',
  'deploy-prod': '[main]\n✓ Ultimo merge: feat: add spec.customer_360 (ha 12 min)\n⏳ GMUD-9821 aberta automaticamente · janela 2026-04-26 23:00 UTC-3\n   Workflow deploy-prod: pendente',
  'orchestrator': '✓ DAG cust360_daily registrado\n  cron: 0 6 * * *  (06:00 UTC)\n  upstream: orders_silver, clickstream_silver\n  SLA: 07:30 UTC-3',
  'data-quality': '✓ 12 regras propostas\n  • not_null em customer_id (CRITICAL)\n  • unique em customer_id (CRITICAL)\n  • freshness < 24h (HIGH)\n  • row_count change +/-20% (MEDIUM)',
  'documentation': '✓ Doc gerada: portal/docs/products/customer_360\n✓ Vinculado ao Catalogo: spec.customer_360\n✓ Owners: Squad B · Stewards: @data-gov',
};
