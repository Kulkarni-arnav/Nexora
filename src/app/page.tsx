import { Brain, Search, Zap, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "Intelligent Search",
    description: "Semantic vector search across all your documents with pgvector-powered retrieval.",
  },
  {
    icon: Search,
    title: "RAG-Powered Chat",
    description: "Chat with your knowledge base. Get cited answers grounded in your documents.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized embeddings, chunking, and retrieval for sub-second response times.",
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description: "Workspaces, roles, audit logs, and data isolation built for teams.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="text-xl font-semibold tracking-tight text-foreground">
                NEXORA AI
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground mb-6">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Phase 1: Foundation Complete</span>
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
                Your knowledge.
                <br />
                <span className="text-primary">Searchable, understandable, intelligent.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                NEXORA AI is a production-quality AI Knowledge Management &
                Research Assistant SaaS. Transform your documents into searchable,
                intelligent knowledge with semantic search and RAG-powered chat.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                    <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-28 lg:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Built for Production
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Every component designed for scale, reliability, and developer experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Modern Architecture
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  NEXORA AI is built on a modern, type-safe stack with clear separation
                  of concerns. The foundation is designed to scale from prototype to
                  production without rewrites.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Next.js 15 with App Router & React 19",
                    "TypeScript strict mode throughout",
                    "PostgreSQL with pgvector for embeddings",
                    "Prisma ORM with type-safe database access",
                    "Redis for caching, queues & rate limiting",
                    "shadcn/ui with Tailwind CSS v4",
                    "Docker Compose for local development",
                    "Comprehensive health checks & monitoring",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-2xl border border-border bg-card p-8">
                <div className="font-mono text-sm text-muted-foreground mb-4">
                  nxr-foundation &gt; status
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next.js App Router</span>
                    <span className="text-green-600 dark:text-green-400">✓ Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TypeScript Strict</span>
                    <span className="text-green-600 dark:text-green-400">✓ Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tailwind CSS v4</span>
                    <span className="text-green-600 dark:text-green-400">✓ Configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">shadcn/ui Components</span>
                    <span className="text-green-600 dark:text-green-400">✓ Installed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PostgreSQL + pgvector</span>
                    <span className="text-green-600 dark:text-green-400">✓ Running</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Redis</span>
                    <span className="text-green-600 dark:text-green-400">✓ Running</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prisma Migrations</span>
                    <span className="text-green-600 dark:text-green-400">✓ Applied</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health Endpoint</span>
                    <span className="text-green-600 dark:text-green-400">✓ Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-lg font-semibold text-foreground">NEXORA AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Phase 1 Foundation — Ready for Phase 2 Development
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Changelog
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}