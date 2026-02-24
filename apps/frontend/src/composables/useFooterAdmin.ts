import { ref } from 'vue';
import type { CreateFooterInput, UpdateFooterInput } from '@ew/shared';
import type { Footer } from '~/interfaces/footer.interface';
import { useTrpc } from './useTrpc';

export const useFooterAdmin = () => {
  const trpc = useTrpc();
  const footers = ref<Footer[]>([]);
  const currentFooter = ref<Footer | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Lấy danh sách tất cả footer
  const fetchAllFooters = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết router này tồn tại
      footers.value = await trpc.footer.getAllFooters.query();
    } catch (err) {
      console.error('Failed to fetch footers:', err);
      error.value = err instanceof Error ? err.message : 'Không thể tải danh sách footer';
    } finally {
      isLoading.value = false;
    }
  };

  // Tạo footer mới
  const createFooter = async (data: CreateFooterInput) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết router này tồn tại
      const newFooter = await trpc.footer.createFooter.mutate(data);
      footers.value.push(newFooter);
      return newFooter;
    } catch (err) {
      console.error('Failed to create footer:', err);
      error.value = err instanceof Error ? err.message : 'Không thể tạo footer mới';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Cập nhật footer
  const updateFooter = async (id: number, data: UpdateFooterInput) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết router này tồn tại
      const updatedFooter = await trpc.footer.updateFooter.mutate({ id, data });
      
      // Cập nhật danh sách
      const index = footers.value.findIndex(f => f.id === id);
      if (index !== -1) {
        footers.value[index] = updatedFooter;
      }
      
      return updatedFooter;
    } catch (err) {
      console.error(`Failed to update footer ${id}:`, err);
      error.value = err instanceof Error ? err.message : 'Không thể cập nhật footer';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Xóa footer
  const deleteFooter = async (id: number) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết router này tồn tại
      await trpc.footer.deleteFooter.mutate(id);
      
      // Xóa khỏi danh sách
      footers.value = footers.value.filter(f => f.id !== id);
      
      return true;
    } catch (err) {
      console.error(`Failed to delete footer ${id}:`, err);
      error.value = err instanceof Error ? err.message : 'Không thể xóa footer';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Đặt footer làm active
  const setActiveFooter = async (id: number) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết router này tồn tại
      const activeFooter = await trpc.footer.setActiveFooter.mutate(id);
      
      // Cập nhật trạng thái active trong danh sách
      footers.value = footers.value.map(footer => ({
        ...footer,
        isActive: footer.id === id
      }));
      
      return activeFooter;
    } catch (err) {
      console.error(`Failed to set footer ${id} as active:`, err);
      error.value = err instanceof Error ? err.message : 'Không thể đặt footer làm active';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    footers,
    currentFooter,
    isLoading,
    error,
    fetchAllFooters,
    createFooter,
    updateFooter,
    deleteFooter,
    setActiveFooter
  };
}; 
