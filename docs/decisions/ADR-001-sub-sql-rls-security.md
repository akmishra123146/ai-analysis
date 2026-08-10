# ADR-001: Enforce Row-Level Security (RLS) Below the SQL Translation Layer

## Context
LLMs generate SQL queries non-deterministically. Relying on an LLM to generate `WHERE` clauses matching user permissions is vulnerable to prompt injections and privilege escalation.

## Decision
We enforce user data access control physically inside PostgreSQL using Row-Level Security (RLS). Every query executed by the AI assistant sets session context variables (`SET LOCAL app.current_user_id` and `SET LOCAL app.current_user_role`) within a database transaction.

## Consequences
* **Positive**: 100% mathematical guarantee that Team Members cannot view unauthorized contacts or company-wide figures.
* **Positive**: Immune to prompt injections attempting to bypass `WHERE` clauses.
* **Negative**: Requires PostgreSQL (MySQL lacks native RLS policies).
