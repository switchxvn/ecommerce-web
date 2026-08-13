# Advertising Popup Design

## Goal

Add an editable advertising-popup module. Administrators can manage multiple campaigns, while the public website shows at most one active, in-schedule campaign once per browser session on the first public page visited.

## Scope

The feature includes a PostgreSQL table and migration, a dedicated NestJS module, admin CRUD screens, a public campaign endpoint, and a responsive popup in the shared public layout. Campaign analytics, targeting rules, campaign images, and multiple simultaneous active popups are excluded.

## Data Model

Create `advertising_popups` with these columns:

- `id`: generated primary key.
- `name`: required internal campaign name.
- `title`: required public heading.
- `content`: required multiline plain text. Unicode and emoji are preserved.
- `cta_label`: required button label.
- `cta_url`: required internal path or HTTPS URL.
- `is_active`: boolean, default `false`.
- `starts_at`: nullable timestamp with timezone.
- `ends_at`: nullable timestamp with timezone.
- `created_at` and `updated_at`: managed timestamps.

A PostgreSQL partial unique index on `is_active = true` enforces that only one campaign can be active. Enabling a campaign also runs in a transaction that deactivates the previous campaign before activating the selected one.

The initial campaign content is:

```text
✨ Chỉ với 250.000đ/vé khứ hồi người lớn, bạn sẽ nhận ngay:
🚠 Vé cáp treo khứ hồi ngắm toàn cảnh Núi Sam từ trên cao.
🍱 01 suất ăn miễn phí với thực đơn hấp dẫn.
🥤 01 ly nước miễn phí giúp chuyến đi thêm trọn vẹn.

📅 Ưu đãi áp dụng từ Thứ 2 đến Thứ 5 hằng tuần.
```

Its default CTA label is `Đặt vé ngay` and its default CTA URL is the existing `/order-ticket` route.

## Backend Architecture

Add a dedicated advertising-popup module following the project's existing NestJS/TypeORM/tRPC conventions:

- Entity and migration for persistence.
- Admin service and procedures for list, detail, create, update, activate/deactivate, and delete.
- Public service and procedure that returns only the currently eligible campaign.
- Shared input/output schemas and types where existing module conventions require them.

The public eligibility query requires `is_active = true`, `starts_at IS NULL OR starts_at <= now`, and `ends_at IS NULL OR ends_at > now`. It returns `null` when no campaign qualifies.

Validation rules:

- `name`, `title`, `content`, `cta_label`, and `cta_url` are non-empty.
- `ends_at` must be later than `starts_at` when both exist.
- The CTA accepts a root-relative internal path or an absolute HTTPS URL. Unsafe schemes such as `javascript:` are rejected.
- An active campaign cannot be deleted without first being deactivated or explicitly confirming the state-changing operation in the admin UI. The backend still rejects deletion of an active campaign to protect non-UI clients.

## Admin Experience

Add “Popup quảng cáo” to the existing Settings area, guarded by the existing settings-management permission pattern.

The campaign list shows internal name, active state, start/end schedule, and edit, activate/deactivate, and delete actions. Activation clearly communicates that any currently active campaign will be disabled.

The create/edit form contains:

- Internal campaign name.
- Public title.
- Multiline plain-text content.
- CTA label and URL.
- Optional start and end date-times.
- Active toggle.
- A live preview using the approved centered-content layout.

The form uses established admin components, spacing, buttons, validation messages, light/dark theme tokens, and toast/confirmation patterns.

## Public Popup Experience

Create a focused popup component and mount it once in the shared public layout so it works on every public route. The admin application and authentication-only surfaces do not render it.

Behavior:

1. The shared layout requests the eligible public campaign after client initialization.
2. If there is no session marker and a campaign is returned, the layout records the marker and opens the popup.
3. The marker lives in `sessionStorage`, so navigation within the same tab does not show the popup again. A new browser session may show it again.
4. The marker is global for the tab session. Even if the active campaign changes, no second popup appears until a new browser session begins.
5. The visitor can close with the close button, Escape, or the overlay. The CTA uses Nuxt navigation for internal routes and safe browser navigation for HTTPS URLs.

Recording the marker when the popup opens, rather than only when it closes, guarantees at-most-once display even if the component remounts or navigation occurs immediately.

## Visual Design and Accessibility

Use the approved “A · Thẻ nội dung tập trung” layout: a centered, image-free content card with a clear title, multiline benefits, schedule text, CTA, and close control.

Colors must come from the project's active theme tokens, including `primary`, `primary-foreground`, `card`, `card-foreground`, `muted`, `muted-foreground`, and `border`. The implementation must not introduce a standalone gold/brown advertising palette. The existing blue theme acts only as the fallback when runtime theme values are unavailable. Dark mode must use the corresponding project tokens.

The popup must:

- Fit mobile and desktop widths.
- Constrain its height and scroll content on short screens.
- Use the project's modal z-index layer.
- Move focus into the dialog, trap focus while open, restore focus on close, expose dialog semantics, and provide an accessible close label.
- Respect reduced-motion preferences.
- Maintain sufficient contrast in both light and dark themes.

## Failure Handling

Public API failure, an invalid response, or no eligible campaign results in no popup and does not block page rendering. Admin mutations keep the form data, show an error notification, and allow retry. Transaction failures must roll back activation so the previous active state is not partially changed.

## Testing

Backend tests cover:

- CRUD and required-field validation.
- CTA URL validation.
- Schedule validation and boundary eligibility.
- Transactional activation and the one-active-campaign invariant.
- Rejection of active-campaign deletion.
- Public response when eligible, expired, scheduled, inactive, or absent.

Frontend tests cover:

- Plain-text multiline/emoji rendering without interpreting HTML.
- Open, close button, Escape, overlay, focus management, and CTA behavior.
- Global per-session `sessionStorage` marker and no repeat during route navigation.
- Graceful handling of `null`, invalid data, and API failure.
- Theme token and dark-mode classes.

Run relevant backend and frontend test suites, type checks, and production builds. Perform visual checks at representative mobile and desktop sizes in light and dark modes.

## Acceptance Criteria

- Admin users can create, edit, schedule, activate, deactivate, and delete inactive campaigns.
- The system cannot have more than one active campaign.
- Only an active campaign inside its optional schedule is returned publicly.
- The popup appears on the first public page visited at most once per tab session.
- All supplied content and CTA fields are editable in admin.
- The popup matches the approved centered layout and the project's runtime color theme.
- Popup failures never prevent the public page from rendering.
