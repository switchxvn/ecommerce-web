import { computed, ref, watch, type Ref } from 'vue';

export function useSelectableGalleryImage(thumbnail: Ref<string | null | undefined>) {
  const selectedImage = ref('');

  watch(
    thumbnail,
    (nextThumbnail) => {
      selectedImage.value = nextThumbnail || '';
    },
    {
      immediate: true,
      flush: 'sync',
    }
  );

  const activeImage = computed(() => selectedImage.value || thumbnail.value || '');

  const selectImage = (image: string) => {
    if (!image) return;
    selectedImage.value = image;
  };

  return {
    activeImage,
    selectImage,
  };
}
