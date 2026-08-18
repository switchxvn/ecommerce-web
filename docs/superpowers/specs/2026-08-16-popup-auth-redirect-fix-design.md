# Popup Authentication, Styling, and Persistent Dismissal

## Problem

The advertising popup admin pages use both `auth` and `permission` route middleware. The `permission` middleware calls `checkAuth()` again during navigation. A failed or transient profile request can therefore clear or invalidate the current page state and redirect the administrator to `/auth/login`, even though the surrounding admin session is already active.

The existing `/settings/general` page uses only the `auth` route middleware and performs authorization inside the page after the shared user store has loaded.

## Design

Make all advertising popup pages follow the `/settings/general` route pattern:

- Use only `middleware: ['auth']` on the popup list, create, and edit pages.
- Retain `usePagePermissions(['VIEW_SETTINGS'])` on the list page.
- Retain `usePagePermissions(['EDIT_SETTINGS'])` on the create and edit pages.
- Retain the existing edit/delete visibility checks.
- Retain backend tRPC permission enforcement for every popup operation.
- Do not change the global `permission` middleware because that would broaden the scope beyond the popup feature.

### Public popup styling

- Use the project's neutral theme tokens to give the popup panel a light gray background and a corresponding dark-mode background.
- Increase the promotional body copy to semibold while retaining a stronger visual hierarchy for the headline and price.
- Keep the CTA on the project's primary color tokens.

### Persistent dismissal

- Add a checkbox labeled `Không hiển thị lại lần sau`, unchecked by default.
- Keep the existing once-per-tab-session behavior when the checkbox is not selected.
- When selected, persist the current campaign ID in `localStorage` when the visitor closes the popup or follows the CTA.
- Suppress only the campaign IDs stored by that browser. A newly activated campaign must still display.
- Treat unavailable or malformed browser storage as non-fatal and fall back to the existing session behavior.
- Do not store this preference in the database because it is anonymous, browser-local state and must not require an account.

## Error Handling

Authentication remains the responsibility of the existing `auth` middleware and admin layout. Authorization failures continue to route users back to `/settings` through `usePagePermissions`. Backend `UNAUTHORIZED` and `FORBIDDEN` responses remain authoritative.

Popup storage failures must not prevent closing the modal or following the CTA. The preference is best-effort and campaign-specific.

## Verification

- Add a source-contract regression test asserting that all popup pages use only the `auth` middleware while preserving their page-level permission checks.
- Verify the checkbox is unchecked by default and uses the requested Vietnamese label.
- Verify close and CTA actions persist the campaign ID only when selected.
- Verify suppressed campaigns stay hidden across refreshes and new tabs, while new campaigns still display.
- Verify gray theme tokens and semibold body styling in light and dark modes.
- Run the focused advertising popup admin test suite.
- Run the focused public popup frontend test suite.
- Run the admin production build.
- Run the frontend production build, recording any unrelated baseline failure separately.
- Run `git diff --check`.

## Out of Scope

- Refactoring global authentication or permission middleware.
- Changing permission codes or database migrations.
- Server-side tracking or synchronization of anonymous dismissal preferences.
