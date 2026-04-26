export type DataDemandStatus = 'active' | 'in_review' | 'approved' | 'inactive';

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
  inactiveAt?: string;
  inactiveBy?: string;
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
