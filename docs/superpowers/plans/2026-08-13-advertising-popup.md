# Advertising Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scheduled, admin-editable advertising popup system that permits one active campaign and displays it once per public browser-tab session.

**Architecture:** A dedicated NestJS/TypeORM module owns campaign persistence and the active-campaign invariant. tRPC exposes protected admin CRUD and one public eligible-campaign query. Nuxt admin pages manage campaigns; one accessible Vue component in the public default layout renders the campaign with existing theme tokens.

**Tech Stack:** PostgreSQL, TypeORM, NestJS 11, tRPC 10, Zod, Nuxt 3, Vue 3, Tailwind CSS, Jest, Vitest, Vue Test Utils.

---

## File Structure

- `libs/database/src/migrations/1786587000000-CreateAdvertisingPopups.ts`: creates the table, partial unique index, and initial campaign.
- `apps/backend/src/modules/advertising-popup/entities/advertising-popup.entity.ts`: persistence model only.
- `apps/backend/src/modules/advertising-popup/advertising-popup.module.ts`: module wiring and exported services.
- `apps/backend/src/modules/advertising-popup/admin/services/advertising-popup-admin.service.ts`: CRUD, validation guards, and transactional activation.
- `apps/backend/src/modules/advertising-popup/frontend/services/advertising-popup-frontend.service.ts`: public schedule eligibility query.
- `apps/backend/src/modules/advertising-popup/**/*.spec.ts`: isolated service tests.
- `apps/backend/jest.config.ts`: TypeScript-aware backend unit-test runner configuration.
- `apps/backend/src/modules/trpc/routers/advertising-popup.router.ts`: Zod contracts and tRPC procedures.
- `apps/backend/src/modules/{entities.ts,trpc/**,app.module.ts}`: register the entity, services, and router.
- `apps/admin/src/types/advertising-popup.ts`: admin form/list types and defaults.
- `apps/admin/src/composables/useAdvertisingPopups.ts`: all admin API calls and mutation state.
- `apps/admin/src/pages/settings/advertising-popups/{index,new,[id]}.vue`: campaign list, create, and edit surfaces.
- `apps/admin/src/components/settings/AdvertisingPopupForm.vue`: shared form and live preview.
- `apps/admin/src/pages/settings/index.vue`: adds the Settings category entry.
- `apps/frontend/src/types/advertising-popup.ts`: public campaign contract.
- `apps/frontend/src/composables/useAdvertisingPopup.ts`: fetch and per-session display decision.
- `apps/frontend/src/components/modals/AdvertisingPopup.vue`: accessible themed dialog.
- `apps/frontend/src/layouts/default.vue`: mounts the popup once on all public pages.
- `apps/frontend/src/components/modals/AdvertisingPopup.spec.ts` and `apps/frontend/src/composables/useAdvertisingPopup.spec.ts`: UI/session tests.

### Task 1: Persist campaigns and seed the initial promotion

**Files:**
- Create: `apps/backend/jest.config.ts`
- Create: `apps/backend/src/modules/advertising-popup/entities/advertising-popup.entity.ts`
- Create: `libs/database/src/migrations/1786587000000-CreateAdvertisingPopups.ts`
- Modify: `apps/backend/src/modules/entities.ts`

- [ ] **Step 1: Add the backend TypeScript test harness and migration-contract assertions**

Create `apps/backend/src/modules/advertising-popup/entities/advertising-popup.entity.spec.ts` with assertions against TypeORM metadata:

```ts
import { getMetadataArgsStorage } from 'typeorm';
import { AdvertisingPopup } from './advertising-popup.entity';

describe('AdvertisingPopup entity', () => {
  it('maps the campaign fields to advertising_popups', () => {
    const table = getMetadataArgsStorage().tables.find(item => item.target === AdvertisingPopup);
    const columns = getMetadataArgsStorage().columns
      .filter(item => item.target === AdvertisingPopup)
      .map(item => item.propertyName);
    expect(table?.name).toBe('advertising_popups');
    expect(columns).toEqual(expect.arrayContaining([
      'id', 'name', 'title', 'content', 'ctaLabel', 'ctaUrl',
      'isActive', 'startsAt', 'endsAt', 'createdAt', 'updatedAt',
    ]));
  });
});
```

