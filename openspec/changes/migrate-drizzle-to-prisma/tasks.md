## 1. Setup Prisma

- [x] 1.1 Install Prisma dependencies (`@prisma/client`, `prisma` as dev dependency)
- [x] 1.2 Initialize Prisma with PostgreSQL provider (`prisma init --datasource-provider postgresql`)
- [x] 1.3 Configure Prisma schema with connection string from `.env.local`

## 2. Schema Migration

- [x] 2.1 Define `User` model in `prisma/schema.prisma` (equivalent to Drizzle `users` table)
- [x] 2.2 Define `Provider` model with relation to `User` and CASCADE delete
- [x] 2.3 Define `Token` model with relation to `Provider` and CASCADE delete
- [x] 2.4 Generate Prisma Client (`prisma generate`)
- [x] 2.5 Create and apply initial migration (`prisma migrate dev --name init`)

## 3. Database Client Migration

- [x] 3.1 Create `lib/db/prisma.ts` with Prisma Client singleton initialization
- [x] 3.2 Remove `lib/db/index.ts` (Drizzle client)
- [x] 3.3 Delete `lib/db/schema.ts` (Drizzle schema)

## 4. API Routes Migration

- [x] 4.1 Update `auth.ts` - Replace Drizzle user queries with Prisma `prisma.user.upsert()`
- [x] 4.2 Update `app/api/providers/route.ts` (GET, POST) - Replace Drizzle with Prisma queries
- [x] 4.3 Update `app/api/providers/[id]/route.ts` (GET, PUT, DELETE) - Replace Drizzle with Prisma
- [x] 4.4 Update `app/api/tokens/route.ts` (GET, POST) - Replace Drizzle with Prisma queries
- [x] 4.5 Update `app/api/tokens/[id]/route.ts` (GET, PUT, DELETE) - Replace Drizzle with Prisma
- [x] 4.6 Update `app/page.tsx` - Replace dashboard statistics queries with Prisma

## 5. Component Type Updates

- [x] 5.1 Update `components/providers/provider-dialog.tsx` - Import types from `@prisma/client`
- [x] 5.2 Update `components/providers/provider-list.tsx` - Import types from `@prisma/client`
- [x] 5.3 Update `components/providers/provider-token-list.tsx` - Import types from `@prisma/client`
- [x] 5.4 Update `components/tokens/token-dialog.tsx` - Import types from `@prisma/client`

## 6. Configuration and Scripts

- [x] 6.1 Update `package.json` scripts - Replace `db:generate`, `db:push`, `db:studio` with Prisma equivalents
- [x] 6.2 Remove Drizzle dependencies from `package.json` (`drizzle-orm`, `drizzle-kit`, `postgres`)
- [x] 6.3 Delete `drizzle.config.ts`
- [x] 6.4 Delete `drizzle/` directory if it exists

## 7. Documentation Updates

- [x] 7.1 Update `CLAUDE.md` - Replace all Drizzle references with Prisma equivalents
- [x] 7.2 Update `openspec/project.md` - Update tech stack and database sections
- [x] 7.3 Update `.env.example` if DATABASE_URL format needs adjustment

## 8. Testing and Verification

- [x] 8.1 Test Google OAuth authentication and user creation
- [x] 8.2 Test provider CRUD operations (create, read, update, delete)
- [x] 8.3 Test token CRUD operations with provider association
- [x] 8.4 Test user isolation (users can only access their own data)
- [x] 8.5 Test cascade delete behavior (deleting provider deletes tokens)
- [x] 8.6 Test dashboard statistics display
- [x] 8.7 Verify all TypeScript types compile without errors
- [x] 8.8 Run `pnpm build` to verify production build succeeds

## 9. Cleanup

- [x] 9.1 Remove any remaining Drizzle imports or references
- [x] 9.2 Verify no Drizzle dependencies remain in `node_modules` after reinstall
- [x] 9.3 Remove any Drizzle-related environment variables if no longer needed
