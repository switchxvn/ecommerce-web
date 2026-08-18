<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';

import type { AdvertisingPopupCampaign } from '../../types/advertising-popup';
import {
  modalTitleId,
  registerModal,
  unregisterModal,
} from '../../utils/modalStack';

const props = defineProps<{
  campaign: AdvertisingPopupCampaign;
}>();

const emit = defineEmits<{
  close: [doNotShowAgain: boolean];
}>();

const titleId = modalTitleId(getCurrentInstance()?.uid);
const dialogRef = ref<HTMLElement | null>(null);
const closeButtonRef = ref<HTMLButtonElement | null>(null);
const doNotShowAgain = ref(false);
let modalToken: symbol | null = null;
let cleanedUp = false;

const classifyCta = (value: string) => {
  if (!value || value.includes('\\')) return null;
  if (value.startsWith('/') && !value.startsWith('//')) {
    return { kind: 'internal' as const, href: value };
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname) {
      return { kind: 'external' as const, href: url.href };
    }
  } catch {
    // Invalid URLs intentionally render without an action.
  }

  return null;
};

const cta = computed(() => classifyCta(props.campaign.ctaUrl));

const cleanup = () => {
  if (cleanedUp) return;
  cleanedUp = true;
  unregisterModal(modalToken);
  modalToken = null;
};

const requestClose = () => {
  cleanup();
  emit('close', doNotShowAgain.value);
};

onMounted(() => {
  modalToken = registerModal({
    element: () => dialogRef.value,
    focusInitial: () => closeButtonRef.value?.focus(),
    onEscape: requestClose,
  });
});

onBeforeUnmount(cleanup);
</script>

<template>
  <Teleport to="body">
    <Transition name="advertising-popup" appear>
      <div
        data-testid="popup-overlay"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-[2px] sm:p-6"
        @click.self="requestClose"
      >
        <section
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-muted px-5 pb-6 pt-12 text-foreground shadow-xl sm:px-8 sm:pb-8 sm:pt-14"
        >
          <button
            ref="closeButtonRef"
            type="button"
            aria-label="Đóng thông báo quảng cáo"
            class="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
            @click="requestClose"
          >
            <span aria-hidden="true" class="text-2xl font-light leading-none"
              >×</span
            >
          </button>

          <div class="mx-auto max-w-md text-center">
            <h2
              :id="titleId"
              class="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {{ campaign.title }}
            </h2>
            <p
              data-testid="popup-content"
              class="mt-4 whitespace-pre-line text-pretty text-sm font-semibold leading-6 text-foreground sm:text-base sm:leading-7"
            >
              {{ campaign.content }}
            </p>

            <label
              class="mx-auto mt-5 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground"
            >
              <input
                v-model="doNotShowAgain"
                data-testid="popup-do-not-show-again"
                type="checkbox"
                class="h-4 w-4 rounded border-border bg-background text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
              />
              <span>Không hiển thị lại lần sau</span>
            </label>

            <NuxtLink
              v-if="cta?.kind === 'internal'"
              data-testid="popup-cta"
              :to="cta.href"
              class="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
              @click="requestClose"
            >
              {{ campaign.ctaLabel }}
            </NuxtLink>
            <a
              v-else-if="cta?.kind === 'external'"
              data-testid="popup-cta"
              :href="cta.href"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
              @click="requestClose"
            >
              {{ campaign.ctaLabel }}
            </a>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.advertising-popup-enter-active,
.advertising-popup-leave-active {
  transition: opacity 180ms ease;
}

.advertising-popup-enter-active section,
.advertising-popup-leave-active section {
  transition: transform 180ms ease, opacity 180ms ease;
}

.advertising-popup-enter-from,
.advertising-popup-leave-to,
.advertising-popup-enter-from section,
.advertising-popup-leave-to section {
  opacity: 0;
}

.advertising-popup-enter-from section,
.advertising-popup-leave-to section {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .advertising-popup-enter-active,
  .advertising-popup-leave-active,
  .advertising-popup-enter-active section,
  .advertising-popup-leave-active section {
    transition: none;
  }
}
</style>
