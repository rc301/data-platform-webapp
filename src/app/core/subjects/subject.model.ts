/**
 * Domínio "Assunto + Domínio" do catálogo de dados.
 *
 * Estrutura conceitual:
 *
 *   Subject  (nível 1, ~3-4 itens corporativos: Contas, Cartões, ...)
 *     └── SubjectDomain  (nível 2, dependente do Subject 1:N)
 *           └── TableAssignment  (qualifiedName → Subject + SubjectDomain, 1:1)
 *
 * Esses dados não vêm de sistema externo. São mantidos manualmente pelo
 * admin (CRUD na tela /admin/subjects) e/ou por um job diário que coleta
 * a relação tabela↔assunto e atualiza esta dimensão. As tabelas no catálogo
 * passam a referenciar essa dimensão para responder "que tabelas pertencem
 * ao assunto Cartões?".
 */

export interface Subject {
  id: string;
  name: string;
  description?: string;
  /** Owner/responsável pelo assunto (ex.: equipe que valida as classificações). */
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDomain {
  id: string;
  subjectId: Subject['id'];
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Atribuição 1:1 — uma tabela corporativa pertence a 1 assunto + 1 domínio.
 * `qualifiedName` é a forma canônica `database.schema.tabela`.
 */
export interface TableAssignment {
  qualifiedName: string;
  subjectId: Subject['id'];
  domainId: SubjectDomain['id'];
  /** Ferramenta/processo que registrou (admin manual, job diário, etc.). */
  source: 'manual' | 'daily-job' | 'agent';
  updatedAt: string;
  updatedBy: string;
}

export interface SubjectDraft {
  name: string;
  description?: string;
  owner?: string;
}

export interface SubjectDomainDraft {
  subjectId: Subject['id'];
  name: string;
  description?: string;
}

export interface TableAssignmentDraft {
  qualifiedName: string;
  subjectId: Subject['id'];
  domainId: SubjectDomain['id'];
}
