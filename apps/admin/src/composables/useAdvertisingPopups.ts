import { computed, reactive, ref } from 'vue';
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
  const inFlight = ref(0);
  const loading = computed(() => inFlight.value > 0);
  const error = ref<string | null>(null);
  const pendingActions = reactive(new Set<number>());
  const actionPromises = new Map<number, Promise<unknown>>();

  const run = async <T>(
    operation: () => Promise<T>,
    options: { reportError?: boolean; clearError?: boolean } = {}
  ): Promise<T> => {
    inFlight.value += 1;
    if (options.clearError) error.value = null;
    try {
      return await operation();
    } catch (caught) {
      if (options.reportError) error.value = errorMessage(caught);
      throw caught;
    } finally {
      inFlight.value -= 1;
    }
  };

  const runAction = <T>(
    id: number,
    operation: () => Promise<T>
  ): Promise<T> => {
    const existing = actionPromises.get(id);
    if (existing) return existing as Promise<T>;
    pendingActions.add(id);
    const promise = run(operation).finally(() => {
      pendingActions.delete(id);
      actionPromises.delete(id);
    });
    actionPromises.set(id, promise);
    return promise;
  };

  const refresh = () =>
    run(
      async () => {
        campaigns.value =
          (await trpc.advertisingPopup.list.query()) as AdvertisingPopup[];
        return campaigns.value;
      },
      { reportError: true, clearError: true }
    );
  const getActive = () =>
    run(() => trpc.advertisingPopup.getActive.query(), {
      reportError: true,
      clearError: true,
    });
  const getById = (id: number) =>
    run(
      async () => {
        current.value = (await trpc.advertisingPopup.getById.query(
          id
        )) as AdvertisingPopup;
        return current.value;
      },
      { reportError: true, clearError: true }
    );
  const create = (data: PopupMutationInput) =>
    run(() => trpc.advertisingPopup.create.mutate(data), {
      reportError: true,
      clearError: true,
    });
  const update = (id: number, data: PopupMutationInput) =>
    run(() => trpc.advertisingPopup.update.mutate({ id, data }), {
      reportError: true,
      clearError: true,
    });
  const setActive = (id: number, active: boolean) =>
    runAction(id, async () => {
      const result = (await trpc.advertisingPopup.setActive.mutate({
        id,
        active,
      })) as AdvertisingPopup;
      campaigns.value = campaigns.value.map((campaign) => {
        if (campaign.id === id) return result;
        return active ? { ...campaign, isActive: false } : campaign;
      });
      if (current.value?.id === id) current.value = result;
      return result;
    });
  const remove = (id: number) =>
    runAction(id, async () => {
      const result = await trpc.advertisingPopup.delete.mutate(id);
      campaigns.value = campaigns.value.filter(
        (campaign) => campaign.id !== id
      );
      if (current.value?.id === id) current.value = null;
      return result;
    });
  const isActionPending = (id: number) => pendingActions.has(id);

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
    isActionPending,
  };
}
