# Database Design

Supabase PostgreSQL is the system of record. pgvector is enabled in the same database for semantic retrieval.

## Current tables

| Table | Responsibility |
| --- | --- |
| `users` | Customer profile and explicit preferences |
| `products` | Catalogue, inventory, pricing, specifications, source, and external identifier |
| `orders` | Order status, totals, tracking, and item snapshot |
| `conversations` | Customer chat sessions |
| `messages` | User, assistant, tool, and human messages |
| `feedback` | Ratings and comments |
| `analytics` | Latency, tokens, cost, and domain events |
| `embeddings` | Product and knowledge vectors |
| `faqs` | Curated support answers, keywords, and publication state |

## Planned normalization

The commerce expansion introduces `categories`, `order_items`, and `reviews`. Existing JSON order snapshots remain useful for audit history while normalized rows support reporting. Orders also retain return reason and request time for the support workflow.

Migrations live in `backend/database/migrations` and must be applied in numeric order.

Analytics and feedback rows are user-scoped. Row-level security permits authenticated customers to read only their own records; privileged event writes remain a backend responsibility.

Migration `008_product_catalogue_source.sql` adds idempotent external-source keys. The DummyJSON importer upserts on SKU, so catalogue synchronization can be safely rerun without creating duplicate products.