Create `apps/backend/jest.config.ts`:

```ts
export default {
  displayName: 'backend',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.app.json' }],
  },
  moduleNameMapper: {
    '^@ew/shared$': '<rootDir>/../../libs/shared/src/index.ts',
  },
};
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup/entities/advertising-popup.entity.spec.ts --runInBand`

Expected: FAIL because `advertising-popup.entity.ts` does not exist.

- [ ] **Step 3: Add the entity and reversible migration**

Implement the entity with `@Entity('advertising_popups')`, text columns for `content` and `cta_url`, `timestamptz` nullable schedule columns, and snake-case database names. In the migration, execute:

```sql
CREATE TABLE "advertising_popups" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "title" varchar NOT NULL,
  "content" text NOT NULL,
  "cta_label" varchar NOT NULL,
  "cta_url" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT false,
  "starts_at" timestamptz NULL,
  "ends_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CHK_advertising_popups_schedule" CHECK
    ("starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" > "starts_at")
);
CREATE UNIQUE INDEX "IDX_advertising_popups_one_active"
  ON "advertising_popups" ("is_active") WHERE "is_active" = true;
```

Insert one inactive initial campaign using the approved Vietnamese content, `Đặt vé ngay`, and `/order-ticket`. `down()` drops the index and table. Add `AdvertisingPopup` to the shared entity list.

- [ ] **Step 4: Run tests and migration compilation**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup/entities/advertising-popup.entity.spec.ts --runInBand`

Expected: PASS.

Run: `npx tsc -p libs/database/tsconfig.migration.json --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit persistence**

```bash
git add apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup libs/database/src/migrations/1786587000000-CreateAdvertisingPopups.ts apps/backend/src/modules/entities.ts
git commit -m "feat: add advertising popup persistence"
```

### Task 2: Implement backend campaign rules

**Files:**
- Create: `apps/backend/src/modules/advertising-popup/admin/services/advertising-popup-admin.service.ts`
- Create: `apps/backend/src/modules/advertising-popup/admin/services/advertising-popup-admin.service.spec.ts`
- Create: `apps/backend/src/modules/advertising-popup/frontend/services/advertising-popup-frontend.service.ts`
- Create: `apps/backend/src/modules/advertising-popup/frontend/services/advertising-popup-frontend.service.spec.ts`
- Create: `apps/backend/src/modules/advertising-popup/advertising-popup.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Test admin service invariants**

Use mocked `Repository<AdvertisingPopup>` and `DataSource.transaction` to verify: CRUD returns saved records; activation calls `update({ isActive: true }, { isActive: false })` before saving the selected record as active; inactive deletion succeeds; active deletion throws `BadRequestException`; missing IDs throw `NotFoundException`.

```ts
it('deactivates the current campaign before activating the selected one', async () => {
  repo.findOne.mockResolvedValue({ id: 2, isActive: false });
  await service.setActive(2, true);
  expect(manager.update).toHaveBeenCalledWith(AdvertisingPopup, { isActive: true }, { isActive: false });
  expect(manager.save).toHaveBeenCalledWith(AdvertisingPopup, expect.objectContaining({ id: 2, isActive: true }));
});
```

- [ ] **Step 2: Test public schedule boundaries**

Mock the query builder and assert `findEligible(new Date('2026-08-13T00:00:00Z'))` filters active campaigns with nullable start/end boundaries and returns `null` when no row matches.

- [ ] **Step 3: Run tests and verify RED**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup --runInBand`

Expected: FAIL because the services and module are absent.

- [ ] **Step 4: Implement minimal services and module**

Expose these service contracts:

```ts
type PopupWriteInput = Pick<AdvertisingPopup,
  'name' | 'title' | 'content' | 'ctaLabel' | 'ctaUrl' | 'startsAt' | 'endsAt'>;

class AdvertisingPopupAdminService {
  findAll(): Promise<AdvertisingPopup[]>;
  findById(id: number): Promise<AdvertisingPopup>;
  create(input: PopupWriteInput & { isActive?: boolean }): Promise<AdvertisingPopup>;
  update(id: number, input: Partial<PopupWriteInput>): Promise<AdvertisingPopup>;
  setActive(id: number, active: boolean): Promise<AdvertisingPopup>;
  delete(id: number): Promise<void>;
}

class AdvertisingPopupFrontendService {
  findEligible(now?: Date): Promise<AdvertisingPopup | null>;
}
```

