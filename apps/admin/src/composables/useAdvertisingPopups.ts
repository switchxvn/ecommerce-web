import { ref } from 'vue';
import { useTrpc } from './useTrpc';
import type {
  AdvertisingPopup,
  PopupMutationInput,
} from '@/types/advertising-popup';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Không thể xử lý chiến dịch popup';

export function useAdvertisingPopups() {
  const trpc = useTrpc();
  const campaigns = ref<AdvertisingPopup[]>([]);
  const current = ref<AdvertisingPopup | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await operation();
    } catch (caught) {
      error.value = errorMessage(caught);
      throw caught;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () =>
    run(async () => {
      campaigns.value =
        (await trpc.advertisingPopup.list.query()) as AdvertisingPopup[];
      return campaigns.value;
    });
  const getActive = () => run(() => trpc.advertisingPopup.getActive.query());
  const getById = (id: number) =>
    run(async () => {
      current.value = (await trpc.advertisingPopup.getById.query(
        id
      )) as AdvertisingPopup;
      return current.value;
    });
  const create = (data: PopupMutationInput) =>
    run(() => trpc.advertisingPopup.create.mutate(data));
  const update = (id: number, data: PopupMutationInput) =>
    run(() => trpc.advertisingPopup.update.mutate({ id, data }));
  const setActive = (id: number, active: boolean) =>
    run(async () => {
      const result = await trpc.advertisingPopup.setActive.mutate({
        id,
        active,
      });
      await refresh();
      return result;
    });
  const remove = (id: number) =>
    run(async () => {
      const result = await trpc.advertisingPopup.delete.mutate(id);
      await refresh();
      return result;
    });

  return {
    campaigns,
    current,
    loading,
    error,
    refresh,
    getActive,
    getById,
    create,
    update,
    setActive,
    remove,
  };
}
