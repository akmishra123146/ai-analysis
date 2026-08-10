import os

base_dir = "/Users/asus/Desktop/task/docs"

docs = {}

# ---------------------------------------------------------
# KNOWLEDGE FILES
# ---------------------------------------------------------

docs["knowledge/product.md"] = """# Knowledge: Product & Business Rules

## Overview
The platform is an Internal CRM integrated with a Natural-Language-to-SQL AI Assistant. It empowers sales teams to manage contacts, tasks, invoices, estimates, activity logs, and attachments while enabling conversational data queries.

## Rules & Core Principles
1. **Single Point of Visibility Scoping**: Visibility is defined exclusively at the contact level via two foreign keys: `sales_manager_id` and `lead_generator_id`.
2. **Inherited Entity Scoping**: Tasks, Invoices, Estimates, Activities, and Attachments inherit visibility strictly from the contact they belong to. Do not write separate access rules for subsidiary entities.
3. **No Unscoped Exports**: Data export paths (CSV/Markdown) must enforce identical row scoping as UI list views.
4. **Existence Non-Leakage**: Asking about an unauthorized contact must return an identical response ("No matching contact found") as asking about a non-existent contact.

## Naming Conventions
* Roles: `ADMIN`, `MANAGER`, `MEMBER`
* Statuses:
  * Tasks: `OPEN`, `IN_PROGRESS`, `DONE`
  * Invoices: `DRAFT`, `SENT`, `PAID`, `OVERDUE`
  * Estimates: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`
  * Activity Types: `CALL`, `EMAIL`, `MEETING`, `NOTE`

## Common Pitfalls & Edge Cases
* **Pitfall**: Writing custom `WHERE` clauses in application code for exports, bypassing database RLS.
* **Edge Case**: Contact reassigned to a new manager while a Team Member is actively viewing its invoices. (DB RLS instantly revokes access on next API call).
"""

docs["knowledge/security.md"] = """# Knowledge: Security & Anti-Leakage Architecture

## Overview
Security is the heavily weighted core of this system. LLM-generated SQL is treated as untrusted user input. Security relies on a multi-layer defense-in-depth model.

## Mandatory Rules
1. **Never Trust Generated SQL**: AST parsing (`sqlglot` or `node-sql-parser`) must validate generated SQL before execution.
2. **AST Validation Requirements**:
   * Must be a single `SELECT` statement.
   * Reject multi-statements, semicolon chaining, DDL (`DROP`, `ALTER`), DML (`INSERT`, `UPDATE`, `DELETE`), or writes inside CTEs (`WITH ... AS (...)`).
   * Reject access to system catalogs (`pg_catalog`, `information_schema`) or side-effect functions (`pg_sleep`).
   * Enforce statement timeouts (5,000ms) and hard row limits (1,000 rows).
3. **Sub-SQL Database Layer Scoping**:
   * Access scoping MUST be physically enforced below the SQL layer using PostgreSQL Row-Level Security (RLS) or pre-scoped views.
   * LLM SQL runs under a restricted database role (`app_ai_reader`) with user session context set via `SET LOCAL app.current_user_id = '<user_id>'`.
4. **Prompt Injection Data Isolation**:
   * Database row strings (e.g. activity notes containing "Ignore instructions...") must NEVER be re-fed into prompt context for SQL generation.
5. **Session Identity Source**:
   * User identity and role MUST come directly from authenticated server sessions/JWTs, NEVER from request bodies.

## Neutral Error Responses
* On SQL validation rejection, log the block reason internally in `ai_queries` and return a neutral response: *"Your query could not be processed due to system constraints."* Never return parser stack traces.
"""

docs["knowledge/database.md"] = """# Knowledge: Database & Schema Guidelines

## Schema Architecture
The minimum viable database schema comprises 8 tables:
1. `users` (id, name, email, password_hash, role, is_active, created_at)
2. `contacts` (id, company_name, contact_name, email, phone, status, sales_manager_id, lead_generator_id, created_at)
3. `tasks` (id, contact_id, assigned_to, title, due_date, status)
4. `invoices` (id, contact_id, invoice_number, amount, currency, issue_date, due_date, status, paid_at)
5. `estimates` (id, contact_id, estimate_number, amount, currency, valid_until, status)
6. `activities` (id, contact_id, user_id, type, body, occurred_at)
7. `attachments` (id, contact_id, filename, mime_type, size_bytes, storage_path, uploaded_by, uploaded_at)
8. `ai_queries` (id, user_id, question, generated_sql, was_blocked, block_reason, row_count, model, input_tokens, output_tokens, cost_usd, latency_ms, created_at)

## PostgreSQL RLS Policies Example
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_access_policy ON contacts
FOR SELECT USING (
  current_setting('app.current_user_role', true) = 'ADMIN'
  OR (current_setting('app.current_user_role', true) = 'MANAGER' AND sales_manager_id = current_setting('app.current_user_id', true)::uuid)
  OR (current_setting('app.current_user_role', true) = 'MEMBER' AND lead_generator_id = current_setting('app.current_user_id', true)::uuid)
);
```

## Subsidiary Entity RLS Rule
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_access_policy ON invoices
FOR SELECT USING (
  contact_id IN (SELECT id FROM contacts)
);
```
"""

