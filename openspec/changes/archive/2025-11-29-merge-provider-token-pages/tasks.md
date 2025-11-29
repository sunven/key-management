# Implementation Tasks

## 1. Create Unified Provider-Token Components

- [x] 1.1 Create `components/providers/provider-token-list.tsx` with expandable table structure
- [x] 1.2 Create `components/providers/provider-token-row.tsx` for individual provider rows with expansion logic
- [x] 1.3 Add state management for tracking expanded providers (`Set<number>`)
- [x] 1.4 Implement expand/collapse toggle functionality
- [x] 1.5 Add nested token display within expanded provider rows
- [x] 1.6 Integrate token masking and visibility toggle (reuse existing logic from `token-list.tsx`)
- [x] 1.7 Add "Add Token" button within expanded provider sections (pre-select provider)

## 2. Update Token Dialog for Contextual Use

- [x] 2.1 Modify `components/tokens/token-dialog.tsx` to accept optional `preSelectedProviderId` prop
- [x] 2.2 When `preSelectedProviderId` is provided, hide or disable provider selection dropdown
- [x] 2.3 Ensure token dialog still works for standalone use (with provider selection)

## 3. Update Provider Page Route

- [x] 3.1 Replace `app/providers/page.tsx` to use new `ProviderTokenList` component
- [x] 3.2 Remove reference to old `ProviderList` component
- [x] 3.3 Test page renders correctly with providers and expandable tokens

## 4. Deprecate Tokens Route

- [x] 4.1 Update `app/tokens/page.tsx` to redirect to `/providers` using Next.js `redirect()`
- [x] 4.2 Test redirect works correctly when accessing `/tokens` URL
- [x] 4.3 Verify no console errors or infinite redirect loops

## 5. Update Navigation Components

- [x] 5.1 Update `components/layout/navbar.tsx` to remove "Tokens" navigation link
- [x] 5.2 Verify navbar only shows "Dashboard" and "Providers" links
- [x] 5.3 Update `app/page.tsx` dashboard "Quick Actions" section
- [x] 5.4 Replace separate "Manage Providers" and "Manage Tokens" buttons with single "Manage Providers" button linking to `/providers`

## 6. Testing and Validation

- [x] 6.1 Test expanding and collapsing multiple providers
- [x] 6.2 Test adding a new token from within an expanded provider section
- [x] 6.3 Test editing and deleting tokens from the unified view
- [x] 6.4 Test token masking and visibility toggle functionality
- [x] 6.5 Test provider CRUD operations still work correctly
- [x] 6.6 Verify user isolation (only see own providers and tokens)
- [x] 6.7 Test cascade delete warning when deleting provider with tokens
- [x] 6.8 Test redirect from `/tokens` to `/providers`
- [x] 6.9 Verify no broken links in navigation

## 7. Cleanup (Optional)

- [ ] 7.1 Remove `components/tokens/token-list.tsx` if no longer used
- [ ] 7.2 Archive old implementation code for reference
- [ ] 7.3 Update any inline code comments referencing the old structure
