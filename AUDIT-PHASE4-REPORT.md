# NEXORA AI — Phase-4 Full Audit Report

Audit date: 2026-08-14 · Workspace: `nexora-ai/` · All findings verified against a **live** instance (Next.js dev server, postgres+pgvector, redis) using real HTTP requests, real DB inspection, and the real Gemini API.

---

## 1. Test evidence

| Suite | Where | Result |
|---|---|---|
| Chunking unit tests (31 cases: tiny, paragraphs, large, whitespace, markdown, unicode, repeats, chunk-boundary exact) | `node` direct on `chunking.ts` | **31/31 pass** |
| End-to-end API suite (65 cases) | `POST/PATCH/DELETE` via curl against running server | **65/65 pass (ALL GREEN)** |
| SQL injection attempts on search (DROP/DELETE/1=1 payloads) + post-check table integrity | live | safe, tables intact |
| Workspace-delete cascade (chunks, documents, members, rows) | live + DB | all cascade to 0 |
| Embedding dimension / version consistency | DB | 768, version 1 |
| LLM + embedding model names exist | live Gemini `models` list | `gemini-3.6-flash` and `gemini-embedding-001` present |
| `npm run typecheck` | tsc --noEmit | clean |
| `npm run lint` | eslint | 0 errors, 1 warning (`use-toast.ts` unused type) |

Environment notes: Postgres/Redis healthy. `.env` is gitignored and never committed (verified via `git ls-files` + history). `AUTH_SECRET="dev-secret-change-in-production"` — must be rotated when deploying.

---

## 2. Confirmed correct

**Authentication & authorization**
- Every workspace-scoped route enforces `auth() → 401` and then `requireWorkspaceMember` / `requireWorkspaceRole` (all verified: non-member view/delete/search/members = 403; member can read/search; VIEWER cannot upload/delete; ADMIN cannot assign OWNER; self role-change blocked; owner-only workspace delete).
- Cross-workspace document access = 403 (non-member) / 404 (member querying own workspace for a foreign doc). Search is scoped in SQL by `workspaceId` **and** by membership at the route — no vertical/horizontal leak.
- JWT sessions; token invalidation on password change (`passwordChangedAt` check); bcrypt cost 12; timing-safe dummy hash on unknown email; login rate limit (10/min per email) — **verified live**: 12 bad logins rejected and the 13th valid attempt is denied (429-equivalent behavior), then recovers.
- Signup validation (weak password, bad email, confirm mismatch, duplicate email) → all rejected with proper 400s. Signup and `/api/health` are the only public endpoints (intended).

**SQL safety**
- All queries parameterized via Prisma templates/`$executeRaw`. Injection payloads (`'; DROP TABLE document_chunks; --`, `'OR 1=1`, `DELETE FROM users`) are treated as plain text; `document_chunks`, `users`, `documents` verified intact afterward.
- `documentId` search filter is an additional `AND` clause only — cannot be used to read another workspace's chunks.

**Document lifecycle & data integrity**
- Upload: extension+MIME cross-check (`classifyDocumentFile`), 10 MB cap (413), empty file (400), unsupported type (400). Storage-failure rollback of the file before DB write.
- Processing: extract → store content → complete → index. PDF extraction verified on a real 2-page PDF (both pages extracted); password-protected/corrupted PDFs → friendly `FAILED` + `errorMessage`, retryable.
- Indexing is transactional and idempotent: `DELETE` chunks for the doc → bulk `INSERT` via `UNNEST` → set `indexedAt`, all in one transaction. Delete-document cascades chunks (verified live). Delete-workspace cascades documents→chunks and members (verified live).
- File cleanup on delete removes the doc dir from local storage (verified: no orphans from any audit-run doc/workspace deletes).
- Retry guard: only `FAILED`/unindexed docs retryable; completed docs rejected.

