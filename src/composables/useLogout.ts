import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'

export const useLogout = () => {
  const auth = useAuthStore()
  const router = useRouter()

  const logout = async () => {
    try {
      if (auth.isLoggedIn && !isDemoMode()) {
        await api.post('/auth/logout')
      }
    } catch {
      // Local cleanup still wins even if the network logout call fails.
    } finally {
      auth.clearSession()
      router.push('/login')
    }
  }

  return { logout }
}
