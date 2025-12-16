<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multi-user key management application** for securely storing and managing API provider credentials and tokens. Built with Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL), Prisma ORM, NextAuth.js v5, and shadcn/ui components.

**Core Features:**
- Google OAuth authentication with multi-user isolation
- Provider management (API base URLs and metadata)
- Token management with masked display (click to reveal)
- Group management (key-value storage with tagging system)
- Full CRUD operations with user-scoped access control

## Commands

### Development
```bash
pnpm dev          # Start development server at http://localhost:3100
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database Operations
```bash
pnpm db:generate  # Generate Prisma Client from schema
pnpm db:migrate   # Create and apply migrations
pnpm db:push      # Push schema changes to Supabase (no migrations)
pnpm db:studio    # Open Prisma Studio (visual database browser)
```

**Important:** This project uses `pnpm` as the package manager (pnpm-lock.yaml present).

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, React Server Components)
- **React**: 19.2.0 with automatic JSX transform
- **Database**: Supabase PostgreSQL (hosted)
- **ORM**: Prisma ORM with relational queries
- **Authentication**: NextAuth.js v5 with Google OAuth
- **UI**: shadcn/ui (New York style) with Tailwind CSS v4
- **Validation**: Zod schemas
- **TypeScript**: Strict mode enabled

### Database Schema & Multi-User Isolation

The application uses a **multi-table relational schema** with user isolation enforced at both database and API levels:

**Schema hierarchy:**
```
users (from NextAuth)
  ↓ (one-to-many)
  ├── providers (user_id FK with CASCADE delete)
  │     ↓ (one-to-many)
  │     └── tokens (provider_id FK with CASCADE delete)
  │
  └── groups (user_id FK with CASCADE delete)
        ↓ (one-to-many)
        └── group_items (group_id FK with CASCADE delete)
              ↓ (one-to-many)
              └── item_tags (item_id FK with CASCADE delete)
