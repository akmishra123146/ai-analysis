# Database Indexing Strategy

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
