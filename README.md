# Data Platform - Management Console

Web application for managing and monitoring a data platform running on AWS.

## Tech Stack

- **Angular 17** with standalone components and signals
- **Angular Material** (Google Material Design)
- **TypeScript** with strict mode
- **SCSS** with custom theme
- **Lazy-loaded** feature modules

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs, service health, alerts overview, pipeline status |
| **Pipelines** | Monitor and manage ETL/ELT pipelines (Glue, Step Functions) |
| **Data Quality** | Quality rules, scores by dimension, trend analysis |
| **Data Catalog** | Asset discovery, lineage, domains, glossary (Atlan integration) |
| **Infrastructure** | Glue Jobs, Step Functions, S3, RDS, DynamoDB, IAM |
| **Monitoring** | Alerts management, cost explorer by AWS service |

## Architecture

```
src/app/
├── core/           # Models, services, interceptors, guards, mocks
├── shared/         # Reusable components, pipes, directives
├── layout/         # App shell (sidenav, toolbar)
└── features/       # Lazy-loaded feature modules
    ├── dashboard/
    ├── pipelines/
    ├── data-quality/
    ├── catalog/
    ├── infrastructure/
    └── monitoring/
```

## Getting Started

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`.

## Mock Mode

The app runs with mock data by default (`environment.mockApi = true`), enabling full local development without backend services.
