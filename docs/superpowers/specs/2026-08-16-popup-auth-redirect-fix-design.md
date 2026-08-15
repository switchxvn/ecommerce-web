# Popup Admin Authentication Redirect Fix

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

## Error Handling

Authentication remains the responsibility of the existing `auth` middleware and admin layout. Authorization failures continue to route users back to `/settings` through `usePagePermissions`. Backend `UNAUTHORIZED` and `FORBIDDEN` responses remain authoritative.

## Verification

- Add a source-contract regression test asserting that all popup pages use only the `auth` middleware while preserving their page-level permission checks.
- Run the focused advertising popup admin test suite.
- Run the admin production build.
- Run `git diff --check`.

## Out of Scope

- Refactoring global authentication or permission middleware.
- Changing permission codes or database migrations.
- Changing popup UI or campaign behavior.
