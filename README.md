# AI Commerce Engagement Platform (ACE)

> An enterprise AI-powered commerce platform that enhances customer engagement across the complete shopping journey using intelligent AI agents.

ACE is an AI engagement layer on top of a complete commerce experience—not a standalone chatbot. Customers can browse and purchase normally, then use grounded AI assistance for discovery, comparison, recommendations, support, and order help.

## Architecture

```text
Customer → Next.js Commerce UI → FastAPI APIs → PostgreSQL / pgvector
                     ↓                ↓
              AI Assistant → Intent Router → Specialized Agents → OpenAI
```

AI agents receive products and business records from repositories. They never invent catalogue items.

## Included

- Next.js 15, React 19, TypeScript, and MUI interface
- Supabase passwordless email authentication (demo mode without credentials)
- FastAPI API with Supabase JWT verification
- Product listing, text search, category and price filters
- DummyJSON-powered catalogue with 194 external products across all available categories, plus local fallback products
- Natural-language shopping requests and explainable recommendations
- OpenAI Responses API integration with a deterministic local fallback
- Supabase pgvector semantic search with a deterministic local-vector fallback
- Catalogue-grounded retrieval-augmented generation (RAG)
- Conversation history and recent-turn context
- Customer memory for explicitly stated brands, budgets, and sizes
- API tests, Docker files, and GitHub Actions CI

## Product surfaces

- Home, products, categories, product details
- Cart, checkout, and orders
- FAQ, about, and contact
- Dedicated AI shopping assistant
- Conversation history and explainable recommendations
- Authenticated Supabase checkout and user-scoped order history
- Product comparison with a catalogue-grounded decision matrix
- Grounded FAQ support with confidence-based human escalation
- Authenticated order tracking and return requests
- Customer response ratings and durable feedback capture
- Protected AI analytics dashboard for quality, groundedness, latency, tokens, cost, resolution, and agent usage

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database design](docs/database.md)
- [AI workflow](docs/ai-workflow.md)
- [Deployment guide](docs/deployment.md)
- [Roadmap](docs/roadmap.md)

## Run locally

Requirements: Node.js 22+, pnpm 11+, and Python 3.12+.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local

cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The API documentation is at `http://localhost:8000/docs`.

## Configure services

The application works in demo mode without secrets. To enable production integrations:

1. Create a Supabase project and enable email authentication.
2. Copy the project URL and publishable key into `frontend/.env.local`.
3. Copy the project URL into `backend/.env` and set `REQUIRE_AUTH=true`.
4. Set `SUPABASE_JWT_SECRET` for legacy HS256 projects; newer asymmetric projects use the project's JWKS endpoint automatically.
5. Add `OPENAI_API_KEY` to `backend/.env`. `OPENAI_MODEL` is configurable and defaults to `gpt-5.6-sol`.
6. Apply the SQL files under `backend/database/migrations` in order. This enables pgvector and installs the protected similarity-search function.
7. Add `SUPABASE_SERVICE_ROLE_KEY` to the backend only. With it and `OPENAI_API_KEY`, product embeddings are indexed into Supabase automatically on the first semantic request; otherwise local vectors and SQLite memory are used.

`EMBEDDING_MODEL` defaults to `text-embedding-3-small`. Without backend Supabase and OpenAI credentials, search uses local deterministic vectors and requires no API calls. `MEMORY_DATABASE_PATH` defaults to `commerce_ai.db` in the example environment; use `:memory:` for ephemeral tests.

`PRODUCT_API_URL` defaults to `https://dummyjson.com/products?limit=0`. Run `python -m database.seed_dummyjson_products` from `backend` after applying migrations to idempotently import the catalogue into Supabase. ACE reads database products first, then uses the remote API and bundled catalogue as fallbacks.

Never expose `OPENAI_API_KEY` or the Supabase service-role key to the frontend.

## API

- `POST /chat`
- `POST /search`
- `POST /search/semantic`
- `POST /recommend`
- `POST /compare`
- `GET /faqs`
- `POST /support`
- `GET /products`
- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `POST /orders/track`
- `POST /returns`
- `GET /analytics`
- `POST /feedback`
- `GET /conversations`
- `GET /conversations/{conversation_id}`
- `GET /health`
- `GET /api/v1/me`

The original versioned Phase 1 routes remain available under `/api/v1`. Agent implementations live in `backend/app/agents`; Supabase migrations are in `backend/database/migrations`.

Example request:

```json
{ "message": "I need a gaming laptop under $1200" }
```

## Verification

```powershell
cd backend; pytest
cd ../frontend; pnpm typecheck; pnpm build
```