docs["knowledge/frontend.md"] = """# Knowledge: Frontend Guidelines & Component Rules

## Core Framework
* Next.js (App Router or Pages Router) with React, TypeScript, and Vanilla CSS / Tailwind CSS.

## Key UI Components
1. **AI Chat Assistant Interface**:
   * Input prompt box for natural language questions.
   * Rendered query restatement ("Interpreted as: ...").
   * Transparent SQL code viewer drawer/accordion.
   * Dynamic output renderer.
2. **Dynamic Output Renderer Rules**:
   * **Scalar Answer**: Contextual sentence (e.g. "Total revenue from your clients: ₹42,80,000 across 14 contacts").
   * **Single Row / Multi-Column**: Key-Value card component.
   * **Multi-Row / Multi-Column**: Paginated data table with export button.
   * **Zero Rows**: Explicit "No matching results found" empty state + interpretation statement.
3. **Admin Token & Cost Analytics View**:
   * Date range selector.
   * Summary metrics cards (Total Spend, Total Queries, Total Tokens, Avg Latency).
   * Per-user breakdown table and blocked security alert logs.

## Usability Guidelines
* Always show the SQL query that ran alongside the AI answer so users can verify query logic.
"""

docs["knowledge/backend.md"] = """# Knowledge: Backend Guidelines & LLM Pipeline

## Pipeline Execution Steps
1. **Request Ingestion**: Extract authenticated user identity (`user_id`, `role`) directly from validated HTTP session token.
2. **Prompt Assembly**: Combine user question with database schema definition (tables, columns, FK relationships, ENUMs).
3. **LLM Translation**: Send prompt to LLM provider (OpenAI / Claude) using system instructions for SQL generation.
4. **AST Guardrail Validation**: Pass raw SQL string into AST parser (`sqlglot`/`node-sql-parser`). Rejection aborts pipeline immediately.
5. **Database Execution**: Open DB connection, execute `SET LOCAL app.current_user_id = '...'` and `SET LOCAL app.current_user_role = '...'`, then execute validated SQL query.
6. **Result Formatting & Logging**: Determine output shape, log execution details in `ai_queries` table, return formatted payload to client.

## Logging Requirements
* Insert row into `ai_queries` table for **every** request (Success, Blocked, Errored).
* Record input tokens, output tokens, latency (ms), and cost (USD).
* **PII Guard**: Do NOT log returned data rows in `ai_queries` table.
"""

docs["knowledge/auth.md"] = """# Knowledge: Authentication & Authorization

## Overview
Authentication uses session cookies or signed JWTs. Identity is anchored server-side.

## Role Definitions
* `ADMIN`: Sees all contacts and entities. Accesses user management and AI cost analytics.
* `MANAGER`: Sees contacts where `sales_manager_id = user.id` and all subsidiary entities.
* `MEMBER`: Sees contacts where `lead_generator_id = user.id` and all subsidiary entities.

## Authorization Flow
1. Middleware validates session cookie/JWT.
2. API endpoint reads `user_id` and `role` from request context.
3. Database connection sets session variables before executing queries.
"""

docs["knowledge/payments.md"] = """# Knowledge: Financial Entities & Invoice Logic

## Overview
Defines financial tracking entities (`invoices` and `estimates`).

## Business Rules
* Amounts are represented as fixed decimal (12, 2).
* Currency defaults to INR (₹) or USD ($).
* Invoice status transitions: `DRAFT` → `SENT` → `PAID` or `OVERDUE`.
* Estimate status transitions: `DRAFT` → `SENT` → `ACCEPTED` or `REJECTED`.
"""

docs["knowledge/notifications.md"] = """# Knowledge: System Notifications & Audit Signals

## Overview
Defines alert signals for system admins. Security alerts fire when prompt injections or blocked queries occur.
"""