**Chunking** (`chunking.ts`, verified empirically)
- Deterministic, index-contiguous, chunk-size capped, paragraph-aware, whitespace-tolerant, Unicode-safe, exact-boundary-safe.
- Full token coverage across all cases (no accidental character loss); overlap provides cross-boundary context (word from a chunk tail reappears in the following chunk's head).

---

## 3. Findings to address (prioritized)

### P1/P2 — Performance: no pgvector (ANN) index → every search is a sequential scan
`EXPLAIN` of the production search query shows `Seq Scan on document_chunks` + full `Sort` for `ORDER BY embedding <=> … LIMIT N` (no HNSW/IVFFlat index exists; `pg_indexes` confirms 0 vector indexes). Fine at 32 chunks; at thousands of chunks per workspace every semantic query becomes O(total chunks).

Suggested fix (migration):
```sql
CREATE INDEX document_chunks_embedding_hnsw
  ON document_chunks USING hnsw (embedding vector_cosine_ops);
```
Note: 768-dim HNSW is memory-hungry; for cost-sensitive deploys consider `ivfflat` (`.lists` sized to chunk count) or a `WHERE embeddingVersion = 1` partition strategy, plus periodic `ANALYZE`. Keep embeddings batched at 64 (already done) and prefer smaller effective corpus per workspace.

### P2 — Silent indexing failure: docs can end up `COMPLETED` but unindexed
`indexDocument` catches every error and returns `{ indexed: false }`; `processDocument` ignores the result, so a document whose embedding/insert fails stays `COMPLETED` with `indexedAt = NULL`, `errorMessage = NULL`, 0 chunks — the UI offers no signal (this is the "index entry + status mismatch" case). The doc is excluded from search (correct) but appears healthy (misleading), and only a manual retry recovers it.

Suggested fix: in `processDocument`, branch on the `indexDocument` result and call `failDocument(…, message)` when `indexed === false`, and/or surface `indexedAt: null` in the UI as "index failed — retry".

### P3 — Storage cleanup is not atomic with DB deletes
Document delete does storage-first then DB (good). Workspace delete does **DB first** (`deleteWorkspace()`), then `storage.deletePrefix(...)` — if the process dies between, DB rows are gone but files orphan (4 such orphaned dirs were found, from an earlier session). Best-effort for local FS; reorder workspace delete to storage-first, or add a sweeper. If migrating to object storage later, this becomes a billing/cost leak, not just disk.

### P3 — Overlap is a best-effort "context carry," not uniform overlap
When a packed chunk already reaches `chunkSize`, the outgoing chunk is truncated to capacity and the next chunk re-emits only the last ~200 chars as a prefix (verified: no token loss; boundary words remain fully covered in the next chunk). Semantics are correct but differ from a classic sliding-window overlap. Cosmetic/quality issue only.

### P3 — No rate limit on search / document / workspace endpoints
Rate limiting exists for **login** and **password change** only. Search invokes Gemini embedding on every call (cost + floor for abuse), and uploads are processor-bound. Recommend adding `checkRateLimit` (the infra already exists in `rate-limit.ts`) to `search` and `documents POST`.

### P3 — Chat/citations/conversations NOT implemented (API)
`conversations`, `messages`, `citations` tables and aggregate counts exist, and the dashboard renders an empty-state, but there are no API routes to create/read them in Phase 4. If conversation UX was in scope, it is incomplete; otherwise it is sat as planned-for-next-phase.

### P3 — Minor
- `docker-compose.yml` `version:` key is obsolete (warning on every `up`).
- Failed credentials return 302 (standard NextAuth) — clients must follow redirects; the harness detected this.
- Login rate limit is keyed per-email; rotating emails bypasses it (acceptable if combined with IP limiting at a gateway).
- `rate-limit.ts` fails open when Redis is unreachable (availability-over-security) — deliberate, but worth documenting.
- Observed pre-existing orphaned storage dirs (`workspaces/1e89ccd8-…`, no DB row) predate this audit.

---

## 4. Verdict
Phase 4 is in a **healthy, deployable state**: security boundaries (auth, RBAC, workspace isolation, SQL parameterization, upload validation) all verified live at 100% pass rate; the embedding/search pipeline works end-to-end against real Gemini with correct dimensionality and deterministic, lossless chunking; cascades and cleanup behave correctly.

The two changes I recommend before scale/production: the **ANN index** (P1) and the **indexing-failure status handling** (P2). The remaining items are P3 quality/debt.

Test artifacts (scripts, fixtures, this report) live in `/tmp/nexora-phase4/` unless you want them moved into the repo.