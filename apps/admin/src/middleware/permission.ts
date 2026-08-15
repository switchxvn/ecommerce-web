import { RouteLocationNormalized } from 'vue-router';
import { usePermissions } from '../composables/usePermissions';
import { useAuth } from '../composables/useAuth';
import { resolveRequiredPermissions } from '../utils/permission-route';

// Định nghĩa quyền truy cập cho từng route
const routePermissions: Record<string, string[]> = {
  '/settings': ['ACCESS_ADMIN_SETTINGS', 'MANAGE_SETTINGS'],
  '/settings/general': ['MANAGE_SETTINGS'],
  '/settings/language': ['MANAGE_LOCALES'],
  '/settings/seo': ['MANAGE_SEO'],
  '/settings/email': ['MANAGE_EMAIL'],
  '/settings/security': ['MANAGE_AUTH'],
  '/settings/theme': ['MANAGE_THEME'],
  '/settings/users': ['MANAGE_USERS'],
  '/settings/system': ['MANAGE_SYSTEM'],
  '/settings/api': ['MANAGE_API'],
  '/settings/advanced': ['MANAGE_ADVANCED'],
  '/settings/advertising-popups': ['VIEW_SETTINGS'],
  // Thêm nhiều route khác ở đây
};

/**
 * Middleware kiểm tra quyền truy cập cho từng trang
 */
export default async function (to: RouteLocationNormalized) {
  // Không thực hiện kiểm tra nếu client-side không khả dụng
  if (typeof window === 'undefined') return;

  // Không kiểm tra quyền cho các trang auth (login, logout)
  if (to.path.startsWith('/auth/')) {
    console.log('Auth page, skip permission check:', to.path);
    return;
  }

  try {
    // Lấy thông tin người dùng trước
    const { checkAuth, user } = useAuth();

    // Đảm bảo thông tin người dùng đã được tải
    const isAuthenticated = await checkAuth();
    console.log('Permission middleware - Auth check result:', isAuthenticated);
    console.log(
      'User data after auth check:',
      JSON.stringify(user.value, null, 2)
    );

    // Chờ thêm một khoảng thời gian ngắn để đảm bảo dữ liệu đã được tải hoàn tất
    if (isAuthenticated && !user.value?.permissions) {
      console.log('Permissions not loaded yet, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Kiểm tra nếu người dùng không có thông tin, chuyển đến login
    if (!user.value) {
      console.log('No user found, redirecting to login');
      return '/auth/login';
    }

    // Log thông tin người dùng chi tiết để debug
    console.log('User data for permission check:', {
      id: user.value.id,
      role: user.value.role,
      roles: user.value.roles,
      permissions: user.value.permissions,
    });

    // Kiểm tra SUPER_ADMIN
    const isSuperAdmin = () => {
      // Kiểm tra từ role đơn
      if (user.value?.role === 'SUPER_ADMIN') {
        console.log('SUPER_ADMIN detected from role property');
        return true;
      }

      // Kiểm tra từ mảng roles (nếu có)
      if (user.value?.roles) {
        // Kiểm tra kiểu dữ liệu của roles
        if (Array.isArray(user.value.roles)) {
          if (user.value.roles.length > 0) {
            // Sử dụng "in" operator để kiểm tra thuộc tính an toàn
            const isSuperAdminRole = user.value.roles.some(
              (role) =>
                (typeof role === 'string' && role === 'SUPER_ADMIN') ||
                (typeof role === 'object' &&
                  role !== null &&
                  'code' in role &&
                  role.code === 'SUPER_ADMIN')
            );

            if (isSuperAdminRole) {
              console.log('SUPER_ADMIN detected from roles array');
              return true;
            }
          }
        }
      }

      // Kiểm tra từ mảng permissions
      if (user.value?.permissions?.includes('SUPER_ADMIN')) {
        console.log('SUPER_ADMIN detected from permissions array');
        return true;
      }

      return false;
    };

    // Nếu là SUPER_ADMIN, cho phép truy cập
    if (isSuperAdmin()) {
      console.log('User is SUPER_ADMIN, allowing access to:', to.path);
      return; // Cho phép truy cập
    }

    // Sử dụng composable quyền truy cập
    const { hasAnyPermission } = usePermissions();

    // Lấy yêu cầu quyền cho route hiện tại
    const path = to.path;

    // Danh sách các quyền cần thiết cho route hiện tại
    const requiredPermissions = resolveRequiredPermissions(
      path,
      routePermissions
    );

    // Nếu không có quyền nào được đặt cho route, cho phép truy cập
    if (!requiredPermissions.length) {
      console.log('No permissions required for this route:', to.path);
      return;
    }

    // Kiểm tra xem người dùng có ít nhất một quyền cần thiết không
    const hasAccess = hasAnyPermission(requiredPermissions);

    console.log(`User permissions check for ${to.path}:`, {
      required: requiredPermissions,
      hasAccess,
      userPermissions: user.value?.permissions || [],
      userRole: user.value?.role,
    });

    // Nếu không có quyền, hiển thị thông báo từ chối quyền
    if (!hasAccess) {
      console.log('Access denied for path:', to.path);
      return; // Cho phép truy cập nhưng hiển thị thông báo từ chối trong trang
    }

    // Cho phép truy cập vào trang
    return;
  } catch (error) {
    console.error('Error in permission middleware:', error);
    // Trong trường hợp lỗi, vẫn cho phép truy cập nhưng ghi log lỗi
    return;
  }
}
