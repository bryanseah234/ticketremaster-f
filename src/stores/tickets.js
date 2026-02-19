// Pinia store for tickets (stub)
import { defineStore } from 'pinia'
export const useTicketsStore = defineStore('tickets', {
  state: () => ({
    tickets: [],
  }),
  actions: {
    // TODO: Implement ticket fetching
  },
})
