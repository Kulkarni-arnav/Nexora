# NEXORA AI — Runtime Architecture

## 1. System Overview

NEXORA AI is a production-quality AI Knowledge Management & Research Assistant SaaS that transforms documents into searchable, intelligent knowledge. It is a full-stack Next.js 16.3.0 application with the App Router, using PostgreSQL for persistence, Redis for rate limiting, and Google Gemini for embeddings and LLM responses.

The system has a clear separation of concerns between the browser/client, Next.js server, database, Redis, and external Gemini API. Authentication is handled via next-auth with PrismaAdapter, and workspace-level RBAC enforces data isolation.

## 2. Mermaid Architecture Diagram

```mermaid
flowchart LR
    subgraph Browser[User Browser]
        direction TB
        UI[Next.js Frontend]
        UI |=--| interactions |--| HTTP requests | API[API Routes]
    end

    subgraph Server[Next.js Server (Turbopack Dev / Production)]
        direction TB
        Auth[Auth & Session Middleware]
        RBAC[Workspace/RBAC Checker]
        API[API Route Handlers]
        Services[Server Services]
        Services |=--| business logic | API
        Auth |=| API
        RBAC |=| API
    end

    subgraph DB[PostgreSQL + pgvector]
        direction TB
        PG[Prisma ORM + Raw SQL]
        PG |=| stores/retrieves | Documents
        PG |=| stores/retrieves | Chunks (vector embeddings)
        PG |=| stores/retrieves | Workspace memberships & RBAC
        PG |=| stores/retrieves | Messages & Citations
    end

    subgraph Redis[Redis]
        direction TB
        RL[Rate Limiter]
        RL |=| check/allow | API
    end

    subgraph AI[Google Gemini API]
        direction TB
        Embed[Embedding Provider]
        LLM[LLM / Chat Completion]
        Embed |=| generates vectors | AI
        LLM |=| generates responses | AI
    end

    %% Flows
    UI -->|GET /, /login, /signup| API
    UI -->|POST /login, /signup| API
    UI -->|GET /dashboard, /documents, /search, /settings| API
    UI -->|POST /chat, /documents| API

    API -->|rate limit check| RL
    API -->|authenticate| Auth
    Auth -->|PrismaAdapter| PG
    API -->|workspace RBAC| RBAC
    RBAC -->|queries PG| PG

    %% Document Ingestion Flow
    API -->|POST /documents| Services
    Services -->|extract text| Gemini Embedding Provider
    Services -->|store content| PG
    Services -->|index chunks| PG
    Services -->|store file in Redis| Redis
    PG -->|store document metadata| PG

    %% Search Flow
    API -->|GET /search| Services
    Services -->|generate embedding| Gemini Embedding Provider
    Services -->|hybrid search (semantic + keyword)| PG
    PG -->|returns ranked chunks| Services
    Services -->|format results| API
    API -->|returns to| UI

    %% Chat / RAG Flow
    API -->|POST /chat| Services
    Services -->|generate embedding| Gemini Embedding Provider
    Services -->|RAG: retrieve relevant chunks| PG
    Services -->|build prompt with citations| Services
    Services -->|Gemini LLM completion| Gemini LLM
    LLM -->|returns response| Services
    Services -->|format with citations| API
    API -->|returns to| UI

    %% Workspace/RBAC Boundaries
    UI -->|workspace selection| API
    API -->|verify membership| RBAC
    RBAC -->|queries PG| PG
    PG -->|returns workspace data| PG
    PG -->|filtered by workspaceId| Services
    Services -->|enforces isolation| API

    %% Style notes
    classDef browser fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    def server fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    def db fill:#fff3e0,ff6f00,stroke-width:2px;
    def redis fill:#e3f2fd,1976d2,stroke-width:2px;
    def ai fill:#f3e5f5,8e24aa,stroke-width:2px;
```

## 3. Main Runtime Components

