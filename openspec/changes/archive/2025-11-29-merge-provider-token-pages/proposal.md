# Change: Merge Providers and Tokens into Unified Management Page

## Why

Currently, Providers and Tokens are managed on separate pages (`/providers` and `/tokens`), requiring users to navigate between two different routes to manage related entities. Since tokens are tightly coupled to providers (each token belongs to a provider), managing them together would provide a more intuitive user experience and reduce navigation overhead.

## What Changes

- Merge the Providers and Tokens pages into a single unified page at `/providers`
- Display providers with their associated tokens in an expandable/collapsible layout (accordion or nested table)
- Keep token management actions (add, edit, delete) within the unified interface
- Remove the standalone `/tokens` page and route
- Update navigation to remove the "Tokens" link
- Maintain all existing functionality (CRUD operations, token masking, user isolation)

## Impact

**Affected specs:**
- New spec: `provider-token-management` (unified UI capability)

**Affected code:**
- `app/providers/page.tsx` - Enhanced to show providers with tokens
- `app/tokens/page.tsx` - To be removed
- `components/providers/provider-list.tsx` - Enhanced to display nested tokens
- `components/tokens/token-list.tsx` - May be refactored or removed
- `components/layout/navbar.tsx` - Remove "Tokens" navigation link
- `app/page.tsx` (Dashboard) - Update "Quick Actions" to reflect unified page

**Migration notes:**
- Existing routes remain backward compatible temporarily
- `/tokens` route can redirect to `/providers` or show a deprecation notice
- No database schema changes required
- No API changes required (existing endpoints remain functional)
