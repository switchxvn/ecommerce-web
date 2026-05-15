import { useUserSession } from '@/composables/useUserSession';
import { useRoute, useRouter } from 'vue-router';

export default defineNuxtPlugin(() => {
  // Chỉ chạy ở phía client
  if (process.client) {
    const trackingWindow = window as Window & {
      __mgaUserSessionPluginInitialized?: boolean;
      __mgaUserSessionIntervalId?: ReturnType<typeof setInterval>;
    };

    if (trackingWindow.__mgaUserSessionPluginInitialized) {
      return;
    }

    trackingWindow.__mgaUserSessionPluginInitialized = true;
    const userSession = useUserSession();
    const router = useRouter();
    
    // Khởi tạo session ngay khi ứng dụng khởi động
    setTimeout(() => {
      userSession.initSession().then((sessionId) => {
        // Ghi nhận page view ban đầu
        const currentPath = window.location.pathname;
        userSession.trackPageView(currentPath);
      });
    }, 500); // Chờ một chút để đảm bảo các thành phần khác đã được tải
    
    // Lắng nghe sự kiện thay đổi route để theo dõi page views
    router.afterEach((to) => {
      // Theo dõi page view cho mỗi lần chuyển trang
      userSession.trackPageView(to.path);
    });
    
    // Cập nhật session định kỳ khi người dùng đang ở trên trang
    trackingWindow.__mgaUserSessionIntervalId = setInterval(() => {
      userSession.pingActivity();
    }, 30000); // Cập nhật mỗi 30 giây nếu người dùng đang active
  }
}); 