Create `AdvertisingPopupModule` with `TypeOrmModule.forFeature([AdvertisingPopup])`; export both services and register it in `AppModule`.

- [ ] **Step 5: Run focused tests and backend build**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup --runInBand`

Expected: PASS.

Run: `npx nx build backend --configuration=development`

Expected: exit 0.

- [ ] **Step 6: Commit domain services**

```bash
git add apps/backend/src/modules/advertising-popup apps/backend/src/app.module.ts
git commit -m "feat: add advertising popup services"
```

### Task 3: Expose protected admin and public tRPC procedures

**Files:**
- Create: `apps/backend/src/modules/trpc/routers/advertising-popup.router.ts`
- Create: `apps/backend/src/modules/trpc/routers/advertising-popup.router.spec.ts`
- Modify: `apps/backend/src/modules/trpc/routers/index.ts`
- Modify: `apps/backend/src/modules/trpc/trpc.router.ts`
- Modify: `apps/backend/src/modules/trpc/trpc.module.ts`
- Modify: `apps/backend/src/modules/trpc/contexts/service.context.ts`
- Modify: `apps/backend/src/modules/trpc/interfaces/trpc-services.interface.ts`

- [ ] **Step 1: Write router validation tests**

Test exported schemas directly and test callers with mocked services. Cover root-relative and HTTPS CTA acceptance, `javascript:` rejection, end-before-start rejection, protected CRUD wiring, and public `getActive` returning `null`.

```ts
expect(popupWriteSchema.safeParse({ ...valid, ctaUrl: '/order-ticket' }).success).toBe(true);
expect(popupWriteSchema.safeParse({ ...valid, ctaUrl: 'https://example.com/deal' }).success).toBe(true);
expect(popupWriteSchema.safeParse({ ...valid, ctaUrl: 'javascript:alert(1)' }).success).toBe(false);
```

- [ ] **Step 2: Run router test and verify RED**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/trpc/routers/advertising-popup.router.spec.ts --runInBand`

Expected: FAIL because the router is absent.

- [ ] **Step 3: Implement schemas and procedures**

Export `popupWriteSchema` with trimmed required strings, nullable coerced dates, URL refinement, and a schedule `superRefine`. Expose `getActive` as `publicProcedure`; expose `list`, `getById`, `create`, `update`, `setActive`, and `delete` as `protectedProcedure`. Preserve `TRPCError` codes for not-found and bad-request failures.

Register the services in both flat and grouped `admin.advertisingPopup` / `frontend.advertisingPopup` contexts, import the module into `TrpcModule`, and register `advertisingPopup` in both router aggregators.

- [ ] **Step 4: Run tests and type/build checks**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/trpc/routers/advertising-popup.router.spec.ts --runInBand`

Expected: PASS.

Run: `npx nx build backend --configuration=development`

Expected: exit 0.

- [ ] **Step 5: Commit API wiring**

```bash
git add apps/backend/src/modules/trpc
git commit -m "feat: expose advertising popup api"
```

### Task 4: Build admin campaign management

**Files:**
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/src/types/advertising-popup.ts`
- Create: `apps/admin/src/composables/useAdvertisingPopups.ts`
- Create: `apps/admin/src/components/settings/AdvertisingPopupForm.vue`
- Create: `apps/admin/src/pages/settings/advertising-popups/index.vue`
- Create: `apps/admin/src/pages/settings/advertising-popups/new.vue`
- Create: `apps/admin/src/pages/settings/advertising-popups/[id].vue`
- Modify: `apps/admin/src/pages/settings/index.vue`

- [ ] **Step 1: Add the admin test harness, define the form contract, and test pure normalization**

Export `createDefaultPopupForm()` and `toPopupMutationInput()` from the type module. Add `apps/admin/src/types/advertising-popup.spec.ts` proving empty date strings become `null`, content preserves line breaks/emoji, and default CTA is `/order-ticket`.

