import {
  Component, Input, OnChanges, SimpleChanges, ElementRef,
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, inject, Output, EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import mermaid from 'mermaid';

let _initialized = false;

function initMermaidOnce(): void {
  if (_initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#e8eaf6',
      primaryBorderColor: '#9fa8da',
      primaryTextColor: '#1a237e',
      lineColor: '#78909c',
      fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
      fontSize: '13px',
      edgeLabelBackground: '#ffffff',
    },
    flowchart: {
      curve: 'basis',
      htmlLabels: true,
      diagramPadding: 24,
      nodeSpacing: 60,
      rankSpacing: 90,
    },
  });
  _initialized = true;
}

@Component({
  selector: 'app-mermaid-diagram',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  // Default CD: the async render sets innerHTML directly on a ViewChild element,
  // so OnPush would require manual markForCheck after every render.
  // Default is cleaner for this leaf component.
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="mermaid-host">
      <div class="loading-state" *ngIf="renderState === 'loading'">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Processando linhagem...</span>
      </div>
      <div class="error-state" *ngIf="renderState === 'error'">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>Erro ao processar o diagrama</p>
        <small>{{ errorMsg }}</small>
      </div>
      <div #diagramEl [class.hidden]="renderState !== 'ready'"></div>
    </div>
  `,
  styles: [`
    .mermaid-host { position: relative; width: 100%; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px;
      color: #666; font-size: 14px;
    }

    .error-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: #c62828; font-size: 14px;
      text-align: center;
    }
    .error-state mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .hidden { display: none; }

    ::ng-deep .mermaid-host svg {
      max-width: 100%;
      height: auto;
      display: block;
    }
  `],
})
export class MermaidDiagramComponent implements AfterViewInit, OnChanges {
  @Input() definition = '';
  @Output() renderReady = new EventEmitter<void>();
  @Output() renderError = new EventEmitter<string>();
  @ViewChild('diagramEl') diagramEl!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private renderSeq = 0;
  private viewReady = false;

  renderState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  errorMsg = '';

  ngAfterViewInit(): void {
    initMermaidOnce();
    this.viewReady = true;
    if (this.definition) {
      this.renderDiagram();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definition'] && this.viewReady) {
      this.renderDiagram();
    }
  }

  private async renderDiagram(): Promise<void> {
    if (!this.definition.trim() || !this.diagramEl) return;

    this.renderSeq++;
    const seq = this.renderSeq;
    const id = `mermaid-${seq}-${Date.now()}`;

    this.renderState = 'loading';
    this.errorMsg = '';

    try {
      const { svg } = await mermaid.render(id, this.definition);
      // Guard against stale renders when definition changed again mid-flight
      if (seq !== this.renderSeq) return;
      this.diagramEl.nativeElement.innerHTML = svg;
      this.renderState = 'ready';
      this.renderReady.emit();
    } catch (err: unknown) {
      if (seq !== this.renderSeq) return;
      this.errorMsg = err instanceof Error ? err.message : String(err);
      this.renderState = 'error';
      this.renderError.emit(this.errorMsg);
    }

    this.cdr.markForCheck();
  }
}