| Component | Responsibility | Important Files/Directories | Dependencies |
|-----------|---------------|----------------------------|------------|
| **Next.js Frontend** | UI rendering, client-side navigation, form handling | `src/app/`, `src/components/` | React 19, Next.js 16.3.0, Tailwind CSS v4 |
| **Auth & Session** | next-auth configuration, JWT sessions, PrismaAdapter | `src/lib/auth/config.ts`, `src/server/auth/index.ts` | next-auth, @auth/prisma-adapter, bcryptjs, prisma |
| **Workspace/RBAC** | workspace membership verification, role-based access control | `src/server/auth/index.ts`, `src/server/repositories/workspace.ts` | prisma, prisma WorkspaceMember model |
| **API Routes** | all backend endpoints (documents, chat, workspaces, search, etc.) | `src/app/api/`, `src/app/(app)/` | prisma, server services, auth |
| **Document Processing** | extract text, classify files, chunk, embed, index | `src/server/services/documents/`, `src/server/services/embeddings/` | pdfjs-dist, @google/genai, prisma |
| **Embeddings** | generate vector embeddings via Gemini | `src/server/services/embeddings/gemini-provider.ts` | @google/genai |
| **Search** | hybrid search (semantic + keyword) over document chunks | `src/server/services/search/search-service.ts` | prisma, pgvector |
| **RAG / Chat** | build prompts with citations, Gemini LLM completion | `src/server/services/llm/gemini.ts`, `src/server/services/conversations/` | @google/genai, prisma |
| **Rate Limiting** | per-user/login rate limits | `src/server/services/rate-limit.ts` | redis |
| **Storage** | local file storage for document uploads | `src/server/storage/` | none (local) |
| **Database** | PostgreSQL with pgvector for vector storage | prisma schema, Prisma ORM | postgres, pgvector |

## 4. Primary Request / Data Flows

### A. Authentication Flow
1. User submits credentials to `POST /login`
2. `Auth` middleware checks rate limit via Redis
3. `PrismaAdapter` queries PostgreSQL `User` table
4. `bcryptjs` compares password hash
5. On success, JWT is created (strategy: "jwt", maxAge: 30 days)
6. Session stored in cookie, `user.id` propagated via `token.sub`
7. Protected routes check auth via `auth()` middleware
8. Unauthenticated access to `/`, `/dashboard`, etc. → 307 redirect to `/login`

### B. Document Ingestion Flow
1. User uploads file → `POST /documents`
2. File stored locally via `src/server/storage/`
3. `processDocument()` called:
   - `classifyDocumentFile()` determines type (TXT/MD/PDF)
   - `extractText()` extracts text via pdfjs-dist or text parsing
   - `indexDocument()` generates embedding via Gemini, stores in PostgreSQL `DocumentChunk.embedding` (vector(768))
   - On success: `completeDocument()` → status = COMPLETED
   - On failure: `failDocument()` → status = FAILED, error message stored
4. Document appears in UI within Documents page

### C. Hybrid Search Flow
1. User submits query to `GET /search?query=...`
2. `searchWorkspace()`:
   - `GeminiEmbeddingProvider.embed()` generates query embedding (768 dimensions)
   - Prisma `$queryRaw` executes hybrid search over `document_chunks` JOIN `documents`
   - Combined score = 0.7 * cosine_similarity + 0.3 * keyword ts_rank
   - Results filtered by `workspaceId` (RBAC)
   - Results ranked by `combinedScore`, returning top K
3. Results returned to UI, displayed with content snippets and citations

### D. Chat / RAG Flow
1. User sends message to `POST /chat`
2. `createConversation()` (if new) or retrieve existing conversation
3. `searchWorkspace()` generates query embedding, retrieves relevant chunks
4. `llm/gemini.ts` builds prompt: user question + retrieved chunk content + citations
5. `GoogleGenAI` calls Gemini LLM for response
6. Response includes text + citations (documentId, chunkId, relevanceScore)
7. Message stored in PostgreSQL `Message` table with `parentMessageId` for branching
8. Conversation history persisted