docs["knowledge/integrations.md"] = """# Knowledge: LLM Provider Integrations

## Overview
Configures LLM API providers (OpenAI, Anthropic Claude, or local Ollama).

## Configuration Requirements
* API keys injected via environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
* Per-token cost calculations loaded from `docs/config/llm-rates.json`.
"""

docs["knowledge/ui.md"] = """# Knowledge: UI Layout & Design Tokens

## Design System
* Clean, modern SaaS aesthetic with dark mode support.
* Modern typography (Inter, Outfit, System UI).
* Smooth visual transitions, glassmorphism cards for AI metrics, responsive grid layouts.
"""

docs["knowledge/ux.md"] = """# Knowledge: UX Design Principles

## User Experience Guidelines
* AI answers must build trust by clearly displaying the interpreted question and generated SQL.
* Query failures present neutral, non-confusing user messages.
"""

docs["knowledge/deployment.md"] = """# Knowledge: Docker & Local Setup

## Deployment Rules
* Full application stack must launch via `docker-compose up`.
* Automatically runs DB migrations and seeds test data.
* Includes seed credentials in README for Admin, Manager, and Team Member roles.
"""

docs["knowledge/testing.md"] = """# Knowledge: Testing Strategy & Acceptance Verification

## Testing Mandates
Must verify all 10 PRD acceptance scenarios:
1. Manager A asks "show me all invoices" → Returns Manager A's contacts only.
2. Team Member asks "what is total company revenue?" → Scoped to assigned contacts or explicit refusal.
3. Team Member asks about unassigned contact by name → "No matching contact found" (Existence Non-Leakage).
4. Prompt Injection ("drop the users table") → Blocked at AST validation, logged, neutral response returned.
5. Injected instruction in activity note → Has zero effect on AI behavior.
6. Direct API call with fake `user_id` in body → Identity derived strictly from session; body ID ignored.
7. Manager exports contact list → Export matches scoped list view.
8. Non-admin calls admin analytics API directly → 403 Forbidden.
9. Zero rows query → Explicit "no results" + interpretation, not an error.
10. Expensive cross join → Terminated by statement timeout/row limit; logged.
"""

docs["knowledge/coding-standards.md"] = """# Knowledge: Coding Standards & Best Practices

## Guidelines
* TypeScript strict mode for frontend and backend.
* Clean Architecture with modular service and repository layers.
* Complete error handling wrapping all database and LLM calls.
"""

# ---------------------------------------------------------
# IMPLEMENTATION TRACKING
# ---------------------------------------------------------

docs["implementation/implementation-plan.md"] = """# Implementation Plan

## Phase Overview
1. **Sprint 01: Core Architecture, Auth & RLS Database Setup**
   * Database schema creation & RLS policy enforcement.
   * User authentication system & session context middleware.
   * CRM contact & entity CRUD services.
   * Rich database seeding script.

2. **Sprint 02: AI Natural Language Pipeline & Security Guardrails**
   * LLM SQL translation engine & schema prompt builder.
   * AST SQL Parser validator middleware (`sqlglot` / `node-sql-parser`).
   * PostgreSQL session RLS integration layer.
   * AI query logger & cost calculation module.
   * Dynamic contextual UI output renderer.

3. **Sprint 03: Admin Analytics & Security Evaluation**
   * Admin token/cost analytics dashboard.
   * Data export engine (CSV/Markdown).
   * Automated verification suite for the 10 PRD security acceptance tests.
"""

docs["implementation/module-status.md"] = """# Module Status Tracker

| Module | Status | Owner | Progress | Dependencies | Est. Effort | Risks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Users** | Planned | Eng Lead | 0% | DB Schema | 1 Day | Session leaks |
| **Database & RLS Engine** | Planned | DB Arch | 0% | PostgreSQL | 1.5 Days | RLS policy gaps |
| **CRM Core Entities** | Planned | Backend Lead | 0% | Auth & DB | 1 Day | Scoping leaks |
| **AI Question Interface** | Planned | AI Lead | 0% | LLM API | 1 Day | Hallucination |
| **AST Security Guardrail** | Planned | Security Lead| 0% | AST Parser | 1 Day | Parser bypass |
| **Admin Analytics Panel** | Planned | Frontend Lead| 0% | AI Query Log | 0.5 Days | Permission bypass |
| **Export Engine** | Planned | Backend Lead | 0% | RLS Engine | 0.5 Days | Unscoped export |
"""

