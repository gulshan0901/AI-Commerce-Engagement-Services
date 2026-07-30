# Deployment Guide

## Frontend — Vercel

Configure `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Add the deployed `/auth/callback` URL to Supabase Authentication redirect URLs.

## Backend — Koyeb

Configure `FRONTEND_URL`, `REQUIRE_AUTH=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `EMBEDDING_MODEL`.

Never expose the service-role or OpenAI keys to the frontend.

## Database

Apply `backend/database/migrations/*.sql` in numeric order. Verify all expected tables and the `vector` extension before deploying the API.

## Release checks

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
pnpm typecheck
pnpm build
```

