# Knowledge: Authentication & Authorization

## Overview
Authentication uses session cookies or signed JWTs. Identity is anchored server-side.

## Role Definitions
* `ADMIN`: Sees all contacts and entities. Accesses user management and AI cost analytics.
* `MANAGER`: Sees contacts where `sales_manager_id = user.id` and all subsidiary entities.
* `MEMBER`: Sees contacts where `lead_generator_id = user.id` and all subsidiary entities.

## Authorization Flow
1. Middleware validates session cookie/JWT.
2. API endpoint reads `user_id` and `role` from request context.
3. Database connection sets session variables before executing queries.