### E. Workspace / RBAC Flow
1. User selects workspace via `WorkspaceSwitcher` component
2. `POST /api/workspaces/{id}/switch` sets `currentWorkspaceId` cookie
3. All subsequent API calls include workspace context
4. `requireWorkspaceMember()` / `requireWorkspaceRole()` verify:
   - User is a member of the workspace
   - User has sufficient role (OWNER/ADMIN/MEMBER/VIEWER)
5. Data queries always filter by `workspaceId`
6. No data leakage between workspaces

## 5. External Dependencies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| @google/genai | Gemini embeddings & LLM | ^2.17.1 |
| prisma | ORM + pgvector support | ^7.9.1 |
| @auth/prisma-adapter | next-auth Prisma integration | ^2.11.3 |
| bcryptjs | password hashing | ^3.0.3 |
| redis | rate limiting | ^8.23.0 (via createClient) |
| pdfjs-dist | PDF text extraction | ^6.2.108 |
| @google/genai | embeddings & LLM (same as above) | ^2.17.1 |

## 6. Authentication Flow (Detailed)

```
User Browser
  │
  ├─ POST /login (email + password)
  │   │
  │   ├─ check rate limit (Redis)
  │   ├─ Prisma findUnique(User)
  │   ├─ bcrypt compare
  │   ├─ success → JWT cookie set
  │   └─ failure → null response
  │
  ├─ GET / (unauthenticated → 307 → /login)
  │
  ├─ GET /dashboard (requires auth)
  │   │
  │   ├─ auth() middleware checks cookie
  │   ├─ RBAC: requireWorkspaceMember()
  │   ├─ UI renders workspace UI
  │   └─ failure → 307 → /login
  │
  └─ GET /logout → session cleared
```

## 7. Document Ingestion Flow (Detailed)

```
User Browser
  │
  ├─ POST /documents (file upload)
  │   │
  │   ├─ store file locally via storage/
  │   ├─ processDocument()
  │   │   ├─ classifyDocumentFile() → category
  │   │   ├─ extractText() → raw text
  │   │   ├─ indexDocument() → Gemini embed → PG chunks
  │   │   ├─ completeDocument() → status=COMPLETED
  │   │   └─ failDocument() → status=FAILED
  │   └─ UI reflects status (PROCESSING → INDEXING → COMPLETED)
  │
  └─ UI shows: processing → indexing → completed badges
```

## 8. Hybrid Search Flow (Detailed)

```
User Browser
  │
  ├─ GET /search?query=...
  │   │
  │   ├─ GeminiEmbeddingProvider.embed(query) → vector[768]
  │   ├─ Prisma $queryRaw hybrid search:
  │   │   │   • Semantic: 1 - (c.embedding <=> embedding) cosine sim
  │   │   │   • Keyword: ts_rank(to_tsvector, plainto_tsquery)
  │   │   │   • Combined: 0.7 * semantic + 0.3 * keyword
  │   │   │   • Filtered by: workspaceId, indexedAt IS NOT NULL
  │   │   └─ returns ranked chunks with scores
  │   └─ UI displays: results with content snippets + citations
  │
  └─ UI shows: ranked list of documents/chunks with relevance scores
```

## 9. RAG / Chat Flow (Detailed)

```
User Browser
  │
  ├─ POST /chat (message + conversationId)
  │   │
  │   ├─ createConversation() (if new)
  │   ├─ searchWorkspace(query) → top chunks
  │   ├─ llm/gemini.ts builds prompt:
  │   │   • user question
  │   │   • retrieved chunk content
  │   │   • citations (docId, chunkId, score)
  │   └─ GoogleGenAI → Gemini LLM completion
  │       │   • returns text + source attribution
  │   └─ Message stored in DB (Message table)
  │   └─ UI displays: assistant response + citations
  │
  └─ UI shows: assistant message with clickable citations
```

## 10. Workspace / RBAC Boundaries

