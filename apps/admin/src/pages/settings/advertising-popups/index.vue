<script setup lang="ts">
import { onMounted, provide, ref } from 'vue';
import { Edit3, Megaphone, Plus, Power, Trash2 } from 'lucide-vue-next';
import { useAdvertisingPopups } from '@/composables/useAdvertisingPopups';
import { useConfirm } from '@/composables/useConfirm';
import { usePagePermissions } from '@/composables/usePagePermissions';
import { useToast } from '@/composables/useToast';
import type { AdvertisingPopup } from '@/types/advertising-popup';

definePageMeta({ middleware: ['auth', 'permission'] });
provide('pageTitle', ref('Popup quảng cáo'));
const { isLoadingPermissions, hasPermissionAccess, ensureUserData } =
  usePagePermissions(['MANAGE_SETTINGS']);
const {
  campaigns,
  loading,
  error,
  refresh,
  setActive,
  remove,
  isActionPending,
} = useAdvertisingPopups();
const confirm = useConfirm();
const toast = useToast();
const formatDate = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Không giới hạn';

const toggleCampaign = (campaign: AdvertisingPopup) =>
  confirm.show({
    title: campaign.isActive ? 'Tắt chiến dịch?' : 'Kích hoạt chiến dịch?',
    message: campaign.isActive
      ? 'Popup sẽ ngừng hiển thị ngay.'
      : 'Chiến dịch đang hoạt động hiện tại sẽ tự động bị tắt.',
    confirmText: campaign.isActive ? 'Tắt chiến dịch' : 'Kích hoạt',
    onConfirm: async () => {
      try {
        await setActive(campaign.id, !campaign.isActive);
        toast.success(
          campaign.isActive ? 'Đã tắt chiến dịch' : 'Đã kích hoạt chiến dịch'
        );
      } catch (caught) {
        toast.error(
          caught instanceof Error
            ? caught.message
            : 'Không thể cập nhật trạng thái'
        );
      }
    },
  });
const deleteCampaign = (campaign: AdvertisingPopup) => {
  if (campaign.isActive) return;
  confirm.show({
    title: 'Xóa chiến dịch?',
    message: `Chiến dịch “${campaign.name}” sẽ bị xóa vĩnh viễn.`,
    confirmText: 'Xóa',
    confirmButtonColor: '#dc2626',
    onConfirm: async () => {
      try {
        await remove(campaign.id);
        toast.success('Đã xóa chiến dịch');
      } catch (caught) {
        toast.error(
          caught instanceof Error ? caught.message : 'Không thể xóa chiến dịch'
        );
      }
    },
  });
};
onMounted(async () => {
  await ensureUserData();
  if (hasPermissionAccess.value) {
    try {
      await refresh();
    } catch {
      toast.error(error.value || 'Không thể tải chiến dịch');
    }
  }
});
</script>

<template>
  <div
    v-if="isLoadingPermissions"
    class="flex min-h-64 items-center justify-center"
  >
    <span
      class="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
    />
  </div>
  <main v-else-if="hasPermissionAccess" class="space-y-6">
    <header
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Popup quảng cáo
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản lý nội dung, lịch hiển thị và trạng thái popup trên website.
        </p>
      </div>
      <NuxtLink
        to="/settings/advertising-popups/new"
        class="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        ><Plus class="h-4 w-4" />Tạo chiến dịch</NuxtLink
      >
    </header>
    <div
      v-if="error"
      role="alert"
      class="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
    >
      {{ error }}
    </div>
    <div
      class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        v-if="loading && !campaigns.length"
        class="p-10 text-center text-gray-500"
      >
        Đang tải chiến dịch…
      </div>
      <div v-else-if="!campaigns.length" class="p-10 text-center">
        <Megaphone class="mx-auto h-9 w-9 text-gray-400" />
        <p class="mt-3 font-medium text-gray-900 dark:text-white">
          Chưa có chiến dịch
        </p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead
            class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/50"
          >
            <tr>
              <th class="px-5 py-3">Chiến dịch</th>
              <th class="px-5 py-3">Trạng thái</th>
              <th class="px-5 py-3">Lịch hiển thị</th>
              <th class="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="campaign in campaigns"
              :key="campaign.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <td class="px-5 py-4">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ campaign.name }}
                </div>
                <div class="text-sm text-gray-500">{{ campaign.title }}</div>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="
                    campaign.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  "
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  >{{
                    campaign.isActive ? 'Đang hoạt động' : 'Không hoạt động'
                  }}</span
                >
              </td>
              <td class="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                <div>{{ formatDate(campaign.startsAt) }}</div>
                <div>đến {{ formatDate(campaign.endsAt) }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end gap-1">
                  <button
                    :aria-label="
                      campaign.isActive
                        ? 'Tắt chiến dịch'
                        : 'Kích hoạt chiến dịch'
                    "
                    :disabled="isActionPending(campaign.id)"
                    class="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                    @click="toggleCampaign(campaign)"
                  >
                    <Power class="h-4 w-4" /></button
                  ><NuxtLink
                    :to="`/settings/advertising-popups/${campaign.id}`"
                    aria-label="Sửa chiến dịch"
                    class="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                    ><Edit3 class="h-4 w-4" /></NuxtLink
                  ><button
                    aria-label="Xóa chiến dịch"
                    :disabled="
                      campaign.isActive || isActionPending(campaign.id)
                    "
                    class="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                    @click="deleteCampaign(campaign)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
