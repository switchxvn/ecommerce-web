// Auto-imported by Nuxt 3;
import { useRouter } from 'vue-router';
import { TRPCClientError } from '@trpc/client';
import { useTrpc } from './useTrpc';
import { ref } from 'vue';
import type { User, UserProfile, AuthLoginResponse } from '../types/User';
import { useCookie } from 'nuxt/app';
import type { AppRouter } from '../types/trpc';
import { useUserStore } from '@/stores/useUserStore';
import { computed } from 'vue';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export const useAuth = () => {
  const router = useRouter();
  const trpc = useTrpc();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const userStore = useUserStore();

  const login = async (credentials: { email: string; password: string }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await trpc.auth.login.mutate(credentials);
      
      if (result.accessToken) {
        // Lưu token vào localStorage
        localStorage.setItem('accessToken', result.accessToken);
        
        // Lấy thông tin user và cập nhật store
        await userStore.fetchUser();

        // Redirect to dashboard
        router.push('/');
      }
    } catch (err: any) {
      if (err.shape?.message) {
        error.value = err.shape.message;
      } else {
        error.value = 'Đã xảy ra lỗi trong quá trình đăng nhập';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      await trpc.auth.logout.mutate();
      
      // Xóa token và user info
      localStorage.removeItem('accessToken');
      userStore.clearUser();

      // Redirect to login
      router.push('/auth/login');
    } catch (err: any) {
      error.value = 'Đã xảy ra lỗi trong quá trình đăng xuất';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const checkAuth = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }

      // Lấy thông tin user và cập nhật store
      await userStore.fetchUser();

      return true;
    } catch (err) {
      localStorage.removeItem('accessToken');
      userStore.clearUser();
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    login,
    logout,
    checkAuth,
    isLoading,
    error,
    user: computed(() => userStore.user),
  };
}; 
