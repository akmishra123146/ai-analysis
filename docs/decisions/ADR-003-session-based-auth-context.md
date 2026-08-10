# ADR-003: Derive Authenticated Identity Strictly from Server Sessions

## Context
Client requests could attempt privilege escalation by passing another user's ID in request headers or body payloads.

## Decision
The AI assistant endpoint derives `user_id` and `role` strictly from validated HTTP session cookies or signed JWTs verified by server middleware. Any user ID submitted in the request body is strictly ignored.

## Consequences
* **Positive**: Eliminates impersonation attacks via API manipulation.
