## MODIFIED Requirements

### Requirement: Database Schema Definition

The system SHALL define the database schema using Prisma Schema Language in `prisma/schema.prisma`, which includes User, Provider, and Token models with appropriate relations and constraints.

#### Scenario: Prisma schema defines User model

- **WHEN** the schema file is read
- **THEN** it contains a `User` model with fields: id (auto-increment), email (unique), name (optional), image (optional), createdAt (timestamp)
- **AND** the User model has a one-to-many relation to Provider

#### Scenario: Prisma schema defines Provider model

- **WHEN** the schema file is read
- **THEN** it contains a `Provider` model with fields: id (auto-increment), userId (foreign key), baseUrl, name, description (optional), active (boolean default true), createdAt, updatedAt (timestamp)
- **AND** the Provider model has a foreign key relation to User with CASCADE delete
- **AND** the Provider model has a one-to-many relation to Token

#### Scenario: Prisma schema defines Token model

- **WHEN** the schema file is read
- **THEN** it contains a `Token` model with fields: id (auto-increment), providerId (foreign key), token (text), createdAt, updatedAt (timestamp)
- **AND** the Token model has a foreign key relation to Provider with CASCADE delete

#### Scenario: Schema configuration uses PostgreSQL

- **WHEN** the schema datasource is configured
- **THEN** the provider is set to "postgresql"
- **AND** the database URL is read from environment variable DATABASE_URL

### Requirement: Database Client Initialization

The system SHALL use Prisma Client singleton pattern for database access to prevent connection exhaustion in development and optimize production performance.

#### Scenario: Prisma Client initialized as singleton

- **WHEN** the database client is imported from `lib/db/prisma.ts`
- **THEN** a single Prisma Client instance is created and reused
- **AND** in development mode, the instance is attached to global object to survive hot-reloads
- **AND** in production mode, a new instance is created normally

#### Scenario: Database client exports Prisma instance

- **WHEN** code imports from `lib/db/prisma`
- **THEN** a `prisma` export is available for all database operations
- **AND** the instance is properly typed with generated Prisma Client types

### Requirement: Type-Safe Database Queries

The system SHALL use Prisma Client's generated TypeScript types for all database operations, replacing Drizzle's query builder with Prisma's type-safe API.

#### Scenario: User queries use Prisma syntax

- **WHEN** user records are queried in authentication flow
- **THEN** Prisma methods like `prisma.user.findFirst()`, `prisma.user.upsert()` are used
- **AND** all queries return Prisma-generated types (`User`, `User | null`, etc.)

#### Scenario: Provider queries use Prisma relational queries

- **WHEN** providers are fetched with their tokens
- **THEN** Prisma's `include: { tokens: true }` is used for eager loading
- **AND** returned type includes nested Token array with full type safety

#### Scenario: Token queries filter by ownership

- **WHEN** tokens are queried by user
- **THEN** Prisma's nested where conditions filter by `provider.userId`
- **AND** user isolation is enforced at query level

#### Scenario: CRUD operations use Prisma methods

- **WHEN** creating records
- **THEN** `prisma.model.create({ data: {...} })` is used
- **WHEN** updating records
- **THEN** `prisma.model.update({ where: {...}, data: {...} })` is used
- **WHEN** deleting records
- **THEN** `prisma.model.delete({ where: {...} })` is used
- **AND** all operations return the affected record automatically

### Requirement: Migration Management with Prisma Migrate

The system SHALL use Prisma Migrate for declarative, version-controlled database migrations instead of Drizzle's push command.

#### Scenario: Schema changes generate migrations

- **WHEN** developers modify `prisma/schema.prisma`
- **THEN** running `pnpm prisma migrate dev --name <description>` generates a migration file
- **AND** the migration file is stored in `prisma/migrations/` directory
- **AND** the migration is automatically applied to the development database

#### Scenario: Production migrations are explicit

- **WHEN** deploying to production
- **THEN** `pnpm prisma migrate deploy` applies pending migrations
- **AND** no automatic schema changes occur without explicit migration files

#### Scenario: Migration history is tracked

- **WHEN** migrations are created
- **THEN** each migration has a timestamp and descriptive name
- **AND** the `_prisma_migrations` table tracks applied migrations
- **AND** migrations can be reviewed in version control

### Requirement: Database Administration Tools

The system SHALL provide Prisma Studio for visual database browsing and Prisma Client generation commands for development workflow.

#### Scenario: Developers use Prisma Studio

- **WHEN** developers run `pnpm db:studio`
- **THEN** Prisma Studio opens in browser at `http://localhost:5555`
- **AND** all tables (User, Provider, Token) are browsable with full CRUD interface
- **AND** data can be viewed, edited, created, and deleted visually

#### Scenario: Prisma Client generation

- **WHEN** schema changes or after fresh install
- **THEN** `pnpm prisma generate` regenerates Prisma Client with updated types
- **AND** TypeScript IntelliSense reflects current schema structure
- **AND** generated types are available at `@prisma/client`

## REMOVED Requirements

### Requirement: Drizzle ORM Schema Definition

**Reason**: Replaced by Prisma Schema Language for better developer experience and migration tooling.

**Migration**: All Drizzle schema definitions in `lib/db/schema.ts` have been translated to Prisma schema in `prisma/schema.prisma` with equivalent structure. Relations previously defined via Drizzle's `relations()` are now expressed as Prisma relation fields.

### Requirement: Drizzle Query Builder API

**Reason**: Replaced by Prisma Client's type-safe query API for more intuitive syntax and better IntelliSense support.

**Migration**: All Drizzle queries (`db.query.*.findMany()`, `db.insert().values()`, etc.) have been replaced with Prisma equivalents (`prisma.*.findMany()`, `prisma.*.create()`). Query patterns mapped systematically as documented in design.md.

### Requirement: Drizzle Kit CLI Commands

**Reason**: Replaced by Prisma CLI for schema introspection, migration management, and database tooling.

**Migration**:
- `pnpm db:generate` → `pnpm prisma generate` (generates client types)
- `pnpm db:push` → `pnpm prisma migrate dev` (applies schema changes with migration tracking)
- `pnpm db:studio` → `pnpm prisma studio` (opens database GUI)

### Requirement: postgres.js Driver Configuration

**Reason**: Prisma Client includes its own database driver and connection pooling; explicit postgres.js configuration no longer needed.

**Migration**: Database connection configured solely via `DATABASE_URL` environment variable in `prisma/schema.prisma`. Prisma automatically handles connection pooling and transaction mode compatibility with Supabase.