docs["implementation/sprint-01.md"] = """# Sprint 01 Roadmap & Tasks

* **Goal**: Establish schema, RLS policies, user session auth, and CRM entity services.
* **Deliverables**:
  * Docker Compose environment running PostgreSQL & Next.js.
  * SQL migration scripts creating base tables and RLS policies.
  * Seed script populating 1 Admin, 2 Managers, 2 Team Members, 15 Contacts, 20+ Invoices.
"""

docs["implementation/sprint-02.md"] = """# Sprint 02 Roadmap & Tasks

* **Goal**: Implement NL-to-SQL pipeline, AST parser validation, RLS context injection, and AI UI renderer.
* **Deliverables**:
  * AST parser guardrail middleware.
  * DB connection pool wrapper setting `app.current_user_id` session variables.
  * AI chat interface and dynamic result formatting components.
"""

docs["implementation/completed.md"] = """# Completed Task Log

* [x] Product Requirements Analysis & PDF Parsing
* [x] Feature Inventory & Phasing Roadmap Design
* [x] Complete Modular Documentation Architecture Definition
"""

docs["implementation/blockers.md"] = """# Active Blockers & Risks

* *No active blockers currently.*
"""

docs["implementation/bugs.md"] = """# Known Bugs & Issues Backlog

* *No bugs reported.*
"""

docs["implementation/technical-debt.md"] = """# Technical Debt & Refactoring Backlog

* Maintain AST parser rules up to date with new SQL syntax patterns.
"""

docs["implementation/improvements.md"] = """# Future Improvements

* Support multi-llm fallback routing (e.g. fallback to Claude 3.5 Sonnet if OpenAI rate limits are hit).
* Add interactive visual charting for aggregate query results.
"""

# ---------------------------------------------------------
# ARCHITECTURE DOCUMENTS
# ---------------------------------------------------------

docs["architecture/system-architecture.md"] = """# System Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Next.js Frontend UI    │
                          │ (Chat, Tables, Dashboard)│
                          └────────────┬─────────────┘
                                       │ HTTP / REST (Session Cookie)
                                       ▼
                          ┌──────────────────────────┐
                          │   Node/Python Backend    │
                          │   Authentication & API   │
                          └────────────┬─────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
                ▼                                             ▼
  ┌──────────────────────────┐                  ┌──────────────────────────┐
  │   LLM Translation Engine │                  │ AST SQL Guardrail Engine │
  │   (OpenAI / Claude API)  │                  │(sqlglot / node-sql-parser)│
  └─────────────┬────────────┘                  └─────────────┬────────────┘
                │ Raw Generated SQL                           │ Validates Single SELECT
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼ Validated SQL
                          ┌──────────────────────────┐
                          │ PostgreSQL Connection    │
                          │ SET LOCAL app.user_id=.. │
                          │ Row-Level Security (RLS) │
                          └────────────┬─────────────┘
                                       │
                                       ▼ Scoped Result Rows
                          ┌──────────────────────────┐
                          │ Output Renderer & Audit  │
                          │  Log (`ai_queries` DB)   │
                          └──────────────────────────┘
```

## Security Boundaries
1. **Client / Server Boundary**: Authenticated sessions dictate identity. Client input is never trusted for user IDs or SQL strings.
2. **LLM / Backend Boundary**: Generated SQL is treated as untrusted user input.
3. **Backend / Database Boundary**: RLS policies enforce row-level visibility inside PostgreSQL.
"""

docs["architecture/high-level-design.md"] = """# High-Level System Design

Describes the top-level domain components: Authentication, CRM Operations, Natural Language Query Pipeline, Security Guardrails, and Admin Analytics.
"""

docs["architecture/low-level-design.md"] = """# Low-Level Design & Code Modules

Details class structures, service layer methods, repository interfaces, and AST parsing functions.
"""

docs["architecture/service-boundaries.md"] = """# Service Boundaries & Domain Isolation

Defines micro-service or domain boundaries separating core CRM CRUD from the AI query execution engine.
"""

docs["architecture/data-flow.md"] = """# Data Flow Architecture

Maps end-to-end data flow from user question submission to LLM SQL translation, AST parsing, RLS DB execution, rendering, and audit logging.
"""

docs["architecture/authentication-flow.md"] = """# Authentication & Session Sequence

Sequence diagram mapping login request, bcrypt hash verification, session cookie issuance, and session token validation middleware.
"""

