<template>
  <div class="grid gap-6">
    <!-- Basic Information Card -->
    <div class="rounded-lg border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-medium">{{ t('products.editor.basicInfo') }}</h3>
        <p class="text-sm text-slate-500">{{ t('products.editor.basicDescription') }}</p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Product Name -->
        <div class="grid gap-2">
          <label for="name" class="text-sm font-medium text-slate-900">
            {{ t('products.editor.productName') }} <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            :value="name"
            @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
            class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter product name"
            required
          />
        </div>

        <!-- Slug -->
        <div class="grid gap-2">
          <label for="slug" class="text-sm font-medium text-slate-900">
            {{ t('products.editor.slug') }} <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <input
              id="slug"
              type="text"
              :value="slug"
              @input="$emit('update:slug', ($event.target as HTMLInputElement).value)"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="product-slug"
              required
            />
            <button
              type="button"
              @click="$emit('generate-slug')"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Wand2Icon class="w-4 h-4 mr-2" />
              {{ t('products.editor.generate') }}
            </button>
          </div>
        </div>

        <!-- Price Information -->
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Contact for Price Option -->
          <div class="flex items-center mb-2">
            <input
              id="isContactPrice"
              type="checkbox"
              :checked="isContactPrice"
              @change="$emit('update:isContactPrice', ($event.target as HTMLInputElement).checked)"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label for="isContactPrice" class="ml-2 text-sm font-medium text-slate-900">
              {{ t('products.editor.contactPrice') }}
            </label>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Price -->
          <div class="grid gap-2">
            <label
              for="price"
              class="text-sm font-medium text-slate-900 flex items-center"
            >
              {{ t('products.editor.price') }}
              <div v-if="disablePrice" class="relative ml-2 group">
                <button type="button" class="text-slate-400 hover:text-slate-900">
                  <HelpCircleIcon class="w-4 h-4" />
                </button>
                <div class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {{ t('products.editor.priceDisabledHelp') }}
                </div>
              </div>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                id="price"
                type="number"
                :value="price"
                @input="$emit('update:price', Number(($event.target as HTMLInputElement).value))"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                min="0"
                step="0.01"
                :disabled="disablePrice || isContactPrice"
              />
            </div>
          </div>

          <!-- Compare at Price -->
          <div class="grid gap-2">
            <label 
              for="comparePrice" 
              class="text-sm font-medium text-slate-900 flex items-center"
            >
              {{ t('products.editor.compareAtPrice') }}
              <div v-if="disablePrice" class="relative ml-2 group">
                <button type="button" class="text-slate-400 hover:text-slate-900">
                  <HelpCircleIcon class="w-4 h-4" />
                </button>
                <div class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {{ t('products.editor.priceDisabledHelp') }}
                </div>
              </div>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-slate-500">$</span>
              <input
                id="comparePrice"
                type="number"
                :value="comparePrice"
                @input="$emit('update:comparePrice', Number(($event.target as HTMLInputElement).value) || null)"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="0.00"
                min="0"
                step="0.01"
                :disabled="disablePrice || isContactPrice"
              />
            </div>
          </div>
        </div>

        <!-- SKU and Barcode -->
        <div class="grid gap-6 md:grid-cols-2">
          <!-- SKU -->
          <div class="grid gap-2">
            <label for="sku" class="text-sm font-medium text-slate-900">
              {{ t('products.editor.sku') }}
            </label>
            <input
              id="sku"
              type="text"
              :value="sku"
              @input="$emit('update:sku', ($event.target as HTMLInputElement).value)"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter SKU"
            />
          </div>

          <!-- Barcode -->
          <div class="grid gap-2">
            <label for="barcode" class="text-sm font-medium text-slate-900">
              {{ t('products.editor.barcode') }}
            </label>
            <input
              id="barcode"
              type="text"
              :value="barcode"
              @input="$emit('update:barcode', ($event.target as HTMLInputElement).value)"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter barcode"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Description Card -->
    <div class="rounded-lg border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-medium">{{ t('products.editor.description') }}</h3>
        <p class="text-sm text-slate-500">{{ t('products.editor.descriptionHelp') }}</p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Short Description -->
        <div class="grid gap-2">
          <label for="shortDescription" class="text-sm font-medium text-slate-900">
            {{ t('products.editor.shortDescription') }}
          </label>
          <textarea
            id="shortDescription"
            :value="shortDescription"
            @input="$emit('update:shortDescription', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            class="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Write a short description..."
          ></textarea>
        </div>

        <!-- Full Description -->
        <div class="grid gap-2">
          <label for="description" class="text-sm font-medium text-slate-900">
            {{ t('products.editor.fullDescription') }}
          </label>
          <client-only>
            <QuillEditor
              id="description"
              :content="description"
              @update:content="$emit('update:description', $event)"
              :options="editorOptions"
              contentType="html"
              theme="snow"
              class="quill-editor"
            />
          </client-only>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { HelpCircleIcon, Wand2Icon } from 'lucide-vue-next'
import { useLocalization } from '../../composables/useLocalization'

// Import QuillEditor lazily
const QuillEditor = defineAsyncComponent(() => 
  import('@vueup/vue-quill').then(mod => {
    // Import CSS only on client-side
    if (process.client) {
      import('@vueup/vue-quill/dist/vue-quill.snow.css')
    }
    return mod.QuillEditor
  })
)

const { t } = useLocalization()

defineProps<{
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number | null
  comparePrice: number | null
  sku: string
  barcode: string
  editorOptions: any
  disablePrice?: boolean
  isContactPrice?: boolean
}>()

defineEmits<{
  'update:name': [value: string]
  'update:slug': [value: string]
  'update:description': [value: string]
  'update:shortDescription': [value: string]
  'update:price': [value: number]
  'update:comparePrice': [value: number | null]
  'update:sku': [value: string]
  'update:barcode': [value: string]
  'update:isContactPrice': [value: boolean]
  'generate-slug': []
}>()
</script>

<style scoped>
.quill-editor {
  @apply bg-white rounded-lg overflow-hidden;
}

.ql-toolbar {
  @apply border-0 border-b border-slate-200 bg-white px-6 !important;
}

.ql-container {
  @apply border-0 bg-white !important;
}

.ql-editor {
  @apply min-h-[400px] text-slate-700 px-6 !important;
}

.ql-editor h1 {
  @apply text-3xl font-bold mb-4;
}

.ql-editor h2 {
  @apply text-2xl font-semibold mb-3;
}

.ql-editor h3 {
  @apply text-xl font-semibold mb-3;
}

.ql-editor p {
  @apply mb-4 text-base leading-relaxed;
}

.ql-editor ul, .ql-editor ol {
  @apply mb-4 pl-6;
}

.ql-editor ul {
  @apply list-disc;
}

.ql-editor ol {
  @apply list-decimal;
}

.ql-editor blockquote {
  @apply border-l-4 border-slate-200 pl-4 italic my-4;
}

.ql-editor img {
  @apply max-w-full rounded-lg my-4;
}

.ql-editor pre {
  @apply bg-slate-100 p-4 rounded-lg my-4 overflow-x-auto;
}

.ql-editor code {
  @apply font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded;
}
</style> 
