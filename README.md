# AI Commerce Engagement Platform (ACE)

ACE is a full-stack AI commerce platform where customers can browse products normally or work with Emma, an AI shopping assistant, through text, voice, and visual search.

Emma uses specialized agents for product discovery, comparisons, recommendations, support, order tracking, returns, memory, and analytics. Recommendations remain grounded in real catalogue data and include explanations.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, MUI |
| Backend | FastAPI, Python |
| AI | OpenAI Responses API |
| Database | Supabase PostgreSQL |
| Vector search | Supabase pgvector |
| Guest identity | Browser-scoped anonymous access |
| Product source | Supabase with DummyJSON and bundled fallbacks |
| Deployment | Vercel and Koyeb |
| CI | GitHub Actions |

## Features

- Responsive product catalogue, categories, search, details, cart, checkout, and orders
- Text, voice, and image-based AI shopping assistance
- Explainable product recommendations and product comparison
- Account-free access with browser-scoped guest data
- Database-backed orders, tracking, returns, feedback, and chat history
- Retrieval-augmented generation with pgvector semantic search
- Customer preference memory
- Agent observability with token, latency, tool, trace, and quality analysis
- SEO metadata, structured data, sitemap, accessibility, and optimized images
- Deterministic local fallbacks when cloud AI services are not configured

## Architecture

```text
Customer
   |
Next.js storefront
   |
FastAPI orchestrator
   |-- Shopping and recommendation agents
   |-- Search and visual-search agents
   |-- Support, order, and return agents
   |-- Review and analytics agents
   |
Supabase PostgreSQL + pgvector + OpenAI
```

## Prerequisites

Install:

- Node.js 22 or later
- pnpm 11 or later
- Python 3.12 or later
- Git

Optional cloud integrations:

- A [Supabase](https://supabase.com/) project
- An [OpenAI API](https://platform.openai.com/) key

Enable pnpm if it is not already installed:

```bash
corepack enable
corepack prepare pnpm@11 --activate
```

## Quick start: local demo mode

Demo mode does not require Supabase or OpenAI credentials. Authentication is bypassed, SQLite stores local data, and deterministic AI fallbacks are used.

### 1. Clone and configure

```bash
git clone https://github.com/gulshan0901/AI-Commerce-Engagement-Services.git
cd AI-Commerce-Engagement-Services
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

No login or account setup is required.

### 2. Start the backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

Open another terminal from the repository root:

```bash
cd frontend
pnpm install
pnpm dev
```

Open:

- Storefront: `http://localhost:3000`
- API documentation: `http://localhost:8000/docs`
- Backend health check: `http://localhost:8000/health`

## Full Supabase and OpenAI setup

### 1. Create a Supabase project

Create a project in Supabase, then collect these values from the project settings:

- Project URL
- Publishable key, formerly called the anonymous key
- Service-role key

The service-role key is a private backend secret. Never expose it through a `NEXT_PUBLIC_*` variable or commit it to Git.

### 2. Create the database schema

Open Supabase Dashboard -> SQL Editor. Run every SQL file in `backend/database/migrations` in numeric order:

```text
001_initial_schema.sql
002_phase2_memory.sql
003_user_profile_trigger.sql
004_supabase_pgvector.sql
005_order_checkout.sql
006_support_and_returns.sql
007_phase4_analytics.sql
008_product_catalogue_source.sql
009_observability_indexes.sql
```

These migrations enable pgvector, create the application tables, configure row-level security, and install the semantic-search function.

### 3. Configure backend variables

Edit `backend/.env`:

```dotenv
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_JWT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-sol
EMBEDDING_MODEL=text-embedding-3-small
MEMORY_DATABASE_PATH=commerce_ai.db
PRODUCT_API_URL=https://dummyjson.com/products?limit=0
```

`SUPABASE_JWT_SECRET` is only required for legacy HS256 Supabase projects. Newer projects use the public JWKS endpoint automatically.

### 4. Configure frontend variables

Edit `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Only public browser-safe values belong in this file.

### 5. Import the product catalogue

After applying the database migrations, run from the `backend` directory:

```bash
python -m database.seed_dummyjson_products
```

The importer is idempotent and can be run again safely. ACE reads Supabase products first, then uses DummyJSON and the bundled catalogue as fallbacks.

Product embeddings are generated automatically on the first semantic-search request when both the service-role key and OpenAI key are configured.

## Environment variable reference

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `FRONTEND_URL` | Yes | Comma-separated frontend origins allowed by CORS |
| `USE_SUPABASE_PERSISTENCE` | No | Keep `false` for account-free guest mode |
| `SUPABASE_URL` | Full mode | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Full mode | Private database access key |
| `SUPABASE_JWT_SECRET` | Legacy only | HS256 JWT verification |
| `OPENAI_API_KEY` | AI mode | OpenAI Responses and embedding APIs |
| `OPENAI_MODEL` | No | Chat and agent model |
| `EMBEDDING_MODEL` | No | Vector embedding model |
| `MEMORY_DATABASE_PATH` | No | Local SQLite path; use `:memory:` for tests |
| `PRODUCT_API_URL` | No | External fallback catalogue URL |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | FastAPI base URL |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical SEO, sitemap, and robots URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Full mode | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Full mode | Public browser authentication key |

## Testing

Backend:

```bash
cd backend
pytest -q
```

Frontend:

```bash
cd frontend
pnpm typecheck
pnpm build
```

## Production deployment

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set Root Directory to `frontend`.
3. Add all required frontend environment variables.
4. Set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
5. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel or custom domain.

### Backend on Koyeb

1. Create a web service from the repository.
2. Set the service root to `backend` and use its Dockerfile.
3. Add the backend environment variables.
4. Set `FRONTEND_URL` to the deployed frontend origin.
5. Verify `/health`, then connect the public backend URL to Vercel.

## Troubleshooting

### Products load slowly or do not appear

- Confirm FastAPI is running on port 8000.
- Open `http://localhost:8000/health`.
- Import products into Supabase to avoid relying on the external fallback API.
- Verify `NEXT_PUBLIC_API_URL` and backend CORS `FRONTEND_URL`.

### Windows `.next/trace` `EPERM` error

Stop all running Next.js development processes before running a production build. Then remove the generated `frontend/.next` directory and run `pnpm build` again.

### PowerShell blocks virtual-environment activation

Use the interpreter directly without activating:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## API overview

The interactive OpenAPI specification is available at `/docs` while FastAPI is running.

Important routes include:

- `POST /chat`
- `POST /search`
- `POST /search/semantic`
- `POST /search/visual`
- `POST /recommend`
- `POST /compare`
- `GET /products`
- `POST /orders`
- `GET /orders`
- `POST /orders/track`
- `POST /returns`
- `GET /conversations`
- `GET /analytics`
- `POST /feedback`

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database design](docs/database.md)
- [AI workflow](docs/ai-workflow.md)
- [Deployment guide](docs/deployment.md)
- [Roadmap](docs/roadmap.md)

## Security before publishing

- Never commit `.env`, `.env.local`, private keys, database files, or API credentials.
- Supabase publishable keys are designed for browser use, but database security must still be enforced through row-level security.
- Rotate any private credential that was ever committed, even if it was later deleted.
- Keep OpenAI and Supabase service-role keys on the backend only.

## Author

Built by [Gulshan](https://gulashan.vercel.app/).