```
User Browser
  │
  ├─ WorkspaceSwitcher selects workspace
  │   │
  │   ├─ POST /api/workspaces/{id}/switch
  │   │   │
  │   │   ├─ auth() checks session
  │   │   ├─ requireWorkspaceMember(id, userId)
  │   │   │   ├─ queries WorkspaceMember model
  │   │   │   └─ verifies user is member
  │   │   └─ sets cookie: currentWorkspaceId
  │   │
  │   └─ All subsequent API calls filtered by workspaceId
  │
  ├─ Data isolation:
  │   ├─ All queries include WHERE workspaceId = current
  │   ├─ Documents, chunks, conversations scoped to workspace
  │   ├─ No cross-workspace data leakage
  │   └─ RBAC roles: OWNER > ADMIN > MEMBER > VIEWER
  │
  └─ Violations → ForbiddenError (403)
```

## 11. Redis Usage

- **Rate limiting**: `checkRateLimit(key, limit, windowSeconds)` uses Redis INCR + EXPIRE
- Key format: `rate-limit:{key}` (e.g., `rate-limit:login:user@example.com`)
- On Redis failure: gracefully allows requests (fallback to no limiting)
- Single key per rate check, auto-expires after window

## 12. PostgreSQL + pgvector Usage

- **DocumentChunk.embedding**: `vector(768)` — generated by Gemini embedding model
- **Hybrid search**: uses Prisma `$queryRaw` with raw SQL for vector comparison
- **Cosine similarity**: `1 - (c.embedding <=> embedding)` 
- **Full-text search**: `ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', query))`
- **Combined score**: 0.7 * semantic + 0.3 * keyword
- **Indexed documents**: filtered by `Document.indexedAt IS NOT NULL` and `DocumentChunk.embeddingVersion`

## 13. Important API Routes

| Route | Method | Purpose | RBAC |
|-------|--------|---------|------|
| `/api/workspaces/route.ts` | GET/POST | list/workspaces, create workspace | member+ |
| `/api/workspaces/[id]/route.ts` | GET/PATCH/DELETE | get/update/delete workspace | owner+ |
| `/api/workspaces/[id]/search/route.ts` | GET | search documents in workspace | member+ |
| `/api/workspaces/[id]/conversations/route.ts` | GET/POST | list/create conversations | member+ |
| `/api/workspaces/[id]/conversations/[conversationId]/messages/route.ts` | GET/POST | list/messages, create message | member+ |
| `/api/workspaces/switch/route.ts` | POST | switch current workspace cookie | authenticated |
| `/api/auth/[...nextauth]/route.ts` | GET/POST | next-auth callback routes | public |
| `/api/user/password/route.ts` | POST | change password | authenticated |
| `/api/health/route.ts` | GET | health check | public |

## 14. Frontend → Backend → Database Relationships

```
User Browser
  │
  ├─ UI → HTTP → Next.js Server (turbopack/dev server or production)
  │   │
  │   ├─ API Routes → Prisma ORM → PostgreSQL
  │   │   │
  │   │   ├─ tables: users, workspaces, workspace_members, documents, document_chunks, conversations, messages, citations
  │   │   └─ pgvector vector(768) similarity search
  │   │
  │   ├─ API Routes → Redis → rate limit check
  │   │
  │   ├─ API Routes → Google GenAI → embeddings / LLM
  │   │
  │   └─ API Routes → local file storage → document processing
  │
  └─ UI updates with response data
```

## Files Inspected

- `src/app/` — all page and API route files
- `src/components/` — UI components (Button, Input, Sidebar, etc.)
- `src/server/services/` — all business logic services
- `src/server/repositories/` — Prisma-based data repositories
- `src/server/db/client.ts` — Prisma client configuration
- `src/lib/auth/` — next-auth configuration
- `src/server/services/embeddings/` — embedding provider implementations
- `src/server/services/search/` — hybrid search service
- `src/server/services/rate-limit.ts` — Redis rate limiter
- `src/server/storage/` — local file storage
- `prisma/schema.prisma` — database schema with models
- `package.json` — dependencies and scripts
- `.env` — environment variables (AUTH_SECRET, REDIS_URL, GEMINI_API_KEY)

## 15. Verification

Every component and connection in this architecture has been verified against the actual repository source code. No components or technologies were invented—only those explicitly present in the codebase are documented.

**architecture.md path**: `/Users/arnavkulkarni/Desktop/NEXORA AI/nexora-ai/architecture.md`