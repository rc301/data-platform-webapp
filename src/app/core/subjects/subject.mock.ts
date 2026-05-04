import { Subject, SubjectDomain, TableAssignment } from './subject.model';

const NOW = '2026-04-26T00:00:00-03:00';

export const SUBJECTS: Subject[] = [
  { id: 'subj-contas',   name: 'Contas',   description: 'Produtos de conta corrente, poupança e salário.', owner: 'Squad B', createdAt: NOW, updatedAt: NOW },
  { id: 'subj-cartoes',  name: 'Cartões',  description: 'Crédito, débito, vouchers e benefícios.',          owner: 'Squad C', createdAt: NOW, updatedAt: NOW },
  { id: 'subj-credito',  name: 'Crédito',  description: 'Empréstimos, financiamentos e linhas rotativas.',  owner: 'Squad C', createdAt: NOW, updatedAt: NOW },
  { id: 'subj-seguros',  name: 'Seguros',  description: 'Apólices, sinistros e produtos protetivos.',        owner: 'Squad A', createdAt: NOW, updatedAt: NOW },
];

export const SUBJECT_DOMAINS: SubjectDomain[] = [
  { id: 'dom-cc-corrente',     subjectId: 'subj-contas',  name: 'Conta Corrente',         description: 'Movimentações e saldos de conta corrente.', createdAt: NOW, updatedAt: NOW },
  { id: 'dom-cc-poupanca',     subjectId: 'subj-contas',  name: 'Poupança',               description: 'Depósitos e rendimento.',                    createdAt: NOW, updatedAt: NOW },
  { id: 'dom-cc-salario',      subjectId: 'subj-contas',  name: 'Conta Salário',          description: 'Folha empresarial e portabilidade.',         createdAt: NOW, updatedAt: NOW },

  { id: 'dom-cart-credito',    subjectId: 'subj-cartoes', name: 'Crédito',                description: 'Faturas, limites e parcelamentos.',          createdAt: NOW, updatedAt: NOW },
  { id: 'dom-cart-debito',     subjectId: 'subj-cartoes', name: 'Débito',                 description: 'Compras à vista e saques.',                  createdAt: NOW, updatedAt: NOW },
  { id: 'dom-cart-beneficios', subjectId: 'subj-cartoes', name: 'Benefícios',             description: 'Cashback, pontos e parcerias.',              createdAt: NOW, updatedAt: NOW },

  { id: 'dom-cred-cdc',        subjectId: 'subj-credito', name: 'CDC',                    description: 'Crédito direto ao consumidor.',              createdAt: NOW, updatedAt: NOW },
  { id: 'dom-cred-imobiliario', subjectId: 'subj-credito', name: 'Imobiliário',            description: 'Financiamento imobiliário.',                 createdAt: NOW, updatedAt: NOW },

  { id: 'dom-seg-vida',        subjectId: 'subj-seguros', name: 'Vida',                   description: 'Seguros de vida e cobertura.',               createdAt: NOW, updatedAt: NOW },
  { id: 'dom-seg-residencial', subjectId: 'subj-seguros', name: 'Residencial',            description: 'Seguros residenciais.',                      createdAt: NOW, updatedAt: NOW },
];

export const TABLE_ASSIGNMENTS: TableAssignment[] = [
  { qualifiedName: 'gold.customer_360',          subjectId: 'subj-contas',  domainId: 'dom-cc-corrente',     source: 'manual',    updatedAt: NOW, updatedBy: 'admin@dp' },
  { qualifiedName: 'gold.poupanca_saldos',       subjectId: 'subj-contas',  domainId: 'dom-cc-poupanca',     source: 'daily-job', updatedAt: NOW, updatedBy: 'system' },
  { qualifiedName: 'gold.cartao_fatura',         subjectId: 'subj-cartoes', domainId: 'dom-cart-credito',    source: 'daily-job', updatedAt: NOW, updatedBy: 'system' },
  { qualifiedName: 'gold.cartao_uso_diario',     subjectId: 'subj-cartoes', domainId: 'dom-cart-debito',     source: 'daily-job', updatedAt: NOW, updatedBy: 'system' },
  { qualifiedName: 'gold.cdc_carteira',          subjectId: 'subj-credito', domainId: 'dom-cred-cdc',        source: 'manual',    updatedAt: NOW, updatedBy: 'admin@dp' },
  { qualifiedName: 'gold.imobiliario_carteira',  subjectId: 'subj-credito', domainId: 'dom-cred-imobiliario', source: 'manual',   updatedAt: NOW, updatedBy: 'admin@dp' },
  { qualifiedName: 'gold.seguro_vida_apolices',  subjectId: 'subj-seguros', domainId: 'dom-seg-vida',        source: 'agent',     updatedAt: NOW, updatedBy: 'agent@dp' },
];
