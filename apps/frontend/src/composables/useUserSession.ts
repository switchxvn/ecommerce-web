import { ref, computed } from 'vue';
import { useTrpc } from './useTrpc';
import { useUserStore } from '@/stores/useUserStore';

// Session storage key
const SESSION_ID_KEY = 'user_session_id';

let cachedIpInfo: IpInfo | null = null;
let ipInfoPromise: Promise<IpInfo> | null = null;
let clientTrackingStarted = false;
let userSessionInstance: ReturnType<typeof createUserSession> | null = null;

// Hàm tạo ID ngẫu nhiên thay thế cho uuid
const generateRandomId = (): string => {
  // Tạo chuỗi ngẫu nhiên 16 ký tự
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
};

interface IpInfo {
  ip: string;
  country?: string;
}

function inferCountryFromLocale(): string {
  if (!process.client || typeof navigator === 'undefined') {
    return 'XX';
  }

  const language = navigator.language || '';
  const countrySegment = language.split(/[-_]/)[1];
  return countrySegment?.toUpperCase() || 'XX';
}

const getClientIpInfo = async (): Promise<IpInfo> => {
  if (cachedIpInfo) {
    return cachedIpInfo;
  }

  if (ipInfoPromise) {
    return ipInfoPromise;
  }

  ipInfoPromise = (async () => {
    cachedIpInfo = {
      ip: 'unknown',
      country: inferCountryFromLocale(),
    };

    return cachedIpInfo;
  })();

  try {
    return await ipInfoPromise;
  } finally {
    ipInfoPromise = null;
  }
};

const createUserSession = () => {
  const trpc = useTrpc();
  const userStore = useUserStore();
  const sessionId = ref<string | null>(null);
  const isActive = ref(true);
  const pageViews = ref(0);
  const sessionStartTime = ref<Date | null>(null);
  const currentPage = ref<string | null>(null);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  // Tạo hoặc lấy session ID từ localStorage
  const getOrCreateSessionId = (): string => {
    try {
      let id = localStorage.getItem(SESSION_ID_KEY);
      if (!id) {
        id = generateRandomId();
        localStorage.setItem(SESSION_ID_KEY, id);
      }
      return id;
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      // Fallback to in-memory ID if localStorage fails
      return generateRandomId();
    }
  };

  // Lấy session từ server
  const getSession = async (id: string) => {
    try {
      const session = await trpc.userSession.getSession.query({ sessionId: id });
      
      if (session) {
        // Cập nhật các giá trị theo thông tin từ server
        sessionStartTime.value = new Date(session.startTime);
        pageViews.value = session.pageViews;
        isActive.value = true;
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error getting session:', err);
      return false;
    }
  };

  // Khởi tạo session
  const initSession = async () => {
    if (isInitialized.value) {
      return sessionId.value;
    }
    
    try {
      // Lấy thông tin trình duyệt
      const userAgent = navigator.userAgent;
      const deviceInfo = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        platform: navigator.platform,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Lấy địa chỉ IP và quốc gia của client
      const ipInfo = await getClientIpInfo();

      // Lấy thông tin trang hiện tại
      currentPage.value = window.location.pathname;
      
      // Lấy thông tin referrer
      const referrer = document.referrer;
      
      // Tạo hoặc lấy session ID
      const id = getOrCreateSessionId();
      sessionId.value = id;
      
      // Lấy user ID nếu đã đăng nhập
      const userId = userStore.user?.id || null;

      // Kiểm tra xem phiên đã tồn tại chưa
      const sessionExists = await getSession(id);
      
      if (!sessionExists) {
        // Gửi request khởi tạo session mới
        await trpc.userSession.startSession.mutate({
          sessionId: id,
          userId,
          ipAddress: ipInfo.ip,
          country: ipInfo.country,
          userAgent,
          deviceInfo,
          referrer,
          landingPage: currentPage.value
        });

        // Khởi tạo các giá trị theo dõi
        sessionStartTime.value = new Date();
        pageViews.value = 1;
        isActive.value = true;
      }
      isInitialized.value = true;

      return sessionId.value;
    } catch (err: any) {
      console.error('Error initializing session:', err);
      error.value = err?.message || 'Lỗi khởi tạo phiên';
      return null;
    }
  };

  // Cập nhật session khi có hoạt động
  const updateSession = async () => {
    return;
  };

  // Kết thúc session
  const endSession = async () => {
    try {
      if (!sessionId.value) return;

      // Lưu trang hiện tại làm trang thoát
      const exitPage = window.location.pathname;

      await trpc.userSession.endSession.mutate({
        sessionId: sessionId.value,
        exitPage
      });

      // Xóa session ID khỏi localStorage để tạo session mới lần sau
      localStorage.removeItem(SESSION_ID_KEY);
      sessionId.value = null;
      isActive.value = false;
      isInitialized.value = false;

      return true;
    } catch (err: any) {
      console.error('Error ending session:', err);
      error.value = err?.message || 'Lỗi kết thúc phiên';
      return false;
    }
  };

  // Ghi nhận chuyển trang
  const trackPageView = (path: string) => {
    // Khởi tạo session nếu chưa có
    if (!sessionId.value || !isInitialized.value) {
      initSession().then(() => {
        updatePageView(path);
      });
      return;
    }
    
    updatePageView(path);
  };
  
  const updatePageView = (path: string) => {
    currentPage.value = path;
    pageViews.value += 1;
  };

  // Force cập nhật thời gian hoạt động ngay lập tức
  const pingActivity = () => {
    return;
  };

  // Xử lý sự kiện khi user không còn hoạt động
  const handleVisibilityChange = () => {
    const isVisible = document.visibilityState === 'visible';
    isActive.value = isVisible;
  };

  // Xử lý sự kiện trước khi trang được đóng
  const handleBeforeUnload = async () => {
    if (sessionId.value && isActive.value) {
      // Cập nhật lần cuối trước khi đóng trang
      try {
        const exitPage = window.location.pathname;

        // Sử dụng Beacon API để đảm bảo request được gửi ngay cả khi trang đóng
        const data = JSON.stringify({
          sessionId: sessionId.value,
          exitPage
        });
        
        // Tạo request thủ công vì trpc client không hỗ trợ Beacon API
        navigator.sendBeacon('/api/trpc/userSession.endSession', data);
      } catch (error) {
        console.error('Error in beforeunload handler:', error);
      }
    }
  };

  const setupTracking = () => {
    if (!process.client || clientTrackingStarted) {
      return;
    }

    clientTrackingStarted = true;
    initSession();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
      document.addEventListener(event, pingActivity, { passive: true });
    });
  };

  const teardownTracking = () => {
    if (!process.client || !clientTrackingStarted) {
      return;
    }

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);

    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
      document.removeEventListener(event, pingActivity);
    });

    clientTrackingStarted = false;
  };

  return {
    sessionId: computed(() => sessionId.value),
    isActive: computed(() => isActive.value),
    pageViews: computed(() => pageViews.value),
    currentPage: computed(() => currentPage.value),
    error: computed(() => error.value),
    updateSession,
    endSession,
    trackPageView,
    initSession,
    pingActivity,
    setupTracking,
    teardownTracking,
  };
};

export const useUserSession = () => {
  if (!userSessionInstance) {
    userSessionInstance = createUserSession();
  }

  return userSessionInstance;
};