```

**Key schema details** ([prisma/schema.prisma](prisma/schema.prisma)):
- `users`: Auto-synced during Google OAuth sign-in (see [auth.ts](auth.ts) callbacks)
- `providers`: Each provider belongs to one user; deleting a user cascades to providers
- `tokens`: Each token belongs to one provider; deleting a provider cascades to tokens
- `groups`: Independent key-value storage system per user (separate from providers/tokens)
- `group_items`: Key-value pairs within a group (unique constraint on groupId + key)
- `item_tags`: Tags for group items with indexing for fast search
- All tables use Prisma relations for type-safe joins (`include: { tokens: true }`)

**User isolation enforcement:**
- Database level: Foreign key `userId` on providers and groups tables
- API level: All routes filter by `session.user.id` (see API routes below)
- Never query providers/tokens/groups without checking ownership

### Authentication Flow

**Authentication architecture** ([auth.ts](auth.ts)):

1. **User sign-in** (NextAuth.js v5):
   - Google OAuth configured in [auth.ts](auth.ts)
   - `signIn` callback automatically creates user in database if new
   - `session` callback enriches session with database user ID

2. **Session management**:
   - Session includes `user.id` (database primary key, not OAuth ID)
   - All API routes use `await auth()` to get current session
   - Session user ID is used to filter database queries

3. **Route protection**:
   - NextAuth.js v5 handles route protection automatically
   - Unauthenticated users redirected to `/auth/signin` with callback URL
   - Custom sign-in page at [app/auth/signin/page.tsx](app/auth/signin/page.tsx)

**Adding authentication to new routes:**
```typescript
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id);
  // Use userId to filter queries
}
```

### API Routes Pattern

All API routes follow a **consistent pattern** for user isolation:

**List/Create pattern** ([app/api/providers/route.ts](app/api/providers/route.ts), [app/api/tokens/route.ts](app/api/tokens/route.ts), [app/api/groups/route.ts](app/api/groups/route.ts)):
- `GET`: Query with `where: { userId }` or filter results by ownership
- `POST`: Validate with Zod, insert with `userId` from session
- Always check session before database operations

**Get/Update/Delete pattern** ([app/api/providers/[id]/route.ts](app/api/providers/[id]/route.ts), [app/api/tokens/[id]/route.ts](app/api/tokens/[id]/route.ts), [app/api/groups/[id]/route.ts](app/api/groups/[id]/route.ts)):
- Verify ownership with `where: { id, userId }`
- Return 404 if not found OR not owned by user (don't leak existence)
- Use `params` as `Promise<{ id: string }>` (Next.js 16 requirement)

**Common mistakes to avoid:**
- ❌ Querying all providers/tokens without user filter
- ❌ Using OAuth user ID instead of database user ID
- ❌ Forgetting to parse `session.user.id` to integer
- ❌ Not awaiting `params` in dynamic routes (`await params`)

### Component Architecture

**Server vs Client Components:**
- Pages ([app/*/page.tsx](app/page.tsx)): Server Components that fetch data
- Lists/Dialogs ([components/providers/*](components/providers/), [components/tokens/*](components/tokens/), [components/groups/*](components/groups/)): Client Components with `'use client'`
- Layout ([components/layout/navbar.tsx](components/layout/navbar.tsx)): Server Component
- User Menu ([components/layout/user-menu.tsx](components/layout/user-menu.tsx)): Client Component (uses `signOut` from `next-auth/react`)

**Data fetching pattern:**
- Server Components: Direct database queries via Prisma
- Client Components: Fetch from API routes using `fetch()`
- No shared data fetching library (no React Query, SWR, etc.)

**Form handling:**
- React Hook Form + Zod resolver for validation
- shadcn/ui dialog components for modals
- Toast notifications via `sonner` library for user feedback
- Callbacks (`onSuccess`) to refresh parent component data

### Key Files & Responsibilities

**Authentication:**
- [auth.ts](auth.ts): NextAuth.js configuration, user sync, session enrichment
- [types/next-auth.d.ts](types/next-auth.d.ts): TypeScript augmentation for session.user.id

**Database:**
- [prisma/schema.prisma](prisma/schema.prisma): Prisma schema with relations (users, providers, tokens, groups, group_items, item_tags)
- [lib/db/prisma.ts](lib/db/prisma.ts): Prisma Client instance (database connection)
- [lib/schemas.ts](lib/schemas.ts): Zod validation schemas for all entities

**API Routes:**
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts): NextAuth.js handlers export
- [app/api/providers/*](app/api/providers/): Provider CRUD with user isolation
- [app/api/tokens/*](app/api/tokens/): Token CRUD with provider ownership verification
- [app/api/groups/*](app/api/groups/): Group CRUD with nested items and tags
- [app/api/tags/*](app/api/tags/): Tag search and management

**UI Components:**
- [components/ui/*](components/ui/): shadcn/ui base components (do not edit directly)
- [components/providers/](components/providers/): Provider management components
- [components/tokens/](components/tokens/): Token management components
- [components/groups/](components/groups/): Group management with tag filtering and search

### Environment Variables

Required environment variables (create `.env.local` in project root):

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (not currently used)
- `DIRECT_URL`: PostgreSQL connection string (used by Prisma - Transaction mode)

**NextAuth.js:**
- `AUTH_SECRET`: Random secret (generate with `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID`: Google OAuth client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `NEXTAUTH_URL`: App URL (http://localhost:3100 for dev)

### TypeScript Configuration

- Path alias: `@/*` maps to project root
- Strict mode enabled
- React 19 automatic JSX transform (`jsx: "react-jsx"`)
- Target: ES2017

### Styling System

- **Tailwind CSS v4** with PostCSS plugin
- **shadcn/ui** configured with:
  - Style: "new-york"
  - Base color: neutral
  - CSS variables for theming
  - Icon library: lucide-react
- Design tokens in [app/globals.css](app/globals.css) using OKLCH color space
- **Dark theme**: Application uses a custom dark cyberpunk theme with cyan/slate colors
- Custom styling: Monospace fonts, neon glow effects, grid backgrounds

## Development Notes

### OpenSpec Workflow

This project uses **OpenSpec** for managing architectural changes and feature proposals:

- **When to use**: For new capabilities, breaking changes, architecture shifts, or significant features
- **Documentation**: See [openspec/AGENTS.md](openspec/AGENTS.md) for detailed workflow
- **Slash commands**:
  - `/openspec:proposal` - Create a new change proposal
  - `/openspec:apply` - Implement an approved proposal
  - `/openspec:archive` - Archive a completed change
- **Structure**: Proposals live in `openspec/changes/`, specs in `openspec/specs/`
- **Project overview**: See [openspec/project.md](openspec/project.md)

### Adding New Features

**Adding a new entity (e.g., "Projects"):**

1. **Schema** (`prisma/schema.prisma`):
   ```prisma
   model Project {
     id        Int      @id @default(autoincrement())
     userId    Int
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     // ... other fields
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Run migration**:
   ```bash
   pnpm db:generate  # Generate Prisma Client
   pnpm db:migrate   # Create and apply migration
   ```

3. **API routes** (`app/api/projects/route.ts`):
   - Follow existing provider/token route patterns
   - Enforce user isolation with `where: { userId }`

4. **Components** (`components/projects/`):
   - Create `project-list.tsx` and `project-dialog.tsx`
   - Follow existing component patterns

### Working with Forms

All forms use **React Hook Form + Zod**:
- Define schema with `z.object({})` in [lib/schemas.ts](lib/schemas.ts)
- Use `zodResolver` in `useForm()`
- shadcn/ui form components with error display
- Handle submission with try/catch, show errors via `toast.error()` from `sonner`
- Success feedback via `toast.success()` or callback refresh

### Token Security

**Token masking implementation:**
- Stored as plain text in database (application-level encryption not implemented)
- Masked in UI: `maskToken()` shows `***...last4chars`
- Click eye icon to reveal (state in `visibleTokens: Set<number>`)
- Never log tokens to console or error messages

### Groups Feature

**Groups provide flexible key-value storage separate from providers/tokens:**
- Each group contains multiple key-value items
- Items can have multiple tags for organization and search
- Tag validation: alphanumeric, Chinese characters, hyphens, underscores only (see [lib/schemas.ts](lib/schemas.ts))
- Unique constraint: `groupId + key` must be unique
- Global tag search across all groups ([app/api/tags/search/route.ts](app/api/tags/search/route.ts))
- Tag filtering within groups
- Use cases: Environment variables, configuration sets, API keys not tied to specific providers

### Database Queries

**Prisma ORM patterns used:**
- Relational queries: `prisma.provider.findMany({ include: { tokens: true } })`
- Filtering: `where: { field: value }` or `where: { field1: value1, field2: value2 }`
- Mutations: `prisma.table.create({ data: {...} })`
- Updates: `prisma.table.update({ where: { id }, data: {...} })`
- Deletes: `prisma.table.delete({ where: { id } })`

**Prisma automatically returns the created/updated row without needing `.returning()`**

### Next.js 16 Specifics

- **Dynamic route params**: Must await params (`const { id } = await params`)
- **App Router**: All routes in `app/` directory
- **Server Actions**: Can use `'use server'` for form submissions (used in sign-in page)
- **React Server Components**: Default for all components unless `'use client'`

### Common Patterns

**API error handling:**
```typescript
try {
  const response = await fetch('/api/endpoint', { method: 'POST', ... });
  if (!response.ok) throw new Error('Failed to ...');
  // Success handling
} catch (error) {
  console.error('Error:', error);
  toast.error('Failed to ... Please try again.');
}
```

**User confirmation for destructive actions:**
```typescript
if (!confirm('Are you sure you want to delete...?')) {
  return;
}
```

**Loading states:**
- Use `loading` state variable
- Show spinner with cyan glow effect (see existing components)
- Disable buttons during loading

### Common Tasks

**Adding a shadcn/ui component:**
```bash
pnpm dlx shadcn@latest add [component-name]
```

**Debugging authentication issues:**
1. Check `.env.local` has all required variables
2. Verify Google OAuth redirect URI matches exactly (`http://localhost:3100/api/auth/callback/google`)
3. Verify `AUTH_SECRET` is set (generate with `openssl rand -base64 32`)
4. Inspect session with `console.log(await auth())` in API route
5. Check browser console for NextAuth errors

**Database schema changes:**
1. Modify [prisma/schema.prisma](prisma/schema.prisma)
2. Run `pnpm db:generate` to generate Prisma Client
3. Run `pnpm db:migrate` to create and apply migration (or `pnpm db:push` for prototyping)
4. Never edit database directly; always change schema.prisma first

**Viewing database:**
```bash
pnpm db:studio  # Opens Prisma Studio at http://localhost:5555
```

## Setup Requirements

Before running the application, developers must:

1. Create Supabase project and get connection string
2. Set up Google OAuth credentials (see README.md)
3. Configure `.env.local` with all required variables
4. Run `pnpm db:push` or `pnpm db:migrate` to create database tables
5. Ensure Google OAuth redirect URI is `http://localhost:3100/api/auth/callback/google`

If authentication fails, users will be stuck in redirect loop - check environment variables first.
