import os

base_dir = "/Users/asus/Desktop/task/docs"

files_content = {}

# --- Product Roadmap ---
files_content["product/feature-roadmap.md"] = """# Feature Roadmap & Phasing Strategy

This document outlines the strategic phasing of system features across product development stages.

## 1. Phase Overview Matrix

| Feature | Phase | Rationale & Strategic Value |
| :--- | :--- | :--- |
| **FEAT-101: User Session Authentication** | **MVP** | Core requirement; required to establish identity for RLS session context. |
| **FEAT-201: Role-Scoped Contact Directory** | **MVP** | Primary CRM entity; establishes ownership foreign keys (`sales_manager_id`, `lead_generator_id`). |
| **FEAT-202: Contact CRUD Operations** | **MVP** | Essential data management for sales leads. |
| **FEAT-301: Tasks Tracking** | **MVP** | Crucial operational entity attached to contacts. |
| **FEAT-302: Invoices & Revenue Ledger** | **MVP** | Essential entity driving financial queries in AI assistant. |
| **FEAT-304: Activity Stream & Notes** | **MVP** | Provides interaction history; essential for testing indirect prompt injection safeguards. |
| **FEAT-305: Attachment Metadata** | **MVP** | Metadata tracking for client attachments. |
| **FEAT-401: Natural Language Question Interface** | **MVP** | Primary differentiator & core deliverable of PRD. |
| **FEAT-402: Schema Context Provider** | **MVP** | Necessary for LLM SQL translation accuracy. |
| **FEAT-403: Natural Language Result Formatter** | **MVP** | Formats scalar, tabular, and card results. |
| **FEAT-501: AST SQL Validator Engine** | **MVP** | Non-negotiable security guardrail blocking non-SELECT and malicious SQL. |
| **FEAT-502: Sub-SQL Database Scoping (RLS)** | **MVP** | Non-negotiable physical DB security layer preventing data leaks. |
| **FEAT-503: Anti-Prompt Injection Data Isolation** | **MVP** | Prevents retrieved DB rows from poisoning LLM generation. |
| **FEAT-504: Anti-Enumeration Concealment** | **MVP** | Prevents existence leaks ("No matching contact found"). |
| **FEAT-601: AI Query Audit & Cost Ledger** | **MVP** | Mandated logging table tracking tokens, latency, cost, and block reasons. |
| **FEAT-102: User Lifecycle Administration** | **Phase 2** | Administrative management for user onboarding/deactivation. |
| **FEAT-303: Estimates & Quotations** | **Phase 2** | Secondary revenue entity. |
| **FEAT-602: Admin Cost & Token Dashboard** | **Phase 2** | Visual analytics view for Admins to inspect token spend over date ranges. |
| **FEAT-701: Role-Scoped CSV/Markdown Export** | **Phase 2** | Export capability for generated reports. |
| **FEAT-603: Dynamic Model Pricing Configurator** | **Phase 3** | Externalized config for dynamic token rate updates. |
| **FEAT-604: Role Budgeting & Spend Limits** | **Nice to Have** | Spending limits and soft/hard cutoffs per user. |

---

## 2. Phase Detailed Breakdown

### MVP Phase (Security & Functional Core)
* **Goal**: Deliver a functional CRM with bulletproof RLS security, natural-language-to-SQL execution, real AST validation, and single-command Docker deployment.
* **Non-Negotiables**:
  1. PostgreSQL RLS or Pre-Scoped Views physically enforcing user scope.
  2. AST parsing (`sqlglot` or `node-sql-parser`) rejecting non-SELECT, DDL, DML, multi-statements, and system catalogs.
  3. Audit log table (`ai_queries`) recording tokens, latency, cost, and block status.
  4. Rich seed dataset (Admin, 2 Managers, 2 Team Members, 10+ contacts, 20+ invoices).

### Phase 2 (Admin Capabilities & Export)
* **Goal**: Enhance administrative control and data export capabilities.
* **Features**: Admin User Management UI, Admin Token Analytics Dashboard, CSV/Markdown export engine.

### Phase 3 & Nice to Have (Enterprise Scalability)
* **Goal**: Enterprise operational controls.
* **Features**: Per-user monthly LLM spending caps, soft warnings at 80%, hard cutoffs at 100%, and multi-model dynamic pricing engines.
"""

# --- Folder Structure ---
files_content["planning/folder-structure.md"] = """# Comprehensive Folder Structure Architecture

This document defines the purpose and contents of every folder in the `docs/` repository hierarchy.

```
docs/
├── product/          # Vision, PRD analysis, feature breakdowns, and roadmaps
├── planning/         # Project architecture plans and documentation maps
├── architecture/     # System designs, technical diagrams, security flows, and design patterns
├── database/         # Schemas, ER diagrams, RLS policy definitions, and indexing strategies
├── api/              # OpenAPI specs, REST endpoints, payloads, and error contracts
├── frontend/         # Component sitemaps, page layouts, UI/UX guidelines, and state management
├── backend/          # Service layer patterns, repositories, event handlers, and LLM pipelines
├── knowledge/        # Persistent domain memory files for AI agents and developer guidance
├── implementation/   # Sprint plans, task trackers, blocker logs, and technical debt records
├── testing/          # Test strategies, security evaluation scripts, and QA test cases
├── deployment/       # Docker Compose, environment variable templates, and DevOps guides
├── progress/         # Daily progress trackers, release notes, and current task state
├── decisions/        # Architecture Decision Records (ADRs) tracking structural choices
├── prompts/          # Standardized AI prompt templates for coding agents
└── CHANGELOG.md      # Master version release history
```

## Folder Descriptions

* **`product/`**: Holds product requirements, problem statements, user persona descriptions, and feature roadmaps.
* **`planning/`**: Contains architectural execution plans, roadmap schedules, and documentation sitemaps.
* **`architecture/`**: High-level and low-level system design documents, data flow diagrams, security models, and AST validation specifications.
* **`database/`**: Single source of truth for PostgreSQL schemas, foreign key mappings, Row-Level Security (RLS) policies, and seed data definitions.
* **`api/`**: Comprehensive API contracts detailing HTTP methods, request parameters, response JSON schemas, status codes, and error payloads.
* **`frontend/`**: Architecture for Next.js pages, UI component hierarchies, dynamic query result renderers, and responsive layouts.
* **`backend/`**: Backend service specifications, repository patterns, security middleware, and natural-language-to-SQL translation pipelines.
* **`knowledge/`**: Domain knowledge bases providing operational rules, coding standards, constraints, and edge case guidelines for AI coding agents.
* **`implementation/`**: Operational project tracking, module progress, sprint goals, bug backlogs, and technical debt documentation.
* **`testing/`**: Test plan specifications, unit test definitions, security evaluation scripts (for the 10 PRD acceptance scenarios), and E2E test suites.
* **`deployment/`**: Infrastructure configuration including `docker-compose.yml`, `.env.example`, Dockerfiles, and database migration setups.
* **`progress/`**: Active state tracking for AI agents and human developers showing current task, completed tasks, and upcoming milestones.
* **`decisions/`**: Formal Architecture Decision Records (ADRs) recording context, trade-offs, and consequences of core architectural choices.
* **`prompts/`**: Reusable system prompts for AI code generation across frontend, backend, database, testing, and debugging tasks.
"""

# Write initial set of files
for path, content in files_content.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Wrote {len(files_content)} initial docs files.")
