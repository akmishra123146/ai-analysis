# Knowledge: Database & Schema Guidelines

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
