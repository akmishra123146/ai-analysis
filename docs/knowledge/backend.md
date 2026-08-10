# Knowledge: Backend Guidelines & LLM Pipeline

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
