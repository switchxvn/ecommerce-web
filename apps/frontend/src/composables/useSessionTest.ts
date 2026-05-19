import { ref } from 'vue';
import { useTrpc } from './useTrpc';

/**
 * Composable để test trực tiếp tRPC endpoint
 */
export const useSessionTest = () => {
  const trpc = useTrpc();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const result = ref<any>(null);
  
  /**
   * Test tạo session mới
   */
  const testCreateSession = async () => {
    loading.value = true;
    error.value = null;
    result.value = null;
    
    try {
      const sessionId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const response = await trpc.userSession.startSession.mutate({
        sessionId: sessionId,
        userAgent: navigator.userAgent,
        deviceInfo: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          platform: navigator.platform
        },
        referrer: document.referrer,
        landingPage: window.location.pathname
      });

      result.value = {
        success: true,
        sessionId: sessionId,
        response: response
      };
      
      return result.value;
    } catch (err: any) {
      console.error('tRPC test error:', err);
      error.value = err?.message || 'Unknown error';
      result.value = {
        success: false,
        error: error.value
      };
      
      return result.value;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Test lấy số người dùng đang hoạt động
   */
  const testGetActiveUsers = async () => {
    loading.value = true;
    error.value = null;
    result.value = null;
    
    try {
      const count = await trpc.userSession.getActiveUserCount.query();

      result.value = {
        success: true,
        activeUsers: count
      };
      
      return result.value;
    } catch (err: any) {
      console.error('tRPC test error:', err);
      error.value = err?.message || 'Unknown error';
      result.value = {
        success: false,
        error: error.value
      };
      
      return result.value;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Test tạo request bằng fetch raw
   */
  const testRawFetch = async () => {
    loading.value = true;
    error.value = null;
    result.value = null;
    
    try {
      const sessionId = `raw-test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      const payload = {
        json: {
          sessionId: sessionId,
          userAgent: navigator.userAgent,
          deviceInfo: {
            platform: navigator.platform
          }
        }
      };
      
      const response = await fetch('/api/trpc/userSession.startSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      result.value = {
        success: response.ok,
        status: response.status,
        data: data
      };
      
      return result.value;
    } catch (err: any) {
      console.error('Raw fetch error:', err);
      error.value = err?.message || 'Unknown error';
      result.value = {
        success: false,
        error: error.value
      };
      
      return result.value;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    loading,
    error,
    result,
    testCreateSession,
    testGetActiveUsers,
    testRawFetch
  };
};
