# Design: Unified Provider-Token Management Interface

## Context

The current implementation separates Providers and Tokens into distinct pages, following a traditional normalized database view. However, this creates unnecessary navigation friction because:

1. **Tight coupling**: Tokens cannot exist without a provider (foreign key constraint)
2. **Common workflows**: Users typically add a provider, then immediately add tokens for it
3. **Mental model**: Users think of "provider credentials" as a single concept, not two separate entities

The database schema enforces a clear parent-child relationship:
```
providers (parent)
  ↓ providerId FK (CASCADE delete)
tokens (child)
```

This hierarchical structure naturally maps to a nested UI representation.

## Goals / Non-Goals

**Goals:**
- Reduce navigation between related entities
- Present data in a hierarchical structure matching the mental model
- Maintain all existing security controls (user isolation, token masking)
- Preserve all existing CRUD operations for both providers and tokens
- Improve discoverability (tokens for a provider are visible without navigation)

**Non-Goals:**
- Changing database schema or API endpoints
- Adding new features beyond UI reorganization
- Changing authentication or authorization logic
- Implementing new token management capabilities

## Decisions

### Decision 1: Expandable/Collapsible Provider Rows

**Chosen approach**: Use expandable table rows with inline token display

**Rationale:**
- Maintains table structure for easy scanning of providers
- Tokens appear in context when needed (on-demand expansion)
- No additional page loads or modals required
- Familiar pattern in admin interfaces

**Alternatives considered:**
1. **Accordion component**: Would work but limits table functionality (sorting, fixed columns)
2. **Master-detail sidebar**: Requires more screen real estate, more complex state management
3. **Nested routes** (`/providers/:id/tokens`): Defeats the purpose of unifying the interface

**Implementation approach:**
- Add an expand/collapse icon column to the provider table
- When expanded, show nested table or list of tokens below the provider row
- Use local state to track which providers are expanded
- Token actions (add, edit, delete) remain inline within the expanded section

### Decision 2: Component Reusability

**Chosen approach**: Create a new unified component, deprecate standalone token list

**Rationale:**
- Avoids prop-drilling complexity
- Clear separation of concerns
- Easier to maintain single source of truth for provider-token display

**Component structure:**
```
components/providers/
  provider-token-list.tsx        # New: Unified component
  provider-token-row.tsx         # New: Expandable row with tokens
  provider-dialog.tsx            # Existing: Keep as-is

components/tokens/
  token-dialog.tsx               # Existing: Keep (reused in unified view)
  token-list.tsx                 # Deprecated: Remove after migration
```

### Decision 3: Route Handling

**Chosen approach**: Keep `/providers` as primary route, redirect `/tokens` to `/providers`

**Rationale:**
- Providers are the parent entity, logical primary route
- Graceful migration for bookmarked `/tokens` URLs
- Clear single source of truth

**Implementation:**
```typescript
// app/tokens/page.tsx
import { redirect } from 'next/navigation';
export default function TokensPage() {
  redirect('/providers');
}
```

### Decision 4: Navigation Updates

**Chosen approach**: Remove "Tokens" link from navbar, keep "Providers"

**Rationale:**
- Single entry point reduces cognitive load
- Navbar stays clean
- Users can still find tokens via providers page

**Update locations:**
- `components/layout/navbar.tsx`: Remove tokens link
- `app/page.tsx`: Update "Quick Actions" to have single "Manage Providers & Tokens" button

## Technical Approach

### Component State Management

**Provider expansion state:**
```typescript
const [expandedProviders, setExpandedProviders] = useState<Set<number>>(new Set());

const toggleProvider = (id: number) => {
  setExpandedProviders(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};
```

**Data fetching:**
- Single fetch call to `/api/providers` (already returns tokens via relational query)
- No additional API changes needed
- Existing `ProviderWithTokenCount` type already includes tokens array

### UI Layout Structure

```
[Provider Table]
  Row: Provider 1 [▼]
    Name | Base URL | Description | Status | Tokens | Actions

  [Expanded Section]
    [Token Sub-table]
      Token | Status | Created | Actions
      ***sk-abc123 | Active | 2025-01-15 | Edit | Delete

  Row: Provider 2 [▶]
    Name | Base URL | Description | Status | Tokens | Actions
```

### Token Actions in Unified View

**Add token:**
- "Add Token" button appears in expanded provider section
- Pre-selects current provider in token dialog
- Refreshes provider list on success

**Edit/Delete token:**
- Inline actions within token sub-table
- Same dialogs/logic as standalone token page
- Scoped to current provider context

## Risks / Trade-offs

### Risk: Increased Complexity in Single Component

**Mitigation:**
- Break into smaller sub-components (`provider-token-row.tsx`)
- Keep token dialog logic separate and reusable
- Use clear state management patterns

### Risk: Performance with Many Providers/Tokens

**Current assessment**: Low risk
- Existing API already fetches all data in single query
- No N+1 queries
- Expansion state is client-side only

**Future optimization** (if needed):
- Lazy-load tokens on expansion (separate API call)
- Virtualized table for >100 providers
- Pagination

### Risk: Breaking User Bookmarks

**Mitigation:**
- Redirect `/tokens` → `/providers` (not 404)
- Maintain redirect for 2-3 releases
- Consider deep linking to expanded provider if needed

## Migration Plan

1. **Phase 1: Build unified component**
   - Create `provider-token-list.tsx` with expansion logic
   - Create `provider-token-row.tsx` for row rendering
   - Test with existing API (no backend changes)

2. **Phase 2: Update routes**
   - Replace `app/providers/page.tsx` to use new component
   - Add redirect in `app/tokens/page.tsx`
   - Test navigation flows

3. **Phase 3: Update navigation**
   - Remove "Tokens" link from navbar
   - Update dashboard quick actions
   - Update any documentation/help text

4. **Phase 4: Cleanup** (optional)
   - Remove `components/tokens/token-list.tsx` if no longer used
   - Archive old token page code

**Rollback plan:**
- Keep old components for 1 release cycle
- Can revert by swapping page component imports
- No data migration needed

## Open Questions

None. The change is well-scoped with clear implementation path.
