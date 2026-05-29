<template>
  <div class="space-y-6">
    <div class="rounded-lg border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-medium text-slate-900">Sidebar product detail</h3>
        <p class="text-sm text-slate-500">
          Chọn thủ công tin tức hoặc dịch vụ sẽ hiển thị ở sidebar. Nếu để trống, frontend sẽ tự tải 10 tin tức mới nhất.
        </p>
      </div>

      <div class="space-y-4 p-6">
        <div class="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-900">Loại nội dung</label>
            <select
              v-model="draftType"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              <option value="post">Tin tức</option>
              <option value="service">Dịch vụ</option>
            </select>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-900">Chọn item</label>
            <div class="space-y-2">
              <input
                v-model="search"
                type="text"
                placeholder="Tìm theo tiêu đề..."
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              />
              <select
                v-model="draftItemId"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="">Chọn item</option>
                <option
                  v-for="option in filteredOptions"
                  :key="`${draftType}-${option.id}`"
                  :value="String(option.id)"
                >
                  {{ option.title }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex items-end">
            <button
              type="button"
              @click="addItem"
              class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Thêm vào sidebar
            </button>
          </div>
        </div>

        <p v-if="loading" class="text-sm text-slate-500">Đang tải danh sách bài viết và dịch vụ...</p>
        <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white">
      <div class="border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-medium text-slate-900">Danh sách đã chọn</h3>
      </div>

      <div v-if="items.length === 0" class="p-6 text-sm text-slate-500">
        Chưa có item cấu hình. Frontend sẽ fallback sang 10 bài viết mới nhất.
      </div>

      <div v-else class="divide-y divide-slate-200">
        <div
          v-for="(item, index) in items"
          :key="`${item.itemType}-${item.itemId}-${index}`"
          class="flex items-center gap-4 px-6 py-4"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <NewspaperIcon v-if="item.itemType === 'post'" class="h-4 w-4" />
            <BriefcaseBusinessIcon v-else class="h-4 w-4" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-600">
                {{ item.itemType === 'post' ? 'Tin tức' : 'Dịch vụ' }}
              </span>
              <p class="truncate text-sm font-medium text-slate-900">
                {{ item.title }}
              </p>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              ID: {{ item.itemId }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="index === 0"
              @click="moveItem(index, -1)"
            >
              <ArrowUpIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="index === items.length - 1"
              @click="moveItem(index, 1)"
            >
              <ArrowDownIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
              @click="removeItem(index)"
            >
              <Trash2Icon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowDownIcon, ArrowUpIcon, BriefcaseBusinessIcon, NewspaperIcon, Trash2Icon } from 'lucide-vue-next';
import { useTrpc } from '../../composables/useTrpc';

type SidebarItemType = 'post' | 'service';

interface SidebarItemValue {
  itemType: SidebarItemType;
  itemId: number;
  position: number;
}

interface SidebarItemDisplay extends SidebarItemValue {
  title: string;
}

interface OptionItem {
  id: number;
  title: string;
}

const props = defineProps<{
  modelValue: SidebarItemValue[];
  locale: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SidebarItemValue[]];
}>();

const trpc = useTrpc();
const loading = ref(false);
const loadError = ref('');
const draftType = ref<SidebarItemType>('post');
const draftItemId = ref('');
const search = ref('');
const postOptions = ref<OptionItem[]>([]);
const serviceOptions = ref<OptionItem[]>([]);

const titleMap = computed(() => {
  const entries = new Map<string, string>();

  for (const option of postOptions.value) {
    entries.set(`post:${option.id}`, option.title);
  }

  for (const option of serviceOptions.value) {
    entries.set(`service:${option.id}`, option.title);
  }

  return entries;
});

const items = computed<SidebarItemDisplay[]>(() =>
  (props.modelValue || []).map((item, index) => ({
    ...item,
    position: index,
    title: titleMap.value.get(`${item.itemType}:${item.itemId}`) || `#${item.itemId}`,
  }))
);

const filteredOptions = computed(() => {
  const source = draftType.value === 'post' ? postOptions.value : serviceOptions.value;
  const keyword = search.value.trim().toLowerCase();

  if (!keyword) {
    return source;
  }

  return source.filter((option) => option.title.toLowerCase().includes(keyword));
});

watch(draftType, () => {
  draftItemId.value = '';
  search.value = '';
});

const normalizeItems = (itemsToNormalize: SidebarItemValue[]) =>
  itemsToNormalize.map((item, index) => ({
    itemType: item.itemType,
    itemId: item.itemId,
    position: index,
  }));

const emitItems = (nextItems: SidebarItemValue[]) => {
  emit('update:modelValue', normalizeItems(nextItems));
};

const addItem = () => {
  const itemId = Number(draftItemId.value);
  if (!itemId) return;

  const alreadyExists = props.modelValue.some(
    (item) => item.itemType === draftType.value && item.itemId === itemId
  );

  if (alreadyExists) return;

  emitItems([
    ...props.modelValue,
    {
      itemType: draftType.value,
      itemId,
      position: props.modelValue.length,
    },
  ]);

  draftItemId.value = '';
  search.value = '';
};

const moveItem = (index: number, direction: -1 | 1) => {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= props.modelValue.length) return;

  const nextItems = [...props.modelValue];
  const [current] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, current);
  emitItems(nextItems);
};

const removeItem = (index: number) => {
  emitItems(props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};

const loadOptions = async () => {
  loading.value = true;
  loadError.value = '';

  try {
    const [postResult, services] = await Promise.all([
      trpc.post.byLocale.query({
        locale: props.locale || 'vi',
        page: 1,
        limit: 100,
        sort: 'newest',
      }),
      trpc.service.all.query({
        locale: props.locale || 'vi',
      }),
    ]);

    postOptions.value = (postResult?.items || []).map((post: any) => ({
      id: post.id,
      title: post.title || post.translations?.find((translation: any) => translation.locale === props.locale)?.title || `Post #${post.id}`,
    }));

    serviceOptions.value = (services || []).map((service: any) => {
      const translation = service.translations?.find((item: any) => item.locale === props.locale) || service.translations?.[0];
      return {
        id: service.id,
        title: translation?.title || `Service #${service.id}`,
      };
    });
  } catch (error) {
    console.error('Failed to load sidebar options:', error);
    loadError.value = 'Không tải được danh sách nội dung để cấu hình sidebar.';
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.locale,
  () => {
    loadOptions();
  }
);

onMounted(() => {
  loadOptions();
});
</script>
