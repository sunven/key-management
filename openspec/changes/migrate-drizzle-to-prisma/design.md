## Context

This migration replaces Drizzle ORM with Prisma ORM as the database access layer. The project uses Supabase PostgreSQL as the database, and all tables have been deleted to enable a clean migration. The existing application has three tables (`users`, `providers`, `tokens`) with cascading foreign key relationships and requires strict user isolation for security.

**Constraints:**
- Database provider: Supabase PostgreSQL (remains unchanged)
- Connection mode: Transaction pooling via DATABASE_URL
- No data migration required (clean slate)
- Must maintain exact same database schema and relationships
- Must preserve all security controls (user isolation, ownership checks)
- Must maintain identical API behavior and response formats

**Stakeholders:**
- Developers maintaining the codebase (improved DX)
- End users (no visible changes, identical functionality)

## Goals / Non-Goals

**Goals:**
- Replace Drizzle ORM with Prisma Client for all database operations
- Maintain identical database schema (users, providers, tokens with CASCADE deletes)
- Preserve all existing functionality and API contracts
- Improve developer experience with Prisma's type safety and tooling
- Simplify migration management with Prisma Migrate
- Provide better database introspection via Prisma Studio

**Non-Goals:**
- Changing database schema or adding new fields
- Modifying API response formats or behavior
- Adding new features or capabilities
- Migrating existing production data (clean migration)
- Changing authentication mechanism or security model
- Optimizing queries or adding caching

## Decisions

### Decision: Use Prisma Client over Drizzle ORM

**Rationale:**
- **Mature ecosystem**: Prisma has wider adoption, better documentation, and active community
- **Type safety**: Prisma generates fully type-safe client with IntelliSense support
- **Migration tooling**: Prisma Migrate provides declarative, version-controlled schema migrations
- **Developer experience**: Prisma Studio offers visual database browser, schema introspection is straightforward
- **Query API**: Prisma's intuitive query syntax reduces boilerplate compared to Drizzle's SQL-like API

**Alternatives considered:**
- **Keep Drizzle**: Would maintain status quo but lacks Prisma's DX benefits and migration tooling maturity
- **TypeORM**: More verbose than Prisma, decorator-based approach less idiomatic for Next.js projects
- **Kysely**: Lower-level SQL builder, requires more manual type management than Prisma

### Decision: Use Prisma Migrate for schema management

**Rationale:**
- Declarative schema definition in `schema.prisma`
- Automatic migration generation based on schema changes
- Version-controlled migration history
- Rollback capability via migration files
- Better suited for team collaboration than Drizzle's `push` command

**Alternatives considered:**
- **Manual migrations**: Error-prone, no type safety, hard to track changes
- **Drizzle Kit push**: Quick for development but lacks migration history and production safety

### Decision: Maintain exact database schema without changes

**Rationale:**
- Minimize migration risk by preserving table structure
- Focus on ORM replacement, not schema redesign
- Ensures behavior parity with existing implementation
- Allows for isolated testing of ORM migration

**Alternatives considered:**
- **Schema improvements**: Would increase scope and risk; should be separate change if needed

### Decision: Use singleton pattern for Prisma Client in Next.js

**Rationale:**
- Prevents exhausting database connections in development hot-reload scenarios
- Official Prisma recommendation for Next.js applications
- Avoids "too many clients" errors during development
- Production optimization (single client instance)

**Implementation:**
```typescript
// lib/db/prisma.ts
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Decision: Preserve Drizzle's `prepare: false` equivalent in Prisma

**Rationale:**
- Supabase uses Transaction pooling mode which doesn't support prepared statements
- Must configure Prisma to avoid "prepared statements not supported" errors
- Prisma handles this automatically when using Supabase connection strings with `?pgbouncer=true`

**Implementation:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

If connection string doesn't have `?pgbouncer=true`, may need to adjust.

### Decision: Replace all query patterns systematically

**Drizzle to Prisma query mapping:**

| Drizzle Pattern | Prisma Equivalent |
|-----------------|-------------------|
| `db.query.users.findFirst({ where: eq(...) })` | `prisma.user.findFirst({ where: { ... } })` |
| `db.insert(users).values({...}).returning()` | `prisma.user.create({ data: {...} })` |
| `db.update(users).set({...}).where(...).returning()` | `prisma.user.update({ where: {...}, data: {...} })` |
| `db.delete(users).where(...).returning()` | `prisma.user.delete({ where: {...} })` |
| `with: { tokens: true }` | `include: { tokens: true }` |
| `eq(users.id, userId)` | `{ id: userId }` |
| `and(eq(...), eq(...))` | `{ field1: value1, field2: value2 }` |

## Risks / Trade-offs

**Risk: Connection pooling misconfiguration**
- **Impact**: "Too many connections" errors or prepared statement failures
- **Mitigation**: Verify DATABASE_URL format matches Supabase transaction mode; test connection pooling under load; use singleton pattern

**Risk: Subtle query behavior differences**
- **Impact**: Unintended changes in data retrieval or filtering logic
- **Mitigation**: Comprehensive testing of all CRUD operations; validate user isolation still works; compare query results before/after migration

**Risk: Type inference differences**
- **Impact**: TypeScript compilation errors or loss of type safety
- **Mitigation**: Update all type imports systematically; run type checking after each file change; use Prisma-generated types everywhere

**Risk: Missing Drizzle cleanup**
- **Impact**: Confusion with leftover files, unused dependencies, or import errors
- **Mitigation**: Checklist for removing all Drizzle files and dependencies; grep for remaining imports; verify clean build

**Trade-off: Migration file management vs. push command**
- **Drizzle**: Simple `db:push` for quick schema updates without migration files
- **Prisma**: Requires explicit `prisma migrate dev` and manages migration history
- **Decision**: Accept migration file overhead for better production safety and team collaboration

**Trade-off: Learning curve**
- **Impact**: Team needs to learn Prisma query API and migration workflow
- **Mitigation**: Prisma has excellent documentation; query syntax is more intuitive than Drizzle's SQL-like API

## Migration Plan

**Phase 1: Setup (Steps 1-3 in tasks.md)**
1. Install Prisma dependencies without removing Drizzle (parallel installation)
2. Define schema in `prisma/schema.prisma` matching existing Drizzle schema exactly
3. Generate Prisma Client and create initial migration
4. Verify migration creates correct database structure

**Phase 2: Core Migration (Steps 4-5 in tasks.md)**
1. Create new `lib/db/prisma.ts` alongside existing `lib/db/index.ts`
2. Update one API route at a time, testing each before moving to next
3. Update components to use Prisma types after all API routes migrated
4. Recommended order: `auth.ts` → `providers` routes → `tokens` routes → dashboard

**Phase 3: Cleanup (Steps 6-7 in tasks.md)**
1. After all code migrated and tested, remove Drizzle dependencies
2. Delete Drizzle files (`lib/db/index.ts`, `lib/db/schema.ts`, `drizzle.config.ts`)
3. Update documentation to reflect Prisma usage

**Phase 4: Verification (Step 8 in tasks.md)**
1. Run full test suite (manual testing of all features)
2. Verify production build succeeds
3. Test in local environment matching production configuration

**Rollback strategy:**
- Git branch created before migration for easy rollback
- If critical issues found, revert commit and restore from branch
- Drizzle schema preserved in git history for reference
- Database can be dropped and recreated with either ORM

## Open Questions

None - all decisions finalized based on clean migration requirement.
