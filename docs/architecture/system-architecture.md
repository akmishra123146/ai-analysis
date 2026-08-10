# System Architecture Overview

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
