import { navigateTo } from 'nuxt/app'
import { useTheme } from '../composables/useTheme'
import type { RouteLocationNormalized } from 'vue-router'

// @ts-ignore - Nuxt runtime type
export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  console.log('🔧 Auth middleware: Checking route:', to.path)
  
  // Skip middleware on server side
  if (process.server) {
    console.log('🔧 Auth middleware: Skipping on server side')
    return
  }

  // Skip for auth routes
  if (to.path.startsWith('/auth/')) {
    console.log('🔧 Auth middleware: Skipping for auth routes')
    return
  }

  console.log('🔧 Auth middleware: Starting basic token check')

  // Check if token exists (basic check only)
  const token = localStorage.getItem('accessToken')
  if (!token) {
    console.log('❌ Auth middleware: No token found, redirecting to login')
    
    // Đảm bảo theme được khởi tạo trước khi chuyển hướng
    if (process.client) {
      try {
        const { initializeTheme } = useTheme()
        await initializeTheme()
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Failed to initialize theme before redirect:', error)
      }
    }
    
    return navigateTo('/auth/login', { replace: true })
  }

  console.log('✅ Auth middleware: Token found, proceeding to page (will verify in layout)')
  // Let the layout handle server verification to avoid conflicts
}) 