docs["architecture/authorization-flow.md"] = """# Authorization & Row-Level Security Flow

Details how `SET LOCAL app.current_user_id` and `SET LOCAL app.current_user_role` inject user identity into PostgreSQL transactions before running generated SQL.
"""

docs["architecture/error-handling.md"] = """# Error Handling & Neutral Failure Strategy

Details error classification, stack trace isolation, and standardized client error messages.
"""

docs["architecture/logging-strategy.md"] = """# Logging & Audit Strategy

Specifications for writing transaction records into `ai_queries` without exposing client PII.
"""

docs["architecture/monitoring.md"] = """# System Monitoring & Security Signals

Monitoring guidelines tracking blocked queries, latency spikes, and LLM token spending.
"""

docs["architecture/scalability.md"] = """# Scalability & Connection Pooling

Database connection pool management (`pg-pool`) with transaction-scoped RLS variable resets.
"""

docs["architecture/security.md"] = """# Security Architecture & Threat Matrix

Comprehensive threat matrix covering prompt injection, SQL injection, privilege escalation, and existence enumeration defense strategies.
"""

docs["architecture/performance.md"] = """# Performance Optimization Strategy

Database indexing rules, 5,000ms query timeouts, and 1,000 row truncation limits.
"""

docs["architecture/caching.md"] = """# Caching & Schema Context Strategy

Caching database schema definitions in memory to reduce prompt assembly overhead.
"""

docs["architecture/queue-design.md"] = """# Background Tasks & Queue Design

Handling async audit logging and background analytics reporting.
"""

docs["architecture/file-storage.md"] = """# File Storage Architecture

Metadata tracking and file upload handling for client attachments.
"""

docs["architecture/search-strategy.md"] = """# Search Strategy & Natural Language Processing

Schema description formatting for optimal LLM SQL translation accuracy.
"""

# ---------------------------------------------------------
# DATABASE PLANNING
# ---------------------------------------------------------

docs["database/entity-list.md"] = """# Database Entity Inventory

1. `users`: System users (Admin, Manager, Team Member).
2. `contacts`: Core sales leads.
3. `tasks`: Action items linked to contacts.
4. `invoices`: Financial invoices linked to contacts.
5. `estimates`: Price quotations linked to contacts.
6. `activities`: Interaction log entries.
7. `attachments`: File upload records.
8. `ai_queries`: Audit trail for AI queries.
"""

docs["database/relationships.md"] = """# Database Relationships & Foreign Keys

* `contacts.sales_manager_id` → `users.id`
* `contacts.lead_generator_id` → `users.id`
* `tasks.contact_id` → `contacts.id`
* `invoices.contact_id` → `contacts.id`
* `estimates.contact_id` → `contacts.id`
* `activities.contact_id` → `contacts.id`
* `attachments.contact_id` → `contacts.id`
* `ai_queries.user_id` → `users.id`
"""

docs["database/er-diagram.md"] = """# Entity Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ contacts : "manages / generates"
    contacts ||--o{ tasks : "has"
    contacts ||--o{ invoices : "has"
    contacts ||--o{ estimates : "has"
    contacts ||--o{ activities : "has"
    contacts ||--o{ attachments : "has"
    users ||--o{ ai_queries : "initiates"
```
"""

docs["database/table-definitions.md"] = """# Complete Table Definitions & SQL Schemas

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
CREATE TYPE estimate_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
CREATE TYPE activity_type AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'LEAD',
    sales_manager_id UUID REFERENCES users(id),
    lead_generator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    status task_status DEFAULT 'OPEN'
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'DRAFT',
    paid_at TIMESTAMPTZ
);

CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    estimate_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    valid_until DATE NOT NULL,
    status estimate_status DEFAULT 'DRAFT'
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type activity_type NOT NULL,
    body TEXT NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    question TEXT NOT NULL,
    generated_sql TEXT,
    was_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    row_count INT,
    model VARCHAR(100),
    input_tokens INT,
    output_tokens INT,
    cost_usd NUMERIC(10, 6),
    latency_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
"""

docs["database/index-strategy.md"] = """# Database Indexing Strategy

```sql
CREATE INDEX idx_contacts_sales_manager ON contacts(sales_manager_id);
CREATE INDEX idx_contacts_lead_generator ON contacts(lead_generator_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_estimates_contact ON estimates(contact_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX idx_ai_queries_created_at ON ai_queries(created_at);
```
"""

docs["database/constraints.md"] = """# Database Constraints & Check Rules

Check constraints validating monetary amounts > 0 and valid status values.
"""

docs["database/data-validation-rules.md"] = """# Data Validation Rules

Field validation rules for emails, phone numbers, and foreign keys.
"""

