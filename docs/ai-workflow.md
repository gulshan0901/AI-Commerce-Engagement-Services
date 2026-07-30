# Grounded AI Workflow

1. FastAPI validates the Supabase access token.
2. The orchestrator loads recent conversation turns and explicit customer preferences.
3. Intent routing selects the smallest relevant agent workflow.
4. Repositories retrieve authorised application records.
5. Semantic retrieval ranks records through Supabase pgvector.
6. The model receives only the request, memory, and retrieved records.
7. The API validates product identifiers before returning recommendations.
8. The user and assistant turns are persisted for history and evaluation.

## Grounding contract

Agents must not invent product names, prices, stock, specifications, orders, or policies. When no record satisfies a request, the assistant states that no match was found and suggests a bounded adjustment.

## Phase 2 memory

ACE remembers only explicit shopping preferences such as brands, budgets, and sizes. Current user input overrides stored memory. The UI indicates when memory contributed to a response.

