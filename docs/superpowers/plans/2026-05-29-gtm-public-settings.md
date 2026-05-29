# GTM Public Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load Google Tag Manager on first page entry in `apps/frontend` using the public settings API as the configuration source.

**Architecture:** Add a focused GTM settings/bootstrap path in frontend that resolves `google_tag_manager_id` from the existing public settings API, stores the validated value in shared Nuxt state, and lets the top-level layout inject the standard GTM snippet immediately. Remove the hardcoded fallback and interaction-delay logic so tracking behavior is deterministic.

**Tech Stack:** Nuxt 3, Vue 3, tRPC, Vitest

---

### Task 1: Lock GTM settings source behavior with tests

**Files:**
- Modify: `/Users/abc/project/mga/apps/frontend/src/composables/useSettings.spec.ts`
- Test: `/Users/abc/project/mga/apps/frontend/src/composables/useSettings.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('returns the cached public setting value without querying by key again', async () => {
  const getPublicSettingsQuery = vi.fn(async () => [
    { key: 'google_tag_manager_id', value: 'GTM-API123' },
  ]);
  const getPublicSettingByKeyQuery = vi.fn(async () => null);

  vi.doMock('./useTrpc', () => ({
    useTrpc: () => ({
      settings: {
        getPublicSettings: { query: getPublicSettingsQuery },
        getPublicSettingByKey: { query: getPublicSettingByKeyQuery },
      },
    }),
  }));

  const { useSettings } = await import('./useSettings');
  const { getPublicSettingValueByKey } = useSettings();

  const value = await getPublicSettingValueByKey('google_tag_manager_id', '');

  expect(value).toBe('GTM-API123');
  expect(getPublicSettingsQuery).toHaveBeenCalledTimes(1);
  expect(getPublicSettingByKeyQuery).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/composables/useSettings.spec.ts`
Expected: FAIL because the existing test file does not yet cover cached GTM setting lookup behavior.

- [ ] **Step 3: Write minimal implementation**

```ts
// No production change should be needed if existing cache behavior already works.
// If the test exposes cache leakage between tests, add a test-only-safe reset path by
// keeping module state deterministic across imports and ensuring mocks exercise fetchPublicSettings first.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/composables/useSettings.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/abc/project/mga/apps/frontend/src/composables/useSettings.spec.ts
git commit -m "test: cover GTM public setting cache lookup"
```

### Task 2: Replace hardcoded GTM plugin behavior with API-backed state

