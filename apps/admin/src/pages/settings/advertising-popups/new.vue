<script setup lang="ts">
import { provide, ref } from 'vue';
import { useAdvertisingPopups } from '@/composables/useAdvertisingPopups';
import { usePagePermissions } from '@/composables/usePagePermissions';
import { useToast } from '@/composables/useToast';
import type { PopupMutationInput } from '@/types/advertising-popup';
definePageMeta({ middleware: ['auth', 'permission'] });
provide('pageTitle', ref('Tạo popup quảng cáo'));
const { hasPermissionAccess } = usePagePermissions(['EDIT_SETTINGS']);
const { loading, error, create } = useAdvertisingPopups();
const toast = useToast();
const submit = async (input: PopupMutationInput) => {
  try {
    await create(input);
    toast.success('Đã tạo chiến dịch');
    await navigateTo('/settings/advertising-popups');
  } catch {
    toast.error(error.value || 'Không thể tạo chiến dịch');
  }
};
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
        Tạo popup quảng cáo
      </h1>
    </header>
    <AdvertisingPopupForm :saving="loading" @submit="submit" />
  </main>
</template>
