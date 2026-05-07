import { LineageGraph } from '../models/lineage.model';

// Shared classDef header used in all diagrams
const CLASSES = `  classDef src fill:#e3f2fd,stroke:#1976d2,color:#0d47a1
  classDef sor fill:#fff3e0,stroke:#f57c00,color:#bf360c
  classDef sot fill:#eceff1,stroke:#607d8b,color:#37474f
  classDef spec fill:#fffde7,stroke:#fbc02d,color:#e65100
  classDef job fill:#f3e5f5,stroke:#8e24aa,color:#4a148c
  classDef pnl fill:#e8f5e9,stroke:#388e3c,color:#1b5e20
  classDef mdl fill:#e0f7fa,stroke:#00838f,color:#006064`;

export const MOCK_LINEAGE_GRAPHS: LineageGraph[] = [
  // ─── TABLES ────────────────────────────────────────────────────────────────

  {
    id: 'lg-table-gold-customer360',
    entityType: 'table',
    pipelineId: 'pipeline-2',
    subType: 'spec',
    entityName: 'spec.customer_360',
    displayName: 'spec.customer_360',
    description: 'Linhagem completa — da ingestão em fontes externas até o painel de consumo',
    definition: `flowchart LR
${CLASSES}
  SF_C("salesforce.contacts"):::src
  SF_A("salesforce.accounts"):::src
  RDS_O("rds.orders_db.orders"):::src
  RDS_I("rds.orders_db.order_items"):::src
  J_CRM["ingestion_crm_contacts (Phoenix)"]:::job
  J_ORD["ingestion_orders (GlueJob)"]:::job
  J_HARM["harmonize_customer (CDP)"]:::job
  J_TORD["transform_orders (GlueJob)"]:::job
  J_C360["transform_c360 (CDP)"]:::job
  B_CRM[("sor.crm_contacts")]:::sor
  B_ORD[("sor.orders")]:::sor
  S_CUS[("sot.customer_base")]:::sot
  S_ORD[("sot.orders")]:::sot
  G_360[("spec.customer_360")]:::spec
  P_DASH{{"Customer Dashboard"}}:::pnl
  SF_C --> J_CRM
  SF_A --> J_CRM
  J_CRM --> B_CRM
  RDS_O --> J_ORD
  RDS_I --> J_ORD
  J_ORD --> B_ORD
  B_CRM --> J_HARM --> S_CUS
  B_ORD --> J_TORD --> S_ORD
  S_CUS --> J_C360
  S_ORD --> J_C360
  J_C360 --> G_360 --> P_DASH`,
  },

  {
    id: 'lg-table-sor-orders',
    entityType: 'table',
    pipelineId: 'pipeline-1',
    subType: 'sor',
    entityName: 'sor.orders',
    displayName: 'sor.orders',
    description: 'Tabela de ingestão SOR de pedidos — origens upstream e consumidores downstream',
    definition: `flowchart LR
${CLASSES}
  RDS_O("rds.orders_db.orders"):::src
  RDS_I("rds.orders_db.order_items"):::src
  J_ORD["ingestion_orders (GlueJob)"]:::job
  B_ORD[("sor.orders")]:::sor
  J_TORD["transform_orders (GlueJob)"]:::job
  J_FIN["build_financial (GlueJob)"]:::job
  S_ORD[("sot.orders")]:::sot
  G_FIN[("spec.financial_summary")]:::spec
  G_360[("spec.customer_360")]:::spec
  RDS_O --> J_ORD
  RDS_I --> J_ORD
  J_ORD --> B_ORD
  B_ORD --> J_TORD --> S_ORD --> G_360
  B_ORD --> J_FIN --> G_FIN`,
  },

  {
    id: 'lg-table-sot-products',
    entityType: 'table',
    pipelineId: 'pipeline-7',
    subType: 'sot',
    entityName: 'sot.products',
    displayName: 'sot.products',
    description: 'Tabela harmonizada de produtos — do catálogo SOR ao domínio SPEC',
    definition: `flowchart LR
${CLASSES}
  ERP_P("erp.product_master"):::src
  ERP_A("erp.product_attributes"):::src
  J_ING["ingestion_products (GlueJob)"]:::job
  J_HARM["harmonize_product_catalog (CDP)"]:::job
  B_FEED[("sor.product_feed")]:::sor
  B_ATTR[("sor.product_attributes")]:::sor
  S_PRD[("sot.products")]:::sot
  J_REC["build_recommendations (Spark)"]:::job
  G_CAT[("spec.product_catalog")]:::spec
  G_REC[("spec.recommendations")]:::spec
  P_PRD{{"Product Catalog Dashboard"}}:::pnl
  ERP_P --> J_ING --> B_FEED
  ERP_A --> J_ING --> B_ATTR
  B_FEED --> J_HARM
  B_ATTR --> J_HARM
  J_HARM --> S_PRD
  S_PRD --> G_CAT --> P_PRD
  S_PRD --> J_REC --> G_REC`,
  },

  // ─── JOBS ──────────────────────────────────────────────────────────────────

  {
    id: 'lg-job-gluejob-ingestion-orders',
    entityType: 'job',
    pipelineId: 'pipeline-1',
    subType: 'GlueJob',
    entityName: 'ingestion_orders',
    displayName: 'ingestion_orders',
    description: 'Job de ingestão incremental de pedidos do RDS para a camada SOR',
    definition: `flowchart LR
${CLASSES}
  RDS_O("rds.orders_db.orders"):::src
  RDS_I("rds.orders_db.order_items"):::src
  J_ORD["ingestion_orders (GlueJob)"]:::job
  B_ORD[("sor.orders")]:::sor
  RDS_O --> J_ORD
  RDS_I --> J_ORD
  J_ORD --> B_ORD`,
  },

  {
    id: 'lg-job-munin-orchestration',
    entityType: 'job',
    pipelineId: 'pipeline-5',
    subType: 'Munin',
    entityName: 'orchestration_daily_full',
    displayName: 'orchestration_daily_full',
    description: 'Orquestração diária completa — aciona jobs de transformação SOR → SOT → SPEC',
    definition: `flowchart LR
${CLASSES}
  B1[("sor.orders")]:::sor
  B2[("sor.clickstream")]:::sor
  B3[("sor.crm_contacts")]:::sor
  B4[("sor.product_feed")]:::sor
  ORCH["orchestration_daily_full (Munin)"]:::job
  J1["transform_orders (GlueJob)"]:::job
  J2["harmonize_customer (CDP)"]:::job
  J3["transform_products (CDP)"]:::job
  J4["transform_c360 (CDP)"]:::job
  G1[("spec.customer_360")]:::spec
  G2[("rds.reporting_db.financial")]:::spec
  G3[("spec.product_catalog")]:::spec
  B1 --> ORCH
  B2 --> ORCH
  B3 --> ORCH
  B4 --> ORCH
  ORCH --> J1 --> G2
  ORCH --> J2
  ORCH --> J3 --> G3
  ORCH --> J4 --> G1
  J2 --> G1`,
  },

  // ─── PAINÉIS ───────────────────────────────────────────────────────────────

  {
    id: 'lg-panel-metabase-customer',
    entityType: 'panel',
    subType: 'Metabase',
    entityName: 'Customer Dashboard',
    displayName: 'Customer Dashboard',
    description: 'Painel de visão 360 do cliente — upstream completo até as fontes de origem',
    definition: `flowchart LR
${CLASSES}
  SF_C("salesforce.contacts"):::src
  SF_A("salesforce.accounts"):::src
  RDS_O("rds.orders_db.orders"):::src
  J_CRM["ingestion_crm_contacts (Phoenix)"]:::job
  J_ORD["ingestion_orders (GlueJob)"]:::job
  J_C360["transform_c360 (CDP)"]:::job
  B_CRM[("sor.crm_contacts")]:::sor
  B_ORD[("sor.orders")]:::sor
  S_CUS[("sot.customer_base")]:::sot
  S_ORD[("sot.orders")]:::sot
  G_360[("spec.customer_360")]:::spec
  G_KPI[("spec.kpi_summary")]:::spec
  P_DASH{{"Customer Dashboard (Metabase)"}}:::pnl
  SF_C --> J_CRM
  SF_A --> J_CRM
  J_CRM --> B_CRM --> S_CUS
  RDS_O --> J_ORD --> B_ORD --> S_ORD
  S_CUS --> J_C360
  S_ORD --> J_C360
  J_C360 --> G_360 --> P_DASH
  G_KPI --> P_DASH`,
  },

  // ─── MODELOS ───────────────────────────────────────────────────────────────

  {
    id: 'lg-model-sagemaker-churn',
    entityType: 'model',
    subType: 'SageMaker',
    entityName: 'customer_churn_model',
    displayName: 'customer_churn_model',
    description: 'Modelo de predição de churn — linhagem da feature engineering até o painel de análise',
    definition: `flowchart LR
${CLASSES}
  S_CUS[("sot.customer_base")]:::sot
  S_ORD[("sot.orders")]:::sot
  G_360[("spec.customer_360")]:::spec
  J_FE["feature_engineering (Spark)"]:::job
  J_TRAIN["model_training (SageMaker)"]:::job
  FT[("features.churn_features")]:::sot
  M_CHURN[["customer_churn_model"]]:::mdl
  J_SCORE["batch_scoring (SageMaker)"]:::job
  G_PRED[("spec.churn_predictions")]:::spec
  P_CHURN{{"Churn Analysis Dashboard"}}:::pnl
  S_CUS --> J_FE
  S_ORD --> J_FE
  G_360 --> J_FE
  J_FE --> FT
  FT --> J_TRAIN --> M_CHURN
  M_CHURN --> J_SCORE --> G_PRED --> P_CHURN`,
  },
];