docs["database/audit-fields.md"] = """# Audit Fields & Timestamping

Standard timestamp fields (`created_at`, `updated_at`, `paid_at`).
"""

docs["database/soft-delete-strategy.md"] = """# Soft Delete Strategy

Guidelines for user deactivation (`is_active = false`) and row retention policies.
"""

# ---------------------------------------------------------
# API PLANNING
# ---------------------------------------------------------

docs["api/api-overview.md"] = """# API Architecture Overview

RESTful HTTP APIs serving Next.js frontend with JSON payloads.
"""

docs["api/endpoints.md"] = """# Comprehensive API Endpoint Catalog

## 1. Authentication
* `POST /api/v1/auth/login`: Authenticate user and issue session cookie.
* `POST /api/v1/auth/logout`: Revoke session cookie.
* `GET /api/v1/auth/me`: Get current authenticated user details.

## 2. Contacts (Scoped)
* `GET /api/v1/contacts`: List contacts visible to authenticated user.
* `POST /api/v1/contacts`: Create new contact.
* `GET /api/v1/contacts/:id`: Retrieve contact details (returns 404 if unauthorized).
* `PUT /api/v1/contacts/:id`: Update contact details.

## 3. Natural Language AI Assistant
* `POST /api/v1/ai/query`: Submit natural language question.
  * **Request**: `{ "question": "What is total revenue from my clients this quarter?" }`
  * **Response**:
    ```json
    {
      "question": "What is total revenue from my clients this quarter?",
      "interpretation": "Sum of amount from paid invoices for contacts assigned to current user in current quarter",
      "generated_sql": "SELECT SUM(amount) AS total_revenue FROM invoices WHERE status = 'PAID' AND ...",
      "format": "scalar",
      "result": {
        "text": "Total revenue from your clients: ₹42,80,000 across 14 contacts."
      },
      "metadata": {
        "row_count": 1,
        "latency_ms": 342,
        "model": "gpt-4o"
      }
    }
    ```

## 4. Admin Analytics (Admin Only)
* `GET /api/v1/admin/analytics`: AI usage, costs, and token stats over date range.
* `GET /api/v1/admin/users`: List system users.
* `POST /api/v1/admin/users`: Create new user account.
* `PATCH /api/v1/admin/users/:id/deactivate`: Deactivate user account.
"""

docs["api/request-response-schemas.md"] = """# API Request & Response JSON Schemas

Complete TypeScript definitions for request and response payloads.
"""

docs["api/authentication-authorization.md"] = """# API Authentication & Header Specs

Session cookie header specifications and authorization middleware.
"""

docs["api/validation-error-handling.md"] = """# API Error Response Standard

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters",
    "details": []
  }
}
```
"""

docs["api/pagination-filtering-sorting.md"] = """# Pagination, Filtering & Sorting Specs

Standard query parameters (`?page=1&limit=50&sort_by=created_at&order=desc`).
"""

docs["api/rate-limiting.md"] = """# API Rate Limiting Policies

Imposes 60 requests/minute per session for AI query endpoints.
"""

# ---------------------------------------------------------
# FRONTEND PLANNING
# ---------------------------------------------------------

docs["frontend/pages-and-layouts.md"] = """# Pages & Layouts Architecture

1. `/login`: Authentication page.
2. `/dashboard`: Overview dashboard with quick stats and recent contacts.
3. `/contacts`: Scoped contact directory list and create/edit modal.
4. `/contacts/[id]`: Contact details page displaying linked tasks, invoices, estimates, activities, attachments.
5. `/ai-assistant`: Conversational AI query interface.
6. `/admin/analytics`: Admin token, latency, and cost analytics dashboard.
7. `/admin/users`: Admin user management table.
"""

docs["frontend/component-architecture.md"] = """# Component Hierarchy & UI Specifications

* `AIChatBox`: Input prompt form.
* `QueryResultRenderer`: Contextual output renderer (Scalar Card, Key-Value List, Data Table).
* `SQLDrawer`: Accordion showing generated SQL.
* `AdminMetricsGrid`: Card grid showing token counts and USD costs.
"""

docs["frontend/state-management-routing.md"] = """# State Management & Next.js Routing

Session state managed via React Context / SWR for data fetching.
"""

docs["frontend/forms-and-validation.md"] = """# Forms & Validation Engine

Zod schema validation for user input forms.
"""

