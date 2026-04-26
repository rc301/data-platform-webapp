import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface TermPattern {
  term: string;
  abbreviation: string;
  domain: string;
}

const TERMS: TermPattern[] = [
  { term: 'customer', abbreviation: 'cust', domain: 'Cliente' },
  { term: 'client', abbreviation: 'cli', domain: 'Cliente' },
  { term: 'identifier', abbreviation: 'id', domain: 'Técnico' },
  { term: 'document', abbreviation: 'doc', domain: 'Cadastro' },
  { term: 'account', abbreviation: 'acct', domain: 'Conta' },
  { term: 'transaction', abbreviation: 'txn', domain: 'Financeiro' },
  { term: 'amount', abbreviation: 'amt', domain: 'Financeiro' },
  { term: 'description', abbreviation: 'desc', domain: 'Técnico' },
  { term: 'created', abbreviation: 'cre', domain: 'Temporal' },
  { term: 'updated', abbreviation: 'upd', domain: 'Temporal' },
  { term: 'date', abbreviation: 'dt', domain: 'Temporal' },
  { term: 'status', abbreviation: 'st', domain: 'Técnico' },
];

@Component({
  selector: 'app-term-abbreviation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Padronização de nomes"
      subtitle="Converta nomes extensos de campos para abreviações corporativas internas"
      icon="translate">
    </app-page-header>

    <section class="converter">
      <mat-form-field appearance="outline">
        <mat-label>Campo por extenso</mat-label>
        <input matInput [(ngModel)]="sourceName" placeholder="customer_transaction_amount">
      </mat-form-field>
      <div class="result">
        <span>Nome sugerido</span>
        <strong>{{ convertedName }}</strong>
      </div>
    </section>

    <section class="dictionary">
      <div class="dict-row dict-row--head"><span>Termo</span><span>Abreviação</span><span>Domínio</span></div>
      <div class="dict-row" *ngFor="let item of terms">
        <strong>{{ item.term }}</strong>
        <code>{{ item.abbreviation }}</code>
        <span>{{ item.domain }}</span>
      </div>
    </section>
  `,
  styles: [`
    .converter { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(260px, 420px); gap: 16px; align-items: stretch; margin-bottom: 18px; padding: 16px; border-radius: var(--radius-lg); background: var(--bg-surface); }
    .result { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 14px; border-radius: var(--radius-md); background: var(--bg-app); }
    .result span { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .result strong { color: var(--text-primary); font-family: var(--font-mono); font-size: 18px; word-break: break-word; }
    .dictionary { border-radius: var(--radius-lg); background: var(--bg-surface); overflow: hidden; }
    .dict-row { display: grid; grid-template-columns: 1fr 180px 180px; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px; }
    .dict-row:last-child { border-bottom: 0; }
    .dict-row--head { background: var(--bg-app); color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .dict-row strong { color: var(--text-primary); }
    code { width: fit-content; padding: 2px 6px; border-radius: 4px; background: var(--bg-app); color: var(--brand-300); }
    @media (max-width: 760px) { .converter, .dict-row { grid-template-columns: 1fr; } }
  `],
})
export class TermAbbreviationComponent {
  readonly terms = TERMS;
  sourceName = 'customer_transaction_amount';

  get convertedName(): string {
    return this.sourceName
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(part => TERMS.find(item => item.term === part)?.abbreviation ?? part.slice(0, 8))
      .join('_');
  }
}
