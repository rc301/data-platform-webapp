export interface CatalogAsset {
  id: string;
  name: string;
  qualifiedName: string;
  type: 'table' | 'view' | 'dashboard' | 'column' | 'schema' | 'database' | 'pipeline';
  description: string;
  owner: string;
  domain: string;
  classification: string[];
  tags: string[];
  glossaryTerms: string[];
  certificationStatus: 'certified' | 'in_review' | 'draft' | 'deprecated';
  lastUpdated: string;
  createdAt: string;
  popularity: number;
  lineage: CatalogLineage;
  schema?: CatalogSchema;
  sourceSystem: string;
  atlanLink?: string;
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
