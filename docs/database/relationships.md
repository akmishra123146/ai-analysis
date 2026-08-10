# Database Relationships & Foreign Keys

* `contacts.sales_manager_id` → `users.id`
* `contacts.lead_generator_id` → `users.id`
* `tasks.contact_id` → `contacts.id`
* `invoices.contact_id` → `contacts.id`
* `estimates.contact_id` → `contacts.id`
* `activities.contact_id` → `contacts.id`
* `attachments.contact_id` → `contacts.id`
* `ai_queries.user_id` → `users.id`
