# Knowledge: Security & Anti-Leakage Architecture

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
