# Category Layout Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the category detail page so the product grid appears before support content, while moving quick links into the desktop sidebar with clearer copy.

**Architecture:** Keep the existing category page as the data owner for `categorySupport`, product state, and empty/error states. Update the page layout to move support sections below the product grid, and extend the desktop sidebar with optional quick links and CTA props so the sidebar can render a small support card without changing filter logic.

**Tech Stack:** Nuxt 3, Vue 3 SFCs, Vitest, Vue Test Utils

---

### Task 1: Lock the new category page behavior with tests

**Files:**
- Modify: `apps/frontend/src/pages/categories/[slug].spec.ts`
- Test: `apps/frontend/src/pages/categories/[slug].spec.ts`

- [ ] **Step 1: Add a failing test for the renamed quick-links heading and moved support content**

```ts
  it('shows quick links in the desktop sidebar and keeps FAQ support content on the page', async () => {
    const page = (await import('./[slug].vue')).default;
    const TestHost = defineComponent({
      components: { Page: page },
      template: `
        <Suspense>
          <Page />
        </Suspense>
      `,
    });

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          CategorySidebar: {
            props: ['quickLinksHeading', 'quickLinks', 'supportCta'],
            template: '<div data-testid="sidebar">{{ quickLinksHeading }}|{{ quickLinks?.length || 0 }}|{{ supportCta?.title || "" }}</div>',
          },
          CategoryMobileSidebar: true,
          ProductCard: true,
          UIcon: true,
          UButton: true,
          UPagination: true,
          Pagination: true,
          NuxtLink: NuxtLinkStub,
          CardGridSkeleton: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="sidebar"]').text()).toContain('Xem nhanh theo nhu cầu');
    expect(wrapper.text()).toContain('Câu hỏi thường gặp trong nhóm Xe nâng điện');
  });
```

- [ ] **Step 2: Run the page spec to verify the new assertion fails**

Run: `pnpm --filter frontend test -- src/pages/categories/[slug].spec.ts`
Expected: FAIL because the sidebar stub does not receive `quickLinksHeading` yet.

- [ ] **Step 3: Add a failing assertion that the old heading is gone from the page body**

```ts
    expect(wrapper.text()).not.toContain('Link nhanh theo intent thương mại');
```

- [ ] **Step 4: Re-run the page spec and confirm it still fails for the missing sidebar props**

Run: `pnpm --filter frontend test -- src/pages/categories/[slug].spec.ts`
Expected: FAIL with the new sidebar heading assertion.

- [ ] **Step 5: Commit the red test**

```bash
git add apps/frontend/src/pages/categories/[slug].spec.ts
git commit -m "test: cover category sidebar quick links layout"
```

### Task 2: Update sidebar contracts and category page layout

**Files:**
- Modify: `apps/frontend/src/components/sidebar/CategorySidebar.vue`
- Modify: `apps/frontend/src/pages/categories/[slug].vue`
- Test: `apps/frontend/src/pages/categories/[slug].spec.ts`

- [ ] **Step 1: Extend `CategorySidebar` props to accept sidebar support content**

```ts
const props = defineProps<{
  initialFilters: ProductFilter;
  categoryId?: number;
  quickLinksHeading?: string;
  quickLinks?: Array<{ label: string; to: string }>;
  supportCta?: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryTo: string;
  } | null;
}>();
```

- [ ] **Step 2: Render the quick-links card under the existing filter sections**

```vue
    <div
      v-if="quickLinks?.length"
      class="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ quickLinksHeading || 'Xem nhanh theo nhu cầu' }}
      </h3>
      <div class="mt-4 space-y-3">
        <NuxtLink
          v-for="item in quickLinks"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
        >
          <span>{{ item.label }}</span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
```

- [ ] **Step 3: Add an optional CTA card only when the page passes support CTA data**

```vue
    <div
      v-if="supportCta"
      class="mt-6 rounded-3xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-900/60 dark:bg-primary-900/20"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ supportCta.title }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{ supportCta.description }}
      </p>
      <NuxtLink
        :to="supportCta.primaryTo"
        class="mt-4 inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        {{ supportCta.primaryLabel }}
      </NuxtLink>
    </div>
```

- [ ] **Step 4: Reorder the page so support sections render after the main product area, and pass sidebar props**

```vue
            <div v-if="pageState.shouldShowFilters" class="hidden lg:block lg:w-1/4">
              <CategorySidebar
                :initial-filters="filters"
                :category-id="categoryData?.id"
                :quick-links-heading="'Xem nhanh theo nhu cầu'"
                :quick-links="categorySupport?.quickLinks || []"
                :support-cta="categorySupportCta"
                @filter-change="handleFilterChange"
              />
            </div>
```

```ts
const categorySupportCta = computed(() => {
  if (!categorySupport.value) return null

  return {
    title: 'Cần tư vấn nhanh?',
    description: 'MGA hỗ trợ chọn tải trọng và cấu hình phù hợp theo kho, lối đi và ngân sách vận hành.',
    primaryLabel: tr('categories.contactForAdvice', 'Liên hệ tư vấn mua hàng'),
    primaryTo: getContactRoute(locale.value),
  }
})
```

- [ ] **Step 5: Move the support summary and FAQ blocks to below the product grid without changing their content**

```vue
        <section
          v-if="categorySupport && !isInvalidCategory"
          class="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        >
```

```vue
        <section
          v-if="categorySupport && !isInvalidCategory"
          class="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
        >
```

- [ ] **Step 6: Run the page spec to confirm the new behavior passes**

Run: `pnpm --filter frontend test -- src/pages/categories/[slug].spec.ts`
Expected: PASS

- [ ] **Step 7: Commit the green layout change**

```bash
git add apps/frontend/src/components/sidebar/CategorySidebar.vue apps/frontend/src/pages/categories/[slug].vue apps/frontend/src/pages/categories/[slug].spec.ts
git commit -m "feat: prioritize category product grid layout"
```

### Task 3: Verify no regression in the sidebar interaction surface

**Files:**
- Modify: `apps/frontend/src/components/sidebar/CategoryMobileSidebar.vue` (only if needed)
- Test: `apps/frontend/src/pages/categories/[slug].spec.ts`

- [ ] **Step 1: Check whether mobile needs code changes after the desktop-only sidebar update**

Run: `rg -n "quick-links-heading|support-cta|CategorySidebar" apps/frontend/src/pages/categories/[slug].vue apps/frontend/src/components/sidebar`
Expected: Only `CategorySidebar.vue` needs the new props; mobile stays unchanged unless layout logic requires a fallback.

- [ ] **Step 2: If mobile requires no change, leave `CategoryMobileSidebar.vue` untouched and document that decision in the final summary**

No code block needed; keep the drawer focused on filters.

- [ ] **Step 3: Run the focused page spec one more time**

Run: `pnpm --filter frontend test -- src/pages/categories/[slug].spec.ts`
Expected: PASS

- [ ] **Step 4: Commit only if a mobile fallback was added**

```bash
git add apps/frontend/src/components/sidebar/CategoryMobileSidebar.vue apps/frontend/src/pages/categories/[slug].vue apps/frontend/src/pages/categories/[slug].spec.ts
git commit -m "refactor: align category mobile support layout"
```
