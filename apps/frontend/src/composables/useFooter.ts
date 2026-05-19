import { ref } from 'vue';
import { useTrpc } from './useTrpc';
import type { Footer } from '~/interfaces/footer.interface';

export const useFooter = () => {
  const trpc = useTrpc();
  const activeFooter = ref<Footer | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Lấy footer đang active
  const fetchActiveFooter = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await trpc.footer.getActiveFooter.query();
      
      if (response) {
        activeFooter.value = response as Footer;
      } else {
        console.error('Invalid API response:', response);
        error.value = 'Không thể tải thông tin footer: Dữ liệu không hợp lệ';
        activeFooter.value = null;
      }
    } catch (err) {
      console.error('Failed to fetch active footer:', err);
      error.value = err instanceof Error ? err.message : 'Không thể tải thông tin footer';
      activeFooter.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    activeFooter,
    isLoading,
    error,
    fetchActiveFooter
  };
};