Create `apps/admin/vitest.config.ts` with Vue support, jsdom, and the `@` alias:

```ts
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', globals: true },
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd apps/admin && npx vitest run src/types/advertising-popup.spec.ts`

Expected: FAIL because the type helper is absent.

- [ ] **Step 3: Implement types, composable, and shared form**

The composable wraps `trpc.advertisingPopup` and exposes `campaigns`, `isLoading`, `error`, `fetchAll`, `fetchById`, `create`, `update`, `setActive`, and `remove`. The form emits `submit` with normalized input and renders a live preview using theme classes such as `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`, and `bg-primary`.

- [ ] **Step 4: Implement list/create/edit pages**

Use existing auth middleware and the `ACCESS_ADMIN_SETTINGS` / `MANAGE_SETTINGS` pattern. The list requires confirmation before activation or deletion, prevents delete for active rows, and explains that activation deactivates the current campaign. Create and edit pages reuse `AdvertisingPopupForm` and display toast success/error feedback.

- [ ] **Step 5: Add Settings navigation**

Add a category card in `apps/admin/src/pages/settings/index.vue`:

```ts
{
  title: 'Popup quảng cáo',
  description: 'Quản lý nội dung, lịch chạy và trạng thái popup',
  icon: Megaphone,
  color: 'blue',
  route: '/settings/advertising-popups',
  group: 'advertising-popup',
  permission: 'MANAGE_SETTINGS',
  features: ['Nhiều chiến dịch', 'Lịch bắt đầu/kết thúc', 'Xem trước', 'Một chiến dịch hoạt động'],
  count: 0,
}
```

- [ ] **Step 6: Verify admin**

Run: `cd apps/admin && npx vitest run src/types/advertising-popup.spec.ts`

Expected: PASS.

Run: `npx nx build admin`

Expected: exit 0.

- [ ] **Step 7: Commit admin UI**

```bash
git add apps/admin/vitest.config.ts apps/admin/src/types/advertising-popup.ts apps/admin/src/types/advertising-popup.spec.ts apps/admin/src/composables/useAdvertisingPopups.ts apps/admin/src/components/settings/AdvertisingPopupForm.vue apps/admin/src/pages/settings
git commit -m "feat: manage advertising popup campaigns"
```

### Task 5: Implement the public session decision

**Files:**
- Create: `apps/frontend/src/types/advertising-popup.ts`
- Create: `apps/frontend/src/composables/useAdvertisingPopup.ts`
- Create: `apps/frontend/src/composables/useAdvertisingPopup.spec.ts`

- [ ] **Step 1: Write composable tests**

Mock the tRPC query and `sessionStorage`. Verify the key `advertising-popup-shown` is written before `shouldShow` becomes true, subsequent initialization in the same session does not call/show again, `null` returns false, and rejected queries resolve safely with false.

```ts
expect(sessionStorage.getItem('advertising-popup-shown')).toBeNull();
await popup.initialize();
expect(sessionStorage.getItem('advertising-popup-shown')).toBe('true');
expect(popup.shouldShow.value).toBe(true);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd apps/frontend && npx vitest run src/composables/useAdvertisingPopup.spec.ts`

Expected: FAIL because the composable is absent.

- [ ] **Step 3: Implement the composable**

Expose `campaign`, `shouldShow`, `isLoading`, `initialize()`, and `close()`. Guard all browser APIs with `process.client`; if the session marker exists, return before querying. Validate the response fields defensively and catch API/storage exceptions without rethrowing.

- [ ] **Step 4: Run tests**

