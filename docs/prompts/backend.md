# AI Coding Prompt: Backend Development

You are implementing backend API services.
Follow these standards:
1. Extract identity strictly from authenticated sessions.
2. Pass raw generated SQL through the AST validator before execution.
3. Wrap PostgreSQL connection in transaction executing `SET LOCAL app.current_user_id` before query execution.
4. Log every query in `ai_queries` table.
