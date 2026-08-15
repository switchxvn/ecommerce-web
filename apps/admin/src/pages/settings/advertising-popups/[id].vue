<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAdvertisingPopups } from '@/composables/useAdvertisingPopups';
import { usePagePermissions } from '@/composables/usePagePermissions';
import { useToast } from '@/composables/useToast';
import {
  popupToFormState,
  type PopupMutationInput,
} from '@/types/advertising-popup';
definePageMeta({ middleware: ['auth', 'permission'] });
provide('pageTitle', ref('Sửa popup quảng cáo'));
const route = useRoute();
const id = Number(route.params.id);
const { hasPermissionAccess } = usePagePermissions(['MANAGE_SETTINGS']);
const { current, loading, error, getById, update, setActive } =
  useAdvertisingPopups();
const toast = useToast();
const form = computed(() =>
  current.value ? popupToFormState(current.value) : undefined
);
const submit = async (input: PopupMutationInput) => {
  try {
    const { isActive, ...data } = input;
    await update(id, data);
    if (current.value?.isActive !== isActive) await setActive(id, isActive);
    toast.success('Đã cập nhật chiến dịch');
    await navigateTo('/settings/advertising-popups');
  } catch {
    toast.error(error.value || 'Không thể cập nhật chiến dịch');
  }
};
onMounted(async () => {
  if (!Number.isInteger(id) || id <= 0)
    return navigateTo('/settings/advertising-popups');
  try {
    await getById(id);
  } catch {
    toast.error(error.value || 'Không thể tải chiến dịch');
  }
});
</script>
<template>
  <main v-if="hasPermissionAccess" class="space-y-6">
    <header>
      <NuxtLink
        to="/settings/advertising-popups"
        class="text-sm text-primary hover:underline"
        >← Danh sách chiến dịch</NuxtLink
      >
      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        Sửa popup quảng cáo
      </h1>
    </header>
    <div v-if="loading && !form" class="py-12 text-center text-gray-500">
      Đang tải chiến dịch…
    </div>
    <AdvertisingPopupForm
      v-else-if="form"
      :initial-value="form"
      :saving="loading"
      @submit="submit"
    />
  </main>
</template>