Run: `cd apps/frontend && npx vitest run src/composables/useAdvertisingPopup.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit session behavior**

```bash
git add apps/frontend/src/types/advertising-popup.ts apps/frontend/src/composables/useAdvertisingPopup.ts apps/frontend/src/composables/useAdvertisingPopup.spec.ts
git commit -m "feat: add popup session behavior"
```

### Task 6: Build the accessible themed popup

**Files:**
- Create: `apps/frontend/src/components/modals/AdvertisingPopup.vue`
- Create: `apps/frontend/src/components/modals/AdvertisingPopup.spec.ts`
- Modify: `apps/frontend/src/layouts/default.vue`

- [ ] **Step 1: Write component behavior tests**

Mount the dialog with real Vietnamese multiline content. Assert `role="dialog"`, `aria-modal="true"`, plain-text rendering (a `<script>` string creates no script node), CTA href/navigation behavior, close emission for button/Escape/overlay, body scroll lock, initial focus, and focus restoration.

- [ ] **Step 2: Run the component test and verify RED**

Run: `cd apps/frontend && npx vitest run src/components/modals/AdvertisingPopup.spec.ts`

Expected: FAIL because the component is absent.

- [ ] **Step 3: Implement the approved layout**

Use a teleport to `body`, a fixed overlay at `z-[var(--z-modal)]`, and a centered card. Preserve content with `whitespace-pre-line`; style with runtime tokens/classes only: `bg-[rgb(var(--card))]`, `text-[rgb(var(--card-foreground))]`, `border-[rgb(var(--border))]`, and `bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]`. Add `max-h-[calc(100dvh-2rem)] overflow-y-auto`, responsive padding, reduced-motion utilities, focus trap, Escape, overlay close, and an accessible close label.

- [ ] **Step 4: Mount once in the shared layout**

Instantiate `useAdvertisingPopup()` in `apps/frontend/src/layouts/default.vue`, call `initialize()` from the existing client `onMounted`, and render:

```vue
<AdvertisingPopup
  v-if="shouldShow && campaign"
  :campaign="campaign"
  @close="close"
/>
```

Place it outside the loading branch so public page loading failures cannot strand the dialog or block the page.

- [ ] **Step 5: Run focused and production checks**

Run: `cd apps/frontend && npx vitest run src/components/modals/AdvertisingPopup.spec.ts src/composables/useAdvertisingPopup.spec.ts`

Expected: PASS.

Run: `npm run typecheck:frontend`

Expected: exit 0.

Run: `npx nx build frontend`

Expected: exit 0.

- [ ] **Step 6: Commit public UI**

```bash
git add apps/frontend/src/components/modals/AdvertisingPopup.vue apps/frontend/src/components/modals/AdvertisingPopup.spec.ts apps/frontend/src/layouts/default.vue
git commit -m "feat: display themed advertising popup"
```

### Task 7: End-to-end verification and documentation

**Files:**
- Modify only files needed to fix issues found by verification.

- [ ] **Step 1: Run all focused tests**

Run: `npx jest --config apps/backend/jest.config.ts apps/backend/src/modules/advertising-popup apps/backend/src/modules/trpc/routers/advertising-popup.router.spec.ts --runInBand`

Expected: PASS.

Run: `cd apps/admin && npx vitest run src/types/advertising-popup.spec.ts`

Expected: PASS.

Run: `cd apps/frontend && npx vitest run src/components/modals/AdvertisingPopup.spec.ts src/composables/useAdvertisingPopup.spec.ts`

Expected: PASS.

- [ ] **Step 2: Run builds and type checks**

Run: `npx tsc -p libs/database/tsconfig.migration.json --noEmit && npx nx build backend --configuration=development && npx nx build admin && npm run typecheck:frontend && npx nx build frontend`

Expected: all commands exit 0.

- [ ] **Step 3: Validate the database migration**

Using credentials from `apps/backend/.env`, run `npm run migration:run` against the configured development database, then query the table to confirm one inactive seeded campaign and the partial unique index. Run the migration rollback only on a disposable development database, confirm the table disappears, and re-run the migration.

- [ ] **Step 4: Perform browser QA**

Verify admin create/edit/activate/deactivate/delete, schedule boundaries, public first-page display, route navigation without repeat, new-tab-session repeat, CTA to `/order-ticket`, mobile/desktop sizing, keyboard focus, Escape/overlay close, and light/dark colors derived from the active theme.

- [ ] **Step 5: Review scope and repository state**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended feature files are modified. Confirm `.superpowers/` mockup artifacts remain untracked and are not committed.

- [ ] **Step 6: Commit verification fixes if required**

```bash
git add apps/backend apps/admin/src apps/frontend/src libs/database/src/migrations
git commit -m "fix: harden advertising popup workflow"
```

Skip this commit when verification required no code changes.
