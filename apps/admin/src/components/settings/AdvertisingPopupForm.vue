<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { Megaphone, Save } from 'lucide-vue-next';
import {
  createDefaultPopupForm,
  toPopupMutationInput,
  type PopupFormState,
  type PopupMutationInput,
} from '@/types/advertising-popup';

const props = withDefaults(
  defineProps<{ initialValue?: PopupFormState; saving?: boolean }>(),
  { saving: false }
);
const emit = defineEmits<{
  submit: [payload: { data: PopupMutationInput; isActive: boolean }];
}>();
const form = reactive<PopupFormState>({
  ...createDefaultPopupForm(),
  ...props.initialValue,
});
watch(
  () => props.initialValue,
  (value) => value && Object.assign(form, value),
  { deep: true }
);

const validationError = computed(() => {
  if (
    ![form.name, form.title, form.content, form.ctaLabel, form.ctaUrl].every(
      (value) => value.trim()
    )
  )
    return 'Vui lòng điền đầy đủ các trường bắt buộc.';
  if (
    form.startsAt &&
    form.endsAt &&
    new Date(form.endsAt) <= new Date(form.startsAt)
  )
    return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
  return '';
});
const submit = () => {
  if (!validationError.value && !props.saving)
    emit('submit', {
      data: toPopupMutationInput(form),
      isActive: form.isActive,
    });
};
</script>

<template>
  <form
    class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
    @submit.prevent="submit"
  >
    <div class="space-y-6">
      <section
        class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Nội dung chiến dịch
        </h2>
        <div class="mt-5 grid gap-5 sm:grid-cols-2">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Tên quản lý <span class="text-red-500">*</span
            ><input
              v-model="form.name"
              required
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Tiêu đề <span class="text-red-500">*</span
            ><input
              v-model="form.title"
              required
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
          <label
            class="sm:col-span-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Nội dung <span class="text-red-500">*</span
            ><textarea
              v-model="form.content"
              required
              rows="5"
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
            />
          </label>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Nhãn nút <span class="text-red-500">*</span
            ><input
              v-model="form.ctaLabel"
              required
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Đường dẫn CTA <span class="text-red-500">*</span
            ><input
              v-model="form.ctaUrl"
              required
              type="text"
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
        </div>
      </section>
      <section
        class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Lịch hiển thị và trạng thái
        </h2>
        <div class="mt-5 grid gap-5 sm:grid-cols-2">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Bắt đầu<input
              v-model="form.startsAt"
              type="datetime-local"
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >Kết thúc<input
              v-model="form.endsAt"
              type="datetime-local"
              class="mt-2 w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
          /></label>
        </div>
        <label class="mt-5 flex items-start gap-3"
          ><input
            v-model="form.isActive"
            type="checkbox"
            class="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          /><span
            ><span
              class="block text-sm font-medium text-gray-900 dark:text-white"
              >Kích hoạt chiến dịch</span
            ><span class="text-sm text-gray-500 dark:text-gray-400"
              >Khi lưu, chiến dịch đang hoạt động khác sẽ tự động bị tắt.</span
            ></span
          ></label
        >
      </section>
      <p
        v-if="validationError"
        role="alert"
        class="text-sm text-red-600 dark:text-red-400"
      >
        {{ validationError }}
      </p>
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving || !!validationError"
          class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save class="h-4 w-4" />{{ saving ? 'Đang lưu…' : 'Lưu chiến dịch' }}
        </button>
      </div>
    </div>
    <aside class="xl:sticky xl:top-6 xl:self-start">
      <h2
        class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        Xem trước trực tiếp
      </h2>
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <Megaphone class="h-7 w-7 text-primary-600 dark:text-primary-400" />
        <h3 class="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          {{ form.title || 'Tiêu đề popup' }}
        </h3>
        <p
          class="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300"
        >
          {{ form.content || 'Nội dung popup' }}
        </p>
        <span
          class="mt-5 inline-flex rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
          >{{ form.ctaLabel || 'Nút hành động' }}</span
        >
      </div>
    </aside>
  </form>
</template>