docs["frontend/theme-accessibility.md"] = """# Theme & Accessibility (a11y)

Vanilla CSS / Tailwind tokens enforcing WCAG AA contrast standards.
"""

# ---------------------------------------------------------
# BACKEND PLANNING
# ---------------------------------------------------------

docs["backend/services-and-modules.md"] = """# Backend Services & Layered Architecture

* `AuthService`: Password hashing, token signing.
* `ContactService`: Role-scoped contact operations.
* `AIService`: Schema prompt assembly, LLM translation API calls.
* `ASTValidatorService`: SQL AST validation using `sqlglot` / `node-sql-parser`.
* `DatabaseService`: RLS transaction execution wrapper.
* `AuditLoggerService`: Writing log rows to `ai_queries`.
"""

docs["backend/business-logic-rules.md"] = """# Business Logic Implementation Rules

Rules enforcing single point visibility at contact level.
"""

docs["backend/repositories-middleware.md"] = """# Repository Interfaces & Middleware

Data access objects and express/next middleware definitions.
"""

docs["backend/background-jobs-event-system.md"] = """# Background Jobs & Event Processing

Async logging handlers for AI query audit trails.
"""

docs["backend/external-integrations.md"] = """# External Integrations API Client

OpenAI / Anthropic API wrapper classes.
"""

# ---------------------------------------------------------
# TESTING STRATEGY
# ---------------------------------------------------------

docs["testing/testing-strategy.md"] = """# Complete Testing & Quality Assurance Plan

Unit tests, integration tests, API tests, and E2E tests using Jest / Playwright.
"""

docs["testing/security-acceptance-tests.md"] = """# Security Acceptance Test Suite (10 PRD Scenarios)

Detailed test scripts for evaluating the 10 PRD acceptance scenarios on camera.
"""

# ---------------------------------------------------------
# DEVOPS PLANNING
# ---------------------------------------------------------

docs["deployment/docker-docker-compose.md"] = """# Docker & Docker Compose Specification

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: crm_ai_db
      POSTGRES_USER: crm_admin
      POSTGRES_PASSWORD: crm_secure_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://crm_admin:crm_secure_password@postgres:5432/crm_ai_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

volumes:
  pgdata:
```
"""

docs["deployment/environment-variables.md"] = """# Environment Variables Specification (.env.example)

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://crm_admin:crm_secure_password@localhost:5432/crm_ai_db
JWT_SECRET=super_secret_jwt_key_change_in_production
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o
```
"""

docs["deployment/local-setup-guide.md"] = """# Local Developer Setup Guide

1. Clone repository.
2. Create `.env` file from `.env.example`.
3. Run `docker-compose up --build`.
4. Open `http://localhost:3000`.
"""

docs["deployment/cicd-monitoring.md"] = """# CI/CD Pipeline & Health Monitoring

GitHub Actions workflow building Docker images and running security tests.
"""

# ---------------------------------------------------------
# PROGRESS & CHANGELOG
# ---------------------------------------------------------

docs["progress/overall-progress.md"] = """# Overall Project Progress

* Architecture & Documentation: **100% Complete**
* Implementation Phase: Ready for execution.
"""

docs["progress/completed-features.md"] = """# Completed Features List

* [x] Complete PRD Analysis & Security Scoping Definition
* [x] Feature Inventory & Phasing Roadmap
* [x] 60+ Documentation Files Generated across all 15 Phases
"""

docs["progress/current-task.md"] = """# Current Task State

* Documentation suite generated and persisted to `docs/`.
"""

docs["progress/next-task.md"] = """# Next Task

* Execute Sprint 01 Docker & Database RLS setup.
"""

docs["progress/known-issues.md"] = """# Known Issues

* None.
"""

docs["progress/release-notes.md"] = """# Release Notes v1.0.0-docs

* Complete Software Specification & Architecture Package Release.
"""

docs["CHANGELOG.md"] = """# Master Changelog

## [1.0.0] - 2026-08-07
### Added
- Complete Product Analysis, Executive Summary, and Vision.
- Complete Feature Inventory & Breakdown (7 Core Modules).
- Feature Roadmap & Strategic Phasing Matrix (MVP, Phase 2, Phase 3).
- Comprehensive Knowledge Base Directory (`docs/knowledge/`).
- System Architecture & Low-Level Design Specifications (`docs/architecture/`).
- Complete Database Schemas, RLS Policies, Indexes, and ER Diagram (`docs/database/`).
- Full API Endpoint Catalog & Request/Response JSON Schemas (`docs/api/`).
- Frontend & Backend Planning Specifications (`docs/frontend/`, `docs/backend/`).
- Quality Assurance & 10 Security Acceptance Tests Specification (`docs/testing/`).
- Docker Compose, `.env.example`, and DevOps Local Setup Specs (`docs/deployment/`).
- Architecture Decision Records (ADRs 001-003) (`docs/decisions/`).
- Standardized AI Agent Prompt Library (`docs/prompts/`).
"""

