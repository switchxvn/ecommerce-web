import { ref } from 'vue';
import type { Service, ServiceFilter, ServiceResponse } from '../types/service';
import { useTrpc } from './useTrpc';
import { normalizeLocaleCode } from '../utils/locale';

export function useService() {
  const trpc = useTrpc();
  
  const services = ref<Service[]>([]);
  const totalServices = ref(0);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const fetchServices = async (page: number, limit: number, filters?: ServiceFilter) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await trpc.service.list.query({
        page,
        limit,
        ...filters,
        locale: filters?.locale ? normalizeLocaleCode(filters.locale) : undefined,
      });

      services.value = response.items;
      totalServices.value = response.total;
    } catch (err) {
      error.value = err as Error;
      console.error('Error fetching services:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    services,
    totalServices,
    isLoading,
    error,
    fetchServices,
  };
}

export type { ServiceFilter } from '../types/service'; 