**Files:**
- Modify: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.ts`
- Modify: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts`
- Test: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('loads a valid GTM id from public settings and stores it in shared state', async () => {
  const plugin = (await import('./gtm.server')).default;
  const provide = vi.fn();
  const stateStore: Record<string, string | null> = {};

  vi.stubGlobal('useState', (key: string, init: () => string | null) => {
    if (!(key in stateStore)) {
      stateStore[key] = init();
    }
    return {
      get value() {
        return stateStore[key];
      },
      set value(value: string | null) {
        stateStore[key] = value;
      },
    };
  });

  await plugin({
    ssrContext: {},
    provide,
    $trpc: {
      settings: {
        getPublicSettings: {
          query: vi.fn(async () => [
            { key: 'google_tag_manager_id', value: 'GTM-API123' },
          ]),
        },
      },
    },
  });

  expect(provide).toHaveBeenCalledWith('gtmId', 'GTM-API123');
  expect(stateStore['gtm-id']).toBe('GTM-API123');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts`
Expected: FAIL because the current plugin still uses the hardcoded/env fallback and does not query public settings.

- [ ] **Step 3: Write minimal implementation**

```ts
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

const resolveGtmId = async (nuxtApp: any) => {
  const settings = await nuxtApp.$trpc.settings.getPublicSettings.query();
  const value = settings.find((item: any) => item.key === 'google_tag_manager_id')?.value?.trim() || '';
  return GTM_ID_PATTERN.test(value) ? value : null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.ts /Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts
git commit -m "feat: resolve GTM id from public settings"
```

### Task 3: Inject GTM immediately in the default layout

**Files:**
- Modify: `/Users/abc/project/mga/apps/frontend/src/layouts/default.vue`
- Test: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('does not require delayed interaction flags to expose GTM state', async () => {
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile(new URL('../layouts/default.vue', import.meta.url), 'utf8')
  );

  expect(source).not.toContain('shouldLoadTracking');
  expect(source).not.toContain('requestIdleCallback');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts`
Expected: FAIL after adding the new source assertion because the layout still defers GTM loading.

- [ ] **Step 3: Write minimal implementation**

```ts
// In default.vue:
// - keep `const gtmConfig = useState('gtm-id', () => null);`
// - remove `shouldLoadTracking`
// - inject script/noscript whenever `gtmConfig.value` is truthy
// - remove interaction and idle callback listeners
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/abc/project/mga/apps/frontend/src/layouts/default.vue /Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts
git commit -m "refactor: load GTM immediately in frontend layout"
```

### Task 4: Remove obsolete hardcoded analytics paths and verify the slice

**Files:**
- Modify: `/Users/abc/project/mga/apps/frontend/src/composables/useGoogleAnalytics.ts`
- Modify: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts`
- Modify: `/Users/abc/project/mga/apps/frontend/src/composables/useSettings.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('does not keep the old hardcoded GTM container id in frontend sources', async () => {
  const files = await Promise.all([
    import('node:fs/promises').then((fs) => fs.readFile(new URL('./gtm.server.ts', import.meta.url), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('../composables/useGoogleAnalytics.ts', import.meta.url), 'utf8')),
  ]);

  expect(files.join('\n')).not.toContain('GTM-T89X4CKH');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts src/composables/useSettings.spec.ts`
Expected: FAIL because the hardcoded GTM container still exists in source.

- [ ] **Step 3: Write minimal implementation**

```ts
// Remove the hardcoded GTM ID and dead GTM initialization path from useGoogleAnalytics.ts.
// Keep the file focused on GA4-only fallback behavior if still needed, or strip unused GTM bootstrap logic entirely.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/plugins/gtm.server.spec.ts src/composables/useSettings.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/abc/project/mga/apps/frontend/src/composables/useGoogleAnalytics.ts /Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.spec.ts /Users/abc/project/mga/apps/frontend/src/composables/useSettings.spec.ts
git commit -m "refactor: remove hardcoded GTM bootstrap paths"
```

### Task 5: Final verification

**Files:**
- Verify: `/Users/abc/project/mga/apps/frontend/src/plugins/gtm.server.ts`
- Verify: `/Users/abc/project/mga/apps/frontend/src/layouts/default.vue`
- Verify: `/Users/abc/project/mga/apps/frontend/src/composables/useSettings.ts`

- [ ] **Step 1: Run focused tests**

Run: `cd /Users/abc/project/mga/apps/frontend && npx vitest run src/composables/useSettings.spec.ts src/plugins/gtm.server.spec.ts`
Expected: PASS

- [ ] **Step 2: Run typecheck for frontend**

Run: `cd /Users/abc/project/mga && npm run typecheck:frontend`
Expected: PASS

- [ ] **Step 3: Review the diff**

Run: `cd /Users/abc/project/mga && git diff -- apps/frontend/src/composables/useSettings.ts apps/frontend/src/plugins/gtm.server.ts apps/frontend/src/layouts/default.vue apps/frontend/src/composables/useGoogleAnalytics.ts apps/frontend/src/plugins/gtm.server.spec.ts apps/frontend/src/composables/useSettings.spec.ts`
Expected: diff shows GTM now comes from public settings, loads immediately, and no hardcoded container remains.

- [ ] **Step 4: Commit**

```bash
git add /Users/abc/project/mga/docs/superpowers/plans/2026-05-29-gtm-public-settings.md
git commit -m "docs: add GTM public settings implementation plan"
```
