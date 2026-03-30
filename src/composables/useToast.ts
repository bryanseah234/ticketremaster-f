import { reactive, readonly } from 'vue'
import api from '@/api/client'
import type { Toast } from '@/types'

interface ToastState {
  toasts: Toast[]
  nextId: number
}

const state = reactive<ToastState>({
  toasts: [],
  nextId: 0,
})

export function useToast() {
  const push = (
    message: string,
    type: Toast['type'] = 'info',
    duration = 5000
  ) => {
    const id = state.nextId++
    const toast: Toast = { id, message, type, duration }
    state.toasts.push(toast)

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const remove = (id: string | number) => {
    const index = state.toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      state.toasts.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) =>
    push(message, 'success', duration)

  const error = (message: string, duration?: number) =>
    push(message, 'error', duration)

  const warning = (message: string, duration?: number) =>
    push(message, 'warning', duration)

  const info = (message: string, duration?: number) =>
    push(message, 'info', duration)

  return {
    toasts: readonly(state.toasts),
    push,
    remove,
    success,
    error,
    warning,
    info,
  }
}
