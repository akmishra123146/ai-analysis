# Comprehensive API Endpoint Catalog

## 1. Authentication
* `POST /api/v1/auth/login`: Authenticate user and issue session cookie.
* `POST /api/v1/auth/logout`: Revoke session cookie.
* `GET /api/v1/auth/me`: Get current authenticated user details.

## 2. Contacts (Scoped)
* `GET /api/v1/contacts`: List contacts visible to authenticated user.
* `POST /api/v1/contacts`: Create new contact.
* `GET /api/v1/contacts/:id`: Retrieve contact details (returns 404 if unauthorized).
* `PUT /api/v1/contacts/:id`: Update contact details.

## 3. Natural Language AI Assistant
* `POST /api/v1/ai/query`: Submit natural language question.
  * **Request**: `{ "question": "What is total revenue from my clients this quarter?" }`
  * **Response**:
    ```json
    {
      "question": "What is total revenue from my clients this quarter?",
      "interpretation": "Sum of amount from paid invoices for contacts assigned to current user in current quarter",
      "generated_sql": "SELECT SUM(amount) AS total_revenue FROM invoices WHERE status = 'PAID' AND ...",
      "format": "scalar",
      "result": {
        "text": "Total revenue from your clients: ₹42,80,000 across 14 contacts."
      },
      "metadata": {
        "row_count": 1,
        "latency_ms": 342,
        "model": "gpt-4o"
      }
    }
    ```

## 4. Admin Analytics (Admin Only)
* `GET /api/v1/admin/analytics`: AI usage, costs, and token stats over date range.
* `GET /api/v1/admin/users`: List system users.
* `POST /api/v1/admin/users`: Create new user account.
* `PATCH /api/v1/admin/users/:id/deactivate`: Deactivate user account.
