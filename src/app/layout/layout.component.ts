import { Component, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';
import { PersonaService, PersonaId } from '../core/services/persona.service';
import { AccessService } from '../core/access/access.service';
import { Capability } from '../core/access/access.types';

interface NavItem {
  label: string;
  route: string;
  icon?: string;
  badge?: number | string;
  primary?: boolean;
  /** Quando true, só ativa quando a URL é exatamente igual (não prefix). */
  exact?: boolean;
  requiredCapabilities?: Capability[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatMenuModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <!-- ========== SIDEBAR ========== -->
      <aside class="shell__sidebar" [class.shell__sidebar--collapsed]="collapsed()">
        <div class="brand">
          <div class="brand__mark"><span class="brand__glyph">◆</span></div>
          <div class="brand__text" *ngIf="!collapsed()">
            <span class="brand__name">DataPlatform</span>
            <span class="brand__sub">Console Corporativo</span>
          </div>
          <button class="icon-btn icon-btn--collapse" (click)="toggleCollapse()" [attr.aria-label]="collapsed() ? 'Expandir menu' : 'Recolher menu'">
            {{ collapsed() ? '›' : '‹' }}
          </button>
        </div>

        <!-- Persona switcher -->
        <div class="persona" [class.persona--mini]="collapsed()">
          <button class="persona__trigger" [matMenuTriggerFor]="personaMenu">
            <span class="persona__avatar"><span>{{ personaInitial() }}</span></span>
            <span class="persona__meta" *ngIf="!collapsed()">
              <span class="persona__hint">Modo de trabalho</span>
              <span class="persona__name">{{ persona.active().shortLabel }}</span>
            </span>
            <span class="persona__caret" *ngIf="!collapsed()">▾</span>
          </button>
          <mat-menu #personaMenu="matMenu" xPosition="after">
            <button *ngFor="let p of persona.all"
                    mat-menu-item
                    class="persona-option"
                    (click)="switchPersona(p.id)">
              <div class="persona-option__title">{{ p.label }}</div>
              <div class="persona-option__desc">{{ p.description }}</div>
            </button>
          </mat-menu>
        </div>

        <!-- Nav -->
        <nav class="nav">
          <ng-container *ngFor="let group of navGroups()">
            <div class="nav__group-title" *ngIf="!collapsed()">{{ group.title }}</div>
            <div class="nav__group">
              <a *ngFor="let item of group.items"
                 [routerLink]="item.route"
                 routerLinkActive="nav__item--active"
                 [routerLinkActiveOptions]="{ exact: !!item.exact }"
                 class="nav__item"
                 [class.nav__item--primary]="item.primary"
                 [matTooltip]="collapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <span class="nav__icon" *ngIf="item.icon">{{ iconGlyph(item.icon) }}</span>
                <span class="nav__label" *ngIf="!collapsed()">{{ item.label }}</span>
                <span class="nav__badge" *ngIf="item.badge && !collapsed()">{{ item.badge }}</span>
              </a>
            </div>
          </ng-container>
        </nav>

        <div class="env" *ngIf="!collapsed()">
          <span class="env__dot"></span>
          <span class="env__label">Ambiente</span>
          <span class="env__value">DEV LOCAL</span>
        </div>
      </aside>

      <!-- ========== MAIN ========== -->
      <div class="shell__main">
        <header class="topbar">
          <div class="topbar__crumb">
            <span class="topbar__persona-label">{{ persona.active().shortLabel }}</span>
            <span class="topbar__sep">/</span>
            <span class="topbar__title">Console</span>
          </div>

          <button *ngIf="access.activeScopes().length > 0"
                  class="scope-chip"
                  [matMenuTriggerFor]="scopeMenu"
                  matTooltip="Escopo de acesso ativo">
            <span class="scope-chip__label">{{ access.context()?.activeScope?.label || 'Escopo global' }}</span>
            <span class="scope-chip__caret" *ngIf="access.activeScopes().length > 1">▾</span>
          </button>
          <mat-menu #scopeMenu="matMenu" xPosition="after">
            <button *ngFor="let scope of access.activeScopes()"
                    mat-menu-item
                    (click)="access.setActiveScope(scope.id)">
              {{ scope.label }}
            </button>
          </mat-menu>

          <div class="topbar__search">
            <span class="topbar__search-icon">⌕</span>
            <input class="topbar__search-input" placeholder="Buscar pipelines, jobs, datasets…" />
            <kbd class="topbar__kbd">⌘K</kbd>
          </div>

          <div class="topbar__actions">
            <button class="icon-btn" [matMenuTriggerFor]="notifMenu" matTooltip="Notificações">
              <span>◔</span>
              <span class="icon-btn__dot"></span>
            </button>
            <mat-menu #notifMenu="matMenu" xPosition="before">
              <div class="menu-section">
                <div class="menu-section__title">Notificações</div>
                <button mat-menu-item><span class="dot dot--danger"></span> Pipeline ingestion_orders falhou</button>
                <button mat-menu-item><span class="dot dot--warning"></span> Qualidade abaixo do limite</button>
                <button mat-menu-item><span class="dot dot--info"></span> Conexões RDS próximas do limite</button>
              </div>
            </mat-menu>

            <button class="user-chip" [matMenuTriggerFor]="userMenu">
              <span class="user-chip__avatar">{{ userInitials() }}</span>
              <span class="user-chip__meta">
                <span class="user-chip__name">{{ auth.user()?.name }}</span>
                <span class="user-chip__role">{{ auth.user()?.role | titlecase }}</span>
              </span>
              <span class="user-chip__caret">▾</span>
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <button mat-menu-item>Configurações</button>
              <button mat-menu-item (click)="auth.logout()">Sair</button>
            </mat-menu>
          </div>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: auto 1fr; min-height: 100vh; background: var(--bg-app); }

    /* ---------- Sidebar ---------- */
    .shell__sidebar {
      width: 260px;
      background: linear-gradient(180deg, #0D1320 0%, #0A0E14 100%);
      border-right: 1px solid var(--border-subtle);
      display: flex; flex-direction: column;
      transition: width .2s ease;
    }
    .shell__sidebar--collapsed { width: 72px; }

    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 18px 16px; min-height: 64px;
      border-bottom: 1px solid var(--border-subtle);
      position: relative;
    }
    .brand__mark {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
      display: flex; align-items: center; justify-content: center;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(46,91,176,0.30);
      flex-shrink: 0;
    }
    .brand__glyph { color: #fff; font-size: 16px; font-weight: 700; }
    .brand__text { display: flex; flex-direction: column; min-width: 0; }
    .brand__name { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }
    .brand__sub { font-size: 11px; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }
    .icon-btn--collapse {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px;
    }

    /* ---------- Persona switcher ---------- */
    .persona { padding: 12px; border-bottom: 1px solid var(--border-subtle); }
    .persona__trigger {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 8px 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      cursor: pointer;
      font-family: inherit;
      transition: border-color .15s ease, background .15s ease;
    }
    .persona__trigger:hover { border-color: var(--border-strong); background: var(--bg-elevated); }
    .persona__avatar {
      width: 30px; height: 30px; border-radius: 8px;
      background: linear-gradient(135deg, var(--brand-400), var(--brand-700));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 12px;
      flex-shrink: 0;
    }
    .persona__meta { display: flex; flex-direction: column; flex: 1; min-width: 0; align-items: flex-start; }
    .persona__hint { font-size: 10px; color: var(--text-muted); letter-spacing: 0.10em; text-transform: uppercase; }
    .persona__name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .persona__caret { color: var(--text-muted); font-size: 10px; }
    .persona--mini .persona__trigger { justify-content: center; padding: 8px; }

    /* ---------- Nav ---------- */
    .nav { flex: 1; overflow-y: auto; padding: 12px 8px; display: flex; flex-direction: column; gap: 6px; }
    .nav__group-title {
      font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
      color: var(--text-muted); text-transform: uppercase;
      padding: 12px 12px 4px;
    }
    .nav__group { display: flex; flex-direction: column; gap: 1px; }

    .nav__item {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 13px; font-weight: 500;
      transition: background .15s ease, color .15s ease;
      text-decoration: none;
      position: relative;
    }
    .nav__item:hover { background: var(--bg-surface); color: var(--text-primary); text-decoration: none; }
    .nav__item--active {
      background: rgba(76,141,255,0.10);
      color: var(--text-primary);
      font-weight: 600;
    }
    .nav__item--active::before {
      content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px;
      background: var(--brand-400); border-radius: 0 2px 2px 0;
    }

    .nav__item--primary {
      background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
      color: #fff;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 14px rgba(46,91,176,0.28);
      margin: 4px 0 8px;
    }
    .nav__item--primary:hover { background: linear-gradient(135deg, var(--brand-400), var(--brand-600)); color: #fff; }
    .nav__item--primary.nav__item--active::before { display: none; }

    .nav__icon { width: 18px; text-align: center; font-size: 14px; opacity: 0.85; flex-shrink: 0; }
    .nav__label { flex: 1; }
    .nav__badge {
      font-size: 10px; font-weight: 700;
      background: var(--danger-500); color: #fff;
      padding: 1px 6px; border-radius: 999px;
    }

    /* ---------- Env footer ---------- */
    .env {
      display: flex; align-items: center; gap: 8px;
      margin: 12px; padding: 8px 12px;
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-size: 11px; color: var(--text-secondary);
    }
    .env__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success-500); box-shadow: 0 0 8px var(--success-500); }
    .env__label { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
    .env__value { margin-left: auto; font-weight: 700; color: var(--text-primary); letter-spacing: 0.06em; }

    /* ---------- Topbar ---------- */
    .shell__main { display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      display: flex; align-items: center; gap: 16px;
      height: 60px; padding: 0 24px;
      background: rgba(10,14,20,0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky; top: 0; z-index: 5;
    }
    .topbar__crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .topbar__persona-label { color: var(--brand-300); font-weight: 600; }
    .topbar__sep { color: var(--text-muted); }
    .topbar__title { color: var(--text-primary); font-weight: 600; }

    .scope-chip {
      display: inline-flex; align-items: center; gap: 8px;
      min-height: 32px; max-width: 280px;
      padding: 0 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font: inherit; font-size: 12px; font-weight: 600;
      cursor: pointer;
    }
    .scope-chip:hover { color: var(--text-primary); border-color: var(--border-default); background: var(--bg-elevated); }
    .scope-chip__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scope-chip__caret { color: var(--text-muted); font-size: 10px; }

    .topbar__search {
      flex: 1; max-width: 480px;
      display: flex; align-items: center; gap: 8px;
      padding: 0 12px; height: 36px;
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }
    .topbar__search-icon { color: var(--text-muted); }
    .topbar__search-input {
      flex: 1; background: transparent; border: 0; outline: 0;
      color: var(--text-primary); font: inherit; font-size: 13px;
    }
    .topbar__search-input::placeholder { color: var(--text-muted); }
    .topbar__kbd {
      font-family: var(--font-mono); font-size: 10px;
      padding: 2px 6px; background: var(--bg-elevated);
      border: 1px solid var(--border-default); border-radius: 4px;
      color: var(--text-muted);
    }

    .topbar__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .icon-btn {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      color: var(--text-secondary); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      position: relative;
    }
    .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-default); }
    .icon-btn__dot {
      position: absolute; top: 8px; right: 8px;
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--danger-500); border: 2px solid var(--bg-app);
    }

    .user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 4px 10px 4px 4px; height: 36px;
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary); cursor: pointer; font: inherit;
    }
    .user-chip:hover { background: var(--bg-elevated); border-color: var(--border-default); }
    .user-chip__avatar {
      width: 28px; height: 28px; border-radius: 6px;
      background: linear-gradient(135deg, var(--accent-400), var(--accent-600));
      color: #1A1206; font-size: 11px; font-weight: 700;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .user-chip__meta { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
    .user-chip__name { font-size: 13px; font-weight: 600; }
    .user-chip__role { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .user-chip__caret { color: var(--text-muted); font-size: 10px; }

    /* ---------- Content ---------- */
    .content { padding: 28px 32px; max-width: 1480px; width: 100%; margin: 0 auto; }

    /* ---------- Menu items ---------- */
    .menu-section { padding: 8px 0; }
    .menu-section__title {
      padding: 6px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em;
      color: var(--text-muted); font-weight: 700;
    }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
    .dot--danger { background: var(--danger-500); }
    .dot--warning { background: var(--warning-500); }
    .dot--info { background: var(--info-500); }

    .persona-option { padding: 10px 16px !important; line-height: 1.3 !important; height: auto !important; }
    .persona-option__title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .persona-option__desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; max-width: 280px; white-space: normal; }

    @media (max-width: 900px) {
      .topbar__search { display: none; }
      .user-chip__meta { display: none; }
    }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);
  persona = inject(PersonaService);
  access = inject(AccessService);
  private router = inject(Router);

  collapsed = signal(false);

  toggleCollapse(): void { this.collapsed.update(v => !v); }

  switchPersona(id: PersonaId): void {
    this.persona.setActive(id);
    // Navega para a home da persona — evita o usuário ficar olhando a página
    // anterior pensando que a troca não surtiu efeito.
    const home = this.persona.all.find(p => p.id === id)?.homeRoute;
    if (home) this.router.navigateByUrl(home);
  }

  personaInitial = computed(() => this.persona.active().shortLabel.charAt(0));
  userInitials = computed(() => {
    const n = this.auth.user()?.name ?? '';
    return n.split(' ').slice(0, 2).map(s => s.charAt(0)).join('').toUpperCase() || 'U';
  });

  /** Glifo unicode usado nos itens — substituível por ícones do design system futuro. */
  iconGlyph(name: string): string {
    return ({
      home: '⌂',
      build: '✦',
      list: '≡',
      catalog: '✦',
      lineage: '⇄',
      quality: '✓',
      infra: '◫',
      git: '◴',
      shield: '◐',
      bell: '◔',
      pipeline: '⛓',
      cost: '$',
      capacity: '▦',
      kpi: '◧',
      docs: '✎',
    } as Record<string, string>)[name] ?? '•';
  }

  navGroups = computed<NavGroup[]>(() => {
    const id = this.persona.active().id;
    const groups = id === 'developer' ? this.devNav : id === 'sustaining' ? this.opsNav : this.mgrNav;
    const allowedGroups = groups
      .map(group => ({ ...group, items: group.items.filter(item => this.canSee(item)) }))
      .filter(group => group.items.length > 0);

    if (this.access.hasAny(['admin.manageAccess', 'admin.manageOrg', 'admin.viewAudit'])) {
      allowedGroups.push({
        title: 'Admin',
        items: [{ label: 'Acessos & Auditoria', icon: 'shield', route: '/admin', requiredCapabilities: ['admin.manageAccess'] }],
      });
    }
    return allowedGroups;
  });

  private canSee(item: NavItem): boolean {
    return !item.requiredCapabilities?.length || item.requiredCapabilities.some(capability => this.access.can(capability));
  }

  /* ===== Persona: Desenvolvedor ===== */
  private devNav: NavGroup[] = [
    {
      title: 'Início',
      items: [
        { label: 'Visão do Desenvolvedor', icon: 'home', route: '/dev', exact: true, requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Nova Jornada', icon: 'build', route: '/dev/journeys/new', primary: true, requiredCapabilities: ['pipeline.create'] },
      ],
    },
    {
      title: 'Meu trabalho',
      items: [
        { label: 'Meus Projetos', icon: 'list', route: '/dev/journeys', requiredCapabilities: ['dev.viewProjects'] },
      ],
    },
    {
      title: 'Conhecimento de dados',
      items: [
        { label: 'Central de Demandas', icon: 'docs', route: '/demands', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Cadastro de LUPs', icon: 'docs', route: '/lups', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Histórico de Projetos', icon: 'list', route: '/projects', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Catálogo', icon: 'catalog', route: '/catalog', requiredCapabilities: ['catalog.viewBasic'] },
        { label: 'Linhagem', icon: 'lineage', route: '/lineage', requiredCapabilities: ['lineage.view'] },
        { label: 'Qualidade', icon: 'quality', route: '/data-quality', requiredCapabilities: ['dataQuality.view'] },
      ],
    },
    {
      title: 'Operação da Plataforma',
      items: [
        { label: 'Pipelines', icon: 'pipeline', route: '/pipelines', requiredCapabilities: ['pipeline.view'] },
        { label: 'Orquestrador', icon: 'infra', route: '/orchestrator', requiredCapabilities: ['ops.viewBoard'] },
        { label: 'Custos de Execução', icon: 'cost', route: '/monitoring/costs', requiredCapabilities: ['pipeline.viewCosts'] },
      ],
    },
    {
      title: 'Utilidades',
      items: [
        { label: 'Padrões de Nomes', icon: 'catalog', route: '/term-abbreviations', requiredCapabilities: ['catalog.viewBasic'] },
      ],
    },
  ];

  /* ===== Persona: Sustentação (Bombeiro) ===== */
  private opsNav: NavGroup[] = [
    {
      title: 'Operação',
      items: [
        { label: 'Painel de Faróis', icon: 'shield', route: '/ops', exact: true, requiredCapabilities: ['ops.viewBoard'] },
        { label: 'Alertas', icon: 'bell', route: '/monitoring/alerts', badge: 3, requiredCapabilities: ['ops.viewBoard'] },
      ],
    },
    {
      title: 'Investigação',
      items: [
        { label: 'Central de Demandas', icon: 'docs', route: '/demands', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Cadastro de LUPs', icon: 'docs', route: '/lups', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Pipelines', icon: 'pipeline', route: '/pipelines', requiredCapabilities: ['pipeline.view'] },
        { label: 'Linhagem', icon: 'lineage', route: '/lineage', requiredCapabilities: ['lineage.view'] },
        { label: 'Qualidade', icon: 'quality', route: '/data-quality', requiredCapabilities: ['dataQuality.view'] },
      ],
    },
    {
      title: 'Operação da Plataforma',
      items: [
        { label: 'Orquestrador', icon: 'infra', route: '/orchestrator', requiredCapabilities: ['ops.viewBoard'] },
        { label: 'Custos de Execução', icon: 'cost', route: '/monitoring/costs', requiredCapabilities: ['pipeline.viewCosts'] },
      ],
    },
    {
      title: 'Utilidades',
      items: [
        { label: 'Padrões de Nomes', icon: 'catalog', route: '/term-abbreviations', requiredCapabilities: ['catalog.viewBasic'] },
      ],
    },
  ];

  /* ===== Persona: Gestão ===== */
  private mgrNav: NavGroup[] = [
    {
      title: 'Visão executiva',
      items: [
        { label: 'KPIs da Plataforma', icon: 'kpi', route: '/executive', exact: true, requiredCapabilities: ['executive.viewOwnScope'] },
      ],
    },
    {
      title: 'Análises',
      items: [
        { label: 'Capacidade & SLAs', icon: 'capacity', route: '/executive/capacity', requiredCapabilities: ['executive.viewOwnScope'] },
        { label: 'Catálogo', icon: 'catalog', route: '/catalog', requiredCapabilities: ['catalog.viewBasic'] },
      ],
    },
    {
      title: 'Governança',
      items: [
        { label: 'Central de Demandas', icon: 'docs', route: '/demands', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Cadastro de LUPs', icon: 'docs', route: '/lups', requiredCapabilities: ['dev.viewProjects'] },
        { label: 'Histórico de Projetos', icon: 'list', route: '/projects', requiredCapabilities: ['dev.viewProjects'] },
      ],
    },
    {
      title: 'Operação da Plataforma',
      items: [
        { label: 'Pipelines', icon: 'pipeline', route: '/pipelines', requiredCapabilities: ['pipeline.view'] },
        { label: 'Orquestrador', icon: 'infra', route: '/orchestrator', requiredCapabilities: ['ops.viewBoard'] },
        { label: 'Custos de Execução', icon: 'cost', route: '/monitoring/costs', requiredCapabilities: ['pipeline.viewCosts'] },
      ],
    },
    {
      title: 'Utilidades',
      items: [
        { label: 'Padrões de Nomes', icon: 'catalog', route: '/term-abbreviations', requiredCapabilities: ['catalog.viewBasic'] },
      ],
    },
  ];
}
