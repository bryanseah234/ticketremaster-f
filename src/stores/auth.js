// Pinia store for auth (stub)
import { defineStore } from 'pinia'
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoggedIn: false,
  }),
  actions: {
    // TODO: Implement login, logout, refresh, user info
  },
})
