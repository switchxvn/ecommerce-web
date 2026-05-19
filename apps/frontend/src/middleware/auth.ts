import { useAuth } from '@/composables/useAuth';
import { AUTH_ROUTE_PATHS } from '@/utils/routes';

export default defineNuxtRouteMiddleware(async (to) => {
  const { checkAuth } = useAuth();
  const isAuthenticated = await checkAuth();
  
  // Các trang không yêu cầu xác thực
  const publicPages = [AUTH_ROUTE_PATHS.login, AUTH_ROUTE_PATHS.register];
  const requiresAuth = !publicPages.includes(to.path);
  
  // Nếu route yêu cầu xác thực và người dùng chưa đăng nhập
  if (requiresAuth && !isAuthenticated) {
    return navigateTo(AUTH_ROUTE_PATHS.login);
  }
  
  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
  if (isAuthenticated && publicPages.includes(to.path)) {
    return navigateTo('/');
  }
}); 
