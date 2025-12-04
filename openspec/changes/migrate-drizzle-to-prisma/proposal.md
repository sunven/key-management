# Change: Migrate from Drizzle ORM to Prisma ORM

## Why

The project currently uses Drizzle ORM for database operations. This change proposes migrating to Prisma ORM to leverage its more mature ecosystem, better TypeScript integration, comprehensive migration tooling, and intuitive schema definition language. Prisma provides superior developer experience with Prisma Studio, robust migration management, and type-safe query APIs that align better with the project's goals for maintainability and scalability.

## What Changes

- **BREAKING**: Replace Drizzle ORM with Prisma Client for all database operations
- Replace `lib/db/schema.ts` (Drizzle schema) with `prisma/schema.prisma` (Prisma schema)
- Replace `lib/db/index.ts` (Drizzle client) with Prisma Client initialization
- Update all API routes to use Prisma query syntax instead of Drizzle
- Update all components importing database types to use Prisma-generated types
- Replace database CLI commands (`db:generate`, `db:push`, `db:studio`) with Prisma equivalents
- Remove all Drizzle dependencies (`drizzle-orm`, `drizzle-kit`, `postgres` driver)
- Remove `drizzle.config.ts` configuration file
- Remove any generated Drizzle migration files in `drizzle/` directory
- Update authentication logic to use Prisma queries
- Update project documentation (`CLAUDE.md`, `openspec/project.md`) to reflect Prisma usage

## Impact

**Affected specs:**
- `provider-token-management` - All CRUD operations and database queries will use Prisma syntax

**Affected code:**
- `lib/db/schema.ts` - Replaced with `prisma/schema.prisma`
- `lib/db/index.ts` - Replaced with Prisma Client initialization
- `auth.ts` - User sync logic updated to Prisma queries
- `app/api/providers/route.ts` - All Drizzle queries replaced with Prisma
- `app/api/providers/[id]/route.ts` - All Drizzle queries replaced with Prisma
- `app/api/tokens/route.ts` - All Drizzle queries replaced with Prisma
- `app/api/tokens/[id]/route.ts` - All Drizzle queries replaced with Prisma
- `app/page.tsx` - Dashboard statistics queries updated to Prisma
- `components/providers/provider-dialog.tsx` - Type imports updated
- `components/providers/provider-list.tsx` - Type imports updated
- `components/providers/provider-token-list.tsx` - Type imports updated
- `components/tokens/token-dialog.tsx` - Type imports updated
- `package.json` - Dependencies replaced
- `drizzle.config.ts` - Removed (replaced with `prisma/schema.prisma`)
- `.env.example` - Updated with Prisma connection string format if needed
- `CLAUDE.md` - Updated to reference Prisma instead of Drizzle
- `openspec/project.md` - Updated tech stack and conventions

**Migration considerations:**
- All Supabase tables have been deleted; no data migration required
- Database schema will be recreated using Prisma migrations
- No backward compatibility concerns as this is a clean migration
- All existing functionality will be preserved with identical behavior
