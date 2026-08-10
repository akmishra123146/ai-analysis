# Knowledge: Financial Entities & Invoice Logic

## Overview
Defines financial tracking entities (`invoices` and `estimates`).

## Business Rules
* Amounts are represented as fixed decimal (12, 2).
* Currency defaults to INR (₹) or USD ($).
* Invoice status transitions: `DRAFT` → `SENT` → `PAID` or `OVERDUE`.
* Estimate status transitions: `DRAFT` → `SENT` → `ACCEPTED` or `REJECTED`.