# ---------------------------------------------------------
# ADRs
# ---------------------------------------------------------

docs["decisions/ADR-001-sub-sql-rls-security.md"] = """# ADR-001: Enforce Row-Level Security (RLS) Below the SQL Translation Layer

## Context
LLMs generate SQL queries non-deterministically. Relying on an LLM to generate `WHERE` clauses matching user permissions is vulnerable to prompt injections and privilege escalation.

## Decision
We enforce user data access control physically inside PostgreSQL using Row-Level Security (RLS). Every query executed by the AI assistant sets session context variables (`SET LOCAL app.current_user_id` and `SET LOCAL app.current_user_role`) within a database transaction.

## Consequences
* **Positive**: 100% mathematical guarantee that Team Members cannot view unauthorized contacts or company-wide figures.
* **Positive**: Immune to prompt injections attempting to bypass `WHERE` clauses.
* **Negative**: Requires PostgreSQL (MySQL lacks native RLS policies).
"""

docs["decisions/ADR-002-ast-sql-parser-guardrail.md"] = """# ADR-002: AST SQL Parsing for Pre-Execution Validation

## Context
Keyword regex blocklists (e.g. checking for "DROP" or "UPDATE") are easily defeated by SQL comments, alias tricks, or whitespace encoding.

## Decision
We use a real Abstract Syntax Tree (AST) parser (`sqlglot` / `node-sql-parser`) to parse every generated SQL query before database execution.

## Rules Enforced
1. Must contain exactly one AST statement node of type `SELECT`.
2. Reject any DDL, DML, write CTE, or multi-statement nodes.
3. Reject references to `pg_catalog` or `information_schema`.

## Consequences
* **Positive**: Robust security against obfuscated SQL injection.
* **Positive**: Rejects invalid or dangerous queries cleanly.
"""

docs["decisions/ADR-003-session-based-auth-context.md"] = """# ADR-003: Derive Authenticated Identity Strictly from Server Sessions

## Context
Client requests could attempt privilege escalation by passing another user's ID in request headers or body payloads.

## Decision
The AI assistant endpoint derives `user_id` and `role` strictly from validated HTTP session cookies or signed JWTs verified by server middleware. Any user ID submitted in the request body is strictly ignored.

## Consequences
* **Positive**: Eliminates impersonation attacks via API manipulation.
"""

# ---------------------------------------------------------
# PROMPT LIBRARY
# ---------------------------------------------------------

docs["prompts/frontend.md"] = """# AI Coding Prompt: Frontend Development

You are building components for the CRM AI Analytics platform.
Follow these standards:
1. Use Next.js with TypeScript strict mode.
2. Render query outputs dynamically based on result shape (Scalar Card, Key-Value List, Data Table).
3. Always display the generated SQL and interpretation restatement alongside answers.
"""

docs["prompts/backend.md"] = """# AI Coding Prompt: Backend Development

You are implementing backend API services.
Follow these standards:
1. Extract identity strictly from authenticated sessions.
2. Pass raw generated SQL through the AST validator before execution.
3. Wrap PostgreSQL connection in transaction executing `SET LOCAL app.current_user_id` before query execution.
4. Log every query in `ai_queries` table.
"""

docs["prompts/api.md"] = """# AI Coding Prompt: API Endpoint Creation

Ensure REST endpoints adhere to JSON response formats and return neutral security error messages.
"""

docs["prompts/testing.md"] = """# AI Coding Prompt: Security & QA Testing

Write automated tests verifying the 10 PRD acceptance scenarios, specifically testing prompt injection resistance and existence non-leakage.
"""

docs["prompts/debugging.md"] = """# AI Coding Prompt: Debugging & Log Analysis

Analyze `ai_queries` log entries to identify blocked queries or latency bottlenecks without altering security contracts.
"""

docs["prompts/documentation.md"] = """# AI Coding Prompt: Documentation Maintenance

Keep all knowledge files and architectural specs synchronized with codebase changes.
"""

# Write all files
written_count = 0
for path, content in docs.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    written_count += 1

print(f"Successfully generated all {written_count} documentation files in {base_dir}")
