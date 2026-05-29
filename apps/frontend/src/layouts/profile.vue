<script setup lang="ts">
import { useRoute } from 'vue-router';
import {
  UserCircle,
  Settings,
  CreditCard,
  ShoppingBag,
  Heart,
  Bell
} from 'lucide-vue-next';

const route = useRoute();

const navigationItems = [
  { name: 'Thông tin cá nhân', href: '/dashboard', icon: UserCircle },
  { name: 'Đơn hàng của tôi', href: '/dashboard', icon: ShoppingBag },
  { name: 'Sản phẩm yêu thích', href: '/dashboard', icon: Heart },
  { name: 'Thông báo', href: '/dashboard', icon: Bell },
  { name: 'Phương thức thanh toán', href: '/dashboard', icon: CreditCard },
  { name: 'Cài đặt', href: '/dashboard', icon: Settings },
];

const isActiveRoute = (path: string) => {
  return route.path === path;
};
</script>

<template>
  <div>
    <!-- Auth Guard -->
    <AuthGuard>
      <div class="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <!-- Dashboard Header -->
        <DashboardHeader />

        <!-- Main Content -->
        <main class="py-8">
          <div class="mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex gap-8">
              <!-- Sidebar Navigation -->
              <aside class="w-64 flex-shrink-0">
                <nav class="space-y-1 bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
                  <NuxtLink
                    v-for="item in navigationItems"
                    :key="item.name"
                    :to="item.href"
                    :class="[
                      isActiveRoute(item.href)
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700',
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                    ]"
                  >
                    <component
                      :is="item.icon"
                      :class="[
                        isActiveRoute(item.href)
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400',
                        'flex-shrink-0 -ml-1 mr-3 h-6 w-6'
                      ]"
                      aria-hidden="true"
                    />
                    {{ item.name }}
                  </NuxtLink>
                </nav>
              </aside>

              <!-- Page Content -->
              <div class="flex-1">
                <slot />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  </div>
</template> 
