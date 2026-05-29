import { TRPCClientError } from '@trpc/client'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { navigateTo } from '#imports'
import { useUserStore } from '@/stores/useUserStore'
import type { ProfileResponseExtended, User } from '../types/user'
import { useTrpc } from './useTrpc'

export interface LoginCredentials {
  email: string
  password: string
}

const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  return null
}

export const useAuth = () => {
  const router = useRouter()
  const trpc = useTrpc()
  const userStore = useUserStore()
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      userStore.setLoading(true)
      error.value = null

      const result = await trpc.auth.login.mutate(credentials)
      
      if (result.accessToken) {
        // Save token to localStorage
        const storage = getLocalStorage()
        if (storage) {
          storage.setItem('accessToken', result.accessToken)
        }
        
        // Get user info and update store
        await loadUserToStore()

        // Redirect to dashboard
        router.push('/')
      }
    } catch (err: any) {
      const errorMessage = err instanceof TRPCClientError ? err.message : 'An error occurred during login'
      error.value = errorMessage
      userStore.setError(errorMessage)
      throw err
    } finally {
      isLoading.value = false
      userStore.setLoading(false)
    }
  }

  const logout = async () => {
    try {
      isLoading.value = true
      userStore.setLoading(true)
      error.value = null

      await trpc.auth.logout.mutate()
      
      // Clear everything
      const storage = getLocalStorage()
      if (storage) {
        storage.removeItem('accessToken')
      }
      userStore.clearUser()

      // Redirect to login
      if (typeof window !== 'undefined') {
        navigateTo('/auth/login', { replace: true })
        return
      }
      
      router.push({ path: '/auth/login', replace: true })
    } catch (err: any) {
      const errorMessage = 'An error occurred during logout'
      error.value = errorMessage
      userStore.setError(errorMessage)
      throw err
    } finally {
      isLoading.value = false
      userStore.setLoading(false)
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    console.log('🔍 checkAuth: Starting authentication check')
    try {
      isLoading.value = true
      userStore.setLoading(true)
      error.value = null

      await new Promise(resolve => setTimeout(resolve, 0))

      const storage = getLocalStorage()
      if (!storage) {
        console.log('❌ checkAuth: No localStorage available')
        return false
      }

      const token = storage.getItem('accessToken')
      if (!token) {
        console.log('❌ checkAuth: No access token found')
        return false
      }

      console.log('✅ checkAuth: Token found, loading user data...')
      try {
        await loadUserToStore()
        console.log('✅ checkAuth: User data loaded successfully, authentication passed')
        return true
      } catch (profileError: any) {
        console.log('❌ checkAuth: Profile loading failed:', profileError)
        const errorMessage = profileError?.message || ''
        const isAuthError = profileError instanceof TRPCClientError && 
                           (errorMessage.includes('unauthorized') || 
                            errorMessage.includes('unauthenticated') ||
                            errorMessage.includes('expired'))
                           
        if (isAuthError) {
          console.log('❌ checkAuth: Auth error detected, clearing token and redirecting')
          // Clear invalid token
          storage.removeItem('accessToken')
          userStore.clearUser()
          
          // Redirect to login page if not already there
          if (process.client && !window.location.pathname.endsWith('/auth/login')) {
            console.log('🔄 checkAuth: Redirecting to login page')
            navigateTo('/auth/login', { replace: true })
            return false
          }
        } else {
          console.log('❌ checkAuth: Non-auth error:', profileError)
        }
        
        return false
      }
    } catch (err) {
      console.log('❌ checkAuth: Unexpected error:', err)
      return false
    } finally {
      isLoading.value = false
      userStore.setLoading(false)
      console.log('🏁 checkAuth: Authentication check completed')
    }
  }

  // Helper function to load user data to store
  const loadUserToStore = async () => {
    const userInfo = await trpc.profile.getMyProfile.query() as any
    
    if (userInfo?.id) {
      // Determine role from roles array
      let userRole = 'user'
      if (userInfo.roles && Array.isArray(userInfo.roles)) {
        if (userInfo.roles.includes('SUPER_ADMIN')) {
          userRole = 'SUPER_ADMIN'
        } else if (userInfo.roles.includes('ADMIN')) {
          userRole = 'ADMIN'
        }
      }
      
      // Transform API response to User interface
      const user: User = {
        id: String(userInfo.id),
        email: userInfo.email,
        name: userInfo.profile?.firstName || userInfo.email.split('@')[0],
        role: userRole,
        permissions: userInfo.permissions?.map((p: any) => p.code) || [],
        roles: userInfo.roles || [],
        profile: userInfo.profile || null,
        isActive: userInfo.isActive ?? true, // Default to true if not provided
        isEmailVerified: userInfo.isEmailVerified ?? false,
        createdAt: userInfo.createdAt instanceof Date ? userInfo.createdAt.toISOString() : String(userInfo.createdAt),
        updatedAt: userInfo.updatedAt instanceof Date ? userInfo.updatedAt.toISOString() : String(userInfo.updatedAt)
      }
      
      userStore.setUser(user)
    }
  }

  return {
    login,
    logout,
    checkAuth,
    isLoading,
    error,
    // Expose store getters for backward compatibility
    isAuthenticated: () => userStore.isAuthenticated,
    user: () => userStore.user,
  }
} 
