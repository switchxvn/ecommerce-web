# Popup Auth, Styling, and Persistent Dismissal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop popup admin pages from re-running permission authentication, give the public popup a light-gray semibold treatment, and let visitors permanently hide one campaign in their browser.

**Architecture:** Popup admin pages will follow `/settings/general` by using only the `auth` route middleware while retaining page-level and backend permission enforcement. The public modal owns the unchecked checkbox UI and emits whether persistent dismissal was requested; the composable owns campaign-specific `localStorage` persistence and the host passes the emitted decision to it.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, TypeScript, Tailwind semantic theme tokens, Vitest, Vue Test Utils, browser `sessionStorage` and `localStorage`.

---

### Task 1: Align popup admin authentication with General Settings

**Files:**
- Modify: `apps/admin/src/components/settings/advertising-popup-permissions.spec.ts`
- Modify: `apps/admin/src/pages/settings/advertising-popups/index.vue`
- Modify: `apps/admin/src/pages/settings/advertising-popups/new.vue`
- Modify: `apps/admin/src/pages/settings/advertising-popups/[id].vue`

- [ ] **Step 1: Write the failing middleware contract test**

Add a test that reads all three page files and asserts the exact General Settings middleware pattern:

```ts
it('uses only auth middleware like general settings', () => {
  for (const path of [
    '../../pages/settings/advertising-popups/index.vue',
    '../../pages/settings/advertising-popups/new.vue',
    '../../pages/settings/advertising-popups/[id].vue',
  ]) {
    const source = read(path);
    expect(source).toContain("definePageMeta({ middleware: ['auth'] })");
    expect(source).not.toContain("['auth', 'permission']");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
cd apps/admin
npx vitest run --poolOptions.threads.singleThread=true src/components/settings/advertising-popup-permissions.spec.ts
```

Expected: FAIL because the popup pages still declare `['auth', 'permission']`.

- [ ] **Step 3: Make the minimal middleware change**

Change each popup page declaration to:

```ts
definePageMeta({ middleware: ['auth'] });
```

Do not remove `usePagePermissions`, edit/delete visibility checks, or backend permissions.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2. Expected: all permission-contract tests PASS.

- [ ] **Step 5: Commit the admin auth fix**

```bash
git add apps/admin/src/components/settings/advertising-popup-permissions.spec.ts \
  apps/admin/src/pages/settings/advertising-popups/index.vue \
  apps/admin/src/pages/settings/advertising-popups/new.vue \
  'apps/admin/src/pages/settings/advertising-popups/[id].vue'
git commit -m "fix: align popup admin authentication"
```

### Task 2: Persist campaign-specific dismissal

**Files:**
- Modify: `apps/frontend/src/composables/useAdvertisingPopup.spec.ts`
- Modify: `apps/frontend/src/composables/useAdvertisingPopup.ts`
- Modify: `apps/frontend/src/components/modals/AdvertisingPopupHost.vue`
- Modify: `apps/frontend/src/layouts/default.spec.ts`

- [ ] **Step 1: Write failing composable tests**

Clear both storage objects in `beforeEach`, then add tests covering campaign-specific persistence:

```ts
it('persists the current campaign when permanent dismissal is requested', async () => {
  query.mockResolvedValue(validCampaign);
  const popup = useAdvertisingPopup();
  await popup.initialize();

  popup.close(true);

  expect(localStorage.getItem('advertising-popup-dismissed-campaigns')).toBe('[1]');
  expect(popup.shouldShow.value).toBe(false);
});

it('does not persist a normal close', async () => {
  query.mockResolvedValue(validCampaign);
  const popup = useAdvertisingPopup();
  await popup.initialize();

  popup.close(false);

  expect(localStorage.getItem('advertising-popup-dismissed-campaigns')).toBeNull();
});

it('hides a persistently dismissed campaign but allows a new campaign', async () => {
  localStorage.setItem('advertising-popup-dismissed-campaigns', '[1]');
  query.mockResolvedValue(validCampaign);
  await useAdvertisingPopup().initialize();
  expect(query).toHaveBeenCalledTimes(1);

  sessionStorage.clear();
  __resetAdvertisingPopupSessionForTests();
  query.mockResolvedValue({ ...validCampaign, id: 2 });
  const nextCampaign = useAdvertisingPopup();
  await nextCampaign.initialize();
  expect(nextCampaign.shouldShow.value).toBe(true);
});
```

Also test malformed `localStorage` and write failures to confirm they do not block closing or future display.

- [ ] **Step 2: Run composable tests and verify RED**

```bash
cd apps/frontend
npx vitest run src/composables/useAdvertisingPopup.spec.ts
```

Expected: FAIL because `close` has no persistence parameter and no dismissal key exists.

- [ ] **Step 3: Implement storage helpers and close contract**

Add:

```ts
const DISMISSED_CAMPAIGNS_KEY = 'advertising-popup-dismissed-campaigns';

const readDismissedCampaignIds = (): number[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DISMISSED_CAMPAIGNS_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
};
```

After validating the active campaign, skip showing it when its ID is present. Change close to accept the modal decision and write a deduplicated list without preventing close if storage throws:

```ts
const close = (doNotShowAgain = false) => {
  shouldShow.value = false;
  if (!doNotShowAgain || !campaign.value) return;

  try {
    const ids = new Set(readDismissedCampaignIds());
    ids.add(campaign.value.id);
    window.localStorage.setItem(DISMISSED_CAMPAIGNS_KEY, JSON.stringify([...ids]));
  } catch (storageError) {
    error.value = storageError;
  }
};
```

