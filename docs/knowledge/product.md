# Knowledge: Product & Business Rules

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
