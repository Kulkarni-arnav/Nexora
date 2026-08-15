# NEXORA AI

## Overview

NEXORA AI is a production-quality AI Knowledge Management & Research Assistant SaaS. Transform your documents into searchable, intelligent knowledge with semantic search and RAG-powered chat.

**Tagline:** "Your knowledge. Searchable, understandable, intelligent."

## Tech Stack

- **Framework:** Next.js 15 (App Router) with React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with shadcn/ui components
- **Database:** PostgreSQL 16 with pgvector extension
- **ORM:** Prisma with type-safe database access
- **Caching/Queues:** Redis 7
- **Icons:** Lucide React
- **Containerization:** Docker Compose for local development
- **Package Manager:** npm

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── health/          # Health check endpoint
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Landing page (placeholder)
│
├── components/
│   └── ui/                  # shadcn/ui components
│
├── lib/
│   ├── env.ts               # Typed environment configuration
│   └── utils.ts             # Utility functions (cn, etc.)
│
├── server/
│   ├── db/
│   │   └── client.ts        # Prisma client with driver adapter
│   ├── repositories/        # Data access layer (Phase 2+)
│   ├── services/
│   │   └── logger.ts        # Structured logging
│   └── validation/
│       └── errors.ts        # Application error classes
│
├── types/                   # Shared TypeScript types
│
└── config/                  # Configuration files

prisma/
└── schema.prisma            # Database schema with pgvector support
```

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd nexora-ai

# Install dependencies
npm install

# Start PostgreSQL and Redis via Docker
npm run docker:up

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `AUTH_SECRET` | Secret for authentication (Phase 2) | Yes |
| `GEMINI_API_KEY` | Gemini API key for embeddings and LLM (Phase 4+) | No |
| `STORAGE_ENDPOINT` | Object storage endpoint (Phase 3+) | No |
| `STORAGE_ACCESS_KEY` | Object storage access key (Phase 3+) | No |
| `STORAGE_SECRET_KEY` | Object storage secret key (Phase 3+) | No |
| `NEXT_PUBLIC_APP_URL` | Public app URL | No |
| `NEXT_PUBLIC_APP_NAME` | Public app name | No |

## Running PostgreSQL

PostgreSQL runs via Docker Compose with pgvector extension pre-installed:

```bash
# Start containers
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

The database persists data in a Docker volume (`postgres_data`).

### Database Configuration

- **Host:** localhost
- **Port:** 5432
- **Database:** nexora
- **User:** nexora
- **Password:** nexora_dev (from .env)

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-12T12:00:00.000Z",
  "checks": {
    "database": true,
    "redis": true
  }
}
```

## Running Redis

Redis runs via Docker Compose for caching, rate limiting, and background jobs:

```bash
# Start (included in docker:up)
npm run docker:up

# Connect via CLI
docker exec -it nexora-redis redis-cli
```

The Redis instance persists data in a Docker volume (`redis_data`).

## Database Setup

### Generate Prisma Client

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

### Reset Database

```bash
npm run db:reset
```

### Open Prisma Studio

```bash
npm run db:studio
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm run test` | Run tests (Phase 2+) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:reset` | Reset database and re-run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:logs` | View Docker container logs |

## Project Structure

```
nexora-ai/
├── public/                  # Static assets
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Prisma schema
│   └── config.ts            # Prisma configuration
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities
│   ├── server/              # Server-only code
│   └── types/               # TypeScript types
├── docker-compose.yml       # Docker services
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── eslint.config.mjs        # ESLint config
├── next.config.ts           # Next.js config
└── README.md                # This file
```

## Roadmap

The following features are planned for future phases:

### Phase 2: Authentication & Workspaces
- [ ] User authentication (NextAuth.js / Auth.js)
- [ ] Workspace management
- [ ] Role-based access control (Owner, Admin, Member, Viewer)
- [ ] Invitation system

### Phase 3: Document Ingestion & Processing
- [ ] Document upload (multipart/form-data)
- [ ] Object storage integration (S3-compatible)
- [ ] Text extraction (PDF, DOCX, TXT, MD)
- [x] Document chunking strategies
- [x] Embedding generation (Gemini gemini-embedding-001)
- [x] pgvector storage & indexing

### Phase 4: RAG & AI Chat
- [ ] Vector similarity search
- [ ] Hybrid search (keyword + semantic)
- [ ] Streaming AI chat responses
- [ ] Citation tracking & display
- [ ] Conversation management
- [ ] Message history & branching

### Phase 5: Document Viewer & UI
- [ ] Document list & grid views
- [ ] In-browser PDF/document viewer
- [ ] Highlight cited chunks
- [ ] Document metadata editing
- [ ] Search interface with filters

### Phase 6: Analytics & Monitoring
- [ ] Usage tracking (queries, tokens, storage)
- [ ] Cost analytics per workspace
- [ ] Performance metrics
- [ ] Audit logging
- [ ] Health dashboards

### Phase 7: Security & Compliance
- [ ] API rate limiting
- [ ] Data encryption at rest
- [ ] PII detection & redaction
- [ ] SOC 2 / GDPR compliance features
- [ ] SSO integration (SAML, OIDC)

### Phase 8: Testing & Deployment
- [ ] Unit & integration tests
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipelines
- [ ] Staging & production environments
- [ ] Database migration strategy
- [ ] Observability (logging, metrics, tracing)

## License

Proprietary - All rights reserved.

---

**Phase 1 Status:** ✅ Foundation Complete

Ready for Phase 2 development.