- [ ] **Step 4: Update host event forwarding**

Make `AdvertisingPopupHost.vue` pass the boolean emitted by the modal:

```vue
<AdvertisingPopup
  v-if="shouldShow && campaign"
  :campaign="campaign"
  @close="closeAdvertisingPopup"
/>
```

Update the mocked modal contract in `default.spec.ts` so a `close` event carrying `true` calls the composable close handler with `true`.

- [ ] **Step 5: Run composable and host tests and verify GREEN**

```bash
cd apps/frontend
npx vitest run src/composables/useAdvertisingPopup.spec.ts src/layouts/default.spec.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit persistent dismissal**

```bash
git add apps/frontend/src/composables/useAdvertisingPopup.ts \
  apps/frontend/src/composables/useAdvertisingPopup.spec.ts \
  apps/frontend/src/components/modals/AdvertisingPopupHost.vue \
  apps/frontend/src/layouts/default.spec.ts
git commit -m "feat: remember dismissed popup campaigns"
```

### Task 3: Add checkbox and neutral popup styling

**Files:**
- Modify: `apps/frontend/src/components/modals/AdvertisingPopup.spec.ts`
- Modify: `apps/frontend/src/components/modals/AdvertisingPopup.vue`

- [ ] **Step 1: Write failing modal behavior and style tests**

Add tests that assert:

```ts
it('renders an unchecked persistent-dismissal checkbox', () => {
  mountPopup();
  const checkbox = document.body.querySelector<HTMLInputElement>(
    '[data-testid="popup-do-not-show-again"]'
  )!;
  expect(checkbox.checked).toBe(false);
  expect(document.body.textContent).toContain('Không hiển thị lại lần sau');
});

it('emits the checkbox decision when closed', async () => {
  const wrapper = mountPopup();
  const checkbox = document.body.querySelector<HTMLInputElement>(
    '[data-testid="popup-do-not-show-again"]'
  )!;
  checkbox.checked = true;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  document.body
    .querySelector<HTMLElement>('[aria-label="Đóng thông báo quảng cáo"]')!
    .click();
  await nextTick();
  expect(wrapper.emitted('close')).toEqual([[true]]);
});
```

Extend the theme test to require a neutral gray/muted background token and `font-semibold` on `popup-content`.

- [ ] **Step 2: Run modal tests and verify RED**

```bash
cd apps/frontend
npx vitest run src/components/modals/AdvertisingPopup.spec.ts
```

Expected: FAIL because the checkbox, boolean close event, and requested classes are absent.

- [ ] **Step 3: Implement checkbox and close event**

Add local state and emit the selected value for every close path, including close button, overlay, Escape, and CTA:

```ts
const doNotShowAgain = ref(false);

const emit = defineEmits<{
  close: [doNotShowAgain: boolean];
}>();

const requestClose = () => {
  cleanup();
  emit('close', doNotShowAgain.value);
};
```

Render the checkbox before the CTA:

```vue
<label class="mt-5 flex cursor-pointer items-center justify-center gap-2 text-sm text-muted-foreground">
  <input
    v-model="doNotShowAgain"
    data-testid="popup-do-not-show-again"
    type="checkbox"
    class="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
  />
  <span>Không hiển thị lại lần sau</span>
</label>
```

- [ ] **Step 4: Apply project-aligned neutral styling**

Change the dialog background from `bg-card` to a neutral semantic class already supported by the project, such as `bg-muted`, while preserving `border-border` and foreground tokens. Add `font-semibold text-foreground` to the promotional content and retain the existing primary CTA classes. Ensure focus ring offsets use the resulting panel background token.

- [ ] **Step 5: Run modal tests and verify GREEN**

Run the command from Step 2. Expected: all modal tests PASS, including focus-trap tests with the checkbox as an additional focusable element.

- [ ] **Step 6: Commit modal UI changes**

```bash
git add apps/frontend/src/components/modals/AdvertisingPopup.vue \
  apps/frontend/src/components/modals/AdvertisingPopup.spec.ts
git commit -m "feat: add persistent popup dismissal control"
```

### Task 4: Full focused verification and delivery

**Files:**
- Verify only; no production file changes expected.

- [ ] **Step 1: Run all focused admin tests**

```bash
cd apps/admin
npx vitest run --poolOptions.threads.singleThread=true \
  src/types/advertising-popup.spec.ts \
  src/composables/useAdvertisingPopups.spec.ts \
  src/utils/permission-route.spec.ts \
  src/components/settings/advertising-popup-theme.spec.ts \
  src/components/settings/advertising-popup-permissions.spec.ts
```

Expected: all focused admin tests PASS.

- [ ] **Step 2: Run all focused frontend tests**

```bash
cd apps/frontend
npx vitest run \
  src/composables/useAdvertisingPopup.spec.ts \
  src/components/modals/AdvertisingPopup.spec.ts \
  src/layouts/default.spec.ts
```

Expected: all focused frontend tests PASS.

- [ ] **Step 3: Run production builds**

```bash
cd apps/admin && npm run build
cd ../frontend && npm run build
```

Expected: admin build PASS. Record frontend failures only when they match the known unchanged shared locale export baseline; investigate any new popup-related error.

- [ ] **Step 4: Check repository hygiene**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the pre-existing generated `apps/frontend/vue-tsc.config.tsbuildinfo` modification may remain unstaged.

- [ ] **Step 5: Push the completed branch**

```bash
git push origin codex/advertising-popup
```

Expected: remote branch advances to the verified implementation commit.
