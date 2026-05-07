import { CatalogAsset, CatalogDomain, CatalogGlossaryTerm } from '../models';

export const MOCK_CATALOG_ASSETS: CatalogAsset[] = [
  {
    id: 'asset-1', name: 'customer_360', qualifiedName: 'spec.customer_360', type: 'table',
    logicalName: 'Cliente 360',
    sigla: 'eg4', dataLayer: 'spec', goldenSource: true,
    slaDelivery: 'D-1 até 07h30',
    description: 'Visão unificada do cliente combinando dados de CRM, pedidos e comportamento',
    owner: 'Analytics Engineering', supportSquad: 'Squad B', domain: 'Customer', classification: ['PII', 'Confidential'],
    tags: ['golden-record', 'certified'], glossaryTerms: ['Customer', 'Customer Lifetime Value'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T07:25:00Z', createdAt: '2025-06-01T00:00:00Z',
    popularity: 95, sourceSystem: 'AWS Glue', atlanLink: 'https://atlan.company.com/assets/customer_360',
    lineage: {
      upstream: [
        { id: 'ln-1', name: 'sor.crm_contacts', type: 'table', source: 'Salesforce' },
        { id: 'ln-2', name: 'sot.customer_base', type: 'table', source: 'CDP' },
        { id: 'ln-3', name: 'sor.clickstream', type: 'table', source: 'Kinesis' },
      ],
      downstream: [
        { id: 'ln-4', name: 'spec.customer_kpis', type: 'view', source: 'RDS Reporting' },
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
    id: 'asset-2', name: 'orders', qualifiedName: 'sor.orders', type: 'table',
    logicalName: 'Pedidos (bronze)',
    sigla: 'ab1', dataLayer: 'sor', goldenSource: false,
    slaDelivery: 'Até 30 min após disponibilidade na origem',
    description: 'Dados brutos de pedidos ingeridos do banco transacional',
    owner: 'Data Engineering', supportSquad: 'Squad A', domain: 'Sales', classification: ['Internal'],
    tags: ['raw', 'high-volume'], glossaryTerms: ['Order', 'Revenue'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T09:42:00Z', createdAt: '2025-01-15T00:00:00Z',
    popularity: 88, sourceSystem: 'RDS', lineage: { upstream: [], downstream: [{ id: 'ln-10', name: 'spec.customer_360', type: 'table', source: 'CDP' }] }
  },
  {
    id: 'asset-3', name: 'financial', qualifiedName: 'rds.reporting_db.financial', type: 'table',
    logicalName: 'Relatório financeiro',
    sigla: 'as7', dataLayer: 'spec', goldenSource: true,
    slaDelivery: 'D-1 até 05h00',
    description: 'Tabela de consumo financeiro publicada no RDS de relatórios',
    owner: 'Finance Data', supportSquad: 'Squad C', domain: 'Finance', classification: ['Restricted', 'Confidential'],
    tags: ['finance', 'sla-critical'], glossaryTerms: ['Transaction', 'Revenue'],
    certificationStatus: 'certified', lastUpdated: '2026-03-15T09:00:00Z', createdAt: '2025-03-01T00:00:00Z',
    popularity: 82, sourceSystem: 'AWS Glue', lineage: { upstream: [{ id: 'ln-20', name: 'spec.financial_summary', type: 'table', source: 'Glue' }], downstream: [{ id: 'ln-21', name: 'reporting.financial_summary', type: 'view', source: 'RDS' }] }
  },
  {
    id: 'asset-4', name: 'clickstream', qualifiedName: 'sor.clickstream', type: 'table',
    logicalName: 'Clickstream digital (bronze)',
    sigla: 'ab1', dataLayer: 'sor', goldenSource: false,
    slaDelivery: 'A cada 5 min',
    description: 'Eventos de clickstream brutos de aplicações web e mobile',
    owner: 'Data Engineering', supportSquad: 'Squad A', domain: 'Digital', classification: ['Internal'],
    tags: ['streaming', 'high-volume', 'raw'], glossaryTerms: ['Event', 'Session'],
    certificationStatus: 'in_review', lastUpdated: '2026-03-15T09:58:00Z', createdAt: '2025-08-01T00:00:00Z',
    popularity: 72, sourceSystem: 'Kinesis', lineage: { upstream: [], downstream: [{ id: 'ln-30', name: 'spec.customer_360', type: 'table', source: 'CDP' }] }
  },
  {
    id: 'asset-5', name: 'products', qualifiedName: 'sot.products', type: 'table',
    logicalName: 'Produtos harmonizados',
    sigla: 'as7', dataLayer: 'sot', goldenSource: true,
    description: 'Catálogo de produtos curado com atributos enriquecidos',
    owner: 'Product Data', supportSquad: 'Squad B', domain: 'Product', classification: ['Internal'],
    tags: ['product', 'master-data'], glossaryTerms: ['Product', 'SKU'],
    certificationStatus: 'certified', lastUpdated: '2026-03-14T05:55:00Z', createdAt: '2025-04-01T00:00:00Z',
    popularity: 68, sourceSystem: 'AWS Glue', lineage: { upstream: [{ id: 'ln-40', name: 'sor.product_feed', type: 'table', source: 'ERP' }], downstream: [] }
  },
  {
    id: 'asset-6', name: 'iot_sensors', qualifiedName: 'sor.iot_sensors', type: 'table',
    logicalName: 'Sensores IoT',
    sigla: 'as7', dataLayer: 'sor', goldenSource: false,
    description: 'Dados de telemetria de sensores IoT',
    owner: 'IoT Team', supportSquad: 'Squad C', domain: 'Engineering', classification: ['Internal'],
    tags: ['iot', 'streaming'], glossaryTerms: ['Sensor', 'Telemetry'],
    certificationStatus: 'draft', lastUpdated: '2026-03-15T09:59:00Z', createdAt: '2025-11-01T00:00:00Z',
    popularity: 45, sourceSystem: 'Kinesis', lineage: { upstream: [], downstream: [] }
  },
  {
    id: 'asset-7', name: 'crm_contacts', qualifiedName: 'sor.crm_contacts', type: 'table',
    logicalName: 'Contatos CRM',
    sigla: 'eg4', dataLayer: 'sor', goldenSource: false,
    slaDelivery: 'Até 1h após disponibilidade na origem',
    description: 'Contatos e contas CRM ingeridos do Salesforce para a camada SOR',
    owner: 'CRM Team', supportSquad: 'Squad B', domain: 'Customer', classification: ['PII', 'Internal'],
    tags: ['crm', 'incremental'], glossaryTerms: ['Customer', 'Contact'],
    certificationStatus: 'in_review', lastUpdated: '2026-03-15T09:18:00Z', createdAt: '2025-09-01T00:00:00Z',
    popularity: 64, sourceSystem: 'Phoenix', lineage: { upstream: [], downstream: [{ id: 'ln-50', name: 'spec.customer_360', type: 'table', source: 'CDP' }] }
  },
  {
    id: 'asset-8', name: 'all_domains', qualifiedName: 'spec.all_domains', type: 'table',
    logicalName: 'Domínios integrados',
    sigla: 'eg4', dataLayer: 'spec', goldenSource: false,
    slaDelivery: 'D-1 até 07h00',
    description: 'Tabela integrada por orquestração diária multi-domínio',
    owner: 'Data Platform', supportSquad: 'Squad A', domain: 'Engineering', classification: ['Internal'],
    tags: ['orchestration', 'full-refresh'], glossaryTerms: ['SLA', 'Data Freshness'],
    certificationStatus: 'in_review', lastUpdated: '2026-03-15T07:00:00Z', createdAt: '2025-12-01T00:00:00Z',
    popularity: 58, sourceSystem: 'Munin', lineage: { upstream: [{ id: 'ln-60', name: 'sor.orders', type: 'table', source: 'Glue' }, { id: 'ln-61', name: 'sor.clickstream', type: 'table', source: 'Glue' }], downstream: [] }
  },
  {
    id: 'asset-9', name: 'erp_master', qualifiedName: 'sor.erp_master', type: 'table',
    logicalName: 'Dados mestres ERP',
    sigla: 'cd2', dataLayer: 'sor', goldenSource: false,
    slaDelivery: 'D-1 até 02h00',
    description: 'Dados mestre de materiais, fornecedores e centros de custo sincronizados do ERP',
    owner: 'ERP Data', supportSquad: 'Squad C', domain: 'Engineering', classification: ['Internal'],
    tags: ['erp', 'master-data'], glossaryTerms: ['Master Data'],
    certificationStatus: 'draft', lastUpdated: '2026-03-14T01:30:00Z', createdAt: '2026-01-10T00:00:00Z',
    popularity: 37, sourceSystem: 'Outros', lineage: { upstream: [], downstream: [] }
  },
];

export const MOCK_DOMAINS: CatalogDomain[] = [
  { id: 'dom-1', name: 'Customer', description: 'Todos os ativos de dados relacionados a clientes', owner: 'Analytics Engineering', assetCount: 2, subDomains: ['CRM', 'Behavioral', 'Segmentation'] },
  { id: 'dom-2', name: 'Sales', description: 'Dados de vendas e pedidos', owner: 'Sales Analytics', assetCount: 1, subDomains: ['Orders', 'Revenue', 'Forecast'] },
  { id: 'dom-3', name: 'Finance', description: 'Dados financeiros e contábeis', owner: 'Finance Data', assetCount: 1, subDomains: ['Transactions', 'Reporting', 'Budgeting'] },
  { id: 'dom-4', name: 'Product', description: 'Catálogo de produtos e inventário', owner: 'Product Data', assetCount: 1, subDomains: ['Catalog', 'Inventory', 'Pricing'] },
  { id: 'dom-5', name: 'Digital', description: 'Analíticas digitais e comportamento', owner: 'Digital Analytics', assetCount: 1, subDomains: ['Clickstream', 'Mobile', 'Engagement'] },
  { id: 'dom-6', name: 'Engineering', description: 'Dados de IoT, ERP e operação da plataforma', owner: 'Engineering', assetCount: 3, subDomains: ['IoT', 'ERP', 'Monitoring'] },
];

export const MOCK_GLOSSARY: CatalogGlossaryTerm[] = [
  { id: 'gt-1', term: 'Customer Lifetime Value', definition: 'Receita total que um cliente deve gerar ao longo do relacionamento', domain: 'Customer', relatedTerms: ['Revenue', 'Customer'], assignedAssets: 5, owner: 'Analytics', status: 'approved' },
  { id: 'gt-2', term: 'Revenue', definition: 'Receita total gerada a partir das operações normais do negócio', domain: 'Finance', relatedTerms: ['Transaction', 'Order'], assignedAssets: 12, owner: 'Finance', status: 'approved' },
  { id: 'gt-3', term: 'Session', definition: 'Grupo de interações do usuário dentro de um período em uma plataforma digital', domain: 'Digital', relatedTerms: ['Event', 'Pageview'], assignedAssets: 8, owner: 'Digital Analytics', status: 'approved' },
  { id: 'gt-4', term: 'SKU', definition: 'Stock Keeping Unit - identificador único para uma variante de produto', domain: 'Product', relatedTerms: ['Product'], assignedAssets: 4, owner: 'Product Data', status: 'approved' },
  { id: 'gt-5', term: 'Data Freshness', definition: 'Medida de quão recentemente um dataset foi atualizado em relação ao SLA', domain: 'Data Quality', relatedTerms: ['SLA', 'Data Quality'], assignedAssets: 0, owner: 'Data Platform', status: 'under_review' },
];
