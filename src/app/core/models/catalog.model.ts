export type DataLayer = 'sor' | 'sot' | 'spec';

export interface CatalogAsset {
  id: string;
  /** Nome físico — como aparece no banco (ex: customer_360). */
  name: string;
  /** Nome qualificado (`database.tabela`), usado em queries. */
  qualifiedName: string;
  /** Nome lógico de negócio — descrição amigável (ex: "Cliente 360"). */
  logicalName?: string;
  type: 'table' | 'view' | 'dashboard' | 'column' | 'schema' | 'database' | 'pipeline';
  sigla: string;
  dataLayer?: DataLayer;
  goldenSource?: boolean;
  description: string;
  owner: string;
  supportSquad?: string;
  domain: string;
  classification: string[];
  tags: string[];
  glossaryTerms: string[];
  certificationStatus: 'certified' | 'in_review' | 'draft' | 'deprecated';
  /** SLA de entrega (texto humano: "D-1 até 07h30", "A cada 5 min"). */
  slaDelivery?: string;
  lastUpdated: string;
  createdAt: string;
  popularity: number;
  lineage: CatalogLineage;
  schema?: CatalogSchema;
  sourceSystem: string;
  atlanLink?: string;
  ingestionFlows?: {
    name: string;
    type: 'munin' | 'glue_job' | 'outro';
  }[];
}

export interface CatalogLineage {
  upstream: CatalogLineageNode[];
  downstream: CatalogLineageNode[];
}

export interface CatalogLineageNode {
  id: string;
  name: string;
  type: string;
  source: string;
}

export interface CatalogSchema {
  columns: CatalogColumnInfo[];
}

export interface CatalogColumnInfo {
  name: string;
  type: string;
  description: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  classification: string[];
  sampleValues?: string[];
}

export interface CatalogDomain {
  id: string;
  name: string;
  description: string;
  owner: string;
  assetCount: number;
  subDomains: string[];
}

export interface CatalogGlossaryTerm {
  id: string;
  term: string;
  definition: string;
  domain: string;
  relatedTerms: string[];
  assignedAssets: number;
  owner: string;
  status: 'approved' | 'draft' | 'under_review';
}
