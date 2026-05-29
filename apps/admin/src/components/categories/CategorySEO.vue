<template>
  <div class="rounded-lg border border-slate-200 bg-white p-6 shadow">
    <div class="mb-6">
      <h2 class="text-lg font-medium text-gray-900">{{ t('settings.seo.title') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('settings.seo.description') }}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UFormGroup :label="t('settings.seo.metaTitle')">
        <UInput
          :model-value="metaTitle"
          :placeholder="t('settings.seo.metaTitle')"
          @update:model-value="$emit('update:metaTitle', $event)"
        />
        <div class="mt-2 flex justify-between text-xs text-slate-500">
          <span>50-60 ký tự</span>
          <span :class="{ 'text-amber-600': metaTitleLength > 60 }">{{ metaTitleLength }}/60</span>
        </div>
      </UFormGroup>

      <div class="md:col-span-2">
        <UFormGroup :label="t('settings.seo.metaDescription')">
          <UTextarea
            :model-value="metaDescription"
            :rows="4"
            :placeholder="t('settings.seo.metaDescription')"
            @update:model-value="$emit('update:metaDescription', $event)"
          />
          <div class="mt-2 flex justify-between text-xs text-slate-500">
            <span>150-160 ký tự</span>
            <span :class="{ 'text-amber-600': metaDescriptionLength > 160 }">{{ metaDescriptionLength }}/160</span>
          </div>
        </UFormGroup>
      </div>

      <div class="md:col-span-2">
        <UFormGroup :label="t('settings.seo.metaKeywords')">
          <UInput
            :model-value="metaKeywords"
            :placeholder="t('settings.seo.metaKeywords')"
            @update:model-value="$emit('update:metaKeywords', $event)"
          />
        </UFormGroup>
      </div>

      <UFormGroup :label="t('settings.seo.ogTitle')">
        <UInput
          :model-value="ogTitle"
          :placeholder="t('settings.seo.ogTitle')"
          @update:model-value="$emit('update:ogTitle', $event)"
        />
      </UFormGroup>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-slate-900">
          {{ t('settings.seo.ogImage') }}
        </label>

        <div
          v-if="safeOgImage"
          class="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group relative"
        >
          <img
            :src="safeOgImage"
            alt="OG image preview"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            type="button"
            @click="handleRemoveImage"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>
        <div
          v-else
          class="aspect-video rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2"
        >
          <div class="rounded-full bg-slate-100 p-3">
            <ImageIcon class="w-6 h-6 text-slate-400" />
          </div>
          <p class="text-sm text-slate-500">Chưa có OG image</p>
        </div>

        <input
          :id="fileInputId"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleFileSelect"
        />

        <div v-if="uploadProgress !== null" class="space-y-2">
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-slate-500 text-center">
            Đang tải ảnh: {{ Math.round(uploadProgress) }}%
          </p>
        </div>

        <label
          v-else
          :for="fileInputId"
          class="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-slate-200 h-10 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          :class="{
            'pointer-events-none opacity-50': isUploading,
          }"
        >
          <UploadIcon class="w-4 h-4 mr-2" />
          {{ isUploading ? 'Đang tải lên...' : 'Tải OG image' }}
        </label>

        <p v-if="uploadError" class="text-sm text-red-500 flex items-center gap-2">
          <AlertCircleIcon class="w-4 h-4" />
          {{ uploadError }}
        </p>
      </div>

      <div class="md:col-span-2">
        <UFormGroup :label="t('settings.seo.ogDescription')">
          <UTextarea
            :model-value="ogDescription"
            :rows="4"
            :placeholder="t('settings.seo.ogDescription')"
            @update:model-value="$emit('update:ogDescription', $event)"
          />
          <p v-if="!safeOgDescription && safeMetaDescription" class="mt-2 text-xs text-slate-500">
            OG Description sẽ tự lấy từ Meta Description nếu để trống.
          </p>
        </UFormGroup>
      </div>

      <div class="md:col-span-2">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-medium text-slate-900">Google snippet preview</p>
          <p class="mt-1 text-xs text-green-700">{{ previewCanonical }}</p>
          <p class="mt-2 text-lg font-medium leading-snug text-blue-700">
            {{ previewTitle }}
          </p>
          <p class="mt-1 text-sm leading-6 text-slate-600">
            {{ previewDescription }}
          </p>
          <p v-if="!safeOgTitle && safeMetaTitle" class="mt-3 text-xs text-slate-500">
            OG Title sẽ tự lấy từ Meta Title nếu để trống.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-vue-next'
import { useLocalization } from '@/composables/useLocalization'
import { useUpload } from '@/composables/useUpload'

const { t } = useLocalization()
const { uploadFile } = useUpload()

const props = defineProps<{
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
}>()

const asTrimmedText = (value: string | null | undefined) => (typeof value === 'string' ? value.trim() : '')

const safeMetaTitle = computed(() => asTrimmedText(props.metaTitle))
const safeMetaDescription = computed(() => asTrimmedText(props.metaDescription))
const safeOgTitle = computed(() => asTrimmedText(props.ogTitle))
const safeOgDescription = computed(() => asTrimmedText(props.ogDescription))
const metaTitleLength = computed(() => safeMetaTitle.value.length)
const metaDescriptionLength = computed(() => safeMetaDescription.value.length)
const previewTitle = computed(() => safeMetaTitle.value || 'Tên danh mục sẽ hiển thị ở đây')
const previewDescription = computed(() => safeMetaDescription.value || 'Mô tả ngắn gọn cho danh mục sẽ hiển thị ở đây để bạn xem trước snippet trên Google.')
const previewCanonical = computed(() => 'Canonical URL sẽ được tự động tạo từ URL chuẩn của trang')
const safeOgImage = computed(() => asTrimmedText(props.ogImage))
const fileInputId = 'category-og-image-upload'

const uploadProgress = ref<number | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)

const emit = defineEmits<{
  'update:metaTitle': [value: string]
  'update:metaDescription': [value: string]
  'update:metaKeywords': [value: string]
  'update:ogTitle': [value: string]
  'update:ogDescription': [value: string]
  'update:ogImage': [value: string]
}>()

const handleRemoveImage = () => {
  emit('update:ogImage', '')
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'File phải là hình ảnh'
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Ảnh không được vượt quá 5MB'
    input.value = ''
    return
  }

  try {
    isUploading.value = true
    uploadError.value = null
    uploadProgress.value = 0

    const result = await uploadFile({
      file,
      folder: 'categories',
      onProgress: (progress) => {
        uploadProgress.value = progress
      }
    })

    emit('update:ogImage', result.url)
  } catch (error) {
    uploadError.value = 'Tải ảnh lên thất bại'
    console.error('Failed to upload category OG image:', error)
  } finally {
    isUploading.value = false
    uploadProgress.value = null
    input.value = ''
  }
}
</script>
