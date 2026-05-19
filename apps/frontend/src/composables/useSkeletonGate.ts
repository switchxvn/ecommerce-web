import { nextTick, onMounted, ref } from 'vue';

export function useSkeletonGate() {
  const shouldShowSkeleton = ref(true);

  onMounted(async () => {
    await nextTick();
    shouldShowSkeleton.value = false;
  });

  return {
    shouldShowSkeleton,
  };
}
