import { CatalogAsset, CatalogDomain, CatalogGlossaryTerm } from '../models';

export const MOCK_CATALOG_ASSETS: CatalogAsset[] = [
  {
    id: 'asset-1', name: 'customer_360', qualifiedName: 'datalake.gold.customer_360', type: 'table',
    description: 'Visão unificada do cliente combinando dados de CRM, pedidos e comportamento',
    owner: 'Analytics Engineering', domain: 'Customer', classification: ['PII', 'Confidential'],
    tags: ['golden-record', 'certified'], glossaryTerms: ['Customer', 'Customer Lifetime Value'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T07:25:00Z', createdAt: '2025-06-01T00:00:00Z',
    popularity: 95, sourceSystem: 'AWS Glue', atlanLink: 'https://atlan.company.com/assets/customer_360',
    lineage: {
      upstream: [
        { id: 'ln-1', name: 'raw.crm_contacts', type: 'table', source: 'Salesforce' },
        { id: 'ln-2', name: 'raw.orders', type: 'table', source: 'RDS' },
        { id: 'ln-3', name: 'raw.clickstream', type: 'table', source: 'Kinesis' },
      ],
      downstream: [
        { id: 'ln-4', name: 'gold.customer_kpis', type: 'view', source: 'RDS Reporting' },
        { id: 'ln-5', name: 'bi.customer_dashboard', type: 'dashboard', source: 'Tableau' },
      ]
    },
    schema: {
      columns: [
        { name: 'customer_id', type: 'STRING', description: 'Identificador único do cliente', isPrimaryKey: true, isForeignKey: false, isNullable: false, classification: [] },
        { name: 'full_name', type: 'STRING', description: 'Nome completo', isPrimaryKey: false, isForeignKey: false, isNullable: false, classification: ['PII'] },
        { name: 'email', type: 'STRING', description: 'Endereço de e-mail principal', isPrimaryKey: false, isForeignKey: false, isNullable: true, classification: ['PII'] },
        { name: 'total_orders', type: 'INT', description: 'Total de pedidos realizados', isPrimaryKey: false, isForeignKey: false, isNullable: false, classification: [] },
        { name: 'ltv', type: 'DECIMAL(18,2)', description: 'Valor do tempo de vida do cliente', isPrimaryKey: false, isForeignKey: false, isNullable: false, classification: ['Confidential'] },
        { name: 'segment', type: 'STRING', description: 'Segmento do cliente', isPrimaryKey: false, isForeignKey: false, isNullable: false, classification: [] },
        { name: 'last_order_date', type: 'TIMESTAMP', description: 'Data do último pedido', isPrimaryKey: false, isForeignKey: false, isNullable: true, classification: [] },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Data de criação do registro', isPrimaryKey: false, isForeignKey: false, isNullable: false, classification: [] },
      ]
    }
  },
  {
    id: 'asset-2', name: 'orders', qualifiedName: 'datalake.bronze.orders', type: 'table',
    description: 'Dados brutos de pedidos ingeridos do banco transacional',
    owner: 'Data Engineering', domain: 'Sales', classification: ['Internal'],
    tags: ['raw', 'high-volume'], glossaryTerms: ['Order', 'Revenue'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T09:42:00Z', createdAt: '2025-01-15T00:00:00Z',
    popularity: 88, sourceSystem: 'RDS', lineage: { upstream: [], downstream: [{ id: 'ln-10', name: 'curated.customer_360', type: 'table', source: 'Glue' }] }
  },
  {
    id: 'asset-3', name: 'financial_transactions', qualifiedName: 'datalake.gold.financial_transactions', type: 'table',
    description: 'Transações financeiras curadas com metadados enriquecidos',
    owner: 'Finance Data', domain: 'Finance', classification: ['Restricted', 'Confidential'],
    tags: ['finance', 'sla-critical'], glossaryTerms: ['Transaction', 'Revenue'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T09:00:00Z', createdAt: '2025-03-01T00:00:00Z',
    popularity: 82, sourceSystem: 'AWS Glue', lineage: { upstream: [{ id: 'ln-20', name: 'raw.payments', type: 'table', source: 'Stripe' }], downstream: [{ id: 'ln-21', name: 'reporting.financial_summary', type: 'view', source: 'RDS' }] }
  },
  {
    id: 'asset-4', name: 'clickstream', qualifiedName: 'datalake.bronze.clickstream', type: 'table',
    description: 'Eventos de clickstream brutos de aplicações web e mobile',
    owner: 'Data Engineering', domain: 'Digital', classification: ['Internal'],
    tags: ['streaming', 'high-volume', 'raw'], glossaryTerms: ['Event', 'Session'],
    certificationStatus: 'in_review', lastUpdated: '2026-03-15T09:58:00Z', createdAt: '2025-08-01T00:00:00Z',
    popularity: 72, sourceSystem: 'Kinesis', lineage: { upstream: [], downstream: [{ id: 'ln-30', name: 'curated.customer_360', type: 'table', source: 'Glue' }] }
  },
  {
    id: 'asset-5', name: 'products', qualifiedName: 'datalake.silver.products', type: 'table',
    description: 'Catálogo de produtos curado com atributos enriquecidos',
    owner: 'Product Data', domain: 'Product', classification: ['Internal'],
    tags: ['product', 'master-data'], glossaryTerms: ['Product', 'SKU'],
    certificationStatus: 'certified', lastUpdated: '2026-03-14T05:55:00Z', createdAt: '2025-04-01T00:00:00Z',
    popularity: 68, sourceSystem: 'AWS Glue', lineage: { upstream: [{ id: 'ln-40', name: 'bronze.product_feed', type: 'table', source: 'ERP' }], downstream: [] }
  },
  {
    id: 'asset-6', name: 'iot_sensor_readings', qualifiedName: 'datalake.bronze.iot_sensor_readings', type: 'table',
    description: 'Dados de telemetria de sensores IoT',
    owner: 'IoT Team', domain: 'Engineering', classification: ['Internal'],
    tags: ['iot', 'streaming'], glossaryTerms: ['Sensor', 'Telemetry'],
    certificationStatus: 'draft', lastUpdated: '2026-03-15T09:59:00Z', createdAt: '2025-11-01T00:00:00Z',
    popularity: 45, sourceSystem: 'Kinesis', lineage: { upstream: [], downstream: [] }
  },
];

export const MOCK_DOMAINS: CatalogDomain[] = [
  { id: 'dom-1', name: 'Customer', description: 'Todos os ativos de dados relacionados a clientes', owner: 'Analytics Engineering', assetCount: 24, subDomains: ['CRM', 'Behavioral', 'Segmentation'] },
  { id: 'dom-2', name: 'Sales', description: 'Dados de vendas e pedidos', owner: 'Sales Analytics', assetCount: 18, subDomains: ['Orders', 'Revenue', 'Forecast'] },
  { id: 'dom-3', name: 'Finance', description: 'Dados financeiros e contábeis', owner: 'Finance Data', assetCount: 15, subDomains: ['Transactions', 'Reporting', 'Budgeting'] },
  { id: 'dom-4', name: 'Product', description: 'Catálogo de produtos e inventário', owner: 'Product Data', assetCount: 12, subDomains: ['Catalog', 'Inventory', 'Pricing'] },
  { id: 'dom-5', name: 'Digital', description: 'Analíticas digitais e comportamento', owner: 'Digital Analytics', assetCount: 20, subDomains: ['Clickstream', 'Mobile', 'Engagement'] },
  { id: 'dom-6', name: 'Engineering', description: 'Dados de IoT e infraestrutura', owner: 'Engineering', assetCount: 8, subDomains: ['IoT', 'Infrastructure', 'Monitoring'] },
];

export const MOCK_GLOSSARY: CatalogGlossaryTerm[] = [
  { id: 'gt-1', term: 'Customer Lifetime Value', definition: 'Receita total que um cliente deve gerar ao longo do relacionamento', domain: 'Customer', relatedTerms: ['Revenue', 'Customer'], assignedAssets: 5, owner: 'Analytics', status: 'approved' },
  { id: 'gt-2', term: 'Revenue', definition: 'Receita total gerada a partir das operações normais do negócio', domain: 'Finance', relatedTerms: ['Transaction', 'Order'], assignedAssets: 12, owner: 'Finance', status: 'approved' },
  { id: 'gt-3', term: 'Session', definition: 'Grupo de interações do usuário dentro de um período em uma plataforma digital', domain: 'Digital', relatedTerms: ['Event', 'Pageview'], assignedAssets: 8, owner: 'Digital Analytics', status: 'approved' },
  { id: 'gt-4', term: 'SKU', definition: 'Stock Keeping Unit - identificador único para uma variante de produto', domain: 'Product', relatedTerms: ['Product'], assignedAssets: 4, owner: 'Product Data', status: 'approved' },
  { id: 'gt-5', term: 'Data Freshness', definition: 'Medida de quão recentemente um dataset foi atualizado em relação ao SLA', domain: 'Data Quality', relatedTerms: ['SLA', 'Data Quality'], assignedAssets: 0, owner: 'Data Platform', status: 'under_review' },
];
