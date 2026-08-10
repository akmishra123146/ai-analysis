# Backend Services & Layered Architecture

* `AuthService`: Password hashing, token signing.
* `ContactService`: Role-scoped contact operations.
* `AIService`: Schema prompt assembly, LLM translation API calls.
* `ASTValidatorService`: SQL AST validation using `sqlglot` / `node-sql-parser`.
* `DatabaseService`: RLS transaction execution wrapper.
* `AuditLoggerService`: Writing log rows to `ai_queries`.
