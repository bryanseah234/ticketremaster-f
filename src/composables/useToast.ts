import { reactive } from 'vue'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const state = reactive({
  items: [] as ToastItem[],
})

let seq = 1

export function useToast() {
  const push = (message: string, type: ToastType = 'info', duration = 3200) => {
    const id = seq++
    state.items.push({ id, message, type })
    window.setTimeout(() => {
      const idx = state.items.findIndex((item) => item.id === id)
      if (idx >= 0) state.items.splice(idx, 1)
    }, duration)
  }

  const remove = (id: number) => {
    const idx = state.items.findIndex((item) => item.id === id)
    if (idx >= 0) state.items.splice(idx, 1)
  }

  return { state, push, remove }
}
