# Knowledge: Frontend Guidelines & Component Rules

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
