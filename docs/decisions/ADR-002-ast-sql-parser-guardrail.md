# ADR-002: AST SQL Parsing for Pre-Execution Validation

## Context
Keyword regex blocklists (e.g. checking for "DROP" or "UPDATE") are easily defeated by SQL comments, alias tricks, or whitespace encoding.

## Decision
We use a real Abstract Syntax Tree (AST) parser (`sqlglot` / `node-sql-parser`) to parse every generated SQL query before database execution.

## Rules Enforced
1. Must contain exactly one AST statement node of type `SELECT`.
2. Reject any DDL, DML, write CTE, or multi-statement nodes.
3. Reject references to `pg_catalog` or `information_schema`.

## Consequences
* **Positive**: Robust security against obfuscated SQL injection.
* **Positive**: Rejects invalid or dangerous queries cleanly.
