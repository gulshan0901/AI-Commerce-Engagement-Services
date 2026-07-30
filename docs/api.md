# API Reference

All protected endpoints accept `Authorization: Bearer <supabase-access-token>`.

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Available | Service health |
| GET | `/products` | Available | Catalogue listing and filters |
| POST | `/search` | Available | Lexical catalogue search |
| POST | `/search/semantic` | Available | pgvector or local semantic search |
| POST | `/search/visual` | Available | Analyze a product image and return catalogue-grounded matches |
| POST | `/recommend` | Available | Explainable product ranking |
| POST | `/compare` | Available | Compare two to four catalogue products |
| POST | `/chat` | Available | Grounded shopping conversation |
| GET | `/faqs` | Available | Curated public FAQ knowledge |
| POST | `/support` | Available | Grounded FAQ answer and escalation decision |
| GET | `/conversations` | Available | Current user conversation history |
| GET | `/conversations/{id}` | Available | Conversation messages |
| POST | `/orders` | Available | Validate, price, and persist checkout |
| GET | `/orders` | Available | Current user order history |
| GET | `/orders/{id}` | Available | Current user order details |
| POST | `/orders/track` | Available | Track an order owned by the current user |
| POST | `/returns` | Available | Request an eligible return for the current user |
| GET | `/analytics` | Available | User-scoped AI quality, performance, usage, cost, and commerce metrics |
| POST | `/feedback` | Available | Persist a 1–5 rating and optional comment for an owned conversation |

Interactive OpenAPI documentation is available at `/docs` while FastAPI is running.
